import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Associe le nouvel utilisateur connecté à un parrain, à partir d'un code de
// parrainage. Ne récompense personne ici : la récompense n'est accordée que
// plus tard, côté webhook Stripe, sur un paiement réellement confirmé — cette
// route se contente d'enregistrer la relation, ce qui limite son impact en cas
// d'abus (spam de comptes) à du bruit, jamais à de l'argent gratuit.
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const rateLimit = checkRateLimit(`referral-claim:${user.id}`, 5, 60_000)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Trop de tentatives. Réessaie dans ${rateLimit.resetIn}s` },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : ''

    if (!code) {
      return NextResponse.json({ error: 'Code de parrainage requis' }, { status: 400 })
    }

    const { data: referrer } = await supabase
      .from('profiles')
      .select('id')
      .eq('referral_code', code)
      .maybeSingle()

    if (!referrer) {
      return NextResponse.json({ error: 'Code de parrainage invalide' }, { status: 404 })
    }

    if (referrer.id === user.id) {
      return NextResponse.json({ error: 'Tu ne peux pas utiliser ton propre code' }, { status: 400 })
    }

    // Un utilisateur ne peut être parrainé qu'une seule fois (contrainte UNIQUE
    // sur referred_id côté base, ceci évite juste un aller-retour serveur inutile).
    const { data: existing } = await supabase
      .from('referrals')
      .select('id')
      .eq('referred_id', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Un parrainage est déjà enregistré pour ce compte' }, { status: 409 })
    }

    const { error: insertError } = await supabase.from('referrals').insert({
      referrer_id: referrer.id,
      referred_id: user.id,
      status: 'pending',
    })

    if (insertError) {
      console.error('Error claiming referral:', insertError)
      return NextResponse.json({ error: 'Erreur lors de l’enregistrement du parrainage' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error in referral claim:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
