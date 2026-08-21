'use client'

import dynamic from 'next/dynamic'
import type { School } from '@/types/campus'
import type { Profile } from '@/types/database'

const DynamicSchoolMap = dynamic(() => import('./SchoolMapClient'), {
  ssr: false,
  loading: () => (
    <div className="h-full min-h-[320px] w-full rounded-3xl bg-surface-secondary flex flex-col items-center justify-center border border-border gap-2 text-text-tertiary">
      <div className="h-8 w-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
      <span className="text-xs font-semibold">Chargement de la carte interactive...</span>
    </div>
  ),
})

export interface SchoolMapProps {
  schools: School[]
  users?: Partial<Profile>[]
  currentUserId?: string | null
  currentUserAvatarUrl?: string | null
  currentUserName?: string | null
  userLocation?: { latitude: number; longitude: number } | null
  userSchoolId?: string | null
  userSchoolName?: string | null
  selectedSchoolId?: string | null
  flyToTarget?: { latitude: number; longitude: number; zoom?: number } | null
  isCurrentUserVerified?: boolean
  defaultCenter?: [number, number]
  defaultZoom?: number
  height?: string
  className?: string
  isLocked?: boolean
  onSelectSchool?: (school: School) => void
  onSetUserSchool?: (school: School) => void
  onContactStudent?: (user: Partial<Profile>) => void
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void
}

export function SchoolMap(props: SchoolMapProps) {
  return <DynamicSchoolMap {...props} />
}
