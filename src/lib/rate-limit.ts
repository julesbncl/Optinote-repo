// ═══════════════════════════════════════════════════════
// OptiNote — Rate Limiting Utility
// ═══════════════════════════════════════════════════════
// Simple in-memory rate limiter for API routes.
// For production at scale, use Redis or Upstash.

const rateLimitMap = new Map<
  string,
  { count: number; lastReset: number }
>()

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetIn: number // seconds until reset
}

/**
 * Check rate limit for a given identifier (e.g., user ID or IP).
 * @param identifier - Unique key for the rate limit bucket
 * @param maxRequests - Maximum requests allowed per window
 * @param windowMs - Time window in milliseconds (default: 60s)
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number = 60_000
): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitMap.get(identifier)

  if (!entry || now - entry.lastReset > windowMs) {
    // Reset window
    rateLimitMap.set(identifier, { count: 1, lastReset: now })
    return {
      success: true,
      remaining: maxRequests - 1,
      resetIn: Math.ceil(windowMs / 1000),
    }
  }

  if (entry.count >= maxRequests) {
    const resetIn = Math.ceil((windowMs - (now - entry.lastReset)) / 1000)
    return {
      success: false,
      remaining: 0,
      resetIn,
    }
  }

  entry.count++
  return {
    success: true,
    remaining: maxRequests - entry.count,
    resetIn: Math.ceil((windowMs - (now - entry.lastReset)) / 1000),
  }
}

// Cleanup stale entries every 5 minutes
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
