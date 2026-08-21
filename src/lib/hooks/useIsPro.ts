'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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

  const isPro = Boolean(
    profile &&
      (profile.is_pro === true ||
        (['active', 'trialing'].includes(profile.subscription_status || '') &&
          (profile.subscription_tier === 'monthly' || profile.subscription_tier === 'annual')))
  )

  return { isPro, profile, loading }
}
