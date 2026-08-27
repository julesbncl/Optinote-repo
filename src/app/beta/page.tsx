'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { CLASS_LEVELS, APP_NAME } from '@/lib/constants'
import { Rocket, Copy, Check, ArrowLeft, Sparkles, PartyPopper } from 'lucide-react'
import toast from 'react-hot-toast'

export default function BetaWaitlistPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [classLevel, setClassLevel] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [code, setCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [redeeming, setRedeeming] = useState(false)
  const [redeemed, setRedeemed] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setIsLoggedIn(true)
    })
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, classLevel: classLevel || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l’inscription')
      setCode(data.code)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l’inscription'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRedeemNow() {
    if (!code) return
    setRedeeming(true)
    try {
      const res = await fetch('/api/waitlist/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Code invalide')
      toast.success(data.message)
      setRedeemed(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l’activation'
      toast.error(message)
    } finally {
      setRedeeming(false)
    }
  }

  function handleCopy() {
    if (!code) return
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center bg-surface-secondary px-3 sm:px-6 py-6 sm:py-10 overflow-hidden selection:bg-primary-100 selection:text-primary-900">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-gradient-to-b from-primary-400/15 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-10 w-[350px] h-[250px] bg-gradient-to-t from-accent-400/10 to-transparent blur-3xl pointer-events-none rounded-full" />

      <div className="w-full max-w-md flex items-center justify-between mb-3 sm:mb-6 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-text-secondary hover:text-primary-600 transition-colors py-0.5 px-2 rounded-lg hover:bg-surface border border-transparent hover:border-border"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Accueil</span>
        </Link>
        <div className="flex items-center gap-1 text-[10px] font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-200">
          <Rocket className="h-3 w-3" />
          <span>Beta · Lancement le 1er septembre</span>
        </div>
      </div>

      <div className="mb-3 sm:mb-5 z-10">
        <Logo size="md" href="/" />
      </div>

      <div className="w-full max-w-md z-10">
        <Card padding="lg" className="shadow-md border-border">
          {!code ? (
            <>
              <div className="text-center space-y-1.5 mb-5">
                <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
                  Rejoins la liste d’attente
                </h1>
                <p className="text-sm text-text-secondary">
                  Inscris-toi et reçois un code d’accès Pro gratuit, valable les 30 et 31 août — deux jours avant le lancement officiel d’{APP_NAME}.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="ton.email@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-4 rounded-lg border border-border bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500"
                />

                <select
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value)}
                  className="w-full h-11 px-4 rounded-lg border border-border bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Ton niveau (optionnel)</option>
                  {CLASS_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.emoji} {level.label}
                    </option>
                  ))}
                </select>

                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="w-full"
                  rightIcon={<Sparkles className="h-4 w-4" />}
                >
                  Rejoindre la liste d’attente
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary-50 flex items-center justify-center">
                <PartyPopper className="h-6 w-6 text-primary-600" />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-xl font-bold text-text-primary tracking-tight">
                  Tu es sur la liste ! 🎉
                </h1>
                <p className="text-sm text-text-secondary">
                  Voici ton code d’accès Pro gratuit, actif les 30 et 31 août :
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 h-12 rounded-lg border-2 border-dashed border-primary-300 bg-primary-50/60 text-lg font-bold tracking-widest text-primary-700"
              >
                {code}
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>

              {isLoggedIn ? (
                <Button
                  onClick={handleRedeemNow}
                  isLoading={redeeming}
                  disabled={redeemed}
                  className="w-full"
                  rightIcon={<Sparkles className="h-4 w-4" />}
                >
                  {redeemed ? 'Code activé sur ton compte' : 'Activer ce code sur mon compte'}
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-text-tertiary">
                    Crée ton compte OptiNote, puis entre ce code dans Paramètres pour activer ton accès.
                  </p>
                  <Link href="/register">
                    <Button className="w-full" rightIcon={<Sparkles className="h-4 w-4" />}>
                      Créer mon compte
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
