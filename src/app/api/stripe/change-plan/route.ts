import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'
import { PRICING_PLANS } from '@/lib/constants'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Change le prix de l'abonnement Stripe ACTIF d'un utilisateur déjà abonné
// (mensuel <-> annuel), au lieu de le faire repasser par un tout nouveau
// Checkout (ce qui créerait un second abonnement en doublon). Le prix cible
// ne vient jamais du client : toujours résolu côté serveur depuis la config,
// comme pour /api/stripe/checkout.
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const targetPlanId = body.planId === 'annual' ? 'annual' : body.planId === 'monthly' ? 'monthly' : null

    if (!targetPlanId) {
      return NextResponse.json({ error: 'Formule invalide' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, subscription_tier, subscription_status')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'Aucun abonnement actif trouvé' }, { status: 404 })
    }

    if (!['active', 'trialing'].includes(profile.subscription_status || '')) {
      return NextResponse.json({ error: 'Aucun abonnement actif à modifier' }, { status: 400 })
    }

    if (profile.subscription_tier === targetPlanId) {
      return NextResponse.json({ error: 'Tu es déjà sur cette formule' }, { status: 400 })
    }

    const targetPlan = PRICING_PLANS.find((p) => p.id === targetPlanId)
    const targetPriceId = targetPlan?.stripePriceId
    if (!targetPriceId || !targetPriceId.startsWith('price_')) {
      console.error(
        `[change-plan] Prix Stripe mal configuré pour la formule '${targetPlanId}':`,
        targetPriceId
      )
      return NextResponse.json({ error: 'Configuration de prix invalide, contacte le support' }, { status: 500 })
    }

    const subs = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: 'active',
      limit: 1,
    })
    const subscription = subs.data[0]
    if (!subscription) {
      return NextResponse.json({ error: 'Aucun abonnement actif trouvé chez Stripe' }, { status: 404 })
    }

    const currentItem = subscription.items.data[0]
    if (!currentItem) {
      return NextResponse.json({ error: 'Abonnement introuvable' }, { status: 404 })
    }

    const updated = await stripe.subscriptions.update(subscription.id, {
      items: [{ id: currentItem.id, price: targetPriceId }],
      proration_behavior: 'create_prorations',
      metadata: {
        ...subscription.metadata,
        plan_tier: targetPlanId,
        billing_interval: targetPlanId === 'annual' ? 'year' : 'month',
      },
    })

    // Mise à jour immédiate en base (le webhook customer.subscription.updated
    // la confirmera aussi, mais on ne fait pas attendre l'utilisateur pour ça).
    await supabase
      .from('profiles')
      .update({
        subscription_tier: targetPlanId,
        subscription_current_period_end: new Date(
          (updated as any).current_period_end * 1000
        ).toISOString(),
      })
      .eq('id', user.id)

    return NextResponse.json({
      success: true,
      message:
        targetPlanId === 'annual'
          ? 'Tu es passé à l’abonnement Annuel ! 🎉'
          : 'Tu es passé à l’abonnement Mensuel.',
    })
  } catch (error: any) {
    console.error('Error changing subscription plan:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors du changement de formule' },
      { status: 500 }
    )
  }
}
