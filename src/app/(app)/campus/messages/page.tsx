'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ChatWindow } from '@/components/campus/ChatWindow'
import { FriendsList } from '@/components/campus/FriendsList'
import { PaywallGuard } from '@/components/paywall/PaywallGuard'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  ArrowLeft,
  MessageSquare,
  Users,
  UserPlus,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Search,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { Profile } from '@/types/database'
import type { Friendship } from '@/types/campus'

function PrivateMessagesContent() {
  const searchParams = useSearchParams()
  const initialFriendId = searchParams.get('friendId') || searchParams.get('dmUserId')
  const initialFriendName = searchParams.get('friendName') || searchParams.get('dmUserName')

  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [friends, setFriends] = useState<Partial<Profile>[]>([])
  const [pendingReceived, setPendingReceived] = useState<Friendship[]>([])
  const [selectedFriend, setSelectedFriend] = useState<Partial<Profile> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { data: pData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (pData) setProfile(pData)
        }

        const res = await fetch('/api/campus/friends')
        if (res.ok) {
          const data = await res.json()
          const loadedFriends: Partial<Profile>[] = data.friends || []
          setFriends(loadedFriends)
          setPendingReceived(data.pendingReceived || [])

          // Si un friendId est passé en paramètre URL
          if (initialFriendId) {
            const found = loadedFriends.find((f) => f.id === initialFriendId)
            if (found) {
              setSelectedFriend(found)
            } else {
              setSelectedFriend({
                id: initialFriendId,
                full_name: initialFriendName ? decodeURIComponent(initialFriendName) : 'Camarade',
              })
            }
          } else if (loadedFriends.length > 0) {
            setSelectedFriend(loadedFriends[0])
          }
        }
      } catch (err) {
        console.error('Error loading private messages:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Abonnement Realtime pour les invitations d'ami
    const channel = supabase
      .channel('realtime:private_messages_hub')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
        },
        async () => {
          const res = await fetch('/api/campus/friends')
          if (res.ok) {
            const data = await res.json()
            setFriends(data.friends || [])
            setPendingReceived(data.pendingReceived || [])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [initialFriendId, initialFriendName, supabase])

  async function handleAcceptFriend(friendId: string) {
    try {
      const res = await fetch('/api/campus/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId, action: 'accept' }),
      })
      if (res.ok) {
        toast.success('Demande d’ami acceptée ! Vous pouvez discuter en privé 🎉')
        const dataRes = await fetch('/api/campus/friends')
        if (dataRes.ok) {
          const data = await dataRes.json()
          setFriends(data.friends || [])
          setPendingReceived(data.pendingReceived || [])
          const acceptedFriend = (data.friends || []).find((f: any) => f.id === friendId)
          if (acceptedFriend) setSelectedFriend(acceptedFriend)
        }
      }
    } catch {
      toast.error('Erreur lors de l’acceptation')
    }
  }

  async function handleDeclineFriend(friendId: string) {
    try {
      const res = await fetch('/api/campus/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId, action: 'decline' }),
      })
      if (res.ok) {
        toast.success('Demande d’ami refusée.')
        setPendingReceived((prev) => prev.filter((r) => r.user_id !== friendId))
      }
    } catch {
      toast.error('Erreur lors du refus')
    }
  }

  // Ne pas évaluer PaywallGuard tant que le vrai profil (et statut Pro) n'est pas
  // chargé : sinon profile=null est traité comme "non abonné" et affiche brièvement
  // l'écran d'abonnement même pour un compte Pro.
  if (loading) {
    return (
      <div className="space-y-4 max-w-6xl mx-auto pb-12">
        <Skeleton className="h-9 w-40" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <Skeleton className="lg:col-span-5 h-[520px] rounded-2xl" />
          <Skeleton className="lg:col-span-7 h-[520px] rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <PaywallGuard
      profile={profile}
      title="Messagerie Privée & Entraide (Pro) 💬"
      description="Échange en direct avec tes camarades de classe et de révision partout en France dans un cadre sécurisé et modéré."
    >
      <div className="space-y-4 max-w-6xl mx-auto pb-12">
      {/* Barre de navigation supérieure */}
      <div className="flex items-center justify-between">
        <Link
          href="/campus"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors bg-surface px-3 py-1.5 rounded-xl border border-border shadow-2xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour au Campus</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Messages Privés Sécurisés & Modérés</span>
          </div>

          <Link href="/campus/map">
            <button
              type="button"
              className="px-3 py-1.5 rounded-xl bg-primary-50 hover:bg-primary-100 text-primary-700 text-xs font-bold border border-primary-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <GraduationCap className="h-3.5 w-3.5 text-primary-600" />
              <span>Trouver des amis</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Grille principale : Liste des amis (Gauche) & Fenêtre de Chat (Droite) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Colonne Gauche : Boîte de réception 1-à-1 et amis */}
        <div className="lg:col-span-5 bg-surface rounded-2xl border border-border p-3.5 sm:p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-sm font-black text-text-primary">
                  Mes Messages Privés
                </h1>
                <p className="text-[10px] text-text-tertiary">
                  Conversations directes 1-à-1 avec tes amis
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
              {friends.length} contact{friends.length > 1 ? 's' : ''}
            </span>
          </div>

          <FriendsList
            friends={friends}
            pendingReceived={pendingReceived}
            activeFriendId={selectedFriend?.id}
            onSelectFriend={(friend) => setSelectedFriend(friend)}
            onAcceptRequest={handleAcceptFriend}
            onDeclineRequest={handleDeclineFriend}
          />
        </div>

        {/* Colonne Droite : Fenêtre de discussion en direct */}
        <div className="lg:col-span-7">
          {selectedFriend && profile ? (
            <ChatWindow
              directUser={selectedFriend}
              currentUserId={profile.id}
            />
          ) : (
            <div className="h-[520px] bg-surface rounded-2xl border border-border flex flex-col items-center justify-center p-6 text-center space-y-3 shadow-sm">
              <div className="h-14 w-14 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <MessageSquare className="h-7 w-7" />
              </div>
              <h2 className="font-black text-sm text-text-primary">
                Aucune conversation sélectionnée
              </h2>
              <p className="text-xs text-text-secondary max-w-sm">
                Sélectionne un ami dans la liste à gauche pour ouvrir votre discussion privée instantanée ou explore la carte pour faire de nouvelles rencontres.
              </p>
              <Link href="/campus/map">
                <button
                  type="button"
                  className="mt-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Explorer les lycéens sur la Carte</span>
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
    </PaywallGuard>
  )
}

export default function PrivateMessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[600px] flex items-center justify-center text-xs text-text-tertiary">
          Chargement des messages...
        </div>
      }
    >
      <PrivateMessagesContent />
    </Suspense>
  )
}
