import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/auth/subscribe
 *
 * Placeholder endpoint for upgrading a user to Pro.
 * In production this would be called by your Stripe webhook
 * after a successful payment.
 *
 * For now it accepts { userId, tier } and sets is_pro = true.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, tier } = body as { userId?: string; tier?: 'monthly' | 'annual' }

    if (!userId || !tier) {
      return NextResponse.json(
        { error: 'userId and tier are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify the requesting user matches (basic security)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Update profile with Pro status
    const { error } = await supabase
      .from('profiles')
      .update({
        is_pro: true,
        subscription_tier: tier,
        subscription_status: 'active',
      })
      .eq('id', userId)

    if (error) {
      console.error('Subscribe error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Abonnement Pro activé !' })
  } catch (err) {
    console.error('Subscribe API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
