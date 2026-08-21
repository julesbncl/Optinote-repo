'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { forgotPasswordSchema } from '@/lib/validators/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Mail, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { LogoIcon } from '@/components/ui/Logo'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string

    const result = forgotPasswordSchema.safeParse({ email })
    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }

    setIsLoading(true)

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        })

      if (resetError) {
        toast.error(resetError.message)
        return
      }

      setSent(true)
      toast.success('Email envoyé !')
    } catch {
      toast.error('Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-surface/95 backdrop-blur-md rounded-xl sm:rounded-3xl border border-border p-3.5 sm:p-7 shadow-xl shadow-primary-950/5 relative transition-all duration-300">
      {sent ? (
        <div className="text-center py-2 sm:py-4">
          <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 sm:mb-4 border border-emerald-200">
            <Mail className="h-5 w-5 sm:h-7 sm:w-7 text-emerald-600" />
          </div>
          <h1 className="text-sm sm:text-xl font-bold text-text-primary mb-1 sm:mb-2">
            Email envoyé ! ✉️
          </h1>
          <p className="text-[10px] sm:text-sm text-text-secondary mb-3 sm:mb-6">
            Vérifie ta boîte mail et clique sur le lien pour réinitialiser
            ton mot de passe.
          </p>
          <Link href="/login">
            <Button variant="secondary" className="w-full text-xs sm:text-sm h-8 sm:h-10">
              <ArrowLeft className="h-3.5 w-3.5" />
              Retour à la connexion
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="text-center mb-3 sm:mb-5">
            <div className="inline-flex items-center justify-center h-8 w-8 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/70 border border-primary-200/80 shadow-xs mb-1 sm:mb-3">
              <LogoIcon className="h-4.5 w-4.5 sm:h-7 sm:w-7" />
            </div>
            <h1 className="text-sm sm:text-xl font-black text-text-primary">
              Mot de passe oublié ? 🔑
            </h1>
            <p className="mt-0.5 text-[9.5px] sm:text-xs text-text-secondary">
              Entre ton email pour recevoir un lien de réinitialisation
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-4">
            <Input
              name="email"
              type="email"
              label="Adresse email"
              placeholder="eleve@lycee.fr"
              leftIcon={<Mail className="h-4 w-4" />}
              error={error}
              autoComplete="email"
              required
            />

            <Button
              type="submit"
              className="w-full text-xs sm:text-sm h-8.5 sm:h-11 font-bold mt-1"
              size="lg"
              isLoading={isLoading}
            >
              Envoyer le lien
            </Button>

            <div className="text-center pt-1">
              <Link
                href="/login"
                className="text-[10px] sm:text-xs text-primary-600 hover:text-primary-700 font-semibold inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Retour à la connexion</span>
              </Link>
            </div>
          </form>
        </>
      )}
    </div>
  )
}
