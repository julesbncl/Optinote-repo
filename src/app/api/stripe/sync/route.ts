import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe/server'

// Client Supabase Admin avec Service Role pour garantir les droits d'écriture
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'placeholder-key'
)

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const userEmail = user.email?.toLowerCase().trim()
    if (!userEmail) {
      return NextResponse.json({ error: 'Email utilisateur introuvable' }, { status: 400 })
    }

    // 1. Récupérer le profil actuel
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    // 2. Si pas de customerId dans le profil, chercher par email dans Stripe
    if (!customerId) {
      const customers = await stripe.customers.list({
        email: userEmail,
        limit: 5,
      })

      if (customers.data.length > 0) {
        customerId = customers.data[0].id
      }
    }

    let activeSubscription: any = null
    let customerList = customerId ? [customerId] : []

    // Si on a un customerId, vérifier toutes ses souscriptions
    if (customerId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 10,
      })

      activeSubscription = subscriptions.data.find(
        (sub) => sub.status === 'active' || sub.status === 'trialing'
      )
    }

    // Recherche élargie par email Stripe si toujours rien trouvé
    if (!activeSubscription && userEmail) {
      const customersByEmail = await stripe.customers.list({
        email: userEmail,
        limit: 10,
      })

      for (const cust of customersByEmail.data) {
        const subs = await stripe.subscriptions.list({
          customer: cust.id,
          status: 'all',
          limit: 10,
        })
        const found = subs.data.find(
          (sub) => sub.status === 'active' || sub.status === 'trialing'
        )
        if (found) {
          activeSubscription = found
          customerId = cust.id
          break
        }
      }
    }

    // 3. Si un abonnement actif est trouvé sur Stripe, mettre à jour Supabase
    if (activeSubscription) {
      const planTier =
        activeSubscription.metadata?.plan_tier ||
        (activeSubscription.items.data[0]?.plan?.interval === 'year' ? 'annual' : 'monthly')

      const currentPeriodEnd = new Date(
        activeSubscription.current_period_end * 1000
      ).toISOString()

      const { data: updatedProfile, error: updateErr } = await supabaseAdmin
        .from('profiles')
        .update({
          is_pro: true,
          subscription_tier: planTier,
          subscription_status: activeSubscription.status,
          stripe_customer_id: customerId,
          subscription_current_period_end: currentPeriodEnd,
        })
        .eq('id', user.id)
        .select()
        .single()

      if (updateErr) {
        console.error('Erreur mise à jour Supabase lors de la synchronisation:', updateErr)
      }

      return NextResponse.json({
        success: true,
        is_pro: true,
        subscription_tier: planTier,
        subscription_status: activeSubscription.status,
        message: 'Abonnement Pro synchronisé avec succès !',
        profile: updatedProfile || undefined,
      })
    }

    // 4. Si aucun abonnement Stripe n'est trouvé mais le profil est déjà Pro (ex: bypass admin ou manuel)
    if (profile?.is_pro === true) {
      return NextResponse.json({
        success: true,
        is_pro: true,
        subscription_tier: profile.subscription_tier || 'monthly',
        subscription_status: profile.subscription_status || 'active',
        message: 'Statut Pro déjà actif sur votre compte.',
      })
    }

    return NextResponse.json({
      success: false,
      is_pro: false,
      message: 'Aucun abonnement Stripe actif trouvé pour ce compte.',
    })
  } catch (error: any) {
    console.error('Erreur API sync Stripe:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la synchronisation Stripe' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
