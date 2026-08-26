import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateReferralCode } from '@/lib/referral'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code, free_months_credit')
      .eq('id', user.id)
      .single()

    let referralCode = profile?.referral_code || null

    // Génère un code au premier accès (quelques tentatives en cas de collision,
    // extrêmement improbable mais l'unicité est imposée par la base).
    if (!referralCode) {
      for (let attempt = 0; attempt < 5 && !referralCode; attempt++) {
        const candidate = generateReferralCode()
        const { data, error } = await supabase
          .from('profiles')
          .update({ referral_code: candidate })
          .eq('id', user.id)
          .select('referral_code')
          .single()

        if (!error && data) {
          referralCode = data.referral_code
        }
      }

      if (!referralCode) {
        return NextResponse.json({ error: 'Erreur lors de la génération du code' }, { status: 500 })
      }
    }

    const { count: referredCount } = await supabase
      .from('referrals')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_id', user.id)

    const { count: convertedCount } = await supabase
      .from('referrals')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_id', user.id)
      .eq('status', 'converted')

    return NextResponse.json({
      referralCode,
      freeMonthsCredit: profile?.free_months_credit || 0,
      referredCount: referredCount || 0,
      convertedCount: convertedCount || 0,
    })
  } catch (err) {
    console.error('Error fetching referral info:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
