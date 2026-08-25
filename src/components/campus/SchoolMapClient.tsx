'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import Link from 'next/link'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Sparkles,
  CheckCircle2,
  GraduationCap,
  MessageSquare,
  School as SchoolIcon,
  User,
  LocateFixed,
  Navigation,
  ChevronRight,
} from 'lucide-react'
import type { School } from '@/types/campus'
import type { Profile } from '@/types/database'

// 1. Icône discrète et élégante pour les Lycées (Open Data)
function createSchoolIcon(isSelected: boolean = false, isUserSchool: boolean = false) {
  const size = isSelected ? 26 : isUserSchool ? 20 : 12
  const border = isSelected
    ? '2.5px solid #f59e0b'
    : isUserSchool
    ? '2px solid #10b981'
    : '1.5px solid #ffffff'

  const gradient = isSelected
    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
    : isUserSchool
    ? 'linear-gradient(135deg, #10b981, #059669)'
    : 'linear-gradient(135deg, #3b82f6, #2563eb)'

  const shadow = isSelected
    ? '0 0 16px rgba(245, 158, 11, 0.85)'
    : isUserSchool
    ? '0 0 12px rgba(16, 185, 129, 0.65)'
    : '0 2px 6px rgba(37, 99, 235, 0.45)'

  return L.divIcon({
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        ${
          isSelected
            ? '<div style="position: absolute; width: 42px; height: 42px; border-radius: 50%; background: rgba(245, 158, 11, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>'
            : ''
        }
        <div style="background: ${gradient}; width: ${size}px; height: ${size}px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; box-shadow: ${shadow}; border: ${border}; transform: ${
      isSelected ? 'scale(1.15)' : 'scale(1)'
    }; transition: all 0.25s ease;">
          ${
            isSelected
              ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`
              : isUserSchool
              ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`
              : ''
          }
        </div>
      </div>
    `,
    className: 'custom-leaflet-school-pin',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
  })
}

// Badge "chapeau d'étudiant" (mortarboard) : affiché sur un marqueur dès que
// l'élève anime ou a rejoint une session de révision en groupe active.
function studyingCapBadge(size: number, top: string, left: string) {
  return `<div style="position: absolute; top: ${top}; left: ${left}; width: ${size}px; height: ${size}px; background: #1f2937; border-radius: 50%; border: 1.5px solid white; display: flex; align-items: center; justify-content: center; font-size: ${Math.round(size * 0.62)}px; box-shadow: 0 2px 6px rgba(0,0,0,0.4); line-height: 1;" title="En session de révision 🎓">🎓</div>`
}

// 2. Icône pour les camarades / lycéens membres normaux (36px)
function createStudentIcon(name?: string | null, avatarUrl?: string | null, isVerified: boolean = false, isStudying: boolean = false) {
  const safeName = name && typeof name === 'string' ? name.trim() : ''
  const initials = safeName
    ? safeName
        .split(/\s+/)
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || '👤'
    : '👤'

  const contentHtml = avatarUrl
    ? `<img src="${avatarUrl}" alt="${safeName || 'Lycéen'}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" /><div style="display: none; width: 100%; height: 100%; border-radius: 50%; background: linear-gradient(135deg, #8b5cf6, #ec4899); align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 900;">${initials}</div>`
    : `<div style="width: 100%; height: 100%; border-radius: 50%; background: linear-gradient(135deg, #8b5cf6, #ec4899); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 900;">${initials}</div>`

  const verifiedBadge = isVerified
    ? `<div style="position: absolute; top: -3px; right: -3px; width: 16px; height: 16px; background: linear-gradient(135deg, #0284c7, #2563eb); border-radius: 50%; border: 1.5px solid white; display: flex; align-items: center; justify-content: center; color: white; font-size: 8.5px; box-shadow: 0 2px 6px rgba(0,0,0,0.35);" title="Lycéen Certifié 🛡️">🛡️</div>`
    : `<div style="position: absolute; bottom: -1px; right: -1px; width: 10px; height: 10px; background: #22c55e; border-radius: 50%; border: 1.5px solid white;"></div>`

  return L.divIcon({
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="width: 36px; height: 36px; border-radius: 50%; box-shadow: 0 4px 14px rgba(139, 92, 246, 0.45); border: 2.5px solid white; overflow: hidden; background: #8b5cf6;">
          ${contentHtml}
        </div>
        ${verifiedBadge}
        ${isStudying ? studyingCapBadge(15, '-3px', '-3px') : ''}
      </div>
    `,
    className: 'custom-leaflet-student-pin',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  })
}

