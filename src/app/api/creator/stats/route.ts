import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Route dédiée au dashboard créateur : chaque créateur ne voit que son(ses)
// propre(s) code(s), via le client Supabase normal (RLS "owner_user_id =
// auth.uid()"), jamais la clé de service.
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { data: codes, error } = await supabase
    .from('creator_codes')
    .select('*')
    .eq('owner_user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching creator codes:', error)
    return NextResponse.json({ creators: [] })
  }

  const creators = await Promise.all(
    (codes || []).map(async (code) => {
      const [{ count: redemptions }, { data: earnings }] = await Promise.all([
        supabase
          .from('creator_code_redemptions')
          .select('*', { count: 'exact', head: true })
          .eq('creator_code_id', code.id),
        supabase
          .from('creator_earnings')
          .select('amount_cents, commission_cents, paid_out, created_at')
          .eq('creator_code_id', code.id)
          .order('created_at', { ascending: false }),
      ])

      const totalRevenueCents = (earnings || []).reduce((sum, e) => sum + e.amount_cents, 0)
      const totalCommissionCents = (earnings || []).reduce((sum, e) => sum + e.commission_cents, 0)
      const paidOutCommissionCents = (earnings || [])
        .filter((e) => e.paid_out)
        .reduce((sum, e) => sum + e.commission_cents, 0)

      return {
        ...code,
        redemptions_count: redemptions || 0,
        total_revenue_cents: totalRevenueCents,
        total_commission_cents: totalCommissionCents,
        commission_due_cents: totalCommissionCents - paidOutCommissionCents,
        recent_earnings: (earnings || []).slice(0, 20),
      }
    })
  )

  return NextResponse.json({ creators })
}
