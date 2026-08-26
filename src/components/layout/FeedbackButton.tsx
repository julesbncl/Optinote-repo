'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle, Bug, Lightbulb, MessageSquare } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import toast from 'react-hot-toast'

type FeedbackType = 'bug' | 'idea' | 'other'

const TYPES: { value: FeedbackType; label: string; icon: typeof Bug }[] = [
  { value: 'bug', label: 'Bug', icon: Bug },
  { value: 'idea', label: 'Idée', icon: Lightbulb },
  { value: 'other', label: 'Autre', icon: MessageSquare },
]

export function FeedbackButton() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [type, setType] = useState<FeedbackType>('bug')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (message.trim().length < 5) {
      toast.error('Décris un peu plus ton message (5 caractères min.)')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message: message.trim(), pageUrl: pathname }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        toast.error(data?.error || 'Erreur lors de l’envoi')
        return
      }

      toast.success('Merci ! Ton message a bien été envoyé 🙌', { duration: 3500 })
      setMessage('')
      setType('bug')
      setIsOpen(false)
    } catch {
      toast.error('Erreur lors de l’envoi')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Bouton flottant : au-dessus de la barre de navigation mobile, sous le
          header desktop. Taille tactile généreuse (48px) pour un usage confortable
          au pouce sur mobile. */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-[4.75rem] lg:bottom-6 right-3 sm:right-6 z-40 h-12 w-12 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all cursor-pointer active:scale-95"
        aria-label="Signaler un bug ou donner un avis"
        title="Signaler un bug / donner un avis"
      >
        <MessageCircle className="h-5 w-5" />
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Signaler un bug / donner un avis"
        description="Ton retour va directement à l'équipe OptiNote."
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-3 gap-1.5">
            {TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                className={`h-11 rounded-xl border text-[11px] font-bold flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                  type === value
                    ? 'bg-primary-50 border-primary-300 text-primary-700'
                    : 'bg-surface-secondary border-border text-text-secondary hover:border-primary-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              type === 'bug'
                ? 'Décris le problème rencontré (ce que tu faisais, ce qui ne marche pas)...'
                : type === 'idea'
                ? "Quelle fonctionnalité ou amélioration aimerais-tu voir sur OptiNote ?"
                : 'Ton message...'
            }
            rows={5}
            maxLength={2000}
            className="w-full p-2.5 rounded-xl bg-surface-secondary border border-border text-[12.5px] text-text-primary placeholder:text-text-tertiary resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-70 text-white text-sm font-bold transition-all cursor-pointer"
          >
            {submitting ? 'Envoi...' : 'Envoyer'}
          </button>
        </form>
      </Modal>
    </>
  )
}
