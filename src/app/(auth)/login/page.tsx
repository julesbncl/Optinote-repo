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
          disabled={isLoading}
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

