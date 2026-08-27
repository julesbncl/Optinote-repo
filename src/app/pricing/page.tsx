'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Zap,
  ArrowRight,
  CreditCard,
  ChevronDown,
  Tag,
  Check,
  Settings as SettingsIcon,
} from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { createClient } from '@/lib/supabase/client'
import { checkIsPro } from '@/lib/hooks/useIsPro'
import {
  PRICING_PLANS,
  VALID_PROMO_CODES,
  PROMO_DISCOUNT_PERCENT,
  getDiscountedPrice,
  formatPrice,
} from '@/lib/constants'
import toast from 'react-hot-toast'

function PricingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Abonnement actuel de l'utilisateur connecté (si connecté et abonné)
  const [currentTier, setCurrentTier] = useState<'monthly' | 'annual' | null>(null)
  const [periodEnd, setPeriodEnd] = useState<string | null>(null)
  const [changingPlan, setChangingPlan] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    async function loadSubscriptionState() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      setIsLoggedIn(true)

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_pro, subscription_tier, subscription_status, subscription_current_period_end, beta_access_redeemed_at')
        .eq('id', user.id)
        .single()

      const isSubscribed = checkIsPro(profile)

      if (isSubscribed && profile) {
        const tier = profile.subscription_tier === 'annual' ? 'annual' : 'monthly'
        setCurrentTier(tier)
        setBillingCycle(tier)
        setPeriodEnd(profile.subscription_current_period_end || null)
      }
    }

    loadSubscriptionState()
  }, [supabase])

  async function handleChangePlan(planId: 'monthly' | 'annual') {
    setChangingPlan(true)
    try {
      const res = await fetch('/api/stripe/change-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors du changement de formule')
      }
      if (data.requiresPayment) {
        if (data.hostedInvoiceUrl) {
          toast('Confirme le paiement de la différence pour activer ta nouvelle formule.', { icon: '💳' })
          window.location.href = data.hostedInvoiceUrl
        } else {
          toast.error(data.error || 'Le paiement n’a pas pu être confirmé.')
        }
        return
      }
      toast.success(data.message || 'Formule mise à jour ! 🎉')
      setCurrentTier(planId)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors du changement de formule'
      toast.error(message)
    } finally {
      setChangingPlan(false)
    }
  }

  async function handleOpenBillingPortal() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || 'Erreur d’accès au portail de facturation')
      }
    } catch {
      toast.error('Erreur d’accès au portail de facturation')
    } finally {
      setPortalLoading(false)
    }
  }

  // Gestion du code promo d'affiliation (-15%)
  const [promoInput, setPromoInput] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null)

  // Détection automatique du code promo via URL (?promo=, ?ref=, ?code=)
  useEffect(() => {
    const codeParam = searchParams.get('promo') || searchParams.get('ref') || searchParams.get('code')
    if (codeParam) {
      const clean = codeParam.trim().toUpperCase()
      if ((VALID_PROMO_CODES as readonly string[]).includes(clean)) {
        setAppliedPromo(clean)
        setPromoInput(clean)
        toast.success(`Code promo ${clean} activé : -${PROMO_DISCOUNT_PERCENT}% sur ton abonnement ! 🎉`)
      }
    }
  }, [searchParams])

  const isPromoApplied = Boolean(appliedPromo)

  function handleApplyPromo(e: React.FormEvent) {
    e.preventDefault()
    const cleanCode = promoInput.trim().toUpperCase()
    if (!cleanCode) return

    if (VALID_PROMO_CODES.includes(cleanCode as any)) {
      setAppliedPromo(cleanCode)
      toast.success(`Code promo ${cleanCode} appliqué : -${PROMO_DISCOUNT_PERCENT}% sur tous les abonnements ! 🎉`)
    } else {
      toast.error('Code promo ou d’affiliation invalide.')
    }
  }

  function handleRemovePromo() {
    setAppliedPromo(null)
    setPromoInput('')
    toast.success('Code promo retiré.')
  }

  async function handleSelectPlan(planId: string) {
    if (planId === 'free') {
      router.push('/register')
      return
    }

    setLoadingPlan(planId)

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          promoCode: appliedPromo || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 401) {
          toast.error('Connecte-toi pour choisir un abonnement !')
          router.push(`/login?redirect=/pricing`)
          return
        }
        throw new Error(data.error || 'Erreur d’initialisation')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la redirection vers le paiement'
      toast.error(message)
    } finally {
      setLoadingPlan(null)
    }
  }

  // Tarifs calculés dynamiquement selon le code promo
  const baseMonthlyPrice = 6.99
  const baseAnnualMonthlyPrice = 4.99
  const baseAnnualTotal = 59.88

  const discountedMonthlyPrice = getDiscountedPrice(baseMonthlyPrice, PROMO_DISCOUNT_PERCENT)
  const discountedAnnualMonthlyPrice = getDiscountedPrice(baseAnnualMonthlyPrice, PROMO_DISCOUNT_PERCENT)
  const discountedAnnualTotal = getDiscountedPrice(baseAnnualTotal, PROMO_DISCOUNT_PERCENT)

  const currentMonthlyDisplay = isPromoApplied ? formatPrice(discountedMonthlyPrice) : '6,99 €'
  const currentAnnualDisplay = isPromoApplied ? formatPrice(discountedAnnualMonthlyPrice) : '4,99 €'
  const currentAnnualTotalDisplay = isPromoApplied ? formatPrice(discountedAnnualTotal) : '59,88 €'

  const faqs = [
    {
      q: 'Que comprend exactement la Version Gratuite Découverte ?',
      a: 'La version gratuite te permet de tester OptiNote en générant 1 fiche de révision complète et en entrant 1 note par matière dans le simulateur. Les outils avancés (Planning IA, Salons Spécialités, Campus Social) nécessitent l’accès Pro.',
    },
    {
      q: 'Puis-je résilier l’abonnement Mensuel à tout moment ?',
      a: 'Oui, absolument ! L’abonnement mensuel à 6,99 € est sans aucun engagement. Tu peux annuler en un seul clic depuis tes paramètres sans aucun frais.',
    },
    {
      q: 'Comment fonctionne le paiement de l’Abonnement Annuel ?',
      a: `L’abonnement annuel est facturé ${currentAnnualTotalDisplay} en paiement unique pour l’année complète (soit ${currentAnnualDisplay}/mois). Tu bénéficies immédiatement de 2 mois offerts (~29% de réduction par rapport au paiement mensuel).`,
    },
    {
      q: 'Comment fonctionne le code promo d’affiliation (-15%) ?',
      a: 'Si tu disposes d’un code promo partenaire ou influenceur (ex: INFLUENCEUR15, BAC2026), entre-le dans l’encart dédié ci-dessus. La réduction de 15% sera immédiatement calculée et transmise à la page de paiement sécurisée Stripe.',
    },
    {
      q: 'Quels sont les moyens de paiement acceptés ?',
      a: 'Toutes les cartes bancaires (CB, Visa, Mastercard, Amex), Apple Pay et Google Pay via la plateforme sécurisée Stripe certifiée PCI-DSS niveau 1.',
    },
    {
      q: 'Mes parents peuvent-ils régler l’abonnement ?',
      a: 'Bien sûr ! Les coordonnées et la carte de tes parents peuvent être renseignées pour recevoir directement la facture officielle déductible.',
    },
  ]

  const freePlan = PRICING_PLANS.find((p) => p.id === 'free')!

  return (
    <div className="min-h-screen bg-surface selection:bg-primary-100 selection:text-primary-900 pb-8 sm:pb-16">
      {/* ═══════════════════════════════════════════════════════
          NAVBAR MOBILE-COMPACT & DESKTOP
          ═══════════════════════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-11 sm:h-16 flex items-center justify-between">
          <Logo size="xs" href="/" className="sm:hidden" />
          <Logo size="md" href="/" className="hidden sm:flex" />

          <div className="flex items-center gap-1.5 sm:gap-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="text-[11px] sm:text-sm font-medium text-text-secondary hover:text-text-primary transition-colors px-2 py-1 rounded-md"
              >
                Mon Espace
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center h-7 sm:h-9 px-2.5 sm:px-4 text-[11px] sm:text-sm font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
              >
                Connexion
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════
          HERO HEADER COMPACT
          ═══════════════════════════════════════════════════════ */}
      <section className="pt-3.5 pb-3 sm:pt-12 sm:pb-16">
        <div className="max-w-6xl mx-auto px-2.5 sm:px-6 text-center">
          <div className="inline-flex items-center gap-1 sm:gap-2 px-2.5 py-0.5 sm:py-1 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-[10px] sm:text-xs font-semibold mb-2 sm:mb-4 shadow-2xs">
            <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary-500 flex-shrink-0" />
            <span>Des tarifs transparents pour réussir ton lycée</span>
          </div>

          <h1 className="text-base sm:text-4xl font-extrabold tracking-tight text-text-primary max-w-2xl mx-auto leading-tight">
            Choisis la formule idéale pour{' '}
            <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              décrocher ton Bac avec mention
            </span>
          </h1>

          <p className="mt-1 sm:mt-2 text-[10px] sm:text-base text-text-secondary max-w-xl mx-auto leading-tight">
            Commence gratuitement ou débloque tous les outils IA en illimité dès {currentAnnualDisplay} / mois.
          </p>

          {/* Toggle Cycle Facturation (Mensuel / Annuel) */}
          <div className="mt-2.5 sm:mt-6 inline-flex items-center p-0.5 sm:p-1 bg-surface-secondary rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                billingCycle === 'annual'
                  ? 'bg-surface text-primary-700 shadow-xs border border-border'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <span>Annuel</span>
              <span className="ml-1 text-[8px] sm:text-[9.5px] font-black bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded-full">
                -29%
              </span>
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-surface text-primary-700 shadow-xs border border-border'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Mensuel
            </button>
          </div>

          {/* ═══════════════════════════════════════════════════════
              ENCART CODE PROMO / AFFILIATION (-15%)
              ═══════════════════════════════════════════════════════ */}
          <div className="mt-3 sm:mt-5 max-w-sm mx-auto">
            {isPromoApplied ? (
              <div className="flex items-center justify-between gap-2 p-2 sm:p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-bold animate-in fade-in zoom-in-95 duration-200 shadow-xs">
                <div className="flex items-center gap-1.5">
                  <div className="h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">
                    <Check className="h-3 w-3" />
                  </div>
                  <span>Code <strong>{appliedPromo}</strong> appliqué (-15%)</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemovePromo}
                  className="text-[10px] font-semibold text-emerald-700 hover:text-red-600 underline cursor-pointer"
                >
                  Supprimer
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyPromo} className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Code promo ou influenceur (ex: BAC2026)"
                    className="w-full pl-8 pr-2.5 py-1.5 text-[11px] sm:text-xs bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary-500 uppercase font-semibold"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-[11px] sm:text-xs font-bold transition-colors cursor-pointer flex-shrink-0"
                >
                  Appliquer
                </button>
              </form>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════
              BANDEAU ABONNEMENT ACTUEL (utilisateur déjà abonné)
              ═══════════════════════════════════════════════════════ */}
          {currentTier && (
            <div className="mt-3 sm:mt-5 max-w-sm mx-auto flex items-center justify-between gap-2 p-2 sm:p-2.5 bg-primary-50 border border-primary-200 rounded-xl text-primary-900 text-[10.5px] sm:text-xs font-bold shadow-xs">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary-600 flex-shrink-0" />
                <span>
                  Abonné {currentTier === 'annual' ? 'Annuel' : 'Mensuel'}
                  {periodEnd &&
                    ` · renouvellement le ${new Date(periodEnd).toLocaleDateString('fr-FR')}`}
                </span>
              </span>
              <button
                type="button"
                onClick={handleOpenBillingPortal}
                disabled={portalLoading}
                className="flex items-center gap-1 text-[9.5px] sm:text-[10.5px] font-bold text-primary-700 hover:text-primary-800 underline cursor-pointer flex-shrink-0 disabled:opacity-60"
              >
                <SettingsIcon className="h-3 w-3" />
                <span>Facturation</span>
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════
              GRILLE DES TARIFS CÔTE À CÔTE SUR MOBILE & PC
              ═══════════════════════════════════════════════════════ */}
          <div className="mt-3.5 sm:mt-8 grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-6 items-stretch text-left max-w-5xl mx-auto">
            {/* CARTE 1 : DÉCOUVERTE GRATUITE */}
            <div className="rounded-xl sm:rounded-3xl p-2.5 sm:p-7 flex flex-col justify-between transition-all bg-surface border border-border shadow-2xs hover:shadow-xs relative">
              <div>
                <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                  <h3 className="text-xs sm:text-xl font-bold text-text-primary">
                    <span className="sm:hidden">Gratuit</span>
                    <span className="hidden sm:inline">{freePlan.name}</span>
                  </h3>
                </div>
                <p className="text-[8px] sm:text-xs text-text-secondary leading-tight min-h-[20px] sm:min-h-[32px]">
                  Pour tester les outils essentiels d&apos;OptiNote.
                </p>

                {/* Price Block */}
                <div className="mt-2 pb-2 sm:mt-4 sm:pb-4 border-b border-border">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl sm:text-4xl font-black text-text-primary tracking-tight">
                      0 €
                    </span>
                    <span className="text-[8px] sm:text-xs text-text-tertiary font-semibold">
                      / gratuit
                    </span>
                  </div>
                  <p className="text-[7.5px] sm:text-xs text-text-tertiary mt-0.5 sm:mt-1">
                    Sans carte bancaire
                  </p>
                </div>

                {/* Features list */}
                <div className="mt-2 sm:mt-4 space-y-1.5 sm:space-y-2.5">
                  <p className="text-[8px] sm:text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
                    Inclus :
                  </p>
                  <ul className="space-y-1 sm:space-y-2 text-[7.5px] sm:text-xs text-text-secondary">
                    <li className="flex items-start gap-1 sm:gap-2">
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="leading-tight">1 fiche IA offerte</span>
                    </li>
                    <li className="flex items-start gap-1 sm:gap-2">
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="leading-tight">Simulateur 1 note/mat.</span>
                    </li>
                    <li className="flex items-start gap-1 sm:gap-2">
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="leading-tight">Moyennes de base</span>
                    </li>
                  </ul>

                  {/* Limitations */}
                  <div className="pt-1.5 sm:pt-3 border-t border-border/50 space-y-1">
                    <p className="text-[7.5px] sm:text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                      Verrouillé :
                    </p>
                    <ul className="space-y-0.5 sm:space-y-1 text-[7px] sm:text-[11px] text-text-tertiary">
                      <li className="flex items-start gap-1">
                        <XCircle className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-text-tertiary/70 flex-shrink-0 mt-0.5" />
                        <span className="line-through opacity-80">Planning IA</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <XCircle className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-text-tertiary/70 flex-shrink-0 mt-0.5" />
                        <span className="line-through opacity-80">Campus Social</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="mt-3 sm:mt-6 pt-1 sm:pt-3">
                {currentTier ? (
                  <div className="w-full inline-flex items-center justify-center gap-1 h-7 sm:h-10 text-[9px] sm:text-xs font-bold text-text-tertiary bg-surface-secondary border border-border rounded-lg sm:rounded-xl">
                    <span>Formule Pro active</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSelectPlan('free')}
                    className="w-full inline-flex items-center justify-center gap-1 h-7 sm:h-10 text-[9px] sm:text-xs font-bold text-text-primary bg-surface hover:bg-surface-secondary border border-border rounded-lg sm:rounded-xl transition-all cursor-pointer"
                  >
                    <span>Commencer</span>
                    <ArrowRight className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* CARTE 2 : OPTINOTE PRO (ANNUEL / MENSUEL ADAPTATIF) */}
            <div className="rounded-xl sm:rounded-3xl p-2.5 sm:p-7 flex flex-col justify-between transition-all bg-surface border-2 border-primary-600 shadow-md ring-2 sm:ring-4 ring-primary-500/10 relative">
              {/* Badge Recommandé */}
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-primary-600 to-accent-600 text-white text-[7.5px] sm:text-[10px] font-black uppercase tracking-wider px-2 sm:px-3 py-0.5 rounded-full shadow-xs whitespace-nowrap">
                  {isPromoApplied
                    ? 'Code Promo -15% Appliqué 🔥'
                    : billingCycle === 'annual'
                    ? '2 mois offerts'
                    : 'Accès Total'}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                  <h3 className="text-xs sm:text-xl font-bold text-primary-700">
                    OptiNote Pro
                  </h3>
                </div>
                <p className="text-[8px] sm:text-xs text-text-secondary leading-tight min-h-[20px] sm:min-h-[32px]">
                  Accès 100% complet et illimité à tous les outils.
                </p>

                {/* Price Block */}
                <div className="mt-2 pb-2 sm:mt-4 sm:pb-4 border-b border-border">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    {isPromoApplied && (
                      <span className="text-sm sm:text-xl text-text-tertiary line-through font-bold">
                        {billingCycle === 'annual' ? '4,99 €' : '6,99 €'}
                      </span>
                    )}
                    <span className="text-xl sm:text-4xl font-black text-text-primary tracking-tight">
                      {billingCycle === 'annual' ? currentAnnualDisplay : currentMonthlyDisplay}
                    </span>
                    <span className="text-[8px] sm:text-xs text-text-tertiary font-semibold">
                      / mois
                    </span>
                  </div>
                  {billingCycle === 'annual' ? (
                    <p className="text-[7.5px] sm:text-xs text-emerald-600 font-bold mt-0.5">
                      {currentAnnualTotalDisplay} / an {isPromoApplied ? '(-15% appliqué)' : '(économie ~29%)'}
                    </p>
                  ) : (
                    <p className="text-[7.5px] sm:text-xs text-text-tertiary mt-0.5">
                      Sans aucun engagement
                    </p>
                  )}
                </div>

                {/* Features list */}
                <div className="mt-2 sm:mt-4 space-y-1.5 sm:space-y-2.5">
                  <p className="text-[8px] sm:text-[11px] font-bold uppercase tracking-wider text-primary-700">
                    Tout en illimité :
                  </p>
                  <ul className="space-y-1 sm:space-y-2 text-[7.5px] sm:text-xs text-text-secondary font-medium">
                    <li className="flex items-start gap-1 sm:gap-2">
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-primary-600 flex-shrink-0 mt-0.5" />
                      <span className="leading-tight font-semibold text-text-primary">Fiches & OCR illimités</span>
                    </li>
                    <li className="flex items-start gap-1 sm:gap-2">
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-primary-600 flex-shrink-0 mt-0.5" />
                      <span className="leading-tight font-semibold text-text-primary">Simulateur & coefficients</span>
                    </li>
                    <li className="flex items-start gap-1 sm:gap-2">
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-primary-600 flex-shrink-0 mt-0.5" />
                      <span className="leading-tight">Planning IA 7j/7</span>
                    </li>
                    <li className="flex items-start gap-1 sm:gap-2">
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-primary-600 flex-shrink-0 mt-0.5" />
                      <span className="leading-tight">Campus Social & Salons</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* CTA Button */}
              <div className="mt-3 sm:mt-6 pt-1 sm:pt-3">
                {currentTier === billingCycle ? (
                  <div className="w-full inline-flex items-center justify-center gap-1.5 h-7 sm:h-10 text-[9px] sm:text-xs font-bold text-primary-700 bg-primary-50 border border-primary-200 rounded-lg sm:rounded-xl">
                    <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span>Ta formule actuelle</span>
                  </div>
                ) : currentTier ? (
                  <button
                    type="button"
                    onClick={() => handleChangePlan(billingCycle)}
                    disabled={changingPlan}
                    className="w-full inline-flex items-center justify-center gap-1 h-7 sm:h-10 text-[9px] sm:text-xs font-bold text-white bg-gradient-to-r from-primary-600 via-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 rounded-lg sm:rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer disabled:opacity-70"
                  >
                    {changingPlan ? (
                      <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>Passer {billingCycle === 'annual' ? "à l'Annuel" : 'au Mensuel'}</span>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSelectPlan(billingCycle)}
                    disabled={loadingPlan !== null}
                    className="w-full inline-flex items-center justify-center gap-1 h-7 sm:h-10 text-[9px] sm:text-xs font-bold text-white bg-gradient-to-r from-primary-600 via-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 rounded-lg sm:rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
                  >
                    {loadingPlan === billingCycle ? (
                      <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Choisir Pro ({billingCycle === 'annual' ? currentAnnualDisplay : currentMonthlyDisplay})</span>
                        <ArrowRight className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* CARTE 3 : VUE COMPLÈTE PC (Abonnement Mensuel explicite sur grand écran) */}
            <div className="hidden lg:flex rounded-3xl p-7 flex-col justify-between transition-all bg-surface border border-border shadow-sm hover:shadow-md">
              <div>
                <h3 className="text-xl font-bold text-text-primary">
                  Abonnement Mensuel
                </h3>
                <p className="text-xs text-text-secondary mt-1.5 min-h-[32px]">
                  Accès complet sans engagement, résiliable en 1 clic.
                </p>

                <div className="mt-4 pb-4 border-b border-border">
                  <div className="flex items-baseline gap-2">
                    {isPromoApplied && (
                      <span className="text-xl text-text-tertiary line-through font-bold">
                        6,99 €
                      </span>
                    )}
                    <span className="text-4xl font-black text-text-primary tracking-tight">
                      {currentMonthlyDisplay}
                    </span>
                    <span className="text-xs text-text-tertiary font-semibold">
                      / mois
                    </span>
                  </div>
                  <p className="text-xs text-text-tertiary mt-1">
                    Sans engagement de durée
                  </p>
                </div>

                <div className="mt-4 space-y-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
                    Inclus :
                  </p>
                  <ul className="space-y-2 text-xs text-text-secondary">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success-600 flex-shrink-0 mt-0.5" />
                      <span>Toutes les fonctionnalités Pro</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success-600 flex-shrink-0 mt-0.5" />
                      <span>Fiches, Planning & Campus illimités</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success-600 flex-shrink-0 mt-0.5" />
                      <span>Résiliation immédiate en 1 clic</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-3">
                {currentTier === 'monthly' ? (
                  <div className="w-full inline-flex items-center justify-center gap-1.5 h-10 text-xs font-bold text-primary-700 bg-primary-50 border border-primary-200 rounded-xl">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Ta formule actuelle</span>
                  </div>
                ) : currentTier === 'annual' ? (
                  <button
                    type="button"
                    onClick={() => handleChangePlan('monthly')}
                    disabled={changingPlan}
                    className="w-full inline-flex items-center justify-center gap-1 h-10 text-xs font-bold text-text-primary bg-surface hover:bg-surface-secondary border border-border rounded-xl transition-all cursor-pointer disabled:opacity-70"
                  >
                    <span>Passer au Mensuel</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSelectPlan('monthly')}
                    disabled={loadingPlan !== null}
                    className="w-full inline-flex items-center justify-center gap-1 h-10 text-xs font-bold text-text-primary bg-surface hover:bg-surface-secondary border border-border rounded-xl transition-all cursor-pointer"
                  >
                    <span>Choisir le Mensuel ({currentMonthlyDisplay})</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════
              SECURITY & REASSURANCE BANNER
              ═══════════════════════════════════════════════════════ */}
          <div className="mt-4 sm:mt-12 bg-surface-secondary/70 rounded-xl sm:rounded-2xl border border-border p-2.5 sm:p-6 max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 text-center sm:text-left">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-7 w-7 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <h4 className="text-[10.5px] sm:text-sm font-bold text-text-primary">
                  Paiement 100% Sécurisé & Protection RGPD
                </h4>
                <p className="text-[8.5px] sm:text-xs text-text-secondary">
                  Transactions chiffrées par Stripe. Données scolaires strictement privées.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[9px] sm:text-xs font-semibold text-text-tertiary">
              <CreditCard className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Apple Pay • Google Pay • CB</span>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════
              FAQ SECTION
              ═══════════════════════════════════════════════════════ */}
          <div className="mt-6 sm:mt-16 max-w-2xl mx-auto text-left">
            <div className="text-center mb-3 sm:mb-6">
              <h2 className="text-xs sm:text-2xl font-bold text-text-primary">
                Foire Aux Questions (FAQ)
              </h2>
              <p className="text-[9px] sm:text-xs text-text-secondary mt-0.5">
                Tout ce que tu dois savoir sur les offres OptiNote.
              </p>
            </div>

            <div className="space-y-1.5 sm:space-y-2.5">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index
                return (
                  <div
                    key={index}
                    className="bg-surface rounded-lg sm:rounded-xl border border-border overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full p-2.5 sm:p-4 flex items-center justify-between text-left font-bold text-[10px] sm:text-sm text-text-primary hover:bg-surface-secondary/50 transition-colors cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`h-3 w-3 sm:h-4 sm:w-4 text-text-tertiary transition-transform duration-200 flex-shrink-0 ml-2 ${
                          isOpen ? 'rotate-180 text-primary-600' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-2.5 sm:px-4 pb-3 text-[9px] sm:text-xs text-text-secondary leading-relaxed border-t border-border/40 pt-2">
                        {faq.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <div className="h-6 w-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  )
}
