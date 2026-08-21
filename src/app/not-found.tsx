import Link from 'next/link'
import { Sparkles, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { APP_NAME } from '@/lib/constants'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-secondary px-4 text-center">
      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg mb-6">
        <Sparkles className="h-8 w-8 text-white" />
      </div>

      <h1 className="text-4xl font-extrabold text-text-primary tracking-tight sm:text-5xl">
        404
      </h1>
      <h2 className="mt-2 text-xl font-semibold text-text-primary">
        Page introuvable
      </h2>
      <p className="mt-2 text-sm text-text-secondary max-w-sm">
        Oups ! La page que tu cherches n&apos;existe pas ou a été déplacée.
      </p>

      <div className="mt-6 flex gap-3">
        <Link href="/dashboard">
          <Button leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Retour au Dashboard
          </Button>
        </Link>
      </div>

      <p className="mt-12 text-xs text-text-tertiary">
        {APP_NAME} — L&apos;application tout-en-un pour lycéens
      </p>
    </div>
  )
}
