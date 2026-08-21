import Stripe from 'stripe'
import type { Profile } from '@/types/database'

// Initialize Stripe SDK instance
export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key',
  {
    apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
    appInfo: {
      name: 'OptiNote SaaS',
      version: '0.1.0',
    },
  }
)

/**
 * Checks if a user has an active paid subscription (monthly or annual).
 */
export function isUserSubscribed(profile: Profile | null): boolean {
  if (!profile) return false
  if (profile.is_pro === true) return true
  const activeStatuses = ['active', 'trialing']
  const tier = profile.subscription_tier || 'free'
  const status = profile.subscription_status || 'inactive'

  return activeStatuses.includes(status) && (tier === 'monthly' || tier === 'annual')
}
