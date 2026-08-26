'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Header } from '@/components/layout/Header'
import type { Profile } from '@/types/database'

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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (data) {
        setProfile(data)
      } else {
        console.error('Error fetching profile:', error)
        router.push('/login')
      }
    }

    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        await fetchProfile(user.id)
      } else {
        // Le proxy d'authentification (src/proxy.ts) protège déjà ces routes ;
        // ce cas ne devrait survenir qu'en cas d'expiration de session en cours de visite.
        router.push('/login')
      }
      setLoading(false)
    }

    loadProfile()

    // Écoute en temps réel des changements d'état de session Supabase (ex: confirmation par email)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        router.push('/login')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

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
