'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { resetPasswordSchema } from '@/lib/validators/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Lock } from 'lucide-react'
import toast from 'react-hot-toast'

import { LogoIcon } from '@/components/ui/Logo'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})

    const formData = new FormData(e.currentTarget)
    const data = {
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    }

    const result = resetPasswordSchema.safeParse(data)
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
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Mot de passe mis à jour !')
      router.push('/dashboard')
    } catch {
      toast.error('Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-surface/95 backdrop-blur-md rounded-xl sm:rounded-3xl border border-border p-3.5 sm:p-7 shadow-xl shadow-primary-950/5 relative transition-all duration-300">
      <div className="text-center mb-3 sm:mb-5">
        <div className="inline-flex items-center justify-center h-8 w-8 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/70 border border-primary-200/80 shadow-xs mb-1 sm:mb-3">
          <LogoIcon className="h-4.5 w-4.5 sm:h-7 sm:w-7" />
        </div>
        <h1 className="text-sm sm:text-xl font-black text-text-primary">
          Nouveau mot de passe 🔒
        </h1>
        <p className="mt-0.5 text-[9.5px] sm:text-xs text-text-secondary">
          Choisis un nouveau mot de passe sécurisé
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-4">
        <Input
          name="password"
          type="password"
          label="Nouveau mot de passe"
          placeholder="6 caractères minimum"
          leftIcon={<Lock className="h-4 w-4" />}
          error={errors.password}
          autoComplete="new-password"
          required
        />

        <Input
          name="confirmPassword"
          type="password"
          label="Confirmer le mot de passe"
          placeholder="••••••••"
          leftIcon={<Lock className="h-4 w-4" />}
          error={errors.confirmPassword}
          autoComplete="new-password"
          required
        />

        <Button
          type="submit"
          className="w-full text-xs sm:text-sm h-8.5 sm:h-11 font-bold mt-1"
          size="lg"
          isLoading={isLoading}
        >
          Mettre à jour
        </Button>
      </form>
    </div>
  )
}
