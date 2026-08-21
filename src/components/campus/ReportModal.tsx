import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { REPORT_REASONS } from '@/lib/constants'
import { ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  messageId: string | null
}

export function ReportModal({ isOpen, onClose, messageId }: ReportModalProps) {
  const [reason, setReason] = useState<string>('harcelement')
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageId) return

    setLoading(true)
    try {
      const res = await fetch('/api/campus/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, reason, details }),
      })

      if (!res.ok) throw new Error('Erreur lors du signalement')

      toast.success('Signalement envoyé. Merci de contribuer à la sécurité du campus !')
      onClose()
    } catch {
      toast.error('Une erreur est survenue lors de l\'envoi du signalement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Signaler un comportement inapproprié"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-danger-50 text-danger-800 rounded-xl text-xs flex items-start gap-2.5">
          <ShieldAlert className="h-4 w-4 flex-shrink-0 text-danger-600 mt-0.5" />
          <p>
            OptiNote garantit un espace bienveillant et sécurisé. Tout comportement de harcèlement est traité en priorité.
          </p>
        </div>

        <Select
          label="Motif du signalement"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          options={REPORT_REASONS.map((r) => ({ value: r.id, label: r.label }))}
          required
        />

        <Textarea
          label="Précisions (optionnel)"
          placeholder="Décris brièvement la situation..."
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={3}
        />

        <div className="flex justify-end gap-2.5 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" variant="danger" isLoading={loading}>
            Envoyer le signalement
          </Button>
        </div>
      </form>
    </Modal>
  )
}
