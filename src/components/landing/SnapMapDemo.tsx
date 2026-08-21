'use client'

import { useState } from 'react'
import { ShieldCheck, Zap, Send } from 'lucide-react'

interface StudentSpot {
  id: string
  name: string
  school: string
  avatar: string
  role: string
  activity: string
  coords: { top: string; left: string }
}

const SPOTS: StudentSpot[] = [
  {
    id: 'group_central',
    name: 'Groupe Spé Maths',
    school: 'Lycée Henri IV',
    avatar: '👥',
    role: 'Léa, Yanis, Mamadou & Inès',
    activity: 'Session révision intensive • 4 élèves',
    coords: { top: '48%', left: '50%' },
  },
  {
    id: 'car_driver',
    name: 'Lucas B.',
    school: 'En route vers le CDI',
    avatar: '🚗',
    role: 'Terminale 2',
    activity: 'Arrive dans 5 min avec les annales',
    coords: { top: '22%', left: '82%' },
  },
  {
    id: 'story_top',
    name: 'Camille R.',
    school: 'Café Étudiant Saint-Michel',
    avatar: '👩🏻‍🎓',
    role: 'Spé SES & HGGSP',
    activity: 'Fiche créée : La mondialisation',
    coords: { top: '18%', left: '22%' },
  },
]

