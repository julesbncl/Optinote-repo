import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { checkRateLimit, getClientIp, getRouteRateLimitRule } from '@/lib/rate-limit'

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const ip = getClientIp(request)

  // ═════════════════════════════════════════════════════════
  // 1. Middleware CORS Strict pour l'API
  // ═════════════════════════════════════════════════════════
  // Safari (mode Privé, appli ajoutée à l'écran d'accueil, redirections
  // cross-origin) envoie parfois littéralement la chaîne "null" comme Origin
  // plutôt que d'omettre l'en-tête. On la traite comme une origine absente,
  // déjà autorisée juste en dessous (requêtes serveur à serveur, apps mobiles).
  const rawOrigin = request.headers.get('origin')
  const origin = rawOrigin && rawOrigin !== 'null' ? rawOrigin : null
  const isProduction = process.env.NODE_ENV === 'production'

  const ALLOWED_ORIGINS = isProduction
    ? ['https://optinote.fr', 'https://www.optinote.fr']
    : [
        'https://optinote.fr',
        'https://www.optinote.fr',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
      ]

  const isApiRoute = pathname.startsWith('/api/')
  const isStripeWebhook = pathname === '/api/stripe/webhook'

  // Gestion des requêtes préliminaires (CORS Preflight OPTIONS)
  if (request.method === 'OPTIONS' && isApiRoute && !isStripeWebhook) {
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return new NextResponse(null, { status: 403, statusText: 'CORS Forbidden' })
    }

    const preflightHeaders = new Headers({
      'Access-Control-Allow-Origin': origin || 'https://optinote.fr',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400', // 24h cache preflight
      'Vary': 'Origin',
    })
    return new NextResponse(null, { status: 204, headers: preflightHeaders })
  }

  // Blocage strict des origines non autorisées sur l'API
  if (isApiRoute && origin && !isStripeWebhook && !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json(
      { error: 'Accès interdit : Origine non autorisée par la politique CORS' },
      { status: 403 }
    )
  }

  // ═════════════════════════════════════════════════════════
  // 2. Rate Limiting Anti-Brute-Force & Anti-Abus
  // ═════════════════════════════════════════════════════════
  const rateLimitRule = getRouteRateLimitRule(pathname)
  if (rateLimitRule) {
    const rateLimitKey = `rl:${pathname.startsWith('/api/') ? 'api' : 'page'}:${pathname}:${ip}`
    const limitResult = checkRateLimit(rateLimitKey, rateLimitRule.maxRequests, rateLimitRule.windowMs)

    if (!limitResult.success) {
      // Pour les routes API : Réponse JSON 429 standard
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          {
            error: 'Trop de tentatives. Veuillez réessayer plus tard.',
            retryAfter: limitResult.resetIn,
          },
          {
            status: 429,
            headers: {
              'Retry-After': limitResult.resetIn.toString(),
              'X-RateLimit-Limit': limitResult.limit.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': limitResult.resetIn.toString(),
            },
          }
        )
      }

      // Pour les pages d'authentification (ex: /login) : redirection avec query param d'erreur
      const url = request.nextUrl.clone()
      url.searchParams.set('error', 'rate_limit')
      const response = NextResponse.redirect(url)
      response.headers.set('Retry-After', limitResult.resetIn.toString())
      return response
    }
  }

  // ═════════════════════════════════════════════════════════
  // 2. Initialisation Supabase SSR avec Cookies Sécurisés
  // ═════════════════════════════════════════════════════════
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Sécurisation stricte des options de cookies JWT/Session
            const secureOptions = {
              ...options,
              httpOnly: options?.httpOnly ?? true,
              secure: options?.secure ?? isProduction,
              sameSite: options?.sameSite ?? ('lax' as const),
              path: options?.path ?? '/',
            }

            request.cookies.set(name, value)
            supabaseResponse.cookies.set(name, value, secureOptions)
          })
        },
      },
    }
  )

  // ═════════════════════════════════════════════════════════
  // 3. Validation de session (getUser valide le JWT côté serveur)
  // ═════════════════════════════════════════════════════════
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Routes protégées — redirection des utilisateurs non connectés
  const protectedPaths = [
    '/dashboard',
    '/campus',
    '/grades',
    '/planning',
    '/revision',
    '/settings',
    '/messages',
    '/admin',
    '/onboarding',
  ]
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Redirection des utilisateurs déjà connectés
  if (user && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // ═════════════════════════════════════════════════════════
  // 4. En-têtes HTTP de Sécurité (OWASP Defense in Depth)
  // ═════════════════════════════════════════════════════════
  supabaseResponse.headers.set('X-Frame-Options', 'DENY')
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  supabaseResponse.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(self)'
  )

  if (isProduction) {
    supabaseResponse.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    )
  }

  // En-têtes CORS pour les requêtes API autorisées
  if (isApiRoute && origin && ALLOWED_ORIGINS.includes(origin)) {
    supabaseResponse.headers.set('Access-Control-Allow-Origin', origin)
    supabaseResponse.headers.set('Access-Control-Allow-Credentials', 'true')
    supabaseResponse.headers.set('Vary', 'Origin')
  }

  return supabaseResponse
}
