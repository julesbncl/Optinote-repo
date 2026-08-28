'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatPrice } from '@/lib/constants'
import { Copy, Check, TrendingUp, Users, Wallet, Sparkles } from 'lucide-react'
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

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    )
  }

  if (creators.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-12 px-4">
        <Sparkles className="h-10 w-10 text-primary-400 mx-auto mb-3" />
        <h2 className="text-base font-bold text-text-primary">Aucun code créateur associé</h2>
        <p className="text-sm text-text-secondary mt-1.5">
          Ton compte n&apos;est relié à aucun code partenaire pour le moment. Contacte l&apos;équipe OptiNote si tu penses que c&apos;est une erreur.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 pb-8">
      <div>
        <h1 className="text-lg sm:text-2xl font-black text-text-primary tracking-tight">
          Espace Créateur ✨
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
          Suis en direct les revenus générés par ton code et ta commission.
        </p>
      </div>

      {creators.map((c) => (
        <Card key={c.id} className="p-4 sm:p-5 space-y-4">
          <CardHeader className="mb-0">
            <CardTitle>
              <div className="flex items-center gap-2">
                <span>{c.creator_name}</span>
                {!c.is_active && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-danger-50 text-danger-700 border border-danger-200">
                    Inactif
                  </span>
                )}
              </div>
            </CardTitle>
            <button
              type="button"
              onClick={() => handleCopyCode(c.code)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 hover:bg-primary-100 border border-primary-200 text-primary-700 text-xs font-bold transition-all cursor-pointer"
            >
              {copiedCode === c.code ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{c.code}</span>
            </button>
          </CardHeader>

          <p className="text-xs text-text-secondary -mt-2">
            Ta communauté obtient <strong className="text-text-primary">-{c.discount_percent}%</strong> avec ce code, et tu touches <strong className="text-text-primary">{c.commission_percent}%</strong> des abonnements générés — y compris les renouvellements.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="p-2.5 sm:p-3 rounded-xl bg-surface-secondary border border-border/80 text-center">
              <Users className="h-3.5 w-3.5 text-primary-600 mx-auto mb-1" />
              <p className="text-sm sm:text-base font-black text-text-primary">{c.redemptions_count}</p>
              <p className="text-[9px] sm:text-[10px] text-text-tertiary font-bold uppercase">Abonnés</p>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-surface-secondary border border-border/80 text-center">
              <TrendingUp className="h-3.5 w-3.5 text-primary-600 mx-auto mb-1" />
              <p className="text-sm sm:text-base font-black text-text-primary">{eur(c.total_revenue_cents)}</p>
              <p className="text-[9px] sm:text-[10px] text-text-tertiary font-bold uppercase">Généré</p>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <Wallet className="h-3.5 w-3.5 text-emerald-600 mx-auto mb-1" />
              <p className="text-sm sm:text-base font-black text-emerald-700">{eur(c.total_commission_cents)}</p>
              <p className="text-[9px] sm:text-[10px] text-emerald-700/80 font-bold uppercase">Commission totale</p>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl bg-amber-50 border border-amber-200 text-center">
              <Wallet className="h-3.5 w-3.5 text-amber-600 mx-auto mb-1" />
              <p className="text-sm sm:text-base font-black text-amber-700">{eur(c.commission_due_cents)}</p>
              <p className="text-[9px] sm:text-[10px] text-amber-700/80 font-bold uppercase">Reste à verser</p>
            </div>
          </div>

          {c.recent_earnings.length > 0 && (
            <div className="pt-2 border-t border-border/60">
              <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wide mb-1.5">
                Derniers paiements
              </p>
              <div className="space-y-1">
                {c.recent_earnings.map((e, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1">
                    <span className="text-text-secondary">
                      {new Date(e.created_at).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="font-bold text-text-primary">
                      +{eur(e.commission_cents)}
                      {e.paid_out && (
                        <span className="ml-1.5 text-[9px] font-bold text-emerald-600">versé</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  )
}
