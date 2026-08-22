import { type NextRequest } from 'next/server'

// ═══════════════════════════════════════════════════════
// OptiNote — Rate Limiting Utility (Anti Brute-Force & DDoS)
// ═══════════════════════════════════════════════════════

const rateLimitMap = new Map<
  string,
  { count: number; lastReset: number }
>()

export interface RateLimitResult {
  success: boolean
  remaining: number
  limit: number
  resetIn: number // seconds until reset
}

/**
 * Extrait l'adresse IP cliente fiable à partir des en-têtes de la requête
 */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }
  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp.trim()
  }
  return '127.0.0.1'
}

/**
 * Vérifie les quotas de requêtes pour un identifiant donné (IP ou User ID)
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number = 60_000
): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitMap.get(identifier)

  if (!entry || now - entry.lastReset > windowMs) {
    rateLimitMap.set(identifier, { count: 1, lastReset: now })
    return {
      success: true,
      remaining: maxRequests - 1,
      limit: maxRequests,
      resetIn: Math.ceil(windowMs / 1000),
    }
  }

  if (entry.count >= maxRequests) {
    const resetIn = Math.ceil((windowMs - (now - entry.lastReset)) / 1000)
    return {
      success: false,
      remaining: 0,
      limit: maxRequests,
      resetIn: Math.max(resetIn, 1),
    }
  }

  entry.count++
  return {
    success: true,
    remaining: maxRequests - entry.count,
    limit: maxRequests,
    resetIn: Math.ceil((windowMs - (now - entry.lastReset)) / 1000),
  }
}

/**
 * Règles de Rate Limiting par type de route
 */
export interface RouteRateLimitRule {
  maxRequests: number
  windowMs: number
}

export function getRouteRateLimitRule(pathname: string): RouteRateLimitRule | null {
  // Routes d'authentification sensibles (Brute-Force protection)
  // Max 10 requêtes par minute pour connexion / inscription
  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/register')
  ) {
    return { maxRequests: 10, windowMs: 60_000 }
  }

  // Mot de passe oublié / Réinitialisation (Anti-Spam & User enumeration)
  // Max 5 requêtes par minute
  if (
    pathname === '/forgot-password' ||
    pathname === '/reset-password' ||
    pathname.startsWith('/api/auth/forgot-password')
  ) {
    return { maxRequests: 5, windowMs: 60_000 }
  }

  // Routes d'envoi d'emails ou notifications
  if (pathname.startsWith('/api/email')) {
    return { maxRequests: 10, windowMs: 60_000 }
  }

  // Routes d'IA générative (Coût & abus d'API)
  // Max 20 requêtes par minute
  if (pathname.startsWith('/api/ai')) {
    return { maxRequests: 20, windowMs: 60_000 }
  }

  // Autres routes API globales
  if (pathname.startsWith('/api/')) {
    return { maxRequests: 60, windowMs: 60_000 }
  }

  return null
}

// Nettoyage régulier de la mémoire vive toutes les 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitMap.entries()) {
      if (now - entry.lastReset > 300_000) {
        rateLimitMap.delete(key)
      }
    }
  }, 300_000)
}
