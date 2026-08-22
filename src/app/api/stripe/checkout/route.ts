import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe/server'
import {
  PRICING_PLANS,
  VALID_PROMO_CODES,
  PROMO_DISCOUNT_PERCENT,
  getDiscountedPrice,
} from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const planId = body.planId || 'monthly'

    if (planId === 'free') {
      return NextResponse.json(
        { error: 'La formule Découverte est déjà gratuite' },
        { status: 400 }
      )
    }

    const selectedPlan = PRICING_PLANS.find((p) => p.id === planId) || PRICING_PLANS[1]

    // Get current profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    // Create Stripe Customer if not existing
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || profile?.email || '',
        name: profile?.full_name || undefined,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      // Save customer ID in profiles
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const promoCode = typeof body.promoCode === 'string' ? body.promoCode.trim().toUpperCase() : undefined
    const isPromoValid = Boolean(promoCode && (VALID_PROMO_CODES as readonly string[]).includes(promoCode))

    const finalPrice = isPromoValid
      ? getDiscountedPrice(selectedPlan.price, PROMO_DISCOUNT_PERCENT)
      : selectedPlan.price

    const isAnnual = selectedPlan.id === 'annual'
    const interval = isAnnual ? 'year' : 'month'

    const envPriceId = isAnnual
      ? (process.env.STRIPE_PRICE_ID_ANNUAL || process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL || 'price_1U7H5KRwM4B48KWbDoLCFGzq')
      : (process.env.STRIPE_PRICE_ID || process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY || 'price_1U6SrGrWM4B48KwBLvdM5LSU')

    const priceId = !isPromoValid ? (body.priceId || selectedPlan.stripePriceId || envPriceId) : undefined

    const forwardedHost = request.headers.get('x-forwarded-host')
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
    const origin = forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000'

    const dynamicPriceData = {
      price_data: {
        currency: 'eur',
        product_data: {
          name: `OptiNote ${selectedPlan.name}${isPromoValid ? ` (-${PROMO_DISCOUNT_PERCENT}% Promo ${promoCode})` : ''}`,
          description: selectedPlan.description || 'Abonnement OptiNote Pro',
        },
        unit_amount: Math.round(finalPrice * 100),
        recurring: {
          interval: interval as 'year' | 'month',
        },
      },
      quantity: 1,
    }

    const sessionParamsBase = {
      customer: customerId,
      mode: 'subscription' as const,
      payment_method_types: ['card' as const],
      success_url: `${origin}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}&plan=${selectedPlan.id}`,
      cancel_url: `${origin}/pricing?payment=cancelled`,
      metadata: {
        supabase_user_id: user.id,
        plan_tier: selectedPlan.id,
        billing_interval: interval,
        promo_code: promoCode || 'none',
        discount_percent: isPromoValid ? '15%' : '0%',
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan_tier: selectedPlan.id,
          billing_interval: interval,
          promo_code: promoCode || 'none',
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto' as const,
    }

    let session

    // 1. Si un ID de prix Stripe est configuré, tenter la création avec cet ID
    const hasConfiguredPriceId =
      priceId &&
      priceId.startsWith('price_') &&
      !priceId.startsWith('price_monthly_') &&
      !priceId.startsWith('price_annual_')

    if (hasConfiguredPriceId) {
      try {
        session = await stripe.checkout.sessions.create({
          ...sessionParamsBase,
          line_items: [{ price: priceId, quantity: 1 }],
        })
      } catch (stripeErr: any) {
        console.warn(
          `[Stripe Checkout] L'ID de prix '${priceId}' n'a pas été trouvé dans le mode actif de la clé Stripe (${stripeErr.message}). Bascule automatique sur la tarification dynamique (price_data)...`
        )
      }
    }

    // 2. Si le price_id n'existe pas dans le mode actif (ex: mismatch Live/Test), créer dynamiquement la session
    if (!session) {
      session = await stripe.checkout.sessions.create({
        ...sessionParamsBase,
        line_items: [dynamicPriceData],
      })
    }

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l’initialisation du paiement' },
      { status: 500 }
    )
  }
}
