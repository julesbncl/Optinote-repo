'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, ArrowRight, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LogoIcon } from '@/components/ui/Logo'
import toast from 'react-hot-toast'

interface PaywallModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  featureLocked?: 'sheet_limit' | 'grade_limit' | 'planning' | 'campus' | 'general'
}

export function PaywallModal({
  isOpen,
  onClose,
  title,
  description,
  featureLocked = 'general',
}: PaywallModalProps) {
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  if (!isOpen) return null

  const titles: Record<string, string> = {
    sheet_limit: 'Limite atteinte : 1 fiche d’essai gratuite',
    grade_limit: 'Limite atteinte : 1 note par matière',
    planning: 'Planning Intelligent IA réservé aux abonnés',
    campus: 'Campus Social & Salons réservés aux abonnés',
    general: 'Débloque l’accès illimité à OptiNote',
  }

  const descriptions: Record<string, string> = {
    sheet_limit:
      'Tu as utilisé ta fiche de révision gratuite. Débloque les générations IA et le scan photo OCR en illimité !',
    grade_limit:
      'La version gratuite est limitée à 1 seule note par matière. Passe à l’illimité pour ajouter toutes tes notes et anticiper tes devoirs surveillés !',
    planning:
      'Génère ton emploi du temps de travail optimisé 7j/7 avec prise en compte de tes devoirs et de ta fatigue.',
    campus:
      'Rejoins les salons de discussion de tes spécialités, échange avec tes camarades de lycée et utilise la carte.',
    general:
      'Passe à l’accès illimité dès 4,99 € / mois pour booster tes résultats et décrocher ton Bac avec mention.',
  }

  const handlePasserPro = async () => {
    setIsRedirecting(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: 'monthly' }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Connecte-toi pour passer à la formule Pro !')
          router.push('/login?redirect=/pricing')
          return
        }
        throw new Error(data.error || 'Erreur d’initialisation')
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        router.push('/pricing')
      }
    } catch {
      router.push('/pricing')
    } finally {
      setIsRedirecting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-surface rounded-2xl sm:rounded-3xl border border-border shadow-2xl p-4 sm:p-7 text-center animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-surface-secondary text-text-tertiary hover:text-text-primary flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>

        {/* Header Icon (Logo Officiel OptiNote) */}
        <div className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 flex items-center justify-center">
          <LogoIcon className="h-full w-full drop-shadow-md" />
        </div>

        <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-primary-200 shadow-2xs">
          ⚡ Accès Illimité Pro
        </span>

        <h3 className="text-xs sm:text-lg font-black text-text-primary mt-1.5 sm:mt-2.5 leading-snug">
          {title || titles[featureLocked]}
        </h3>

        <p className="text-[10px] sm:text-xs text-text-secondary mt-1 sm:mt-1.5 leading-normal max-w-sm mx-auto">
          {description || descriptions[featureLocked]}
        </p>

        {/* Perks list */}
        <div className="bg-surface-secondary/70 p-2 sm:p-3 rounded-xl border border-border text-left text-[9.5px] sm:text-xs space-y-1 sm:space-y-1.5 text-text-secondary font-medium my-2.5 sm:my-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-success-600 flex-shrink-0" />
            <span>Fiches & Notes en illimité (OCR photo inclus)</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-success-600 flex-shrink-0" />
            <span>Planning IA & Notifications de travail 7j/7</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-success-600 flex-shrink-0" />
            <span>Campus Social, Salons Spécialités & Carte</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-1.5 sm:space-y-2.5">
          <Button
            size="sm"
            onClick={handlePasserPro}
            disabled={isRedirecting}
            className="w-full gap-1.5 sm:gap-2 shadow-xs hover:shadow-sm font-bold text-xs sm:text-sm py-1.5 sm:py-2.5 cursor-pointer rounded-xl"
          >
            {isRedirecting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Redirection Stripe...</span>
              </>
            ) : (
              <>
                <span>Passer Pro (Accès Illimité)</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>

          <Link
            href="/pricing"
            onClick={onClose}
            className="block text-[9.5px] sm:text-xs font-semibold text-text-secondary hover:text-primary-600 transition-colors hover:underline pt-0.5"
          >
            Voir le détail des formules (dès 4,99 € / mois)
          </Link>
        </div>
      </div>
    </div>
  )
}
