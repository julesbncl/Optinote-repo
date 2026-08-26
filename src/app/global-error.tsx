'use client'

import { useEffect } from 'react'
import './globals.css'

// Filet de sécurité pour un crash dans le layout racine lui-même (très rare —
// error.tsx ne couvre que les erreurs sous le layout racine). Doit fournir
// son propre <html>/<body> puisqu'il remplace tout le layout quand il se déclenche.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Unhandled root layout error:', error)
  }, [error])

  return (
    <html lang="fr">
      <body className="min-h-screen">
        <div className="min-h-screen flex flex-col items-center justify-center bg-surface-secondary px-4 text-center">
          <div className="h-16 w-16 rounded-2xl bg-danger-50 flex items-center justify-center text-danger-600 mb-6 border border-danger-100 text-3xl">
            ⚠️
          </div>

          <h1 className="text-2xl font-bold text-text-primary">
            OptiNote a rencontré un problème
          </h1>
          <p className="mt-2 text-sm text-text-secondary max-w-md">
            Pas d&apos;inquiétude, tes données sont protégées. Recharge la page pour continuer.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center gap-2">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full sm:w-auto h-10 px-5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-sm transition-all cursor-pointer"
            >
              Réessayer
            </button>
            <a
              href="/dashboard"
              className="w-full sm:w-auto h-10 px-5 rounded-xl bg-surface hover:bg-surface-secondary border border-border text-text-primary text-sm font-bold flex items-center justify-center transition-all"
            >
              Retour à l&apos;accueil
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
