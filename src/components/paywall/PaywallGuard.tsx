'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { Lock, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { Profile } from '@/types/database'

interface PaywallGuardProps {
  profile: Profile | null
  children: ReactNode
  title?: string
  description?: string
}

export function PaywallGuard({
  profile,
  children,
  title = 'Fonctionnalité réservée aux membres abonnés',
  description = 'Débloque cet outil IA d’excellence et maximise tes notes au lycée en rejoignant OptiNote.',
}: PaywallGuardProps) {
  const isSubscribed = Boolean(
    profile &&
      (profile.is_pro === true ||
        (['active', 'trialing'].includes(profile.subscription_status || '') &&
          (profile.subscription_tier === 'monthly' || profile.subscription_tier === 'annual')))
  )

  if (isSubscribed) {
    return <>{children}</>
  }

  return (
    <div className="relative isolate">
      {/* Blurred background preview */}
      <div className="filter blur-md pointer-events-none select-none opacity-40">
        {children}
      </div>

      {/* Paywall Overlay Banner */}
      <div className="absolute inset-0 z-30 flex items-center justify-center p-4">
        <Card
          padding="lg"
          className="max-w-lg w-full bg-surface/95 backdrop-blur-xl border-primary-200 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-300"
        >
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-accent-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-primary-500/20">
            <Lock className="h-7 w-7" />
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
              ⚡ Accès Illimité Requis
            </span>
            <h3 className="text-xl font-bold text-text-primary mt-3">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary mt-1.5 leading-relaxed">
              {description}
            </p>
          </div>

          {/* Quick Perks List */}
          <div className="bg-surface-secondary/70 p-3.5 rounded-xl border border-border text-left text-xs space-y-2 text-text-secondary font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success-600 flex-shrink-0" />
              <span>Planning IA & Fiches de Révision en illimité</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success-600 flex-shrink-0" />
              <span>Campus Social, Salons Spécialités & SnapMap</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success-600 flex-shrink-0" />
              <span>Sans engagement • Annulation en 1 clic</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <Link href="/pricing" className="block w-full">
              <Button size="lg" className="w-full gap-2 shadow-md hover:shadow-lg font-bold">
                <Sparkles className="h-4 w-4" />
                Découvrir les offres dès 4,99 € / mois
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <p className="text-[11px] text-text-tertiary">
              Paiement 100% sécurisé via Stripe • Annuel 59,88 € (-24 € d’économie)
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
