import type { Profile } from '@/types/database'
import { isUserSubscribed } from '@/lib/stripe/server'
import { SupabaseClient } from '@supabase/supabase-js'

export interface QuotaCheckResult {
  allowed: boolean
  currentUsage: number
  maxAllowed: number
  reason?: string
}

/**
 * Checks if a user is allowed to create another revision sheet.
 * Free accounts: max 1 sheet lifetime.
 * Paid accounts (monthly/annual): unlimited.
 */
export async function checkRevisionSheetQuota(
  supabase: SupabaseClient,
  userId: string,
  profile: Profile | null
): Promise<QuotaCheckResult> {
  if (isUserSubscribed(profile)) {
    return { allowed: true, currentUsage: 0, maxAllowed: Infinity }
  }

  const { count, error } = await supabase
    .from('revision_sheets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    console.error('Error counting revision sheets:', error)
  }

  const currentUsage = count || 0
  const maxAllowed = 1

  return {
    allowed: currentUsage < maxAllowed,
    currentUsage,
    maxAllowed,
    reason:
      currentUsage >= maxAllowed
        ? 'Vous avez déjà généré votre fiche d’essai gratuite. Passez à l’accès illimité pour créer des fiches à volonté !'
        : undefined,
  }
}

/**
 * Checks if a user is allowed to add another grade for a specific subject in a given trimester.
 * Free accounts: max 1 real grade per subject per trimester.
 * Paid accounts (monthly/annual): unlimited.
 */
export async function checkGradePerSubjectQuota(
  supabase: SupabaseClient,
  userId: string,
  subjectId: string,
  profile: Profile | null,
  trimester: number
): Promise<QuotaCheckResult> {
  if (isUserSubscribed(profile)) {
    return { allowed: true, currentUsage: 0, maxAllowed: Infinity }
  }

  const { count, error } = await supabase
    .from('grades')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('subject_id', subjectId)
    .eq('trimester', trimester)
    .eq('is_simulated', false)

  if (error) {
    console.error('Error counting grades for subject:', error)
  }

  const currentUsage = count || 0
  const maxAllowed = 1

  return {
    allowed: currentUsage < maxAllowed,
    currentUsage,
    maxAllowed,
    reason:
      currentUsage >= maxAllowed
        ? 'La version gratuite est limitée à 1 seule note par matière. Passez à l’accès illimité pour suivre toutes vos notes et coefficients !'
        : undefined,
  }
}
