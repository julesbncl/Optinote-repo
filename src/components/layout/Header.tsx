'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Zap, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { checkIsPro } from '@/lib/hooks/useIsPro'
import type { Profile } from '@/types/database'

// Map route segments to page titles
const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  campus: 'Campus Social & Carte',
  planning: 'Planning Intelligent',
  revision: 'Fiches de Révision',
  grades: 'Notes & Moyennes',
  settings: 'Paramètres',
}

interface HeaderProps {
  profile: Profile | null
}

export function Header({ profile }: HeaderProps) {
  const pathname = usePathname()
  const segment = pathname.split('/')[1] || 'dashboard'
  const title = pageTitles[segment] || 'Dashboard'

  const isSubscribed = checkIsPro(profile)

  return (
    <header
      className={cn(
        'sticky top-0 z-30 h-13 sm:h-16 flex items-center justify-between',
        'px-3 sm:px-6 lg:px-8',
        'bg-surface/95 backdrop-blur-lg border-b border-border'
      )}
    >
      {/* Côté Gauche : Titre de la page */}
      <div className="flex items-center gap-2 min-w-0">
        <h1 className="text-sm sm:text-lg lg:text-xl font-black text-text-primary tracking-tight truncate">
          {title}
        </h1>
      </div>

      {/* Côté Droit : Badge Passer Pro & Avatar profil */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Badge de statut Essai gratuit / Illimité (Couleur bleue élégante et signature) */}
        {!isSubscribed ? (
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 rounded-xl bg-primary-50 hover:bg-primary-100 text-primary-900 text-[11px] sm:text-xs font-bold border border-primary-200 transition-all shadow-2xs group"
            title="Passer à l'offre mensuelle ou annuelle"
          >
            <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary-600 animate-pulse" />
            <span className="hidden xs:inline text-primary-800">Essai gratuit</span>
            <span className="text-[9px] sm:text-[10px] font-black text-primary-700 underline ml-0.5 group-hover:text-primary-950">
              Passer Pro ➔
            </span>
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl bg-emerald-50 text-emerald-700 text-[11px] sm:text-xs font-bold border border-emerald-200">
            <Sparkles className="h-3 w-3 text-emerald-600" /> Illimité
          </span>
        )}

        {/* Avatar Profil */}
        <Link href="/settings" className="flex items-center" title="Profil & Paramètres">
          <Avatar
            src={profile?.avatar_url}
            name={profile?.full_name || profile?.email || ''}
            size="sm"
          />
        </Link>
      </div>
    </header>
  )
}
