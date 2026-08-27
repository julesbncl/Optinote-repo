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

    // Cette route est un simple raccourci pour un retour instantané côté UI
    // (le webhook Stripe signé reste la source de vérité pour l'activation
    // réelle) — mais elle est appelable par n'importe quel utilisateur
    // authentifié avec n'importe quel sessionId, donc les deux vérifications
    // ci-dessous sont indispensables : sans elles, un ancien mode === 'subscription'
    // suffisait à activer le Pro gratuitement avec une session non payée ou
    // appartenant à quelqu'un d'autre.
    const belongsToCurrentUser = session.metadata?.supabase_user_id === user.id
    const isActuallyPaid =
      session.status === 'complete' &&
      (session.payment_status === 'paid' || session.payment_status === 'no_payment_required')

    if (belongsToCurrentUser && isActuallyPaid) {
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
