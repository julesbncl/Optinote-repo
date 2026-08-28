'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  CalendarDays,
  Sparkles,
  ChevronRight,
  Clock,
  ArrowRight,
} from 'lucide-react'
import { formatToFrenchTimeDisplay } from '@/components/ui/TimePicker'
import type { Schedule, PlanningSlot } from '@/types/database'

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const SHORT_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
// Plage horaire étendue de 5h00 du matin à 00h00 (Minuit)
const PLANNING_HOURS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0]

const DEFAULT_PLAN_SLOTS: PlanningSlot[] = [
  // LUNDI
  { day: 0, startTime: '08:00', endTime: '10:00', subject: 'Mathématiques', task: 'Cours obligatoire', type: 'class' },
  { day: 0, startTime: '10:00', endTime: '12:00', subject: 'Physique-Chimie', task: 'TP laboratoire', type: 'class' },
  { day: 0, startTime: '14:00', endTime: '16:00', subject: 'Philosophie', task: 'Cours obligatoire', type: 'class' },
  { day: 0, startTime: '17:00', endTime: '18:00', subject: 'Mathématiques', task: 'Révision DS TVI & Dérivées', type: 'study' },
  { day: 0, startTime: '19:30', endTime: '20:00', subject: 'Sport', task: 'Footing & Renforcement', type: 'other' },

  // MARDI
  { day: 1, startTime: '08:00', endTime: '10:00', subject: 'SES', task: 'Cours obligatoire', type: 'class' },
  { day: 1, startTime: '10:00', endTime: '12:00', subject: 'Histoire-Géo', task: 'Cours obligatoire', type: 'class' },
  { day: 1, startTime: '14:00', endTime: '16:00', subject: 'Mathématiques', task: 'Cours obligatoire', type: 'class' },
  { day: 1, startTime: '17:30', endTime: '18:30', subject: 'Histoire-Géo', task: 'Croquis géopolitique', type: 'study' },
  { day: 1, startTime: '19:30', endTime: '20:00', subject: 'Sport', task: 'Séance HIIT', type: 'other' },

  // MERCREDI
  { day: 2, startTime: '08:00', endTime: '12:00', subject: 'Physique-Chimie', task: 'Cours & Exercices', type: 'class' },
  { day: 2, startTime: '14:00', endTime: '15:30', subject: 'Philosophie', task: 'Plan de dissertation', type: 'study' },
  { day: 2, startTime: '19:30', endTime: '20:00', subject: 'Sport', task: 'Gainage & Étirements', type: 'other' },

  // JEUDI
  { day: 3, startTime: '08:00', endTime: '10:00', subject: 'Philosophie', task: 'Cours obligatoire', type: 'class' },
  { day: 3, startTime: '10:00', endTime: '12:00', subject: 'Mathématiques', task: 'Cours obligatoire', type: 'class' },
  { day: 3, startTime: '14:00', endTime: '16:00', subject: 'Anglais', task: 'Cours obligatoire', type: 'class' },
  { day: 3, startTime: '17:00', endTime: '18:30', subject: 'Mathématiques', task: 'Annales Bac TVI', type: 'study' },
  { day: 3, startTime: '19:30', endTime: '20:00', subject: 'Sport', task: 'Course à pied', type: 'other' },

  // VENDREDI
  { day: 4, startTime: '08:00', endTime: '10:00', subject: 'Physique-Chimie', task: 'Cours obligatoire', type: 'class' },
  { day: 4, startTime: '10:00', endTime: '12:00', subject: 'Histoire-Géo', task: 'Cours obligatoire', type: 'class' },
  { day: 4, startTime: '14:00', endTime: '16:00', subject: 'Mathématiques', task: 'Cours obligatoire', type: 'class' },
  { day: 4, startTime: '18:00', endTime: '19:00', subject: 'Physique-Chimie', task: 'Exercices thermodynamique', type: 'study' },
  { day: 4, startTime: '19:30', endTime: '20:00', subject: 'Sport', task: 'Séance abdos / cardio', type: 'other' },

  // SAMEDI
  { day: 5, startTime: '10:00', endTime: '11:30', subject: 'Mathématiques', task: 'Synthèse du week-end', type: 'study' },
]

