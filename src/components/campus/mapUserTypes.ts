import type { Profile } from '@/types/database'

// Un élève affiché sur la carte, enrichi des infos de sa session de révision
// active (le cas échéant) — renvoyées par /api/campus/users/location.
export type MapUser = Partial<Profile> & {
  study_session_id?: string | null
  study_session_subject?: string | null
  study_session_current?: number | null
  study_session_max?: number | null
  study_session_joined_by_me?: boolean
}
