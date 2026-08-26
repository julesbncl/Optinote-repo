import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Appelé au chargement du Dashboard : incrémente la série de jours consécutifs
// de connexion. Ne doit jamais être mis en cache, sinon deux visites le même
// jour à quelques minutes d'écart pourraient être comptées deux fois.
export const dynamic = 'force-dynamic'
export const revalidate = 0

function todayISODate(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysBetween(a: string, b: string): number {
  const diffMs = new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()
  return Math.round(diffMs / 86_400_000)
}

export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('current_streak, longest_streak, last_streak_date')
      .eq('id', user.id)
      .single()

    if (fetchError || !profile) {
      return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
    }

    const today = todayISODate()

    // Déjà comptabilisé aujourd'hui : ne rien changer.
    if (profile.last_streak_date === today) {
      return NextResponse.json({
        current_streak: profile.current_streak,
        longest_streak: profile.longest_streak,
        incremented: false,
      })
    }

    // Connexion la veille : la série continue. Sinon (absence ou premier jour) : elle repart à 1.
    const gap = profile.last_streak_date ? daysBetween(profile.last_streak_date, today) : null
    const nextStreak = gap === 1 ? (profile.current_streak || 0) + 1 : 1
    const nextLongest = Math.max(profile.longest_streak || 0, nextStreak)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        current_streak: nextStreak,
        longest_streak: nextLongest,
        last_streak_date: today,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating streak:', updateError)
      return NextResponse.json({ error: 'Erreur lors de la mise à jour de la série' }, { status: 500 })
    }

    return NextResponse.json({
      current_streak: nextStreak,
      longest_streak: nextLongest,
      incremented: true,
    })
  } catch (err) {
    console.error('Error in streak ping:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
