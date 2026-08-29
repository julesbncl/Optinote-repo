import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/rate-limit'
import { BETA_ACCESS_CODE, BETA_ACCESS_WINDOW_END, isBetaAccessWindowActive } from '@/lib/constants'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Le code Beta ne donne un accès Pro complet que pendant la fenêtre des 30-31
// août 2026 (voir hasBetaAccess dans lib/constants.ts) — la saisie du code
// peut se faire n'importe quand avant le lancement, l'activation elle-même
// est purement calculée sur la date, jamais stockée comme un accès permanent.
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const rateLimit = checkRateLimit(`waitlist-redeem:${user.id}`, 10, 60_000)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Trop de tentatives. Réessaie dans ${rateLimit.resetIn}s` },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : ''

    if (code !== BETA_ACCESS_CODE.toUpperCase()) {
      return NextResponse.json({ error: 'Code invalide' }, { status: 400 })
    }

    if (new Date() >= BETA_ACCESS_WINDOW_END) {
      return NextResponse.json(
        { error: 'La période Beta gratuite est terminée, OptiNote est maintenant disponible pour tous !' },
        { status: 400 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('beta_access_redeemed_at')
      .eq('id', user.id)
      .single()

    if (!profile?.beta_access_redeemed_at) {
      // Écriture via la clé de service : ce champ est protégé contre toute
      // écriture directe par un utilisateur authentifié (voir migration 023) —
      // le code a déjà été validé côté serveur juste au-dessus.
      const admin = createAdminClient()
      const { error } = await admin
        .from('profiles')
        .update({ beta_access_redeemed_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) {
        console.error('Error redeeming beta code:', error)
        return NextResponse.json({ error: 'Erreur lors de l’activation du code' }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      activeNow: isBetaAccessWindowActive(),
      message: isBetaAccessWindowActive()
        ? 'Accès Pro gratuit débloqué jusqu’au lancement ! 🎉'
        : 'Code validé ! Ton accès Pro gratuit s’activera automatiquement les 30 et 31 août.',
    })
  } catch (err) {
    console.error('Error in waitlist redeem route:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
