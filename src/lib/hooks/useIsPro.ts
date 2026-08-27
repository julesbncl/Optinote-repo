'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { hasBetaAccess } from '@/lib/constants'
import type { Profile } from '@/types/database'

/**
 * Custom hook that returns the current user's Pro status.
 *
 * Pro is determined by:
 *  1. The explicit `is_pro` column on the profile, OR
 *  2. An active/trialing subscription on a monthly or annual tier.
 *
 * Returns `{ isPro, profile, loading }`.
 */
export function checkIsPro(profile: Partial<Profile> | null | undefined): boolean {
  if (!profile) return false
  if (profile.is_pro === true || (profile as any).is_pro === 'true') return true
  if (hasBetaAccess(profile)) return true
  if (['active', 'trialing'].includes(profile.subscription_status || '')) return true
  if (
    profile.subscription_tier &&
    !['free', 'inactive', 'none', ''].includes(profile.subscription_tier.toLowerCase())
  ) {
    return true
  }
  return false
}

export function useIsPro() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (data) {
            setProfile(data)
          }
        }
      } catch {
        // Silently fallback — profile stays null
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [supabase])

  const isPro = checkIsPro(profile)

  return { isPro, profile, loading }
}