// 3. Icône SPÉCIALE UTILISATEUR CONNECTÉ (Significativement plus grande, 56px, avec photo de profil et halo radar vibrant)
function createCurrentUserAvatarIcon(avatarUrl?: string | null, name?: string | null, isVerified: boolean = false, isStudying: boolean = false) {
  const safeName = name && typeof name === 'string' ? name.trim() : ''
  const initials = safeName
    ? safeName
        .split(/\s+/)
        .filter(Boolean)
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'MOI'
    : 'MOI'

  const contentHtml = avatarUrl
    ? `<img src="${avatarUrl}" alt="Mon profil" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: block;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" /><div style="display: none; width: 100%; height: 100%; border-radius: 50%; background: linear-gradient(135deg, #10b981, #059669); align-items: center; justify-content: center; color: white; font-size: 15px; font-weight: 900;">${initials}</div>`
    : `<div style="width: 100%; height: 100%; border-radius: 50%; background: linear-gradient(135deg, #10b981, #059669); display: flex; align-items: center; justify-content: center; color: white; font-size: 15px; font-weight: 900; letter-spacing: -0.5px;">${initials}</div>`

  const verifiedBadge = isVerified
    ? `<div style="position: absolute; top: -4px; right: -4px; width: 22px; height: 22px; background: linear-gradient(135deg, #0284c7, #2563eb); border-radius: 50%; border: 2.5px solid white; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; box-shadow: 0 3px 10px rgba(2, 132, 199, 0.6); z-index: 10;" title="Lycéen Certifié 🛡️">🛡️</div>`
    : ''

  return L.divIcon({
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 1000;">
        <!-- Pulsing radar halo effect (Vert émeraude vibrant) -->
        <div style="position: absolute; width: 84px; height: 84px; background: rgba(16, 185, 129, 0.45); border-radius: 50%; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; width: 70px; height: 70px; background: rgba(16, 185, 129, 0.28); border-radius: 50%;"></div>

        <!-- Avatar Container (56px : très grand et immédiatement visible même dézoomé) -->
        <div style="position: relative; width: 56px; height: 56px; border-radius: 50%; border: 3.5px solid #ffffff; box-shadow: 0 0 24px rgba(16, 185, 129, 0.95), 0 6px 20px rgba(0, 0, 0, 0.4); overflow: hidden; background: #10b981; transform: scale(1.08);">
          ${contentHtml}
        </div>

        ${verifiedBadge}
        ${isStudying ? studyingCapBadge(24, '-2px', '-2px') : ''}

        <!-- Badge "Moi 📍" -->
        <div style="position: absolute; bottom: -8px; background: #059669; color: #ffffff; font-size: 10px; font-weight: 900; padding: 1.5px 7px; border-radius: 9999px; border: 2px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.3); white-space: nowrap; text-transform: uppercase; letter-spacing: 0.5px;">
          Moi 📍
        </div>
      </div>
    `,
    className: 'custom-leaflet-current-user-avatar',
    iconSize: [84, 84],
    iconAnchor: [42, 42],
    popupAnchor: [0, -44],
  })
}

// Composant individuel pour chaque marqueur de Lycée avec gestion d'ouverture et fermeture STRICTE de Popup
function SchoolMarkerItem({
  school,
  isSelected,
  isUserSchool,
  onSelectSchool,
  onSetUserSchool,
}: {
  school: School
  isSelected: boolean
  isUserSchool: boolean
  onSelectSchool?: (school: School) => void
  onSetUserSchool?: (school: School) => void
}) {
  const markerRef = useRef<L.Marker>(null)

  useEffect(() => {
    if (!markerRef.current) return
    if (isSelected) {
      markerRef.current.openPopup()
    } else {
      markerRef.current.closePopup()
    }
  }, [isSelected])

  return (
    <Marker
      ref={markerRef}
      position={[Number(school.latitude), Number(school.longitude)]}
      icon={createSchoolIcon(isSelected, isUserSchool)}
      eventHandlers={{
        click: () => {
          onSelectSchool?.(school)
        },
      }}
    >
      <Popup
        className="school-custom-popup"
        minWidth={280}
        maxWidth={320}
        autoClose={true}
        closeOnClick={false}
      >
        <div className="p-3 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center flex-shrink-0">
              <SchoolIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-xs sm:text-sm text-text-primary leading-snug">
                {school.name}
              </h3>
              <p className="text-[11px] text-text-secondary mt-0.5">
                {school.city} • {school.postal_code}
              </p>
            </div>
          </div>

          <div
            className={`p-2 rounded-xl flex items-center justify-between border ${
              isUserSchool
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-primary-50/60 text-primary-900 border-primary-100'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-primary-600" />
              <span>Salon d’entraide actif</span>
            </div>
            {isUserSchool ? (
              <span className="text-[9px] font-black text-emerald-700 bg-white/90 px-1.5 py-0.5 rounded-md border border-emerald-200">
                🎓 Ton Lycée
              </span>
            ) : (
              <span className="text-[9px] font-bold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded-md border border-primary-200">
                {school.academy || 'Lycée'}
              </span>
            )}
          </div>

          {/* Bouton unique : "Rejoindre ce lycée et rendre mon profil public" */}
          {!isUserSchool && onSetUserSchool ? (
            <button
              type="button"
              onClick={() => onSetUserSchool(school)}
              className="w-full h-8.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[11px] font-black transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Rejoindre ce lycée et rendre mon profil public</span>
            </button>
          ) : isUserSchool ? (
            <div className="w-full h-7 rounded-xl bg-emerald-100 text-emerald-800 text-[10.5px] font-bold flex items-center justify-center gap-1.5 border border-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Profil public actif sur ce lycée</span>
            </div>
          ) : null}
        </div>
      </Popup>
    </Marker>
  )
}


// 4. Bouton flottant pour recentrer sur la position de l'utilisateur ("Recentrer sur moi")
function RecenterButton({
  userLocation,
  onLocationFound,
}: {
  userLocation?: { latitude: number; longitude: number } | null
  onLocationFound?: (loc: { latitude: number; longitude: number }) => void
}) {
  const map = useMap()
  const [isLocating, setIsLocating] = useState(false)

  const handleRecenter = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (typeof window !== 'undefined' && navigator.geolocation) {
      setIsLocating(true)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false)
          const newLoc = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }
          onLocationFound?.(newLoc)
          map.flyTo([newLoc.latitude, newLoc.longitude], 14, {
            duration: 1.2,
            easeLinearity: 0.25,
          })
        },
        (err) => {
          setIsLocating(false)
          console.warn('Geolocation error:', err.message)
          if (userLocation) {
            map.flyTo([userLocation.latitude, userLocation.longitude], 13, {
              duration: 1.2,
              easeLinearity: 0.25,
            })
          }
        },
        { enableHighAccuracy: true, timeout: 9000, maximumAge: 0 }
      )
    } else if (userLocation) {
      map.flyTo([userLocation.latitude, userLocation.longitude], 13, {
        duration: 1.2,
        easeLinearity: 0.25,
      })
    }
  }

  return (
    <div className="leaflet-top leaflet-right" style={{ pointerEvents: 'auto', zIndex: 1000 }}>
      <div className="leaflet-control m-2 sm:m-3">
        <button
          type="button"
          onClick={handleRecenter}
          className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-surface/95 hover:bg-surface text-text-primary border border-border shadow-md hover:shadow-lg backdrop-blur-md font-extrabold text-xs flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 text-primary-700 hover:border-primary-400 group"
          title="Recentrer la carte sur ma position GPS"
        >
          <LocateFixed
            className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-600 group-hover:text-primary-700 ${
              isLocating ? 'animate-spin' : ''
            }`}
          />
          <span className="text-[10px] sm:text-[11px] font-black text-text-primary group-hover:text-primary-700">
            {isLocating ? 'Localisation...' : 'Recentrer sur moi'}
          </span>
        </button>
      </div>
    </div>
  )
}

// Composant pour synchroniser les changements de zone géographique (Bounds / Bbox)
// Défini au niveau module (pas à l'intérieur de SchoolMapClient) pour que React conserve
// la même identité de composant entre les rendus, au lieu de le démonter/remonter à chaque fois.
function MapBoundsWatcher({
  onBoundsChange,
}: {
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void
}) {
  const map = useMap()

  useEffect(() => {
    if (!onBoundsChange) return

    function handleMapMove() {
      const bounds = map.getBounds()
      onBoundsChange?.({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      })
    }

    handleMapMove()
    map.on('moveend', handleMapMove)
    map.on('zoomend', handleMapMove)

    return () => {
      map.off('moveend', handleMapMove)
      map.off('zoomend', handleMapMove)
    }
  }, [map, onBoundsChange])

  return null
}

// Contrôleur de centrage fluide (FlyTo) : déclenché UNIQUEMENT lors d'une action explicite (sélection de recherche ou clic cible)
function FlyToController({
  target,
}: {
  target?: { latitude: number; longitude: number; zoom?: number } | null
}) {
  const map = useMap()
  const lastTargetRef = useRef<{ latitude: number; longitude: number; zoom?: number } | null>(null)

  useEffect(() => {
    if (target) {
      const isDifferent =
        !lastTargetRef.current ||
        lastTargetRef.current.latitude !== target.latitude ||
        lastTargetRef.current.longitude !== target.longitude ||
        lastTargetRef.current.zoom !== target.zoom

      if (isDifferent) {
        lastTargetRef.current = target
        map.flyTo([target.latitude, target.longitude], target.zoom || 14, {
          duration: 1.4,
          easeLinearity: 0.25,
        })
      }
    }
  }, [target, map])

  return null
}

interface SchoolMapClientProps {
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
  defaultCenter?: [number, number]
  defaultZoom?: number
  isCurrentUserVerified?: boolean
  isCurrentUserStudying?: boolean
  height?: string
  className?: string
  isLocked?: boolean
  onSelectSchool?: (school: School) => void
  onSetUserSchool?: (school: School) => void
  onContactStudent?: (user: Partial<Profile>) => void
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void
  onLocationFound?: (loc: { latitude: number; longitude: number }) => void
}

export default function SchoolMapClient({
  schools,
  users = [],
  currentUserId,
  currentUserAvatarUrl,
  currentUserName,
  userLocation,
  userSchoolId,
  userSchoolName,
  selectedSchoolId,
  flyToTarget,
  defaultCenter: propDefaultCenter,
  defaultZoom: propDefaultZoom,
  isCurrentUserVerified = false,
  isCurrentUserStudying = false,
  height,
  className,
  isLocked = false,
  onSelectSchool,
  onSetUserSchool,
  onContactStudent,
  onBoundsChange,
  onLocationFound,
}: SchoolMapClientProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Hauteur responsive : 30-35% max de l'écran sur mobile pour laisser la place aux infos
  const containerHeight = height || 'h-[32vh] min-h-[220px] max-h-[300px] sm:h-[400px] lg:h-[520px]'

  // Déduplication stricte des lycées par ID et coordonnées/nom
  // IMPORTANT : ce hook doit rester appelé avant tout `return` conditionnel (Rules of Hooks),
  // sinon React voit un nombre de hooks différent entre le rendu "chargement" et le rendu réel
  // (erreur React #310 : "Rendered more hooks than during the previous render").
  const uniqueSchools = useMemo(() => {
    const list: School[] = []
    const seenKeys = new Set<string>()

    schools.forEach((s: School) => {
      if (!s.latitude || !s.longitude || !s.name) return
      const normName = s.name.toLowerCase().trim().replace(/^(lycee|lycée)\s+/i, '')
      const coordKey = `${normName}_${Number(s.latitude).toFixed(3)}_${Number(s.longitude).toFixed(3)}`
      if (!seenKeys.has(s.id) && !seenKeys.has(coordKey)) {
        seenKeys.add(s.id)
        seenKeys.add(coordKey)
        list.push(s)
      }
    })

    return list
  }, [schools])

  if (!mounted) {
    return (
      <div className={`${containerHeight} w-full rounded-3xl bg-surface-secondary flex flex-col items-center justify-center border border-border gap-2 text-text-tertiary animate-pulse`}>
        <div className="h-8 w-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
        <span className="text-xs font-semibold">Chargement de la carte interactive...</span>
      </div>
    )
  }

  // Coordonnées de centrage par défaut : Position utilisateur ou Sud de la France (Occitanie/PACA ~43.61, 3.88)
  const defaultCenter: [number, number] =
    propDefaultCenter ||
    (userLocation ? [userLocation.latitude, userLocation.longitude] : [43.610769, 3.876716])
  const defaultZoom: number = propDefaultZoom ?? (userLocation ? 10.0 : 7.0)

  // Déterminer la position active de l'utilisateur connecté avec fallback garanti (Sud de la France / Lycée)
  const safeUserLoc =
    userLocation && !isNaN(Number(userLocation.latitude)) && !isNaN(Number(userLocation.longitude))
      ? { latitude: Number(userLocation.latitude), longitude: Number(userLocation.longitude) }
      : null

  const effectiveUserLocation =
    safeUserLoc ||
    (() => {
      const match = currentUserId ? users.find((u) => u.id === currentUserId) : null
      if (match?.latitude && match?.longitude && !isNaN(Number(match.latitude)) && !isNaN(Number(match.longitude))) {
        return { latitude: Number(match.latitude), longitude: Number(match.longitude) }
      }
      return { latitude: 43.610769, longitude: 3.876716 }
    })()

  return (
    <div className={`relative ${containerHeight} w-full rounded-2xl sm:rounded-3xl overflow-hidden border border-border shadow-lg ${className || ''}`}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsWatcher onBoundsChange={onBoundsChange} />
        <FlyToController target={flyToTarget || null} />
        <RecenterButton userLocation={effectiveUserLocation} onLocationFound={onLocationFound} />

        {/* 1. MARQUEUR PROÉMINENT DE L'UTILISATEUR CONNECTÉ (Photo de profil + Halo radar) */}
        {effectiveUserLocation && (
          <Marker
            position={[effectiveUserLocation.latitude, effectiveUserLocation.longitude]}
            icon={createCurrentUserAvatarIcon(currentUserAvatarUrl, currentUserName, isCurrentUserVerified, isCurrentUserStudying)}
            zIndexOffset={1000}
          >
            <Popup className="user-custom-popup" minWidth={220}>
              <div className="p-2 text-center space-y-1">
                <div className="inline-flex items-center gap-1 text-xs font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span>📍 Ta position active (MOI)</span>
                </div>
                {isCurrentUserVerified && (
                  <div className="inline-flex items-center gap-1 text-[10px] font-black text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    <span>🛡️ Lycéen Certifié</span>
                  </div>
                )}
                <p className="text-xs font-bold text-text-primary">
                  {currentUserName || 'Moi'}
                </p>
                <p className="text-[10px] text-text-tertiary">
                  Visible par les élèves de ton secteur
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 2. Marqueurs des Lycées (Chargés dynamiquement par zone géographique - DÉDUPLIQUÉS) */}
        {uniqueSchools.map((school: School) => {
          const isSelected = selectedSchoolId === school.id
          const isUserSchool = Boolean(
            (userSchoolId && userSchoolId === school.id) ||
              (userSchoolName &&
                userSchoolName.toLowerCase().trim() === school.name.toLowerCase().trim())
          )

          if (!school.latitude || !school.longitude || isNaN(Number(school.latitude)) || isNaN(Number(school.longitude))) return null

          return (
            <SchoolMarkerItem
              key={`school-${school.id}`}
              school={school}
              isSelected={isSelected}
              isUserSchool={isUserSchool}
              onSelectSchool={onSelectSchool}
              onSetUserSchool={onSetUserSchool}
            />
          )
        })}


        {/* 3. Marqueurs des Lycéens visibles (Campus Social) */}
        {users.map((student) => {
          if (!student || student.latitude === null || student.latitude === undefined || student.longitude === null || student.longitude === undefined) return null
          const lat = Number(student.latitude)
          const lng = Number(student.longitude)
          if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return null
          const isMe = student.id === currentUserId

          // Si c'est l'utilisateur connecté, le marqueur proéminent est déjà affiché ci-dessus
          if (isMe) return null

          const isStudentVerified = Boolean(student.is_verified)

          return (
            <Marker
              key={`student-${student.id}`}
              position={[lat, lng]}
              icon={createStudentIcon(student.full_name || 'Lycéen', student.avatar_url, isStudentVerified, Boolean(student.is_studying))}
              zIndexOffset={100}
            >
              <Popup className="student-custom-popup" minWidth={250} maxWidth={300}>
                <div className="p-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center text-xs font-black flex-shrink-0 overflow-hidden">
                      {student.avatar_url ? (
                        <img src={student.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        (student.full_name || 'L')[0].toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <h4 className="font-extrabold text-xs text-text-primary truncate">
                          {student.full_name || 'Lycéen OptiNote'}
                        </h4>
                        {isMe && (
                          <span className="text-[8px] bg-emerald-100 text-emerald-800 font-bold px-1 py-0.2 rounded">
                            Moi
                          </span>
                        )}
                        {isStudentVerified && (
                          <span className="text-[8px] bg-blue-100 text-blue-800 font-extrabold px-1.5 py-0.2 rounded-full border border-blue-200 flex items-center gap-0.5">
                            🛡️ Certifié
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-text-secondary truncate">
                        {student.school_name || 'Lycée'} •{' '}
                        {student.class_level ? student.class_level.toUpperCase() : 'Lycée'}
                      </p>
                    </div>
                  </div>

                  {/* Bio / Message de statut */}
                  {student.bio && (
                    <div className="p-2 rounded-xl bg-surface-secondary border border-border text-[10.5px] text-text-secondary leading-relaxed">
                      💬 &quot;{student.bio}&quot;
                    </div>
                  )}

                  {/* Spécialités de l'élève */}
                  {student.specialties && student.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {student.specialties.slice(0, 3).map((spec, i) => (
                        <span
                          key={i}
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bouton d'interaction */}
                  {!isMe && (
                    <button
                      type="button"
                      onClick={() => onContactStudent?.(student)}
                      className="w-full h-7 rounded-lg bg-gradient-to-r from-primary-600 to-purple-600 text-white text-[11px] font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-95"
                    >
                      <MessageSquare className="h-3 w-3" />
                      <span>Échanger sur le Campus</span>
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>


      {/* Overlay Pro semi-transparent lorsque non abonné */}
      {isLocked && (
        <div className="absolute inset-0 z-40 bg-slate-900/60 backdrop-blur-[2px] rounded-3xl flex flex-col items-center justify-center p-4 text-center select-none">
          <div className="bg-white px-4 py-3.5 rounded-2xl border border-border shadow-2xl max-w-xs space-y-2 animate-fade-in">
            <div className="flex items-center justify-center gap-1.5 text-xs font-black text-slate-900">
              <span className="text-sm">🔒</span>
              <span>Carte Interactive des Lycées</span>
            </div>
            <p className="text-[10px] text-slate-600 leading-snug">
              Explore les lycées de France, découvre les camarades connectés et échange dans les salons d&apos;entraide.
            </p>
            <Link href="/pricing" className="block pt-1">
              <span className="inline-flex items-center gap-1 text-xs font-black px-4 py-1.5 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-sm hover:opacity-95 transition-opacity">
                <span>Passer Pro (dès 4,99 €)</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
