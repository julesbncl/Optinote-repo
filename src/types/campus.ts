export interface School {
  id: string
  name: string
  city: string
  postal_code: string
  academy: string | null
  latitude: number
  longitude: number
  students_count: number
  created_at: string
}

export interface ChatChannel {
  id: string
  name: string
  description: string | null
  type: 'subject' | 'school' | 'general' | 'study_group'
  subject_tag: string | null
  class_level: string | null
  school_id: string | null
  created_by: string | null
  is_private: boolean
  created_at: string
  schools?: Pick<School, 'name' | 'city'> | null
}

export interface ChannelMember {
  id: string
  channel_id: string
  user_id: string
  role: 'member' | 'moderator' | 'admin'
  joined_at: string
}

export interface Message {
  id: string
  channel_id?: string | null
  user_id?: string
  sender_id?: string
  receiver_id?: string | null
  content: string
  is_flagged: boolean
  flag_reason?: string | null
  moderation_reason?: string | null
  created_at: string
  profiles?: {
    full_name: string | null
    avatar_url: string | null
    class_level: string | null
  }
}

export interface MessageReport {
  id: string
  message_id: string
  reported_by: string
  reason: 'harcelement' | 'propos_inappropries' | 'spam' | 'divulgation_donnees' | 'autre'
  details: string | null
  status: 'pending' | 'reviewed' | 'dismissed'
  created_at: string
}

export interface Friendship {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  updated_at?: string
  friend_profile?: {
    id: string
    full_name: string | null
    avatar_url: string | null
    school_name: string | null
    class_level: string | null
    specialties: string[] | null
  }
}

export interface DirectConversation {
  friendId: string
  friendName: string
  friendAvatar: string | null
  friendSchool: string | null
  friendClass: string | null
  lastMessage?: string
  lastMessageAt?: string
  unreadCount?: number
}
