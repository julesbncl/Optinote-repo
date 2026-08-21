'use client'

import { useState } from 'react'
import { User, MessageSquare, Check, X, UserPlus, Clock, Sparkles } from 'lucide-react'
import type { Profile } from '@/types/database'
import type { Friendship } from '@/types/campus'

interface FriendsListProps {
  friends: Partial<Profile>[]
  pendingReceived: Friendship[]
  activeFriendId?: string | null
  onSelectFriend: (friend: Partial<Profile>) => void
  onAcceptRequest: (friendId: string) => Promise<void> | void
  onDeclineRequest: (friendId: string) => Promise<void> | void
}

export function FriendsList({
  friends,
  pendingReceived,
  activeFriendId,
  onSelectFriend,
  onAcceptRequest,
  onDeclineRequest,
}: FriendsListProps) {
  const [search, setSearch] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const filteredFriends = friends.filter((f) =>
    (f.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (f.school_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleAccept = async (e: React.MouseEvent, friendId: string) => {
    e.stopPropagation()
    setProcessingId(friendId)
    try {
      await onAcceptRequest(friendId)
    } finally {
      setProcessingId(null)
    }
  }

  const handleDecline = async (e: React.MouseEvent, friendId: string) => {
    e.stopPropagation()
    setProcessingId(friendId)
    try {
      await onDeclineRequest(friendId)
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* 1. Demandes d'amis reçues en attente */}
      {pendingReceived.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-2.5 space-y-2">
          <div className="flex items-center gap-1.5 text-[10.5px] font-extrabold text-amber-900">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            <span>Demandes d’ami reçues ({pendingReceived.length})</span>
          </div>

          <div className="space-y-1.5">
            {pendingReceived.map((req) => (
              <div
                key={req.id}
                className="bg-white p-2 rounded-lg border border-amber-200/80 flex items-center justify-between gap-2 shadow-2xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                    {req.friend_profile?.full_name ? req.friend_profile.full_name[0].toUpperCase() : '👤'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-text-primary truncate">
                      {req.friend_profile?.full_name || 'Nouvel élève'}
                    </p>
                    <p className="text-[9px] text-text-tertiary truncate">
                      {req.friend_profile?.school_name || 'Lycée'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handleAccept(e, req.user_id)}
                    disabled={processingId === req.user_id}
                    className="p-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] transition-all cursor-pointer shadow-2xs"
                    title="Accepter"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDecline(e, req.user_id)}
                    disabled={processingId === req.user_id}
                    className="p-1 rounded-md bg-surface-secondary hover:bg-red-50 text-text-tertiary hover:text-red-600 border border-border text-[10px] transition-all cursor-pointer"
                    title="Refuser"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Recherche parmi ses amis */}
      {friends.length > 5 && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un ami..."
          className="w-full h-8 px-2.5 text-xs bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      )}

      {/* 3. Liste de ses amis acceptés */}
      <div className="space-y-1">
        {filteredFriends.length > 0 ? (
          filteredFriends.map((friend) => {
            const isSelected = activeFriendId === friend.id

            return (
              <div
                key={friend.id}
                onClick={() => onSelectFriend(friend)}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer text-left select-none ${
                  isSelected
                    ? 'bg-primary-50 text-primary-900 border-primary-300 shadow-2xs'
                    : 'bg-surface hover:bg-surface-secondary text-text-secondary hover:text-text-primary border-border/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                      {friend.full_name ? friend.full_name[0].toUpperCase() : '👤'}
                    </div>
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-text-primary truncate">
                      {friend.full_name}
                    </p>
                    <p className="text-[10px] text-text-tertiary truncate">
                      {friend.school_name || 'Lycée'} • {friend.class_level || 'Lycéen'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-lg border border-primary-200 flex items-center gap-1">
                    <MessageSquare className="h-2.5 w-2.5" />
                    <span>Discuter</span>
                  </span>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center py-6 px-3 bg-surface-secondary/40 rounded-xl border border-dashed border-border text-text-tertiary space-y-1">
            <UserPlus className="h-6 w-6 mx-auto text-text-tertiary opacity-60" />
            <p className="text-xs font-bold text-text-secondary">Aucun ami pour l’instant</p>
            <p className="text-[10px]">
              Explore la carte interactive du Campus ou les salons pour envoyer des demandes d’amis à tes camarades !
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