export function SnapMapDemo() {
  const [selectedSpot, setSelectedSpot] = useState<StudentSpot>(SPOTS[0])
  const [isGeoActive, setIsGeoActive] = useState(true)

  return (
    <div className="space-y-1.5 sm:space-y-3">
      {/* Header bar compact avec typographie et badges affinés */}
      <div className="flex flex-row items-center justify-between gap-1.5 pb-1 sm:pb-2 border-b border-border">
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="h-5 w-5 sm:h-7 sm:w-7 rounded-md sm:rounded-lg bg-gradient-to-tr from-emerald-500 to-green-600 text-white flex items-center justify-center font-bold text-[10px] sm:text-xs shadow-2xs">
            🗺️
          </div>
          <div>
            <h4 className="text-[10px] sm:text-sm font-bold text-text-primary flex items-center gap-1 sm:gap-1.5 leading-tight">
              <span>Campus Social</span>
              <span className="text-[7.5px] sm:text-[9px] px-1 sm:px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                ● 3 420 lycéens
              </span>
            </h4>
          </div>
        </div>

        {/* Toggle Switch Compact */}
        <div className="inline-flex items-center gap-0.5 sm:gap-1.5 px-1.5 py-0.2 sm:px-2.5 sm:py-1 bg-surface-secondary rounded-full text-[8px] sm:text-xs font-semibold border border-border shadow-2xs flex-shrink-0">
          <ShieldCheck className={`h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 ${isGeoActive ? 'text-primary-600' : 'text-text-tertiary'}`} />
          <span className="text-text-primary font-bold">
            <span className="sm:hidden">Loc</span>
            <span className="hidden sm:inline">Localisation</span>
          </span>
          
          <button
            type="button"
            onClick={() => setIsGeoActive(!isGeoActive)}
            className={`relative inline-flex h-3.5 w-6 sm:h-4.5 sm:w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              isGeoActive ? 'bg-primary-600' : 'bg-surface-tertiary border-border'
            }`}
            aria-label="Activer ou désactiver la géolocalisation"
          >
            <span
              className={`pointer-events-none inline-block h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                isGeoActive ? 'translate-x-2.5 sm:translate-x-3.5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Grid: 50% Carte à gauche, 50% Discussion d'entraide à droite */}
      <div className="grid grid-cols-2 gap-1.5 sm:gap-4 items-stretch">
        
        {/* COLONNE 1 : Carte Interactive */}
        <div className="bg-[#d9f2d9] rounded-xl sm:rounded-2xl p-1.5 sm:p-3 relative overflow-hidden border border-emerald-200/80 shadow-xs flex flex-col justify-between min-h-[175px] sm:min-h-[250px] select-none">
          
          {/* SVG MAP */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#d8f3dc" />
            <path d="M 0 0 L 140 0 L 120 180 L 0 160 Z" fill="#f4f0e6" opacity="0.85" />
            <path d="M 160 0 L 320 0 L 300 130 L 170 140 Z" fill="#f7f3ea" opacity="0.9" />
            <path d="M 360 0 L 550 0 L 520 170 L 340 120 Z" fill="#f4f0e6" opacity="0.85" />
            <path d="M 20 220 L 180 200 L 190 380 L 10 390 Z" fill="#f7f3ea" opacity="0.9" />
            <path d="M 220 180 L 460 160 L 450 360 L 230 380 Z" fill="#faf6ee" opacity="0.95" />

            <path d="M 10 20 Q 80 40 90 110 Q 30 140 10 90 Z" fill="#b7e4c7" opacity="0.8" />
            <path d="M 420 50 Q 480 70 510 140 Q 430 150 400 90 Z" fill="#b7e4c7" opacity="0.8" />

            <g stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.9">
              <line x1="0" y1="80" x2="350" y2="80" />
              <line x1="0" y1="180" x2="350" y2="180" />
              <line x1="80" y1="0" x2="80" y2="300" />
              <line x1="220" y1="0" x2="220" y2="300" />
            </g>

            <path d="M 0 90 Q 150 120 300 170" fill="none" stroke="#ff9f43" strokeWidth="4" strokeLinecap="round" />
            <path d="M 100 0 Q 150 140 220 300" fill="none" stroke="#2563eb" strokeWidth="3.5" strokeLinecap="round" />
          </svg>

          {/* HEATMAP GLOW */}
          <div
            className="absolute top-[48%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-18 sm:w-32 h-18 sm:h-32 rounded-full pointer-events-none animate-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(239,68,68,0.7) 0%, rgba(245,158,11,0.5) 40%, rgba(34,197,94,0.3) 70%, transparent 100%)',
            }}
          />

          {/* Top district label */}
          <div className="relative z-10 flex items-center justify-between text-[7.5px] sm:text-[9px]">
            <div className="flex items-center gap-1 bg-white/90 backdrop-blur-xs px-1.5 py-0.2 rounded-full shadow-2xs font-bold text-slate-800 border border-emerald-300/50">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="truncate">Quartier Latin</span>
            </div>
            <span className="text-[7px] sm:text-[8.5px] bg-white/80 px-1 py-0.2 rounded font-mono font-bold text-blue-700 border border-blue-200">
              Hub
            </span>
          </div>

          {/* Bitmojis Area */}
          <div className="relative w-full h-[85px] sm:h-[130px] my-0.5">
            {/* Spot 1: Camille */}
            <div
              onClick={() => setSelectedSpot(SPOTS[2])}
              className="absolute top-[20%] left-[22%] -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-110 z-20"
            >
              <div className="relative flex items-center gap-0.5">
                <div className="h-5.5 w-5.5 sm:h-8 sm:w-8 rounded-full bg-white p-0.5 shadow-md flex items-center justify-center text-[9px] sm:text-sm border border-amber-400">
                  👩🏻‍🎓
                </div>
                <div className="bg-white/95 px-1 py-0.2 rounded shadow-xs text-left hidden xs:block">
                  <p className="text-[7px] sm:text-[8.5px] font-bold text-slate-900 leading-tight">Camille</p>
                </div>
              </div>
            </div>

            {/* Spot 2: Group Spé Maths */}
            <div
              onClick={() => setSelectedSpot(SPOTS[0])}
              className="absolute top-[48%] left-[50%] -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-110 z-30"
            >
              <div className="flex flex-col items-center">
                <div className="h-7 w-7 sm:h-11 sm:w-11 rounded-full bg-white p-0.5 shadow-lg flex items-center justify-center text-xs sm:text-lg border-2 border-primary-600 animate-bounce">
                  👥
                </div>
                <div className="bg-white/95 px-1 py-0.2 rounded shadow-xs mt-0.5">
                  <p className="text-[7px] sm:text-[8.5px] font-bold text-primary-700 leading-tight">Spé Maths</p>
                </div>
              </div>
            </div>

            {/* Spot 3: Lucas */}
            <div
              onClick={() => setSelectedSpot(SPOTS[1])}
              className="absolute top-[24%] left-[82%] -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-110 z-20"
            >
              <div className="h-4.5 w-4.5 sm:h-7 sm:w-7 rounded-full bg-white shadow-md flex items-center justify-center text-[9px] sm:text-sm border border-slate-200">
                🚗
              </div>
            </div>
          </div>

          {/* Selected Spot Bottom Bar */}
          <div className="relative z-10 bg-white/95 backdrop-blur-xs rounded-md sm:rounded-lg p-1 sm:p-1.5 shadow-xs border border-slate-200/80 flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-[10px] sm:text-sm">{selectedSpot.avatar}</span>
              <div className="truncate">
                <p className="font-bold text-[7.5px] sm:text-[10px] text-slate-900 leading-tight truncate">
                  {selectedSpot.name}
                </p>
                <p className="text-[6.5px] sm:text-[8.5px] text-slate-600 truncate">
                  {selectedSpot.activity}
                </p>
              </div>
            </div>
            <span className="px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold text-[7px] sm:text-[8.5px] flex-shrink-0">
              Actif ✓
            </span>
          </div>

          {/* Overlay Privé */}
          {!isGeoActive && (
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-30 flex flex-col items-center justify-center p-1.5 text-center animate-in fade-in duration-200">
              <div className="bg-white rounded-lg p-1.5 shadow-lg max-w-xs border border-border space-y-0.5">
                <ShieldCheck className="h-3 w-3 text-primary-600 mx-auto" />
                <h5 className="font-bold text-[8.5px] text-text-primary">Mode Privé</h5>
                <button
                  type="button"
                  onClick={() => setIsGeoActive(true)}
                  className="w-full py-0.5 px-1 rounded bg-primary-600 text-white font-bold text-[7.5px] cursor-pointer"
                >
                  Activer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* COLONNE 2 : Discussion en Direct & Entraide Lycée */}
        <div className="bg-surface rounded-xl sm:rounded-2xl border border-border p-1.5 sm:p-3.5 flex flex-col justify-between shadow-xs min-h-[175px] sm:min-h-[250px]">
          <div>
            {/* Header du Chat */}
            <div className="flex items-center justify-between pb-1 sm:pb-2 border-b border-border mb-1 sm:mb-2">
              <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                <div className="relative flex-shrink-0">
                  <span className="h-5 w-5 sm:h-8 sm:w-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-[10px] sm:text-sm">
                    👩🏼‍🎓
                  </span>
                  <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-1 ring-white" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-bold text-[8.5px] sm:text-sm text-text-primary leading-tight flex items-center gap-1 truncate">
                    <span>Léa M.</span>
                  </h5>
                  <p className="text-[7px] sm:text-xs text-emerald-600 font-bold flex items-center gap-0.5 truncate">
                    <Zap className="h-2 w-2 sm:h-3 sm:w-3" /> En ligne
                  </p>
                </div>
              </div>
              <span className="text-[7px] sm:text-xs font-mono text-text-tertiary bg-surface-secondary px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded flex-shrink-0">
                17:42
              </span>
            </div>

            {/* Messages Dialog Flow avec police plus fine sur mobile et text-sm confortable sur PC */}
            <div className="space-y-1 sm:space-y-2">
              {/* Message 1 (Léa) */}
              <div className="flex items-start gap-1 sm:gap-1.5">
                <span className="text-[8px] sm:text-sm mt-0.5 flex-shrink-0">👩🏼‍🎓</span>
                <div className="bg-surface-secondary p-1 sm:p-2.5 rounded-lg sm:rounded-2xl rounded-tl-xs border border-border text-[7px] sm:text-sm text-text-primary leading-tight sm:leading-relaxed max-w-[92%]">
                  <p>
                    Salut ! Tu révises le TVI pour le DS ? 📚
                  </p>
                </div>
              </div>

              {/* Message 2 (Yanis - User) */}
              <div className="flex items-start gap-1 sm:gap-1.5 flex-row-reverse">
                <span className="text-[8px] sm:text-sm mt-0.5 flex-shrink-0">🧑🏽‍🎓</span>
                <div className="bg-primary-600 p-1 sm:p-2.5 rounded-lg sm:rounded-2xl rounded-tr-xs text-[7px] sm:text-sm text-white leading-tight sm:leading-relaxed max-w-[92%]">
                  <p>
                    Oui, fiche partagée sur le salon 🚀
                  </p>
                </div>
              </div>

              {/* Message 3 (Léa) */}
              <div className="flex items-start gap-1 sm:gap-1.5">
                <span className="text-[8px] sm:text-sm mt-0.5 flex-shrink-0">👩🏼‍🎓</span>
                <div className="bg-surface-secondary p-1 sm:p-2.5 rounded-lg sm:rounded-2xl rounded-tl-xs border border-border text-[7px] sm:text-sm text-text-primary leading-tight sm:leading-relaxed max-w-[92%]">
                  <p>
                    Top, on vise le 18/20 ! 👍✨
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Input Bar Simulation */}
          <div className="mt-1 pt-1 border-t border-border flex items-center gap-1">
            <div className="flex-1 bg-surface-secondary px-1.5 py-0.5 rounded-md text-[7px] sm:text-[9px] text-text-tertiary border border-border flex items-center justify-between">
              <span className="truncate">Répondre...</span>
              <span className="text-[8px]">💡</span>
            </div>
            <button
              type="button"
              className="h-4.5 w-4.5 sm:h-6 sm:w-6 rounded-md bg-primary-600 text-white flex items-center justify-center shadow-xs flex-shrink-0"
            >
              <Send className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
