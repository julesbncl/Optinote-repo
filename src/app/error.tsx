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

      <div className="mt-6">
        <Button onClick={() => reset()} leftIcon={<RefreshCw className="h-4 w-4" />}>
          Réessayer
        </Button>
      </div>
    </div>
  )
}
