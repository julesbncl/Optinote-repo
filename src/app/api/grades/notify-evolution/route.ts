import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateWeightedAverage } from '@/lib/utils'
import { sendNotificationEmail } from '@/lib/email'

// Appelé (fire-and-forget) par le client juste après l'ajout d'une note réelle :
// recalcule la moyenne générale, la compare à la dernière valeur connue stockée
// sur le profil, et envoie un e-mail de félicitations ou d'alerte bienveillante
// si l'écart dépasse un seuil (pour éviter de spammer sur des variations infimes).
export const dynamic = 'force-dynamic'
export const revalidate = 0

const CHANGE_THRESHOLD = 0.1

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const [{ data: profile }, { data: subjects }, { data: grades }] = await Promise.all([
      supabase
        .from('profiles')
        .select('email, last_known_average, email_notif_grade_evolution')
        .eq('id', user.id)
        .single(),
      supabase.from('subjects').select('id, coefficient').eq('user_id', user.id),
      supabase
        .from('grades')
        .select('value, out_of, coefficient, subject_id')
        .eq('user_id', user.id)
        .eq('is_simulated', false),
    ])

    if (!profile) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
    }

    const subjectCoefById = new Map((subjects || []).map((s) => [s.id, s.coefficient]))
    const newAverage =
      grades && grades.length > 0
        ? calculateWeightedAverage(
            grades.map((g) => ({
              value: g.value,
              outOf: g.out_of,
              coefficient: g.coefficient * (subjectCoefById.get(g.subject_id) || 1),
            }))
          )
        : null

    const previousAverage =
      profile.last_known_average !== null && profile.last_known_average !== undefined
        ? Number(profile.last_known_average)
        : null

    // La référence est toujours mise à jour, qu'un e-mail soit envoyé ou non.
    await supabase.from('profiles').update({ last_known_average: newAverage }).eq('id', user.id)

    let emailed = false

    if (
      newAverage !== null &&
      previousAverage !== null &&
      profile.email &&
      profile.email_notif_grade_evolution !== false &&
      Math.abs(newAverage - previousAverage) >= CHANGE_THRESHOLD
    ) {
      const increased = newAverage > previousAverage
      const diff = Math.abs(newAverage - previousAverage).toFixed(2)

      const result = await sendNotificationEmail(
        profile.email,
        increased ? 'Bravo, ta moyenne progresse ! 🚀' : 'Ta moyenne a légèrement baissé',
        increased
          ? `Ta moyenne générale est passée à ${newAverage}/20 (+${diff} pt). Continue sur cette lancée, tes efforts payent !`
          : `Ta moyenne générale est passée à ${newAverage}/20 (−${diff} pt). Pas de panique, c'est le moment idéal pour revoir les points faibles et relancer la dynamique.`,
        'Voir mes notes',
        'https://optinote.fr/grades'
      )
      emailed = result.success
    }

    return NextResponse.json({ success: true, newAverage, previousAverage, emailed })
  } catch (err) {
    console.error('Error in grade evolution notification:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
