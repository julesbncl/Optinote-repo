'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Mail,
  MailCheck,
  RefreshCw,
  ArrowRight,
  Inbox,
  ExternalLink,
  Sparkles,
} from 'lucide-react'
import toast from 'react-hot-toast'

function WaitingForEmailContent() {
  const searchParams = useSearchParams()
  const supabase = createClient()

  const email = searchParams.get('email') || ''
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  // Compte à rebours de 60s pour éviter le spam
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  // Détection du webmail selon le domaine de l'email
  const getWebmailUrl = (emailStr: string) => {
    const domain = emailStr.split('@')[1]?.toLowerCase() || ''
    if (domain.includes('gmail')) return 'https://mail.google.com'
    if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live')) return 'https://outlook.live.com'
    if (domain.includes('icloud')) return 'https://www.icloud.com/mail'
    if (domain.includes('yahoo')) return 'https://mail.yahoo.com'
    if (domain.includes('proton')) return 'https://mail.proton.me'
    return null
  }

  const webmailUrl = email ? getWebmailUrl(email) : null

  // Renvoyer l'email de confirmation
  const handleResendEmail = async () => {
    if (cooldown > 0 || resending) return
    if (!email) {
      toast.error('Adresse e-mail introuvable.')
      return
    }

    setResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=/dashboard`,
        },
      })

      if (error) {
        toast.error(error.message || "Erreur lors du renvoi de l'e-mail.")
      } else {
        toast.success('E-mail renvoyé avec succès ! 📬')
        setCooldown(60)
      }
    } catch {
      toast.error('Erreur réseau lors du renvoi.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="bg-surface/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-border p-4 sm:p-7 shadow-xl shadow-primary-950/5 text-center relative transition-all duration-300">
      {/* Verification Icon */}
      <div className="relative inline-flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-tr from-primary-500/15 via-primary-500/25 to-accent-500/25 border border-primary-300/50 shadow-inner mb-2.5 sm:mb-4 animate-in zoom-in-75 duration-300">
        <MailCheck className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 animate-pulse" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3 sm:h-3.5 sm:w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 sm:h-3.5 sm:w-3.5 bg-primary-600"></span>
        </span>
      </div>

      {/* Main Title & Message */}
      <h1 className="text-base sm:text-2xl font-black text-text-primary tracking-tight">
        Vérifie ta boîte de réception ✉️
      </h1>

      <p className="mt-1 text-[11px] sm:text-sm text-text-secondary leading-relaxed max-w-xs sm:max-w-sm mx-auto">
        Un e-mail de confirmation t&apos;a été envoyé. Clique sur le lien pour activer ton compte.
      </p>

      {/* Targeted Email Pill */}
      {email && (
        <div className="mt-2.5 sm:mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 border border-primary-200/80 text-primary-800 text-[10px] sm:text-xs font-semibold max-w-full truncate">
          <Mail className="h-3 w-3 text-primary-600 flex-shrink-0" />
          <span className="truncate">{email}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-3 sm:mt-5 space-y-2">
        {/* Direct Open Webmail button */}
        {webmailUrl && (
          <a
            href={webmailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 h-8.5 sm:h-10.5 px-3.5 text-[11px] sm:text-xs font-bold text-white bg-gradient-to-r from-primary-600 via-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 rounded-xl shadow-2xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer"
          >
            <Inbox className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Ouvrir ma boîte mail</span>
            <ExternalLink className="h-3 w-3 opacity-80" />
          </a>
        )}

        {/* Resend button */}
        <button
          type="button"
          onClick={handleResendEmail}
          disabled={cooldown > 0 || resending}
          className="w-full inline-flex items-center justify-center gap-1.5 h-8 sm:h-9 px-3 text-[10.5px] sm:text-xs font-semibold text-text-primary bg-surface hover:bg-surface-secondary border border-border rounded-xl transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`h-3 w-3 text-primary-600 ${resending ? 'animate-spin' : ''}`} />
          <span>
            {cooldown > 0
              ? `Renvoyer (${cooldown}s)`
              : resending
              ? 'Envoi en cours...'
              : "Renvoyer l'e-mail de confirmation"}
          </span>
        </button>
      </div>

      {/* Compact Spam Note */}
      <p className="mt-2.5 sm:mt-3.5 text-[9px] sm:text-[11px] text-text-tertiary">
        💡 Pense à vérifier tes <strong>Spams / Courriers indésirables</strong>.
      </p>

      {/* Bottom Nav / Return to login */}
      <div className="mt-3 pt-2.5 sm:mt-4 sm:pt-3 border-t border-border flex items-center justify-between text-[9.5px] sm:text-xs">
        <Link
          href="/register"
          className="text-text-secondary hover:text-text-primary transition-colors hover:underline"
        >
          ← Changer d&apos;e-mail
        </Link>
        <Link
          href="/login"
          className="font-bold text-primary-600 hover:text-primary-700 hover:underline inline-flex items-center gap-0.5"
        >
          <span>Déjà validé ? Se connecter</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}

export default function WaitingForEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-surface/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-border p-6 text-center flex flex-col items-center justify-center min-h-[220px]">
          <div className="h-6 w-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-[10px] text-text-tertiary">Chargement...</p>
        </div>
      }
    >
      <WaitingForEmailContent />
    </Suspense>
  )
}
