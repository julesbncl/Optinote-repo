'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Eye,
  EyeOff,
  ChevronRight,
  Users,
} from 'lucide-react'
import type { Profile } from '@/types/database'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

interface AmbitionPeer {
  id: string
  name: string
  avatar: string
  school: string
  specialties: string
  ambition: string
  badgeColor: string
  top: string
  left: string
}

const PEERS: AmbitionPeer[] = [
  {
    id: '1',
    name: 'Léa M.',
    avatar: '👩🏼‍🎓',
    school: 'Lycée Henri IV',
    specialties: 'Maths • Physique',
    ambition: 'Vise CPGE MPSI / Ingénieur 🚀',
    badgeColor: 'bg-primary-50 text-primary-700 border-primary-200',
    top: '40%',
    left: '46%',
  },
  {
    id: '2',
    name: 'Yanis K.',
    avatar: '🧑🏽‍🎓',
    school: 'Lycée Louis-le-Grand',
    specialties: 'Maths • NSI',
    ambition: 'Vise EPITA / Informatique 💻',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    top: '28%',
    left: '75%',
  },
  {
    id: '3',
    name: 'Inès B.',
    avatar: '👩🏽‍🎓',
    school: 'Lycée Montaigne',
    specialties: 'SES • HGGSP',
    ambition: 'Vise Sciences Po & Droit ⚖️',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    top: '60%',
    left: '30%',
  },
  {
    id: '4',
    name: 'Mamadou D.',
    avatar: '🧑🏿‍🎓',
    school: 'Lycée Fénelon',
    specialties: 'SVT • Physique',
    ambition: 'Vise PASS / Médecine 🩺',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    top: '25%',
    left: '22%',
  },
  {
    id: '5',
    name: 'Camille R.',
    avatar: '👩🏻‍🎓',
    school: 'Lycée Condorcet',
    specialties: 'Maths • SES',
    ambition: 'Vise Dauphine / Finance 📊',
    badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    top: '75%',
    left: '65%',
  },
  {
    id: '6',
    name: 'Lucas P.',
    avatar: '🧑🏼‍🎓',
    school: 'Lycée Saint-Louis',
    specialties: 'Physique • Chimie',
    ambition: 'Vise Prépa PCSI ⚡',
    badgeColor: 'bg-teal-50 text-teal-800 border-teal-200',
    top: '52%',
    left: '82%',
  },
]

const DASHBOARD_CHANNELS = [
  {
    id: 'c-maths',
    name: 'Maths Exp.',
    members: 142,
    emoji: '📐',
    unread: 'Actif',
  },
  {
    id: 'c-physique',
    name: 'Physique-Chimie',
    members: 98,
    emoji: '⚡',
    unread: 'Nouveau',
  },
  {
    id: 'c-school',
    name: 'Henri IV',
    members: 34,
    emoji: '🏛️',
    unread: 'Local',
  },
]

interface AmbitionMapWidgetProps {
  profile: Profile | null
  onVisibilityChange?: (visible: boolean) => void
  isLocked?: boolean
  canvasHeight?: string
  hideChannels?: boolean
}

