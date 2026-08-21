import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import { APP_NAME } from '@/lib/constants'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center bg-surface-secondary px-3 sm:px-6 py-2.5 sm:py-10 overflow-hidden selection:bg-primary-100 selection:text-primary-900">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-gradient-to-b from-primary-400/15 to-transparent blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-10 w-[350px] h-[250px] bg-gradient-to-t from-accent-400/10 to-transparent blur-3xl pointer-events-none rounded-full" />

      {/* Top Bar / Back to Home Link */}
      <div className="w-full max-w-md flex items-center justify-between mb-1.5 sm:mb-4 z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-text-secondary hover:text-primary-600 transition-colors py-0.5 px-2 rounded-lg hover:bg-surface border border-transparent hover:border-border"
        >
          <ArrowLeft className="h-3 w-3" />
          <span>Accueil</span>
        </Link>
        <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.2 sm:py-0.5 rounded-full border border-emerald-200">
          <ShieldCheck className="h-3 w-3 text-emerald-600" />
          <span>Espace Sécurisé</span>
        </div>
      </div>

      {/* Logo Central Sleek & Modern */}
      <div className="mb-2 sm:mb-4 z-10">
        <Logo size="md" href="/" />
      </div>

      {/* Main Auth Content */}
      <div className="w-full max-w-md z-10">
        {children}
      </div>

      {/* Footer info */}
      <div className="mt-2.5 sm:mt-6 text-center text-[10px] sm:text-xs text-text-tertiary z-10 space-y-0.5">
        <p>© {new Date().getFullYear()} {APP_NAME} SAS</p>
        <div className="flex items-center justify-center gap-2.5 text-[10px]">
          <Link href="/legal/privacy" className="hover:text-text-secondary transition-colors">
            Confidentialité
          </Link>
          <span>•</span>
          <Link href="/legal/terms" className="hover:text-text-secondary transition-colors">
            Conditions (CGU)
          </Link>
        </div>
      </div>
    </div>
  )
}
