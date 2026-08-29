'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { registerSchema } from '@/lib/validators/auth'
import { LogoIcon } from '@/components/ui/Logo'
import {
  Mail,
  Lock,
  User,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import toast from 'react-hot-toast'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const referralCode = searchParams.get('ref')?.trim().toUpperCase() || null
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [acceptedTerms, setAcceptedTerms] = useState(false)



  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})
    setErrorMessage(null)

    if (!acceptedTerms) {
      setErrorMessage('Merci d’accepter les CGU et la Politique de Confidentialité pour continuer.')
      return
    }

    const formData = new FormData(e.currentTarget)
    const data = {
      fullName: (formData.get('fullName') as string)?.trim(),
      email: (formData.get('email') as string)?.trim(),
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    }

    // Validate input with Zod
    const result = registerSchema.safeParse(data)
    if (!result.success) {
      const fieldErrors: typeof errors = {}
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    setIsLoading(true)

    try {
      // 1. Sign up user via Supabase Auth with redirect callback
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(
            referralCode ? `/onboarding?ref=${referralCode}` : '/onboarding'
          )}`,
        },
      })

      if (error) {
        if (error.message.includes('already registered')) {
          setErrorMessage('Cet email est déjà associé à un compte existant.')
          toast.error('Email déjà utilisé')
        } else {
          setErrorMessage(error.message)
          toast.error(error.message)
        }
        return
      }

      // 2. Initialize profile with Free status if session exists
      if (authData.user) {
        try {
          await supabase
            .from('profiles')
            .update({
              is_pro: false,
              full_name: data.fullName,
              subscription_tier: 'free',
              subscription_status: 'inactive',
            })
            .eq('id', authData.user.id)
        } catch {
          // Trigger will initialize if user session is not yet active
        }
      }

      // 3. If email confirmation is required (session is null), redirect to waiting page
      if (!authData.session) {
        toast.success('Inscription validée ! Vérifie ton e-mail pour activer ton compte 🚀')
        router.push(`/waiting-for-email?email=${encodeURIComponent(data.email)}`)
        return
      }

      // 4. Si un code de parrainage est présent, l'enregistrer (sans effet financier
      // immédiat : la récompense n'est accordée que plus tard, sur paiement confirmé)
      if (referralCode) {
        try {
          await fetch('/api/referrals/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: referralCode }),
          })
        } catch (err) {
          console.warn('Error claiming referral code:', err)
        }
      }

      // 5. Si auto-confirmé, proceed to onboarding (niveau, spécialités, lycée...)
      toast.success('Compte créé avec succès ! Bienvenue sur OptiNote 🎉')
      router.push('/onboarding')
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      if (
        message.includes('NetworkError') ||
        message.includes('fetch') ||
        message.includes('Failed to fetch')
      ) {
        setErrorMessage('Erreur réseau. Vérifie ta connexion internet.')
        toast.error('Erreur réseau')
      } else {
        setErrorMessage('Une erreur est survenue lors de la création du compte.')
        toast.error('Erreur de création')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-surface/95 backdrop-blur-md rounded-xl sm:rounded-3xl border border-border p-3 sm:p-6 shadow-xl shadow-primary-950/5 relative transition-all duration-300">
      {/* Brand Header */}
      <div className="text-center mb-1.5 sm:mb-3">
        <div className="inline-flex items-center justify-center h-7 w-7 sm:h-11 sm:w-11 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/70 border border-primary-200/80 shadow-xs mb-1 sm:mb-2 animate-in zoom-in-75 duration-300">
          <LogoIcon className="h-4 w-4 sm:h-6.5 sm:w-6.5" />
        </div>
        <h1 className="text-xs sm:text-xl font-black text-text-primary tracking-tight">
          Crée ton compte OptiNote
        </h1>
        <p className="mt-0.5 text-[8.5px] sm:text-xs text-text-secondary">
          Accède directement à tes outils d&apos;organisation et d&apos;excellence
        </p>

        {/* Free Trial Banner Ultra-Compact */}
        <div className="mt-1 p-1 sm:p-1.5 bg-primary-50/90 border border-primary-200/80 rounded-md sm:rounded-lg text-left text-[7.5px] sm:text-xs text-primary-900 flex items-center gap-1">
          <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-600 flex-shrink-0" />
          <span>
            <strong>Accès Pro 100% gratuit</strong> jusqu&apos;au 1er septembre, sans code ni carte bancaire.
          </span>
        </div>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="mb-1.5 p-1.5 rounded-lg bg-danger-50 border border-danger-200 text-danger-800 text-[9.5px] flex items-start gap-1 animate-in fade-in">
          <AlertCircle className="h-3 w-3 text-danger-600 flex-shrink-0 mt-0.5" />
          <p className="font-medium leading-tight">{errorMessage}</p>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-1 sm:space-y-2">
        {/* Full Name & Email (2 cols on sm, stacked ultra-compact on mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
          {/* Full Name */}
          <div>
            <label className="block text-[9px] sm:text-xs font-bold text-text-primary mb-0.5">
              Nom complet
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-text-tertiary">
                <User className="h-3 w-3" />
              </div>
              <input
                name="fullName"
                type="text"
                placeholder="ex: Thomas Dubois"
                autoComplete="name"
                required
                disabled={isLoading}
                className={`w-full pl-6.5 sm:pl-8 pr-2.5 py-1 sm:py-2 rounded-md sm:rounded-xl bg-surface border text-[10px] sm:text-sm text-text-primary placeholder:text-text-tertiary focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all ${
                  errors.fullName ? 'border-danger-500 bg-danger-50/20' : 'border-border'
                }`}
              />
            </div>
            {errors.fullName && (
              <p className="mt-0.5 text-[8px] font-medium text-danger-600">{errors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-[9px] sm:text-xs font-bold text-text-primary mb-0.5">
              Adresse email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-text-tertiary">
                <Mail className="h-3 w-3" />
              </div>
              <input
                name="email"
                type="email"
                placeholder="eleve@lycee.fr"
                autoComplete="email"
                required
                disabled={isLoading}
                className={`w-full pl-6.5 sm:pl-8 pr-2.5 py-1 sm:py-2 rounded-md sm:rounded-xl bg-surface border text-[10px] sm:text-sm text-text-primary placeholder:text-text-tertiary focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all ${
                  errors.email ? 'border-danger-500 bg-danger-50/20' : 'border-border'
                }`}
              />
            </div>
            {errors.email && (
              <p className="mt-0.5 text-[8px] font-medium text-danger-600">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Passwords in 2 columns */}
        <div className="grid grid-cols-2 gap-1 sm:gap-2">
          {/* Password */}
          <div>
            <label className="block text-[9px] sm:text-xs font-bold text-text-primary mb-0.5">
              Mot de passe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-text-tertiary">
                <Lock className="h-3 w-3" />
              </div>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="8 car. min, Maj+min+chiffre"
                autoComplete="new-password"
                required
                disabled={isLoading}
                className={`w-full pl-6.5 sm:pl-8 pr-6 sm:pr-7 py-1 sm:py-2 rounded-md sm:rounded-xl bg-surface border text-[10px] sm:text-sm text-text-primary placeholder:text-text-tertiary focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all ${
                  errors.password ? 'border-danger-500 bg-danger-50/20' : 'border-border'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-1.5 flex items-center text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? (
                  <EyeOff className="h-3 w-3" />
                ) : (
                  <Eye className="h-3 w-3" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-0.5 text-[8px] font-medium text-danger-600">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[9px] sm:text-xs font-bold text-text-primary mb-0.5">
              Confirmer
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-text-tertiary">
                <Lock className="h-3 w-3" />
              </div>
              <input
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Identique"
                autoComplete="new-password"
                required
                disabled={isLoading}
                className={`w-full pl-6.5 sm:pl-8 pr-2.5 py-1 sm:py-2 rounded-md sm:rounded-xl bg-surface border text-[10px] sm:text-sm text-text-primary placeholder:text-text-tertiary focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all ${
                  errors.confirmPassword ? 'border-danger-500 bg-danger-50/20' : 'border-border'
                }`}
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-0.5 text-[8px] font-medium text-danger-600">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        {/* CGU / Privacy Consent */}
        <div className="flex items-start gap-1.5 pt-0.5">
          <input
            id="accept-terms"
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            disabled={isLoading}
            className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 rounded border-border text-primary-600 focus:ring-primary-500/20 focus:ring-2 accent-primary-600 cursor-pointer"
          />
          <label htmlFor="accept-terms" className="text-[8.5px] sm:text-xs text-text-secondary select-none cursor-pointer leading-snug">
            J&apos;accepte les{' '}
            <Link href="/legal/terms" target="_blank" className="font-bold text-primary-600 hover:underline">
              CGU
            </Link>{' '}
            et la{' '}
            <Link href="/legal/privacy" target="_blank" className="font-bold text-primary-600 hover:underline">
              Politique de Confidentialité
            </Link>{' '}
            d&apos;OptiNote
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full inline-flex items-center justify-center gap-1 h-7.5 sm:h-10 px-3 text-[10.5px] sm:text-sm font-bold text-white bg-gradient-to-r from-primary-600 via-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 rounded-lg sm:rounded-xl shadow-xs hover:shadow-md transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer mt-1"
        >
          {isLoading ? (
            <>
              <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Création...</span>
            </>
          ) : (
            <>
              <span>Créer mon compte</span>
              <ArrowRight className="h-3 w-3" />
            </>
          )}
        </button>
      </form>

      {/* Security Reassurance */}
      <div className="mt-1.5 pt-1 border-t border-border flex items-center justify-center gap-1 text-[8.5px] sm:text-[10px] text-text-tertiary">
        <ShieldCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-600" />
        <span>100% Conforme RGPD • Données scolaires chiffrées</span>
      </div>

      {/* Login Redirect */}
      <div className="mt-1 text-center">
        <p className="text-[9px] sm:text-xs text-text-secondary">
          Tu as déjà un compte ?{' '}
          <Link
            href="/login"
            className="text-primary-600 hover:text-primary-700 font-bold hover:underline inline-flex items-center gap-0.5"
          >
            <span>Connecte-toi</span>
            <span aria-hidden="true">➔</span>
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="bg-surface/95 backdrop-blur-md rounded-xl sm:rounded-3xl border border-border p-3.5 sm:p-7 shadow-xl shadow-primary-950/5 flex items-center justify-center h-48">
        <div className="h-6 w-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
