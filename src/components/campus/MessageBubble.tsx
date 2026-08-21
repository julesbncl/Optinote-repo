import { useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Flag, ShieldAlert } from 'lucide-react'
import type { Message } from '@/types/campus'

interface MessageBubbleProps {
  message: Message
  isCurrentUser: boolean
  onReport: (messageId: string) => void
}

export function MessageBubble({ message, isCurrentUser, onReport }: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false)
  const authorName = message.profiles?.full_name || 'Élève'
  const authorLevel = message.profiles?.class_level || ''

  const timeString = new Date(message.created_at).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div
      className={`flex items-start gap-2.5 group relative ${
        isCurrentUser ? 'flex-row-reverse' : 'flex-row'
      }`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <Avatar
        src={message.profiles?.avatar_url}
        name={authorName}
        size="sm"
        className="flex-shrink-0 mt-1"
      />

      <div
        className={`max-w-[75%] sm:max-w-[65%] rounded-2xl px-4 py-2.5 text-sm ${
          isCurrentUser
            ? 'bg-primary-600 text-white rounded-tr-xs'
            : 'bg-surface border border-border text-text-primary rounded-tl-xs shadow-xs'
        }`}
      >
        {!isCurrentUser && (
          <div className="flex items-center gap-1.5 mb-1">
            <span className="font-bold text-xs text-primary-600">
              {authorName}
            </span>
            {authorLevel && (
              <span className="text-[10px] px-1.5 py-0.2 bg-surface-tertiary text-text-tertiary rounded uppercase font-semibold">
                {authorLevel}
              </span>
            )}
          </div>
        )}

        {message.is_flagged ? (
          <div className="flex items-center gap-1.5 italic text-xs opacity-80">
            <ShieldAlert className="h-3.5 w-3.5 flex-shrink-0" />
            <span>Message masqué pour modération ({message.flag_reason || 'Contenu sensible'})</span>
          </div>
        ) : (
          <p className="whitespace-pre-wrap leading-relaxed break-words">{message.content}</p>
        )}

        <div
          className={`text-[10px] mt-1 text-right ${
            isCurrentUser ? 'text-white/70' : 'text-text-tertiary'
          }`}
        >
          {timeString}
        </div>
      </div>

      {/* Report Button for other users' messages */}
      {!isCurrentUser && (
        <button
          type="button"
          onClick={() => onReport(message.id)}
          className={`p-1 text-text-tertiary hover:text-danger-600 rounded-lg hover:bg-danger-50 transition-opacity cursor-pointer ${
            showActions ? 'opacity-100' : 'opacity-0'
          }`}
          title="Signaler ce message"
        >
          <Flag className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
