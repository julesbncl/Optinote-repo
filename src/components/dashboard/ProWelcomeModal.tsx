'use client'

import { Modal } from '@/components/ui/Modal'
import { Sparkles, GraduationCap, MapPin, Calculator, CheckCircle2 } from 'lucide-react'

interface ProWelcomeModalProps {
  isOpen: boolean
  onClose: () => void
}

const UNLOCKED_FEATURES = [
  { icon: Calculator, label: 'Fiches & notes illimitées, sans aucune limite' },
  { icon: GraduationCap, label: 'Planning Intelligent IA généré et ajustable 7j/7' },
  { icon: MapPin, label: 'Campus Social : carte, amis, sessions de révision' },
]

export function ProWelcomeModal({ isOpen, onClose }: ProWelcomeModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bienvenue dans OptiNote Pro 🎉" size="md">
      <div className="text-center space-y-3">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg">
          <Sparkles className="h-7 w-7 text-white" />
        </div>

        <p className="text-xs text-text-secondary">
          Ton abonnement est actif. Tout est débloqué dès maintenant :
        </p>

        <div className="text-left space-y-2 bg-surface-secondary/60 rounded-2xl border border-border p-3">
          {UNLOCKED_FEATURES.map(({ icon: Icon, label }, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                <Icon className="h-3.5 w-3.5" />
              </div>
              <span className="text-[12px] font-semibold text-text-primary flex-1">{label}</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full h-11 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-all cursor-pointer shadow-sm"
        >
          C&apos;est parti 🚀
        </button>
      </div>
    </Modal>
  )
}
