'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ChatWindow } from '@/components/campus/ChatWindow'
import { ChannelList } from '@/components/campus/ChannelList'
import { ArrowLeft, Users } from 'lucide-react'
import { PaywallGuard } from '@/components/paywall/PaywallGuard'
import type { ChatChannel } from '@/types/campus'
import type { Profile } from '@/types/database'

export default function ChannelChatPage({
  params,
}: {
  params: Promise<{ channelId: string }>
}) {
  const { channelId } = use(params)
  const supabase = createClient()
  const [channel, setChannel] = useState<ChatChannel | null>(null)
  const [allChannels, setAllChannels] = useState<ChatChannel[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        const { data: pData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        if (pData) setProfile(pData)
      }

      // Fetch channels
      const res = await fetch('/api/campus/channels')
      if (res.ok) {
        const data = await res.json()
        const channels: ChatChannel[] = data.channels || []
        setAllChannels(channels)

        const selected = channels.find((c) => c.id === channelId)
        if (selected) {
          setChannel(selected)
        }
      }
      setLoading(false)
    }

    loadData()
  }, [channelId, supabase])

  if (loading) {
    return (
      <div className="h-[600px] flex items-center justify-center text-xs text-text-tertiary">
        Chargement du salon...
      </div>
    )
  }

  return (
    <PaywallGuard
      profile={profile}
      title="Salons de Spécialités & Lycées (Pro) 🚀"
      description="Échange en continu avec les élèves de ta spécialité et de ton lycée dans des salons dédiés."
    >
      <div className="space-y-4">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/campus"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au Hub Campus
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Other Channels List (hidden on small mobile) */}
        <div className="hidden lg:block lg:col-span-4 bg-surface rounded-2xl border border-border p-4 h-[650px] overflow-y-auto no-scrollbar">
          <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary-600" />
            Tous les salons
          </h3>
          <ChannelList channels={allChannels} activeChannelId={channelId} />
        </div>

        {/* Right Column: Active Chat Window */}
        <div className="lg:col-span-8">
          {channel && currentUserId ? (
            <ChatWindow channel={channel} currentUserId={currentUserId} />
          ) : (
            <div className="h-[600px] bg-surface rounded-2xl border border-border flex flex-col items-center justify-center p-6 text-center">
              <h3 className="font-bold text-text-primary">Salon introuvable</h3>
              <Link href="/campus" className="text-primary-600 text-xs mt-2 underline">
                Retourner à la liste des salons
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
    </PaywallGuard>
  )
}