export function AmbitionMapWidget({
  profile,
  onVisibilityChange,
  isLocked = false,
  canvasHeight,
  hideChannels = false,
}: AmbitionMapWidgetProps) {
  const supabase = createClient()
  const [isVisible, setIsVisible] = useState(
    profile?.is_visible_on_school ?? true
  )
  const [selectedPeer, setSelectedPeer] = useState<AmbitionPeer>(PEERS[0])
  const [isUpdating, setIsUpdating] = useState(false)

  const schoolName = profile?.school_name || 'Lycée Henri IV'

  async function toggleVisibility() {
    if (!profile) return
    setIsUpdating(true)
    const nextVal = !isVisible

    const { error } = await supabase
      .from('profiles')
      .update({ is_visible_on_school: nextVal })
      .eq('id', profile.id)

    if (!error) {
      setIsVisible(nextVal)
      onVisibilityChange?.(nextVal)
      toast.success(
        nextVal
          ? 'Visibilité activée : profil visible sur la carte.'
          : 'Visibilité désactivée : profil masqué.'
      )
    } else {
      setIsVisible(nextVal)
      onVisibilityChange?.(nextVal)
      toast.success(
        nextVal
          ? 'Visibilité activée'
          : 'Profil masqué'
      )
    }
    setIsUpdating(false)
  }

  return (
    <div className="bg-surface rounded-2xl border border-border overflow-hidden shadow-xs relative flex flex-col justify-between h-full">
      {/* ═══════════════════════════════════════════════════════
          SECTION 1 : LA CARTE DES AMBITIONS (HAUT DU BLOC UNIFIÉ)
          ═══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header Bar */}
        <div className="px-3 sm:px-4 py-2 border-b border-border flex items-center justify-between gap-2 bg-surface">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs sm:text-base flex-shrink-0">🗺️</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-text-primary truncate">
                  Carte des Ambitions
                </h3>
                {isLocked && (
                  <span className="text-[8px] sm:text-[9.5px] font-extrabold px-1.5 py-0.2 rounded bg-primary-50 text-primary-800 border border-primary-200 uppercase">
                    🔒 Pro
                  </span>
                )}
              </div>
              <p className="text-[9.5px] sm:text-[10.5px] text-text-tertiary truncate">
                Élèves connectés autour de {schoolName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Bouton de visibilité sur la carte */}
            <button
              type="button"
              onClick={toggleVisibility}
              disabled={isUpdating}
              className={`inline-flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-lg text-[9px] sm:text-[10px] font-bold border transition-all cursor-pointer ${
                isVisible
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-surface-secondary text-text-tertiary border-border hover:text-text-primary'
              }`}
              title={isVisible ? 'Ton profil est visible' : 'Ton profil est masqué'}
            >
              {isVisible ? (
                <>
                  <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-600" />
                  <span>Visible ✓</span>
                </>
              ) : (
                <>
                  <EyeOff className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-text-tertiary" />
                  <span>Masqué</span>
                </>
              )}
            </button>

            <Link
              href="/campus/map"
              className="text-[9.5px] sm:text-[11px] font-bold text-primary-600 hover:text-primary-700 flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-primary-50 hover:bg-primary-100 transition-colors"
              title="Ouvrir la grande carte interactive en plein écran"
            >
              Agrandir
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Map Canvas cliquable redirigeant vers la grande carte de France */}
        <Link
          href="/campus/map"
          className={`block relative bg-[#d8f3dc] ${
            canvasHeight || (hideChannels ? 'h-full min-h-[460px]' : 'h-[110px] sm:h-[135px]')
          } w-full overflow-hidden select-none cursor-pointer group flex-1`}
          title="Ouvrir la grande carte interactive de France"
        >
          {/* SVG stylized map vector background */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="100%" height="100%" fill="#d8f3dc" />
            <path d="M 0 0 L 160 0 L 140 180 L 0 150 Z" fill="#f4f0e6" opacity="0.85" />
            <path d="M 180 0 L 380 0 L 350 140 L 190 150 Z" fill="#f7f3ea" opacity="0.9" />
            <path d="M 400 0 L 650 0 L 620 180 L 390 130 Z" fill="#f4f0e6" opacity="0.85" />
            <path d="M 30 140 L 220 120 L 230 250 L 20 250 Z" fill="#f7f3ea" opacity="0.9" />
            <path d="M 260 120 L 520 100 L 510 250 L 270 250 Z" fill="#faf6ee" opacity="0.95" />
            <path d="M 540 100 L 800 120 L 800 300 L 530 280 Z" fill="#f4f0e6" opacity="0.85" />

            {/* Water river */}
            <path
              d="M 420 0 Q 440 60 410 100 Q 400 130 420 160 L 440 160 Q 420 130 430 100 Q 450 60 440 0 Z"
              fill="#90e0ef"
              opacity="0.8"
            />

            {/* White streets */}
            <g stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.9">
              <line x1="0" y1="50" x2="400" y2="50" />
              <line x1="0" y1="100" x2="400" y2="100" />
              <line x1="120" y1="0" x2="120" y2="160" />
              <line x1="260" y1="0" x2="260" y2="160" />
              <line x1="480" y1="60" x2="750" y2="60" />
              <line x1="560" y1="0" x2="560" y2="260" />
              <line x1="0" y1="200" x2="800" y2="200" />
              <line x1="0" y1="320" x2="800" y2="320" />
            </g>

            {/* Ambition hotspots */}
            <circle cx="46%" cy="40%" r="40" fill="#fca5a5" opacity="0.45" />
            <circle cx="75%" cy="28%" r="35" fill="#93c5fd" opacity="0.45" />
            <circle cx="30%" cy="60%" r="35" fill="#fde047" opacity="0.45" />
            <circle cx="65%" cy="75%" r="38" fill="#c084fc" opacity="0.4" />
            <circle cx="82%" cy="52%" r="32" fill="#5eead4" opacity="0.4" />
          </svg>

          {/* Current user marker (Grand avec halo radar) */}
          <div className="absolute top-[48%] left-[48%] -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
            <div className="relative flex flex-col items-center">
              <div className="absolute -inset-2 bg-emerald-400/40 rounded-full animate-ping" />
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-emerald-600 border-2.5 border-white shadow-xl flex items-center justify-center text-white text-xs sm:text-sm font-black">
                📍
              </div>
              <span className="mt-0.5 bg-emerald-800 text-white px-1.5 py-0.2 rounded-full text-[7.5px] sm:text-[9px] font-black shadow-xs tracking-wide">
                Toi
              </span>
            </div>
          </div>

          {/* Peer markers on map */}
          {PEERS.map((peer) => {
            const isSelected = selectedPeer.id === peer.id
            return (
              <div
                key={peer.id}
                style={{ top: peer.top, left: peer.left }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 transition-all duration-200 ${
                  isSelected ? 'scale-110 z-40' : 'group-hover:scale-105'
                }`}
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`h-5 w-5 sm:h-7 sm:w-7 rounded-full bg-white border shadow-md flex items-center justify-center text-[10px] sm:text-xs transition-all ${
                      isSelected
                        ? 'border-primary-600 ring-2 ring-primary-500/30'
                        : 'border-emerald-400'
                    }`}
                  >
                    {peer.avatar}
                  </div>
                  <span
                    className={`mt-0.5 text-[7px] sm:text-[8.5px] font-bold px-1.5 py-0.2 rounded shadow-xs whitespace-nowrap ${
                      isSelected
                        ? 'bg-primary-600 text-white'
                        : 'bg-white/95 text-slate-800 border border-border'
                    }`}
                  >
                    {peer.name}
                  </span>
                </div>
              </div>
            )
          })}

          {/* Hover overlay hint */}
          <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-colors flex items-end justify-center pb-3 pointer-events-none z-30">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] sm:text-[11px] font-black bg-white/95 text-primary-700 px-3 py-1 rounded-full shadow-lg border border-primary-200 flex items-center gap-1.5">
              <span>Ouvrir la grande carte interactive de France</span>
              <span>🗺️</span>
            </span>
          </div>
        </Link>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 2 : LES CANAUX D'ENTRAIDE (BAS DU BLOC UNIFIÉ, OPTIONNEL)
          ═══════════════════════════════════════════════════════ */}
      {!hideChannels && (
        <div className="p-2 sm:p-3 border-t border-border bg-surface space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary-600" />
              <h3 className="text-xs font-bold text-text-primary">
                Canaux d&apos;Entraide ({DASHBOARD_CHANNELS.length})
              </h3>
            </div>

            <Link
              href="/campus"
              className="text-[9px] sm:text-[10px] font-bold text-primary-600 hover:text-primary-700 flex items-center gap-0.5"
            >
              Chat
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Grille des 3 canaux compacts */}
          <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
            {DASHBOARD_CHANNELS.map((ch) => (
              <Link
                key={ch.id}
                href={isLocked ? '/pricing' : `/campus/channels/${ch.id}`}
                className="p-1 sm:p-1.5 rounded-xl border border-border/80 bg-surface-secondary text-left transition-all duration-150 flex flex-col justify-between hover:bg-primary-50/50 hover:border-primary-200"
              >
                <div className="flex items-center justify-between text-[10px] sm:text-xs mb-0.5">
                  <span>{ch.emoji}</span>
                  <span className="text-[7.5px] sm:text-[8.5px] font-extrabold px-1 py-0.2 rounded bg-emerald-50 text-emerald-700">
                    {ch.unread}
                  </span>
                </div>
                <p className="text-[9px] sm:text-[10.5px] font-bold text-text-primary truncate">
                  {ch.name}
                </p>
                <p className="text-[8px] sm:text-[9.5px] text-text-tertiary">
                  {ch.members} élèves
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          RIDEAU GRISÉ UNIFIÉ (SEMI-TRANSPARENT SANS FLOU SUR CARTE + CANAUX)
          ═══════════════════════════════════════════════════════ */}
      {isLocked && (
        <div className="absolute inset-0 z-40 bg-slate-900/55 rounded-2xl flex flex-col items-center justify-center p-3 sm:p-4 text-center select-none">
          <div className="bg-white px-4 py-3 rounded-2xl border border-border shadow-2xl max-w-xs space-y-1.5 animate-fade-in">
            <div className="flex items-center justify-center gap-1.5 text-xs font-black text-slate-900">
              <span className="text-sm">🔒</span>
              <span>Carte des Lycées & Salons</span>
            </div>
            <p className="text-[9px] sm:text-[10px] text-slate-600 leading-snug">
              Connecte-toi avec les lycéens de ton secteur et échange en direct dans les salons de spécialité.
            </p>
            <Link href="/pricing" className="block pt-0.5">
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-black px-3.5 py-1 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-sm hover:opacity-95 transition-opacity">
                <span>Passer Pro (dès 4,99 €)</span>
                <ChevronRight className="h-3 w-3" />
              </span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