interface DashboardPlanningGridProps {
  schedule: Schedule | null
  isLocked?: boolean
  onSlotClick?: (slot: PlanningSlot, index: number) => void
  onAddSlot?: (day: number, hour: number) => void
  title?: string
  subtitle?: string
  showManageButton?: boolean
}

export function DashboardPlanningGrid({
  schedule,
  isLocked = false,
  onSlotClick,
  onAddSlot,
  title = 'Planning Intelligent',
  subtitle = 'Grille des cours & révisions IA',
  showManageButton = true,
}: DashboardPlanningGridProps) {
  const [viewMode, setViewMode] = useState<'condensed' | 'full'>('full')
  const [selectedMobileDay, setSelectedMobileDay] = useState<number>(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const planSlots = Array.isArray(schedule?.generated_plan) ? schedule.generated_plan : DEFAULT_PLAN_SLOTS

  const dailyTasks = planSlots.filter((s) => s.day === selectedMobileDay)
  const studyTasksCount = dailyTasks.filter((s) => s.type === 'study').length

  // Positionner le défilement par défaut sur la tranche horaire du matin (autour de 6h/7h)
  useEffect(() => {
    if (viewMode === 'full' && scrollContainerRef.current) {
      const targetRow = scrollContainerRef.current.querySelector(
        '[data-hour="6"], [data-hour="7"]'
      ) as HTMLElement

      if (targetRow) {
        scrollContainerRef.current.scrollTop = Math.max(0, targetRow.offsetTop - 24)
      } else {
        scrollContainerRef.current.scrollTop = 24
      }
    }
  }, [viewMode])

  return (
    <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden flex flex-col justify-between h-full relative">
      {/* Header Bar Compact */}
      <div className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 border-b border-border flex items-center justify-between gap-2 bg-surface">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-lg sm:rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center flex-shrink-0 font-bold">
            <CalendarDays className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-[13px] font-bold text-text-primary truncate">
              {title}
            </h3>
            <p className="text-[8.5px] sm:text-[10px] text-text-tertiary truncate">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {/* Toggle Vue Condensée / Grille */}
          <div className="flex items-center gap-0.5 bg-surface-secondary p-0.5 rounded-lg border border-border text-[8px] sm:text-[9.5px] font-bold">
            <button
              type="button"
              onClick={() => setViewMode('condensed')}
              className={`px-1.5 sm:px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'condensed'
                  ? 'bg-primary-600 text-white shadow-2xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Semaine
            </button>
            <button
              type="button"
              onClick={() => setViewMode('full')}
              className={`px-1.5 sm:px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                viewMode === 'full'
                  ? 'bg-primary-600 text-white shadow-2xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Grille
            </button>
          </div>

          {showManageButton && (
            <Link
              href="/planning"
              className="text-[8.5px] sm:text-[10.5px] font-bold text-primary-600 hover:text-primary-700 flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 rounded-lg bg-primary-50 hover:bg-primary-100 transition-colors flex-shrink-0"
              title="Ouvrir la gestion complète du planning"
            >
              <span>Gérer</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Contenu de la Grille avec Hauteur Optimisée et ref pour scroll initial */}
      <div
        ref={scrollContainerRef}
        className="flex-1 p-2 sm:p-2.5 overflow-y-auto max-h-[300px] sm:max-h-[340px]"
      >
        {viewMode === 'condensed' ? (
          /* VUE SEMAINE CONDENSÉE */
          <div className="space-y-2">
            {/* Sélecteur de jour */}
            <div className="grid grid-cols-7 gap-1">
              {SHORT_DAYS.map((shortDay, idx) => {
                const dayTasks = planSlots.filter((s) => s.day === idx)
                const studyCount = dayTasks.filter((s) => s.type === 'study').length
                const isSelected = selectedMobileDay === idx

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedMobileDay(idx)}
                    className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary-600 text-white border-primary-700 shadow-xs scale-[1.02]'
                        : 'bg-surface-secondary text-text-secondary border-border/80 hover:bg-surface-tertiary'
                    }`}
                  >
                    <span className="text-[9.5px] sm:text-[11px] font-bold">{shortDay}</span>
                    {studyCount > 0 ? (
                      <span
                        className={`text-[7.5px] font-black px-1 rounded-full mt-0.5 ${
                          isSelected ? 'bg-white/25 text-white' : 'bg-primary-100 text-primary-800'
                        }`}
                      >
                        {studyCount} DS
                      </span>
                    ) : (
                      <span className="text-[7.5px] opacity-40 mt-0.5">•</span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Liste des créneaux du jour */}
            <div className="bg-surface-secondary/60 p-2 rounded-xl border border-border/70 space-y-1">
              <div className="flex items-center justify-between text-[10.5px] font-bold text-text-primary">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-primary-600" />
                  <span>Créneaux du {DAYS[selectedMobileDay]}</span>
                </div>
                <span className="text-[9.5px] text-text-tertiary font-normal">
                  {studyTasksCount} révision{studyTasksCount > 1 ? 's' : ''} • {dailyTasks.length - studyTasksCount}h de cours
                </span>
              </div>

              <div className="space-y-1">
                {dailyTasks.map((slot, idx) => {
                  const isClass = slot.type === 'class'
                  const isOther = slot.type === 'other'

                  const content = (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[9.5px] font-mono font-black text-primary-800 bg-white/80 px-1 py-0.2 rounded border border-primary-200">
                          {formatToFrenchTimeDisplay(slot.startTime)} - {formatToFrenchTimeDisplay(slot.endTime)}
                        </span>
                        <span className={`text-[11px] font-bold truncate ${isClass ? 'line-through decoration-primary-500' : ''}`}>
                          {slot.subject}
                        </span>
                      </div>
                      <span className="text-[8px] font-extrabold uppercase px-1 py-0.2 rounded bg-white/90 text-text-primary border border-border">
                        {isClass ? 'Cours' : isOther ? 'Activité' : 'Révision IA'}
                      </span>
                    </div>
                  )

                  return onSlotClick ? (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onSlotClick(slot, idx)}
                      className={`w-full text-left p-1.5 rounded-lg sm:rounded-xl border transition-all hover:scale-[1.01] cursor-pointer ${
                        isClass
                          ? 'bg-[repeating-linear-gradient(45deg,rgba(37,99,235,0.06),rgba(37,99,235,0.06)_6px,transparent_6px,transparent_12px)] text-primary-900 border-primary-200'
                          : isOther
                          ? 'bg-indigo-50/80 text-indigo-900 border-indigo-200'
                          : 'bg-primary-50/80 text-primary-900 border-primary-200'
                      }`}
                    >
                      {content}
                    </button>
                  ) : (
                    <Link
                      key={idx}
                      href="/planning"
                      className={`block p-1.5 rounded-lg sm:rounded-xl border transition-all hover:scale-[1.01] ${
                        isClass
                          ? 'bg-[repeating-linear-gradient(45deg,rgba(37,99,235,0.06),rgba(37,99,235,0.06)_6px,transparent_6px,transparent_12px)] text-primary-900 border-primary-200'
                          : isOther
                          ? 'bg-indigo-50/80 text-indigo-900 border-indigo-200'
                          : 'bg-primary-50/80 text-primary-900 border-primary-200'
                      }`}
                    >
                      {content}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          /* VUE GRILLE COMPLÈTE DE 5H À 00H COMPACTÉE & OPTIMISÉE MOBILE */
          <div className="overflow-x-auto no-scrollbar">
            <div className="min-w-[340px] sm:min-w-[460px]">
              {/* En-tête des jours */}
              <div className="grid grid-cols-8 gap-0.5 mb-0.5 sm:mb-1">
                <div className="text-[7.5px] sm:text-[8.5px] text-text-tertiary font-bold py-0.2 text-center"></div>
                {SHORT_DAYS.map((day) => (
                  <div
                    key={day}
                    className="text-[8px] sm:text-[10px] text-text-secondary font-black py-0.2 text-center bg-surface-secondary rounded"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Lignes horaires ultra-compactes de 5h à 00h */}
              <div className="space-y-[1.5px] sm:space-y-0.5">
                {PLANNING_HOURS.map((hour) => (
                  <div
                    key={hour}
                    data-hour={hour}
                    className="grid grid-cols-8 gap-0.5 items-center"
                  >
                    <div className="text-[7px] sm:text-[8.5px] text-text-tertiary font-bold py-0 text-right pr-0.5 sm:pr-1 font-mono select-none">
                      {hour === 0 ? '00h' : `${hour}h`}
                    </div>
                    {DAYS.map((_, dayIdx) => {
                      const slotIndex = planSlots.findIndex(
                        (s) =>
                          s.day === dayIdx &&
                          parseInt(s.startTime.split(':')[0]) === hour
                      )
                      const slot = slotIndex !== -1 ? planSlots[slotIndex] : null
                      const isClass = slot?.type === 'class'
                      const isOther = slot?.type === 'other'

                      const slotClasses = `rounded text-[6px] sm:text-[8px] px-0.5 h-[14.5px] sm:h-[17.5px] min-h-[14.5px] sm:min-h-[17.5px] flex items-center justify-center transition-all select-none font-bold leading-none ${
                        slot
                          ? isClass
                            ? 'bg-[repeating-linear-gradient(45deg,rgba(37,99,235,0.08),rgba(37,99,235,0.08)_6px,transparent_6px,transparent_12px)] text-primary-900 border border-primary-200 line-through decoration-primary-500 font-extrabold hover:border-primary-400'
                            : isOther
                            ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border border-indigo-800 shadow-2xs hover:scale-[1.02]'
                            : 'bg-gradient-to-r from-primary-600 to-primary-700 text-white border border-primary-800 shadow-2xs hover:scale-[1.02]'
                          : 'bg-surface-secondary/35 text-text-tertiary hover:bg-primary-50/50 border border-transparent'
                      }`

                      const slotInner = slot ? (
                        <span className="truncate w-full text-center">
                          {slot.subject}
                        </span>
                      ) : (
                        <span className="opacity-0 hover:opacity-100 text-[6px] text-primary-600">+</span>
                      )

                      const titleText = slot
                        ? `${slot.subject} (${formatToFrenchTimeDisplay(slot.startTime)} - ${formatToFrenchTimeDisplay(slot.endTime)})`
                        : `Créneau libre à ${hour}h`

                      if (onSlotClick || onAddSlot) {
                        return (
                          <button
                            key={dayIdx}
                            type="button"
                            onClick={() => {
                              if (slot) {
                                onSlotClick?.(slot, slotIndex)
                              } else {
                                onAddSlot?.(dayIdx, hour)
                              }
                            }}
                            className={`${slotClasses} cursor-pointer`}
                            title={titleText}
                          >
                            {slotInner}
                          </button>
                        )
                      }

                      return (
                        <Link
                          key={dayIdx}
                          href="/planning"
                          className={slotClasses}
                          title={titleText}
                        >
                          {slotInner}
                        </Link>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Bar Compact */}
      <div className="px-3 py-1.5 border-t border-border bg-surface flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-text-tertiary">
          <Sparkles className="h-2.5 w-2.5 text-primary-600" />
          <span>Ajusté par IA</span>
        </div>

        <Link
          href="/planning"
          className="inline-flex items-center gap-0.5 text-[9.5px] sm:text-[10.5px] font-bold text-primary-600 hover:text-primary-700"
        >
          <span>Éditeur IA</span>
          <ArrowRight className="h-2.5 w-2.5" />
        </Link>
      </div>

      {/* Rideau Pro si non abonné */}
      {isLocked && (
        <div className="absolute inset-0 z-40 bg-slate-900/60 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center p-4 text-center select-none">
          <div className="bg-white px-4 py-3 rounded-2xl border border-border shadow-2xl max-w-xs space-y-1 animate-fade-in">
            <div className="flex items-center justify-center gap-1.5 text-xs font-black text-slate-900">
              <span className="text-sm">🔒</span>
              <span>Planning Intelligent IA</span>
            </div>
            <p className="text-[9.5px] text-slate-600 leading-snug">
              Génère automatiquement tes créneaux de révision adaptés à ton emploi du temps.
              <Link href="/pricing" className="block pt-0.5">
                <span className="inline-flex items-center gap-1 text-[10.5px] font-black px-3.5 py-1 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-sm hover:opacity-95 transition-opacity">
                  <span>Passer Pro (dès 4,99 €)</span>
                  <ChevronRight className="h-3 w-3" />
                </span>
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
