import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe/server'
import { createClient } from '@supabase/supabase-js'
import { sendNotificationEmail } from '@/lib/email'
import type Stripe from 'stripe'

// Initialize a direct Supabase Admin client with Service Role to bypass RLS during webhook handling
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'placeholder-key'
)

// Convertit un parrainage "pending" en "converted" et récompense le parrain,
// uniquement appelé depuis un événement Stripe dont la signature a déjà été
// vérifiée — jamais atteignable depuis une route appelable par le client.
async function processReferralConversion(referredUserId: string) {
  const { data: referral } = await supabaseAdmin
    .from('referrals')
    .select('id, referrer_id')
    .eq('referred_id', referredUserId)
    .eq('status', 'pending')
    .maybeSingle()

  if (!referral) return

  await supabaseAdmin
    .from('referrals')
    .update({ status: 'converted', converted_at: new Date().toISOString() })
    .eq('id', referral.id)

  const { data: referrerProfile } = await supabaseAdmin
    .from('profiles')
    .select('email, full_name, stripe_customer_id, subscription_status, free_months_credit')
    .eq('id', referral.referrer_id)
    .single()

  if (!referrerProfile) return

  const couponId = process.env.STRIPE_REFERRAL_COUPON_ID
  const referrerHasActiveSub =
    referrerProfile.stripe_customer_id &&
    ['active', 'trialing'].includes(referrerProfile.subscription_status || '')

  if (referrerHasActiveSub && couponId) {
    try {
      const subs = await stripe.subscriptions.list({
        customer: referrerProfile.stripe_customer_id as string,
        status: 'active',
        limit: 1,
      })
      const activeSub = subs.data[0]
      if (activeSub) {
        await stripe.subscriptions.update(activeSub.id, { discounts: [{ coupon: couponId }] })

        if (referrerProfile.email) {
          sendNotificationEmail(
            referrerProfile.email,
            'Ton mois offert est appliqué ! 🎁',
            `Ton ami que tu as parrainé vient de passer Pro sur OptiNote. Ta récompense a été appliquée directement : ta prochaine facture sera réduite de 6,99 €. Merci d'avoir fait connaître OptiNote !`,
            'Voir mon abonnement',
            'https://optinote.fr/settings'
          ).catch((err) => console.error('Error sending referral reward email:', err))
        }
        return
      }
    } catch (err) {
      console.error('Error applying referral reward coupon to referrer subscription:', err)
    }
  }

  // Pas d'abonnement actif (ou coupon indisponible) : le mois offert est crédité
  // et sera automatiquement appliqué au prochain passage en caisse du parrain.
  await supabaseAdmin
    .from('profiles')
    .update({ free_months_credit: (referrerProfile.free_months_credit || 0) + 1 })
    .eq('id', referral.referrer_id)

  if (referrerProfile.email) {
    sendNotificationEmail(
      referrerProfile.email,
      'Tu as gagné un mois offert ! 🎁',
      `Ton ami que tu as parrainé vient de passer Pro sur OptiNote. Ton mois offert t'attend : il s'appliquera automatiquement dès que tu passeras Pro à ton tour. Merci d'avoir fait connaître OptiNote !`,
      'Découvrir l’offre Pro',
      'https://optinote.fr/pricing'
    ).catch((err) => console.error('Error sending referral reward email:', err))
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = (await headers()).get('stripe-signature')

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured — refusing unsigned webhook')
    return NextResponse.json({ error: 'Webhook non configuré' }, { status: 500 })
  }

  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    // La vérification de signature est obligatoire : sans elle, n'importe qui pourrait
    // forger un événement "checkout.session.completed" et s'octroyer un abonnement Pro
    // gratuit. Pour tester en local, utiliser `stripe listen` (fournit un vrai secret).
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Signature invalide'
    console.error('Webhook signature verification failed:', message)
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id
        const planTier = session.metadata?.plan_tier || 'monthly'
        const customerId = (session.customer as string) || undefined
        const customerEmail =
          session.customer_details?.email?.toLowerCase().trim() ||
          session.customer_email?.toLowerCase().trim()

        if (userId) {
          await supabaseAdmin
            .from('profiles')
            .update({
              stripe_customer_id: customerId,
              subscription_tier: planTier,
              subscription_status: 'active',
              is_pro: true,
            })
            .eq('id', userId)
        } else if (customerId) {
          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_tier: planTier,
              subscription_status: 'active',
              is_pro: true,
            })
            .eq('stripe_customer_id', customerId)
        } else if (customerEmail) {
          await supabaseAdmin
            .from('profiles')
            .update({
              stripe_customer_id: customerId,
              subscription_tier: planTier,
              subscription_status: 'active',
              is_pro: true,
            })
            .eq('email', customerEmail)
        }

        // Parrainage : converti et récompensé seulement ici, sur ce paiement Stripe
        // réellement confirmé (voir processReferralConversion ci-dessus).
        if (userId && session.metadata?.referral_pending === 'true') {
          try {
            await processReferralConversion(userId)
          } catch (err) {
            console.error('Error processing referral conversion:', err)
          }
        }

        if (userId && session.metadata?.consume_referral_credit === 'true') {
          const { data: p } = await supabaseAdmin
            .from('profiles')
            .select('free_months_credit')
            .eq('id', userId)
            .single()
          const remaining = Math.max(0, (p?.free_months_credit || 1) - 1)
          await supabaseAdmin.from('profiles').update({ free_months_credit: remaining }).eq('id', userId)
        }

        // Programme partenaire créateurs : enregistre l'attribution une seule fois
        // (user_id est UNIQUE) pour que les paiements récurrents à venir (voir
        // 'invoice.paid' ci-dessous) puissent être rattachés au bon créateur.
        const creatorCodeId = session.metadata?.creator_code_id
        if (userId && creatorCodeId) {
          try {
            await supabaseAdmin.from('creator_code_redemptions').upsert(
              {
                creator_code_id: creatorCodeId,
                user_id: userId,
                stripe_customer_id: customerId || null,
                stripe_subscription_id: (session.subscription as string) || null,
              },
              { onConflict: 'user_id', ignoreDuplicates: true }
            )
          } catch (err) {
            console.error('Error recording creator code redemption:', err)
          }
        }

        break
      }


      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.supabase_user_id
        const planTier = subscription.metadata?.plan_tier || 'monthly'
        const interval =
          subscription.metadata?.billing_interval ||
          subscription.items.data[0]?.plan?.interval ||
          'month'

        const status = subscription.status
        const isActive = status === 'active' || status === 'trialing'
        // Le SDK Stripe installé ne déclare plus current_period_end/start au niveau
        // racine de l'abonnement, mais l'API le renvoie toujours ainsi pour la
        // version configurée sur ce compte (même workaround que /api/stripe/sync).
        const currentPeriodEnd = new Date(
          (subscription as unknown as { current_period_end: number }).current_period_end * 1000
        ).toISOString()
        const currentPeriodStart = new Date(
          (subscription as unknown as { current_period_start: number }).current_period_start * 1000
        ).toISOString()

        // 1. If we have userId, update profiles directly
        if (userId) {
          await supabaseAdmin
            .from('profiles')
            .update({
              stripe_customer_id: subscription.customer as string,
              subscription_tier: isActive ? planTier : 'free',
              subscription_status: status,
              is_pro: isActive,
              subscription_current_period_end: currentPeriodEnd,
            })
            .eq('id', userId)
        } else {
          // Lookup by stripe_customer_id
          await supabaseAdmin
            .from('profiles')
            .update({
              subscription_tier: isActive ? planTier : 'free',
              subscription_status: status,
              is_pro: isActive,
              subscription_current_period_end: currentPeriodEnd,
            })
            .eq('stripe_customer_id', subscription.customer as string)
        }

        // 2. Upsert in subscriptions table (optional table)
        if (userId) {
          try {
            await supabaseAdmin.from('subscriptions').upsert({
              id: subscription.id,
              user_id: userId,
              status: status,
              price_id: subscription.items.data[0]?.price.id || 'price_custom',
              plan_tier: planTier,
              billing_interval: interval,
              amount: subscription.items.data[0]?.price.unit_amount || 0,
              currency: subscription.currency || 'eur',
              current_period_start: currentPeriodStart,
              current_period_end: currentPeriodEnd,
              cancel_at_period_end: subscription.cancel_at_period_end || false,
              updated_at: new Date().toISOString(),
            })
          } catch (subErr) {
            console.warn('Subscriptions table upsert warning:', subErr)
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Downgrade profile to free
        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_tier: 'free',
            subscription_status: 'canceled',
            is_pro: false,
          })
          .eq('stripe_customer_id', customerId)

        // Update subscriptions record (optional)
        try {
          await supabaseAdmin
            .from('subscriptions')
            .update({
              status: 'canceled',
              updated_at: new Date().toISOString(),
            })
            .eq('id', subscription.id)
        } catch (subErr) {
          console.warn('Subscriptions table update warning:', subErr)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: 'past_due',
            is_pro: false,
          })
          .eq('stripe_customer_id', customerId)
        break
      }

      case 'invoice.paid': {
        // Commission créateur : calculée sur CHAQUE facture payée (premier paiement
        // et tous les renouvellements), pas seulement à la souscription initiale.
        // metadata.creator_code_id est un instantané de la metadata de l'abonnement
        // au moment de la facturation (Stripe le fournit directement sur la facture,
        // pas besoin d'un appel API supplémentaire).
        const invoice = event.data.object as Stripe.Invoice
        const creatorCodeId = invoice.parent?.subscription_details?.metadata?.creator_code_id

        if (creatorCodeId) {
          try {
            const { data: creatorCode } = await supabaseAdmin
              .from('creator_codes')
              .select('id, commission_percent, is_active')
              .eq('id', creatorCodeId)
              .maybeSingle()

            if (creatorCode?.is_active) {
              const commissionCents = Math.round(
                (invoice.amount_paid * creatorCode.commission_percent) / 100
              )

              // stripe_invoice_id est UNIQUE : un rejeu du webhook ne compte jamais deux fois.
              await supabaseAdmin.from('creator_earnings').upsert(
                {
                  creator_code_id: creatorCode.id,
                  stripe_invoice_id: invoice.id,
                  amount_cents: invoice.amount_paid,
                  commission_cents: commissionCents,
                  currency: invoice.currency || 'eur',
                },
                { onConflict: 'stripe_invoice_id', ignoreDuplicates: true }
              )
            }
          } catch (err) {
            console.error('Error recording creator earning:', err)
          }
        }
        break
      }

      default:
        // Other events ignored
        break
    }

    return NextResponse.json({ received: true })
  } catch (error: unknown) {
    console.error('Error processing webhook event:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
