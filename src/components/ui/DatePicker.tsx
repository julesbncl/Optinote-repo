'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, X, Check } from 'lucide-react'

export interface DatePickerProps {
  label?: string
  name?: string
  value?: string // YYYY-MM-DD
  defaultValue?: string // YYYY-MM-DD
  onChange?: (dateIso: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  id?: string
}

const MONTHS_FR = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
]

// Standard français : la semaine commence le Lundi (index 0)
const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

// Formate YYYY-MM-DD en "DD / MM / YYYY"
export function formatToFrenchDate(isoDateString?: string): string {
  if (!isoDateString) return ''
  const parts = isoDateString.split('-')
  if (parts.length !== 3) return isoDateString
  const [year, month, day] = parts
  return `${day} / ${month} / ${year}`
}

export function DatePicker({
  label,
  name,
  value: controlledValue,
  defaultValue,
  onChange,
  placeholder = 'JJ / MM / AAAA',
  required = false,
  disabled = false,
  className = '',
  id,
}: DatePickerProps) {
  const [internalValue, setInternalValue] = useState<string>(
    controlledValue !== undefined
      ? controlledValue
      : defaultValue || ''
  )
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Current view year & month in calendar
  const initialDate = internalValue ? new Date(internalValue) : new Date()
  const [viewYear, setViewYear] = useState(
    isNaN(initialDate.getTime()) ? new Date().getFullYear() : initialDate.getFullYear()
  )
  const [viewMonth, setViewMonth] = useState(
    isNaN(initialDate.getTime()) ? new Date().getMonth() : initialDate.getMonth()
  )

  const selectedDateStr = controlledValue !== undefined ? controlledValue : internalValue

  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue)
      if (controlledValue) {
        const d = new Date(controlledValue)
        if (!isNaN(d.getTime())) {
          setViewYear(d.getFullYear())
          setViewMonth(d.getMonth())
        }
      }
    }
  }, [controlledValue])

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  function handleSelectDate(day: number) {
    const formattedMonth = String(viewMonth + 1).padStart(2, '0')
    const formattedDay = String(day).padStart(2, '0')
    const isoString = `${viewYear}-${formattedMonth}-${formattedDay}`

    if (controlledValue === undefined) {
      setInternalValue(isoString)
    }
    onChange?.(isoString)
    setIsOpen(false)
  }

  function handleClear() {
    if (controlledValue === undefined) {
      setInternalValue('')
    }
    onChange?.('')
    setIsOpen(false)
  }

  function handleSelectToday() {
    const today = new Date()
    const y = today.getFullYear()
    const m = today.getMonth()
    const d = today.getDate()

    const formattedMonth = String(m + 1).padStart(2, '0')
    const formattedDay = String(d).padStart(2, '0')
    const isoString = `${y}-${formattedMonth}-${formattedDay}`

    setViewYear(y)
    setViewMonth(m)
    if (controlledValue === undefined) {
      setInternalValue(isoString)
    }
    onChange?.(isoString)
    setIsOpen(false)
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  // Calculate calendar grid (Lundi=0 ... Dimanche=6)
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1)
  // getDay(): 0=Dimanche, 1=Lundi, ..., 6=Samedi
  // Convert to Lundi=0: (day + 6) % 7
  const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate()

  const today = new Date()
  const isCurrentMonthThisYear =
    today.getFullYear() === viewYear && today.getMonth() === viewMonth
  const todayDate = today.getDate()

  const selectedDateObj = selectedDateStr ? new Date(selectedDateStr) : null
  const isSelectedInView =
    selectedDateObj &&
    !isNaN(selectedDateObj.getTime()) &&
    selectedDateObj.getFullYear() === viewYear &&
    selectedDateObj.getMonth() === viewMonth
  const selectedDay = isSelectedInView ? selectedDateObj.getDate() : null

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs sm:text-sm font-semibold sm:font-medium text-text-primary mb-1 sm:mb-1.5"
        >
          {label}
          {required && <span className="text-primary-600 ml-0.5">*</span>}
        </label>
      )}

      {/* Hidden input for HTML form submission */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={selectedDateStr || ''}
          required={required}
        />
      )}

      {/* Trigger Button / Input Display */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-8 sm:h-10 px-2.5 sm:px-3 rounded-lg sm:rounded-xl border bg-surface flex items-center justify-between text-left text-xs sm:text-sm font-medium transition-all shadow-2xs cursor-pointer ${
          isOpen
            ? 'border-primary-500 ring-2 ring-primary-500/20'
            : 'border-border hover:border-primary-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-surface-secondary' : ''}`}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-600 flex-shrink-0" />
          <span
            className={`truncate font-semibold text-xs sm:text-sm ${
              selectedDateStr ? 'text-text-primary' : 'text-text-tertiary'
            }`}
          >
            {selectedDateStr
              ? formatToFrenchDate(selectedDateStr)
              : placeholder}
          </span>
        </div>

        {selectedDateStr && !disabled && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              handleClear()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation()
                handleClear()
              }
            }}
            className="p-1 text-text-tertiary hover:text-text-primary rounded-md hover:bg-surface-secondary cursor-pointer"
            title="Effacer la date"
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </button>

      {/* Popover Calendar */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 left-0 w-72 sm:w-80 bg-surface rounded-2xl border border-border shadow-xl p-3 animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Header Bar : Mois & Année en Français + Navigation */}
          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-border/80">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer"
              title="Mois précédent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="text-xs sm:text-sm font-black text-text-primary capitalize">
              {MONTHS_FR[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer"
              title="Mois suivant"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Days of Week (Lundi to Dimanche standard FR) */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {DAYS_FR.map((dayName, idx) => (
              <div
                key={idx}
                className="text-[10px] sm:text-xs font-bold text-text-tertiary uppercase py-1"
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Previous month padding days */}
            {Array.from({ length: startDayIndex }).map((_, i) => {
              const dayNum = daysInPrevMonth - startDayIndex + i + 1
              return (
                <div
                  key={`prev-${i}`}
                  className="h-8 w-8 sm:h-9 sm:w-9 mx-auto flex items-center justify-center text-[11px] text-text-tertiary/40 select-none font-normal"
                >
                  {dayNum}
                </div>
              )
            })}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1
              const isSelected = selectedDay === dayNum
              const isToday = isCurrentMonthThisYear && todayDate === dayNum

              return (
                <button
                  key={`day-${dayNum}`}
                  type="button"
                  onClick={() => handleSelectDate(dayNum)}
                  className={`h-8 w-8 sm:h-9 sm:w-9 mx-auto rounded-xl flex items-center justify-center text-xs font-bold transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-xs scale-105'
                      : isToday
                      ? 'border border-primary-400 text-primary-700 bg-primary-50/50 hover:bg-primary-100'
                      : 'text-text-primary hover:bg-surface-secondary hover:text-primary-600'
                  }`}
                >
                  {dayNum}
                </button>
              )
            })}
          </div>

          {/* Bottom Action Footer (Effacer / Aujourd'hui) */}
          <div className="mt-3 pt-2.5 border-t border-border/80 flex items-center justify-between">
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] font-bold text-text-tertiary hover:text-error-600 px-2 py-1 rounded-lg hover:bg-error-50/60 transition-colors cursor-pointer"
            >
              Effacer
            </button>

            <button
              type="button"
              onClick={handleSelectToday}
              className="text-[11px] font-black text-primary-600 hover:text-primary-700 px-2 py-1 rounded-lg bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors cursor-pointer"
            >
              Aujourd&apos;hui
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
