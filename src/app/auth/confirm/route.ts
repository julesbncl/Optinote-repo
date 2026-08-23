import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const { searchParams } = requestUrl
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  const origin = (
    forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : process.env.NEXT_PUBLIC_APP_URL || requestUrl.origin
  ).replace(/\/+$/, '')


  const supabase = await createClient()

  // 1. Validation par Token Hash (Supabase OTP Email Flow)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // 2. Validation par Code PKCE (OAuth ou PKCE Email Flow)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Redirection en cas de lien expiré ou invalide
  return NextResponse.redirect(`${origin}/login?error=confirmation`)
}


