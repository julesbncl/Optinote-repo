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

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Aucun compte de facturation trouvé' },
        { status: 404 }
      )
    }

    const forwardedHost = request.headers.get('x-forwarded-host')
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
    const origin = (
      forwardedHost
        ? `${forwardedProto}://${forwardedHost}`
        : process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || 'http://localhost:3000'
    ).replace(/\/+$/, '')


    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/settings`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    console.error('Customer Portal Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de l’accès au portail de facturation' },
      { status: 500 }
    )
  }
}
