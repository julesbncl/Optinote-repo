import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { sessionId } = await request.json()
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID requis' }, { status: 400 })
    }

    // Retrieve checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (
      session.payment_status === 'paid' ||
      session.status === 'complete' ||
      session.mode === 'subscription'
    ) {
      const planTier = session.metadata?.plan_tier || 'monthly'

      // Update user profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          is_pro: true,
          subscription_tier: planTier,
          subscription_status: 'active',
          stripe_customer_id: typeof session.customer === 'string' ? session.customer : undefined,
        })
        .eq('id', user.id)

      if (error) {
        console.error('Error updating profile after checkout verification:', error)
      }

      return NextResponse.json({ success: true, is_pro: true })
    }

    return NextResponse.json({ success: false, message: 'Paiement non finalisé' })
  } catch (error: any) {
    console.error('Verify session error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur de vérification' },
      { status: 500 }
    )
  }
}
