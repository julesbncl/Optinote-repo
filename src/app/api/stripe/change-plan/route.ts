import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'
import { PRICING_PLANS } from '@/lib/constants'
import type Stripe from 'stripe'

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
      expand: ['latest_invoice'],
    })

    // Le changement de prix génère une facture de proration facturée
    // immédiatement (carte déjà enregistrée). En Europe, ce prélèvement
    // hors-session échoue souvent sans authentification 3D Secure — dans ce
    // cas on ne doit ni afficher un faux succès, ni activer la formule en
    // base : on renvoie le lien de paiement Stripe pour que l'utilisateur
    // confirme lui-même, le webhook confirmera l'activation une fois payée.
    const latestInvoice = updated.latest_invoice as Stripe.Invoice | null

    if (latestInvoice && latestInvoice.status !== 'paid') {
      return NextResponse.json({
        success: false,
        requiresPayment: true,
        hostedInvoiceUrl: latestInvoice.hosted_invoice_url,
        error: 'Le paiement de la différence nécessite une confirmation supplémentaire.',
      })
    }

    // Le SDK Stripe installé ne déclare plus current_period_end au niveau racine
    // de l'abonnement (même workaround que le webhook et /api/stripe/sync), mais
    // l'API le renvoie toujours ainsi pour la version configurée sur ce compte.
    await supabase
      .from('profiles')
      .update({
        subscription_tier: targetPlanId,
        subscription_current_period_end: new Date(
          (updated as unknown as { current_period_end: number }).current_period_end * 1000
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
  } catch (error: unknown) {
    console.error('Error changing subscription plan:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors du changement de formule' },
      { status: 500 }
    )
  }
}
