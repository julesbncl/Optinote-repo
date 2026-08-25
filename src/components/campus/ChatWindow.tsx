'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageBubble } from './MessageBubble'
import { ReportModal } from './ReportModal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Send, Users, Shield, Sparkles, User, MessageCircle, UserPlus, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Message, ChatChannel } from '@/types/campus'
import type { Profile } from '@/types/database'

interface ChatWindowProps {
  channel?: ChatChannel | null
  directUser?: Partial<Profile> | null
  currentUserId: string
  onBack?: () => void
}

export function ChatWindow({ channel, directUser, currentUserId, onBack }: ChatWindowProps) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [reportMessageId, setReportMessageId] = useState<string | null>(null)
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'accepted'>('none')
  const [isSendingFriendReq, setIsSendingFriendReq] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isDirect = Boolean(directUser && !channel)
  const chatTitle = isDirect
    ? directUser?.full_name || 'Camarade'
    : channel?.name || 'Salon d’entraide'
  const chatSubtitle = isDirect
    ? `${directUser?.school_name || 'Lycée'} • ${directUser?.class_level || 'Lycéen'}`
    : channel?.description || 'Discussion d’entraide'

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Load existing messages & Realtime WebSockets
  useEffect(() => {
    let isMounted = true

    async function loadMessages() {
      try {
        const queryUrl = isDirect
          ? `/api/campus/messages?receiverId=${directUser?.id}`
          : `/api/campus/messages?channelId=${channel?.id}`

        const res = await fetch(queryUrl)
        if (res.ok) {
          const data = await res.json()
          if (isMounted) {
            setMessages(data.messages || [])
            setLoading(false)
            setTimeout(scrollToBottom, 100)
          }
        }
      } catch (err) {
        console.error('Error fetching messages:', err)
        if (isMounted) setLoading(false)
      }
    }

    loadMessages()

    // Configuration du canal Realtime WebSockets
    const channelName = isDirect
      ? `dm:${[currentUserId, directUser?.id].sort().join('-')}`
      : `channel:${channel?.id}`

    const channelSubscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          const newMsg = payload.new as any

          // Vérifier si le message correspond à cette conversation
          const isRelevant = isDirect
            ? (newMsg.sender_id === currentUserId && newMsg.receiver_id === directUser?.id) ||
              (newMsg.sender_id === directUser?.id && newMsg.receiver_id === currentUserId)
            : newMsg.channel_id === channel?.id

          if (!isRelevant) return

          // Récupérer le profil de l'expéditeur si manquant
          const senderProfile = isDirect
            ? newMsg.sender_id === currentUserId
              ? { full_name: 'Moi', avatar_url: null, class_level: null }
              : {
                  full_name: directUser?.full_name || 'Camarade',
                  avatar_url: directUser?.avatar_url || null,
                  class_level: directUser?.class_level || null,
                }
            : null

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [
              ...prev,
              {
                ...newMsg,
                user_id: newMsg.user_id || newMsg.sender_id,
                profiles: senderProfile || undefined,
              },
            ]
          })

          setTimeout(scrollToBottom, 50)
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channelSubscription)
    }
  }, [channel?.id, directUser?.id, currentUserId, isDirect, supabase])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return

    const textToSend = inputText.trim()
    setInputText('')
    setSending(true)

    // Message optimiste local pour fluidité immédiate
    const tempId = `temp-${Date.now()}`
    const optimisticMessage: Message = {
      id: tempId,
      channel_id: channel?.id || null,
      user_id: currentUserId,
      sender_id: currentUserId,
      receiver_id: directUser?.id || null,
      content: textToSend,
      is_flagged: false,
      created_at: new Date().toISOString(),
      profiles: {
        full_name: 'Moi',
        avatar_url: null,
        class_level: null,
      },
    }

    setMessages((prev) => [...prev, optimisticMessage])
    setTimeout(scrollToBottom, 50)

    try {
      const payload = isDirect
        ? { receiverId: directUser?.id, content: textToSend }
        : { channelId: channel?.id, content: textToSend }

      const res = await fetch('/api/campus/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Erreur lors de l’envoi')
      }

      const data = await res.json()
      if (data.isFlagged) {
        toast('Message filtré par la modération anti-harcèlement.', {
          icon: '🛡️',
          duration: 4000,
        })
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l’envoi')
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
    } finally {
      setSending(false)
    }
  }

  async function handleSendFriendRequest() {
    if (!directUser?.id) return
    setIsSendingFriendReq(true)
    try {
      const res = await fetch('/api/campus/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId: directUser.id, action: 'request' }),
      })
      if (res.ok) {
        setFriendStatus('pending')
        toast.success(`Demande d’ami envoyée à ${directUser.full_name || 'ce camarade'} ! ✨`)
      }
    } catch {
      toast.error('Erreur lors de la demande d’ami')
    } finally {
      setIsSendingFriendReq(false)
    }
  }

  return (
    <div className="flex flex-col h-[520px] bg-surface rounded-2xl border border-border shadow-md overflow-hidden relative">
      {/* Header bar */}
      <div className="px-3.5 py-3 border-b border-border bg-surface flex items-center justify-between gap-2 z-10 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary text-xs font-bold cursor-pointer lg:hidden"
            >
              ←
            </button>
          )}

          <div
            className={`h-9 w-9 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 shadow-xs ${
              isDirect
                ? 'bg-gradient-to-tr from-purple-600 to-pink-500'
                : 'bg-gradient-to-tr from-primary-600 to-accent-600'
            }`}
          >
            {isDirect ? (
              (directUser?.full_name || 'A')[0].toUpperCase()
            ) : (
              <Users className="h-4 w-4" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs sm:text-sm font-black text-text-primary truncate">
                {chatTitle}
              </h2>
              <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
            </div>
            <p className="text-[10px] text-text-secondary truncate">{chatSubtitle}</p>
          </div>
        </div>

        {/* Actions header (Ajout ami pour DM ou badge modération) */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isDirect && (
            <button
              type="button"
              onClick={handleSendFriendRequest}
              disabled={isSendingFriendReq || friendStatus !== 'none'}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                friendStatus === 'accepted'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : friendStatus === 'pending'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-primary-50 hover:bg-primary-100 text-primary-700 border-primary-200'
              }`}
            >
              {friendStatus === 'accepted' ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span>Amis</span>
                </>
              ) : friendStatus === 'pending' ? (
                <span>Demande envoyée</span>
              ) : (
                <>
                  <UserPlus className="h-3 w-3 text-primary-600" />
                  <span>Ajouter en ami</span>
                </>
              )}
            </button>
          )}

          <div className="flex items-center gap-1 text-[9px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold hidden sm:flex">
            <Shield className="h-3 w-3" />
            <span>Modéré</span>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-surface-secondary/20">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-text-tertiary">
            <div className="h-6 w-6 rounded-full border-2 border-primary-600 border-t-transparent animate-spin" />
            <span className="text-xs font-semibold">Connexion en direct...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <MessageCircle className="h-6 w-6" />
            </div>
            <h3 className="font-extrabold text-xs text-text-primary">
              {isDirect ? `Démarre la discussion avec ${chatTitle}` : 'Aucun message pour l’instant'}
            </h3>
            <p className="text-[10.5px] text-text-secondary max-w-xs">
              {isDirect
                ? 'Pose une question sur les cours, demande des conseils d’orientation ou révisez ensemble !'
                : 'Sois le premier à poser une question ou partager une astuce avec tes camarades.'}
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isCurrentUser={
                msg.user_id === currentUserId || msg.sender_id === currentUserId
              }
              onReport={(id) => setReportMessageId(id)}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSendMessage}
        className="p-2.5 sm:p-3 border-t border-border bg-surface flex items-center gap-2"
      >
        <Input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Écris ton message à ${isDirect ? chatTitle : 'ce salon'}...`}
          className="flex-1 text-xs h-9 rounded-xl focus:border-primary-500 shadow-2xs"
          disabled={sending}
        />
        <Button
          type="submit"
          size="sm"
          disabled={!inputText.trim() || sending}
          className="h-9 px-3.5 rounded-xl font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-xs"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {/* Report modal */}
      {reportMessageId && (
        <ReportModal
          messageId={reportMessageId}
          isOpen={Boolean(reportMessageId)}
          onClose={() => setReportMessageId(null)}
        />
      )}
    </div>
  )
}
