'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginInput } from '@/lib/validators/auth'
import { LogoIcon } from '@/components/ui/Logo'
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({})

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam === 'confirmation') {
      setErrorMessage('Le lien de confirmation est invalide ou a expiré. Connecte-toi ou demande un nouveau lien.')
    } else if (errorParam === 'auth') {
      setErrorMessage('Erreur d’authentification. Veuillez réessayer.')
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})
    setErrorMessage(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      email: (formData.get('email') as string)?.trim(),
      password: formData.get('password') as string,
    }

    // Validate with Zod
    const result = loginSchema.safeParse(data)
    if (!result.success) {
      const fieldErrors: typeof errors = {}
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as keyof LoginInput] = issue.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')) {
          setErrorMessage('Adresse email ou mot de passe incorrect.')
          toast.error('Identifiants invalides')
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMessage('Vérifie ton adresse email avant de te connecter.')
          toast.error('Email non vérifié')
        } else {
          setErrorMessage(error.message)
          toast.error(error.message)
        }
        return
      }

      toast.success('Connexion réussie ! Heureux de te revoir 🚀')
      router.push(redirectTo)
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      if (
        message.includes('NetworkError') ||
        message.includes('fetch') ||
        message.includes('Failed to fetch')
      ) {
        setErrorMessage('Erreur de connexion au serveur. Vérifie ta connexion internet.')
        toast.error('Erreur réseau')
      } else {
        setErrorMessage('Une erreur inattendue est survenue.')
        toast.error('Erreur de connexion')
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setIsGoogleLoading(true)
    setErrorMessage(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(redirectTo)}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      })

      if (error) {
        toast.error(error.message)
        setErrorMessage(error.message)
      }
    } catch {
      toast.error("Impossible d'initialiser la connexion avec Google")
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="bg-surface/95 backdrop-blur-md rounded-xl sm:rounded-3xl border border-border p-3.5 sm:p-7 shadow-xl shadow-primary-950/5 relative transition-all duration-300">
      {/* Header & Official Logo Avatar */}
      <div className="text-center mb-2.5 sm:mb-5">
        <div className="inline-flex items-center justify-center h-8 w-8 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/70 border border-primary-200/80 shadow-xs mb-1 sm:mb-3 animate-in zoom-in-75 duration-300">
          <LogoIcon className="h-4.5 w-4.5 sm:h-7 sm:w-7" />
        </div>
        <h1 className="text-sm sm:text-xl font-black text-text-primary tracking-tight">
          Content de te revoir 👋
        </h1>
        <p className="mt-0.5 text-[9.5px] sm:text-xs text-text-secondary">
          Accède à ton planning, tes fiches et tes salons d&apos;entraide
        </p>
      </div>

      {/* Google OAuth Login Button */}
      <div className="mb-2.5 sm:mb-4">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading || isGoogleLoading}
          className="w-full inline-flex items-center justify-center gap-2.5 h-8.5 sm:h-10.5 px-3 bg-surface hover:bg-surface-secondary border border-border hover:border-slate-300 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold text-text-primary transition-all duration-150 shadow-2xs active:scale-[0.99] disabled:opacity-50 cursor-pointer"
        >
          {isGoogleLoading ? (
            <div className="h-4 w-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Continuer avec Google</span>
        </button>
      </div>

      {/* Divider */}
      <div className="relative my-2 sm:my-3 text-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <span className="relative bg-surface px-2 text-[9px] sm:text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
          ou avec ton email
        </span>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="mb-2.5 p-2 rounded-lg bg-danger-50 border border-danger-200 text-danger-800 text-[10px] flex items-start gap-1.5 animate-in fade-in">
          <AlertCircle className="h-3.5 w-3.5 text-danger-600 flex-shrink-0 mt-0.5" />
          <p className="font-medium leading-tight">{errorMessage}</p>
        </div>
      )}

      {/* Email / Password Form */}
      <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
        {/* Email Field */}
        <div>
          <label className="block text-[10px] sm:text-xs font-bold text-text-primary mb-0.5">
            Adresse email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-text-tertiary">
              <Mail className="h-3.5 w-3.5" />
            </div>
            <input
              name="email"
              type="email"
              placeholder="eleve@lycee.fr"
              autoComplete="email"
              required
              disabled={isLoading}
              className={`w-full pl-7.5 sm:pl-9 pr-3 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-surface border text-[11px] sm:text-sm text-text-primary placeholder:text-text-tertiary focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all ${
                errors.email ? 'border-danger-500 bg-danger-50/20' : 'border-border'
              }`}
            />
          </div>
          {errors.email && (
            <p className="mt-0.5 text-[9.5px] font-medium text-danger-600">{errors.email}</p>
          )}
        </div>

        {/* Password Field with Eye Toggle */}
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <label className="block text-[10px] sm:text-xs font-bold text-text-primary">
              Mot de passe
            </label>
            <Link
              href="/forgot-password"
              className="text-[9.5px] sm:text-xs text-primary-600 hover:text-primary-700 font-semibold hover:underline"
            >
              Oublié ?
            </Link>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-text-tertiary">
              <Lock className="h-3.5 w-3.5" />
            </div>
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
              autoComplete="current-password"
              required
              disabled={isLoading}
              className={`w-full pl-7.5 sm:pl-9 pr-8 sm:pr-9 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-surface border text-[11px] sm:text-sm text-text-primary placeholder:text-text-tertiary focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all ${
                errors.password ? 'border-danger-500 bg-danger-50/20' : 'border-border'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-0.5 text-[9.5px] font-medium text-danger-600">{errors.password}</p>
          )}
        </div>

        {/* Remember me checkbox */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <input
            id="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-border text-primary-600 focus:ring-primary-500/20 focus:ring-2 accent-primary-600 cursor-pointer"
          />
          <label htmlFor="remember-me" className="text-[10px] sm:text-xs text-text-secondary select-none cursor-pointer">
            Se souvenir de moi
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || isGoogleLoading}
          className="w-full inline-flex items-center justify-center gap-1.5 h-8.5 sm:h-11 px-3 text-[11px] sm:text-sm font-bold text-white bg-gradient-to-r from-primary-600 via-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.99] disabled:opacity-60 cursor-pointer mt-1"
        >
          {isLoading ? (
            <>
              <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Connexion...</span>
            </>
          ) : (
            <>
              <span>Se connecter</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Security Reassurance */}
      <div className="mt-2.5 pt-2 border-t border-border flex items-center justify-center gap-1 text-[9.5px] sm:text-[10.5px] text-text-tertiary">
        <ShieldCheck className="h-3 w-3 text-emerald-600" />
        <span>Connexion 100% Chiffrée & Sécurisée</span>
      </div>

      {/* Registration Redirect */}
      <div className="mt-2 text-center">
        <p className="text-[10px] sm:text-xs text-text-secondary">
          Tu n&apos;as pas de compte ?{' '}
          <Link
            href="/register"
            className="text-primary-600 hover:text-primary-700 font-bold hover:underline inline-flex items-center gap-0.5"
          >
            <span>Crée-en un gratuitement</span>
            <span aria-hidden="true">➔</span>
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="bg-surface/95 backdrop-blur-md rounded-xl sm:rounded-3xl border border-border p-3.5 sm:p-7 shadow-xl shadow-primary-950/5 flex items-center justify-center h-48">
        <div className="h-6 w-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

