// ═══════════════════════════════════════════════════════
// OptiNote — Database Types
// ═══════════════════════════════════════════════════════
// Mirrors the Supabase PostgreSQL schema.

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  class_level: 'seconde' | 'premiere' | 'terminale' | 'autre' | null
  specialties: string[]
  academic_goal: 'excellence' | 'progression' | 'bac_mention' | 'rattrapage' | null
  post_bac_target: 'scientifique' | 'sante' | 'eco_droit' | 'litteraire' | 'ingenieur' | 'art' | 'autre' | null
  school_id: string | null
  is_visible_on_school: boolean
  onboarding_completed: boolean
  school_name: string | null
  latitude?: number | null
  longitude?: number | null
  is_visible?: boolean
  is_studying?: boolean
  bio?: string | null
  stripe_customer_id?: string | null
  subscription_tier?: 'free' | 'monthly' | 'annual'
  subscription_status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'inactive'
  is_pro?: boolean
  beta_access_redeemed_at?: string | null
  is_verified?: boolean
  school_certificate_url?: string | null
  verification_status?: 'none' | 'pending' | 'verified' | 'rejected'
  verification_note?: string | null
  is_admin?: boolean
  email_notif_messages?: boolean
  email_notif_friends?: boolean
  email_notif_revisions?: boolean
  email_notif_planning_reminder?: boolean
  email_notif_grade_evolution?: boolean
  current_streak?: number
  longest_streak?: number
  last_streak_date?: string | null
  last_known_average?: number | null
  leaderboard_opt_in?: boolean
  referral_code?: string | null
  free_months_credit?: number
  subscription_current_period_end?: string | null
  preferences: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Subject {
  id: string
  user_id: string
  name: string
  coefficient: number
  teacher_name: string | null
  color: string
  created_at: string
}

export interface Grade {
  id: string
  user_id: string
  subject_id: string
  value: number
  out_of: number
  coefficient: number
  label: string | null
  trimester: 1 | 2 | 3
  date: string | null
  is_simulated: boolean
  created_at: string
}

export interface Folder {
  id: string
  user_id: string
  name: string
  parent_id: string | null
  position: number
  created_at: string
}

export interface RevisionSheet {
  id: string
  user_id: string
  folder_id: string | null
  subject_id: string | null
  title: string
  original_text: string | null
  original_image_url: string | null
  content: string
  key_concepts: string[]
  summary: string | null
  source_type: 'text' | 'photo' | 'manual'
  created_at: string
  updated_at: string
}

export interface Schedule {
  id: string
  user_id: string
  week_start: string
  timetable_image_url: string | null
  constraints: Record<string, unknown>
  homework: HomeworkEntry[]
  generated_plan: PlanningSlot[]
  status: 'active' | 'archived'
  created_at: string
  updated_at?: string
}

export interface HomeworkEntry {
  subject: string
  description: string
  dueDate: string
  estimatedMinutes?: number
  priority: 'low' | 'medium' | 'high'
}

export interface PlanningSlot {
  day: number // 0=Monday .. 6=Sunday
  startTime: string // HH:mm
  endTime: string // HH:mm
  subject: string
  task: string
  type: 'study' | 'homework' | 'revision' | 'break' | 'class' | 'other'
  activity?: string
}

export interface GeneratedMessage {
  id: string
  user_id: string
  message_type:
    | 'absence'
    | 'retard'
    | 'question'
    | 'rdv'
    | 'rattrapage'
    | 'autre'
  context: string
  teacher_name: string | null
  generated_content: string
  is_favorite: boolean
  created_at: string
}

export interface AiUsage {
  id: string
  user_id: string
  action_type: string
  tokens_used: number
  created_at: string
}

// ═══════════════════════════════════════════════════════
// Extended types (with joins)
// ═══════════════════════════════════════════════════════

export interface GradeWithSubject extends Grade {
  subjects: Pick<Subject, 'name' | 'color'>
}

export interface RevisionSheetWithFolder extends RevisionSheet {
  folders: Pick<Folder, 'name'> | null
}
