'use client'

import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatPrice } from '@/lib/constants'
import { Copy, Check, TrendingUp, Users, Wallet, Sparkles, Share2, PartyPopper } from 'lucide-react'
import toast from 'react-hot-toast'

interface CreatorEarning {
  amount_cents: number
  commission_cents: number
  paid_out: boolean
  created_at: string
}

interface CreatorStats {
  id: string
  code: string
  creator_name: string
  discount_percent: number
  commission_percent: number
  is_active: boolean
  redemptions_count: number
  total_revenue_cents: number
  total_commission_cents: number
  commission_due_cents: number
  recent_earnings: CreatorEarning[]
}

function eur(cents: number): string {
  return formatPrice(cents / 100)
}

export default function CreatorDashboardPage() {
  const [creators, setCreators] = useState<CreatorStats[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/creator/stats')
        if (res.ok) {
          const data = await res.json()
          setCreators(data.creators || [])
        }
      } catch {
        toast.error('Erreur lors du chargement de tes statistiques')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function handleCopyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success('Code copié !')
    setTimeout(() => setCopiedCode(null), 2000)
  }

  function handleCopyMessage(code: string, discountPercent: number) {
    const message = `🎓 -${discountPercent}% sur OptiNote (planning IA, fiches de révision, simulateur de notes...) avec mon code ${code} 👉 optinote.fr/pricing`
    navigator.clipboard.writeText(message)
    setCopiedMessage(code)
    toast.success('Message copié, prêt à partager !')
    setTimeout(() => setCopiedMessage(null), 2000)
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    )
  }

  if (creators.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-12 px-4">
        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-primary-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Sparkles className="h-7 w-7 text-white" />
        </div>
        <h2 className="text-base font-bold text-text-primary">Aucun code créateur associé</h2>
        <p className="text-sm text-text-secondary mt-1.5">
          Ton compte n&apos;est relié à aucun code partenaire pour le moment. Contacte l&apos;équipe OptiNote si tu penses que c&apos;est une erreur.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-5 pb-8">
      <div>
        <h1 className="text-lg sm:text-2xl font-black text-text-primary tracking-tight flex items-center gap-1.5">
          Espace Créateur <PartyPopper className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
          Merci de faire grandir OptiNote — voici en direct ce que ton code rapporte à ta communauté et à toi.
        </p>
      </div>

      {creators.map((c) => (
        <div key={c.id} className="space-y-3">
          {/* Hero : code + réduction/commission */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-primary-600 p-4 sm:p-6 shadow-lg">
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />

            <div className="relative flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] sm:text-xs font-bold text-white/80 uppercase tracking-wider">
                  {c.creator_name}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">{c.code}</h2>
                  {!c.is_active && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-black/20 text-white">
                      Inactif
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopyCode(c.code)}
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white text-xs font-bold transition-all cursor-pointer"
              >
                {copiedCode === c.code ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>

            <p className="relative text-xs sm:text-sm text-white/90 mt-3">
              Ta communauté obtient <strong className="text-white">-{c.discount_percent}%</strong> avec ce code, et tu touches <strong className="text-white">{c.commission_percent}%</strong> de chaque abonnement généré — y compris les renouvellements, tant qu&apos;il reste actif.
            </p>

            <button
              type="button"
              onClick={() => handleCopyMessage(c.code, c.discount_percent)}
              className="relative mt-3.5 w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white text-primary-700 text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-[0.99]"
            >
              {copiedMessage === c.code ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              <span>{copiedMessage === c.code ? 'Message copié !' : 'Copier un message à partager'}</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-surface border border-border shadow-2xs text-center">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-primary-50 flex items-center justify-center mx-auto mb-1.5">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-600" />
              </div>
              <p className="text-base sm:text-lg font-black text-text-primary">{c.redemptions_count}</p>
              <p className="text-[9px] sm:text-[10px] text-text-tertiary font-bold uppercase tracking-wide">Abonnés</p>
            </div>
            <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-surface border border-border shadow-2xs text-center">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-primary-50 flex items-center justify-center mx-auto mb-1.5">
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-600" />
              </div>
              <p className="text-base sm:text-lg font-black text-text-primary">{eur(c.total_revenue_cents)}</p>
              <p className="text-[9px] sm:text-[10px] text-text-tertiary font-bold uppercase tracking-wide">Généré</p>
            </div>
            <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-200 shadow-2xs text-center">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-emerald-100 flex items-center justify-center mx-auto mb-1.5">
                <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-700" />
              </div>
              <p className="text-base sm:text-lg font-black text-emerald-700">{eur(c.total_commission_cents)}</p>
              <p className="text-[9px] sm:text-[10px] text-emerald-700/80 font-bold uppercase tracking-wide">Commission totale</p>
            </div>
            <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-amber-50 border border-amber-200 shadow-2xs text-center">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-amber-100 flex items-center justify-center mx-auto mb-1.5">
                <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-700" />
              </div>
              <p className="text-base sm:text-lg font-black text-amber-700">{eur(c.commission_due_cents)}</p>
              <p className="text-[9px] sm:text-[10px] text-amber-700/80 font-bold uppercase tracking-wide">Reste à verser</p>
            </div>
          </div>

          {/* Derniers paiements */}
          <div className="rounded-xl sm:rounded-2xl bg-surface border border-border shadow-2xs p-3.5 sm:p-4">
            <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wide mb-2">
              Derniers paiements
            </p>
            {c.recent_earnings.length === 0 ? (
              <p className="text-xs text-text-tertiary text-center py-4">
                Aucun abonnement généré pour le moment — partage ton code pour commencer !
              </p>
            ) : (
              <div className="space-y-1">
                {c.recent_earnings.map((e, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-border/50 last:border-0">
                    <span className="text-text-secondary">
                      {new Date(e.created_at).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="font-bold text-text-primary flex items-center gap-1.5">
                      +{eur(e.commission_cents)}
                      {e.paid_out ? (
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200">
                          Versé
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded-full border border-amber-200">
                          En attente
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
