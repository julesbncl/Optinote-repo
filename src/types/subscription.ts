// ═══════════════════════════════════════════════════════
// OptiNote — Subscription & Stripe Types
// ═══════════════════════════════════════════════════════

export type SubscriptionTier = 'free' | 'monthly' | 'annual'

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused'
  | 'inactive'

export type BillingInterval = 'month' | 'year'

export interface Subscription {
  id: string // Stripe subscription ID (sub_xxx)
  user_id: string
  status: SubscriptionStatus
  price_id: string
  plan_tier: 'monthly' | 'annual'
  billing_interval: BillingInterval
  amount: number
  currency: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

export interface PricingPlan {
  id: 'free' | 'monthly' | 'annual'
  name: string
  badge?: string
  description: string
  price: number // e.g. 0, 7.99, 71.88
  displayPrice: string // e.g. "0 €", "7,99 €", "5,99 €"
  billingPeriod: string // e.g. "gratuit", "par mois", "par mois"
  annualBillingTotal?: string // e.g. "71 € facturés pour un an"
  equivalentMonthlyPrice?: string // e.g. "5,99 € / mois"
  savingsBadge?: string // e.g. "Économise 24 €"
  stripePriceId?: string
  features: string[]
  limitations?: string[]
  highlighted?: boolean
  ctaLabel: string
}
