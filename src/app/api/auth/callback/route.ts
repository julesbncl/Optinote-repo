import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const { searchParams } = requestUrl
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  // Déterminer l'URL d'origine de manière fiable (support local et déploiement Vercel)
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  const origin = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin

  const supabase = await createClient()

  // 1. Échange de code OAuth (Google) ou PKCE
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Synchroniser le profil avec les données du compte Google
      try {
        const metadata = data.user.user_metadata || {}
        await supabase
          .from('profiles')
          .upsert(
            {
              id: data.user.id,
              email: data.user.email || '',
              full_name: metadata.full_name || metadata.name || null,
              avatar_url: metadata.avatar_url || metadata.picture || null,
              is_pro: false,
              subscription_tier: 'free',
              subscription_status: 'inactive',
            },
            { onConflict: 'id', ignoreDuplicates: true }
          )
      } catch (profileErr) {
        console.warn('Profile sync warning on OAuth callback:', profileErr)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // 2. Validation Token Hash OTP
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Redirection vers login avec message d'erreur si échec
  return NextResponse.redirect(`${origin}/login?error=auth`)
}


