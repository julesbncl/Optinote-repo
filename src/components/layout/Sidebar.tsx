'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { NAV_ITEMS, APP_NAME } from '@/lib/constants'
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  GraduationCap,
  Users,
  Settings,
  ChevronLeft,
  LogOut,
  Sparkles,
} from 'lucide-react'
import type { Profile } from '@/types/database'
import { Avatar } from '@/components/ui/Avatar'
import { PaywallModal } from '@/components/paywall/PaywallModal'
import { checkIsPro } from '@/lib/hooks/useIsPro'

import { Logo } from '@/components/ui/Logo'

const iconMap = {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  GraduationCap,
  Users,
} as const

interface SidebarProps {
  profile: Profile | null
  onSignOut: () => void
  campusBadgeCount?: number
}

export function Sidebar({ profile, onSignOut, campusBadgeCount = 0 }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [paywallFeature, setPaywallFeature] = useState<'campus' | 'planning' | null>(null)

  const isSubscribed = checkIsPro(profile)

  return (
    <>
    <aside
      className={cn(
        'hidden lg:flex flex-col h-screen bg-surface border-r border-border',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-border">
        <Logo size="sm" showText={!collapsed} href="/dashboard" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto no-scrollbar">
        {NAV_ITEMS.map((item) => {
          const Icon = iconMap[item.icon]
          const isActive = pathname.startsWith(item.href)
          const isLocked = !isSubscribed && (item.href === '/campus' || item.href === '/planning')

          return (
            <Link
              key={item.href}
              href={isLocked ? '#' : item.href}
              onClick={(e) => {
                if (isLocked) {
                  e.preventDefault()
                  setPaywallFeature(item.href === '/campus' ? 'campus' : 'planning')
                }
              }}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium relative group transition-all duration-200 cursor-pointer',
                isActive
                  ? 'bg-primary-50 text-primary-700 font-semibold'
                  : isLocked
                  ? 'text-text-tertiary bg-surface-secondary/40 opacity-60 hover:opacity-85 hover:bg-surface-secondary/70'
                  : 'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary'
              )}
            >
              {/* Icône avec le badge PRO */}
              <div className="relative flex-shrink-0">
                <Icon
                  className={cn(
                    'h-5 w-5',
                    isActive
                      ? 'text-primary-600'
                      : isLocked
                      ? 'text-text-tertiary'
                      : 'text-text-tertiary'
                  )}
                />
                {isLocked && (
                  <span
                    className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full bg-primary-600 text-white text-[7.5px] font-black tracking-tight shadow-xs uppercase leading-none border border-white"
                    title="Réservé aux abonnés Pro"
                  >
                    PRO
                  </span>
                )}
                {!isLocked && item.href === '/campus' && campusBadgeCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-danger-500 text-white text-[9px] font-black flex items-center justify-center shadow-xs border border-white leading-none"
                    title={`${campusBadgeCount} notification${campusBadgeCount > 1 ? 's' : ''} sur le Campus`}
                  >
                    {campusBadgeCount > 9 ? '9+' : campusBadgeCount}
                  </span>
                )}
              </div>

              {!collapsed && (
                <span
                  className={cn(
                    'truncate flex-1',
                    isLocked && 'text-text-tertiary'
                  )}
                >
                  {item.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-3 space-y-1">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
            'transition-all duration-200',
            pathname === '/settings'
              ? 'bg-primary-50 text-primary-700'
              : 'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary'
          )}
        >
          <Settings className="h-5 w-5 flex-shrink-0 text-text-tertiary" />
          {!collapsed && <span>Paramètres</span>}
        </Link>

        {/* User info */}
        <div
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg',
            collapsed ? 'justify-center' : ''
          )}
        >
          <Avatar
            src={profile?.avatar_url}
            name={profile?.full_name || profile?.email || ''}
            size="sm"
          />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {profile?.full_name || 'Utilisateur'}
              </p>
              <p className="text-xs text-text-tertiary truncate">
                {profile?.email}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={onSignOut}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full',
            'text-text-secondary hover:bg-danger-50 hover:text-danger-600',
            'transition-all duration-200 cursor-pointer'
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden xl:flex items-center justify-center h-10 border-t border-border text-text-tertiary hover:text-text-primary hover:bg-surface-tertiary transition-colors cursor-pointer"
      >
        <ChevronLeft
          className={cn(
            'h-4 w-4 transition-transform duration-300',
            collapsed && 'rotate-180'
          )}
        />
      </button>
    </aside>

    <PaywallModal
      isOpen={paywallFeature !== null}
      onClose={() => setPaywallFeature(null)}
      featureLocked={paywallFeature === 'planning' ? 'planning' : 'campus'}
    />
    </>
  )
}
