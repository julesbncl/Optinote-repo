'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Users,
  Calculator,
} from 'lucide-react'
import type { Profile } from '@/types/database'
import { PaywallModal } from '@/components/paywall/PaywallModal'

interface BottomNavProps {
  profile?: Profile | null
}

export function BottomNav({ profile }: BottomNavProps) {
  const pathname = usePathname()
  const [paywallFeature, setPaywallFeature] = useState<'campus' | 'planning' | null>(null)

  const isSubscribed = Boolean(
    profile &&
      (profile.is_pro === true ||
        (['active', 'trialing'].includes(profile.subscription_status || '') &&
          (profile.subscription_tier === 'monthly' || profile.subscription_tier === 'annual')))
  )

  const navItems = isSubscribed
    ? [
        {
          label: 'Dashboard',
          href: '/dashboard',
          icon: LayoutDashboard,
          isLocked: false,
          feature: null,
        },
        {
          label: 'Campus',
          href: '/campus',
          icon: Users,
          isLocked: false,
          feature: null,
        },
        {
          label: 'Planning',
          href: '/planning',
          icon: CalendarDays,
          isLocked: false,
          feature: null,
        },
        {
          label: 'Révision',
          href: '/revision',
          icon: BookOpen,
          isLocked: false,
          feature: null,
        },
        {
          label: 'Notes',
          href: '/grades',
          icon: Calculator,
          isLocked: false,
          feature: null,
        },
      ]
    : [
        {
          label: 'Dashboard',
          href: '/dashboard',
          icon: LayoutDashboard,
          isLocked: false,
          feature: null,
        },
        {
          label: 'Campus',
          href: '/campus',
          icon: Users,
          isLocked: true,
          feature: 'campus' as const,
        },
        {
          label: 'Planning',
          href: '/planning',
          icon: CalendarDays,
          isLocked: true,
          feature: 'planning' as const,
        },
        {
          label: 'Révision',
          href: '/revision',
          icon: BookOpen,
          isLocked: false,
          feature: null,
        },
        {
          label: 'Notes',
          href: '/grades',
          icon: Calculator,
          isLocked: false,
          feature: null,
        },
      ]

  const isSettingsActive = pathname.startsWith('/settings')

  return (
    <>
      <nav
        className={cn(
          'lg:hidden fixed bottom-0 left-0 right-0 z-50',
          'bg-surface/95 backdrop-blur-xl border-t border-border shadow-2xl',
          'pb-[env(safe-area-inset-bottom,0px)]'
        )}
      >
        <div className="flex items-center justify-between h-12 sm:h-14 px-1">
          {/* 5 Onglets Principaux */}
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = !item.isLocked && pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.isLocked ? '#' : item.href}
                onClick={(e) => {
                  if (item.isLocked && item.feature) {
                    e.preventDefault()
                    setPaywallFeature(item.feature)
                  }
                }}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 py-0.5 px-0.5 relative',
                  'min-w-0 transition-all duration-200 cursor-pointer',
                  isActive
                    ? 'text-primary-600'
                    : 'text-text-tertiary active:text-text-secondary'
                )}
              >
                <div
                  className={cn(
                    'flex items-center justify-center h-5.5 w-5.5 sm:h-7 sm:w-7 rounded-lg sm:rounded-xl relative',
                    'transition-all duration-200',
                    isActive && 'bg-primary-50'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-3.5 w-3.5 sm:h-4.5 sm:w-4.5 transition-all duration-200',
                      isActive && 'scale-110'
                    )}
                  />
                  {item.isLocked && (
                    <span
                      className="absolute -top-1 -right-1.5 px-1 py-0.2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[6px] sm:text-[7px] font-black tracking-tight shadow-2xs uppercase leading-none border border-surface"
                      title="Réservé aux abonnés Pro"
                    >
                      PRO
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    'text-[7.5px] sm:text-[9.5px] font-medium leading-tight truncate max-w-full',
                    isActive && 'font-black'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}

          {/* 6ème Onglet : Profil Utilisateur (Entouré d'un fin rond bleu élégant) */}
          <Link
            href="/settings"
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-0.5 px-0.5 relative',
              'min-w-0 transition-all duration-200 group cursor-pointer',
              isSettingsActive
                ? 'text-primary-600'
                : 'text-text-tertiary active:text-text-secondary'
            )}
            title="Mon Compte & Profil"
          >
            <div
              className={cn(
                'flex items-center justify-center h-5.5 w-5.5 sm:h-7 sm:w-7 rounded-full relative transition-all duration-200',
                // Élégant et fin rond bleu incitatif
                'ring-1.5 sm:ring-2 ring-primary-500 ring-offset-1 ring-offset-surface shadow-xs group-hover:scale-105',
                isSettingsActive && 'ring-primary-600 bg-primary-50'
              )}
            >
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || 'Profil'}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="h-full w-full rounded-full bg-gradient-to-tr from-primary-500 to-accent-500 text-white flex items-center justify-center text-[8.5px] sm:text-xs font-black">
                  {profile?.full_name?.charAt(0).toUpperCase() || 'T'}
                </div>
              )}
            </div>
            <span
              className={cn(
                'text-[7.5px] sm:text-[9.5px] font-medium leading-tight truncate max-w-full',
                isSettingsActive ? 'font-black text-primary-600' : 'text-text-tertiary'
              )}
            >
              Profil
            </span>
          </Link>
        </div>
      </nav>

      {/* Modale d'incitation Pro pour les onglets verrouillés */}
      <PaywallModal
        isOpen={Boolean(paywallFeature)}
        onClose={() => setPaywallFeature(null)}
        featureLocked={paywallFeature || 'general'}
      />
    </>
  )
}
