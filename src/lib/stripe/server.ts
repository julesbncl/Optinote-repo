import Stripe from 'stripe'
import { isFreeAccessPeriodActive } from '@/lib/constants'
import type { Profile } from '@/types/database'

// Lazy & dynamic initialization of Stripe SDK instance
let cachedStripe: Stripe | null = null
let lastKey: string | null = null

/**
 * Returns a validated instance of the Stripe SDK using STRIPE_SECRET_KEY.
 * Trims whitespace/quotes and validates that a real key is provided.
 */
export function getStripe(): Stripe {
  const rawKey =
    process.env.STRIPE_SECRET_KEY?.trim().replace(/^["']|["']$/g, '') || ''

  if (
    !rawKey ||
    rawKey === 'sk_test_placeholder_key' ||
    rawKey === 'sk_test_your_secret_key' ||
    !rawKey.startsWith('sk_')
  ) {
    throw new Error(
      "La clé secrète Stripe (STRIPE_SECRET_KEY) n'est pas configurée ou est invalide dans votre fichier .env.local. Veuillez renseigner votre vraie clé secrète Stripe commençant par 'sk_test_' ou 'sk_live_'."
    )
  }

  if (!cachedStripe || lastKey !== rawKey) {
    lastKey = rawKey
    cachedStripe = new Stripe(rawKey, {
      apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
      appInfo: {
        name: 'OptiNote SaaS',
        version: '0.1.0',
      },
    })
  }

  return cachedStripe
}

// Proxy permettant d'utiliser l'export `stripe.xxx` partout de manière transparente
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    const instance = getStripe()
    const value = Reflect.get(instance, prop, receiver)
    return typeof value === 'function' ? value.bind(instance) : value
  },
})

/**
 * Checks if a user has an active paid subscription (monthly or annual).
 */
export function isUserSubscribed(profile: Profile | null): boolean {
  if (isFreeAccessPeriodActive()) return true
  if (!profile) return false
  if (profile.is_creator_partner) return true
  if (profile.is_pro === true) return true
  const activeStatuses = ['active', 'trialing']
  const tier = profile.subscription_tier || 'free'
  const status = profile.subscription_status || 'inactive'

  return activeStatuses.includes(status) && (tier === 'monthly' || tier === 'annual')
}

