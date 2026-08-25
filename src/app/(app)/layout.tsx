'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Header } from '@/components/layout/Header'
import type { Profile } from '@/types/database'

export const DEFAULT_MOCK_PROFILE: Profile = {
  id: 'mock-user-001',
  email: 'thomas.dubois@lycee.fr',
  full_name: 'Thomas Dubois',
  avatar_url: null,
  class_level: 'terminale',
  school_name: 'Lycée Henri IV',
  school_id: null,
  specialties: ['Mathématiques', 'Physique-Chimie'],
  academic_goal: 'excellence',
  post_bac_target: 'ingenieur',
  is_visible_on_school: true,
  onboarding_completed: true,
  subscription_tier: 'free',
  subscription_status: 'inactive',
  is_pro: false,
  subscription_current_period_end: null,
  preferences: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [campusBadgeCount, setCampusBadgeCount] = useState(0)

  useEffect(() => {
    async function fetchProfile(userId: string) {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (data) {
          setProfile(data)
        } else {
          setProfile(DEFAULT_MOCK_PROFILE)
        }
      } catch (error) {
        console.warn('Utilisation du profil mocké en mode dev:', error)
        setProfile(DEFAULT_MOCK_PROFILE)
      }
    }

    async function loadProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          await fetchProfile(user.id)
        } else {
          setProfile(DEFAULT_MOCK_PROFILE)
        }
      } catch (error) {
        console.warn('Utilisation du profil mocké en mode dev:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()

    // Écoute en temps réel des changements d'état de session Supabase (ex: confirmation par email)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        setProfile(DEFAULT_MOCK_PROFILE)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  // Badge de notification sur l'onglet Campus : demandes d'amis en attente + messages non lus
  useEffect(() => {
    async function loadCampusBadge() {
      try {
        const res = await fetch('/api/campus/friends')
        if (res.ok) {
          const data = await res.json()
          setCampusBadgeCount(
            (data.pendingReceived?.length || 0) + (data.unreadMessagesCount || 0)
          )
        }
      } catch {
        // Silencieux : le badge reste simplement à son ancienne valeur
      }
    }

    loadCampusBadge()

    const notifChannel = supabase
      .channel('realtime:campus_notifications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendships' },
        loadCampusBadge
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        loadCampusBadge
      )
      .subscribe()

    return () => {
      supabase.removeChannel(notifChannel)
    }
  }, [supabase])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch {}
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 animate-pulse" />
          <p className="text-sm text-text-tertiary">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-surface-secondary">
      {/* Desktop Sidebar */}
      <Sidebar profile={profile} onSignOut={handleSignOut} campusBadgeCount={campusBadgeCount} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header profile={profile} />

        <main className="flex-1 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-4 pb-20 lg:pb-4">
          <div className="max-w-6xl mx-auto fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav profile={profile} campusBadgeCount={campusBadgeCount} />
    </div>
  )
}
