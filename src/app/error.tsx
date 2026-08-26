'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-secondary px-4 text-center">
      <div className="h-16 w-16 rounded-2xl bg-danger-50 flex items-center justify-center text-danger-600 mb-6 border border-danger-100">
        <AlertTriangle className="h-8 w-8" />
      </div>

      <h1 className="text-2xl font-bold text-text-primary">
        Une erreur inattendue est survenue
      </h1>
      <p className="mt-2 text-sm text-text-secondary max-w-md">
        Pas d&apos;inquiétude, tes données sont protégées. Clique sur le bouton ci-dessous pour réessayer.
      </p>

      <div className="mt-6 flex flex-col sm:flex-row items-center gap-2 w-full max-w-xs sm:max-w-none sm:w-auto">
        <Button
          onClick={() => reset()}
          leftIcon={<RefreshCw className="h-4 w-4" />}
          className="w-full sm:w-auto"
        >
          Réessayer
        </Button>
        <a
          href="/dashboard"
          className="w-full sm:w-auto h-10 px-5 rounded-xl bg-surface hover:bg-surface-secondary border border-border text-text-primary text-sm font-bold flex items-center justify-center transition-all"
        >
          Retour à l&apos;accueil
        </a>
      </div>
    </div>
  )
}
