import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-surface-secondary">
      {/* Top Navbar */}
      <header className="h-16 border-b border-border bg-surface flex items-center px-4 sm:px-8 justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-xs">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-text-primary">
            {APP_NAME}
          </span>
        </Link>
        <span className="text-xs font-semibold px-3 py-1 bg-primary-50 text-primary-700 rounded-full">
          Configuration initiale
        </span>
      </header>

      {/* Main Centered Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-8 sm:py-12">
        <div className="w-full max-w-xl">
          {children}
        </div>
      </main>
    </div>
  )
}
