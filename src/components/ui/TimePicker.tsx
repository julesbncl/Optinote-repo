'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Clock, ChevronDown } from 'lucide-react'

export interface TimePickerProps {
  label?: string
  value: string // "HH:MM"
  onChange: (time: string) => void
  required?: boolean
  className?: string
  id?: string
}

// Génère les créneaux par tranche de 15 minutes en format 24h français (06h00 à 23h45)
const TIME_SLOTS_24H: string[] = []
for (let h = 6; h <= 23; h++) {
  for (let m = 0; m < 60; m += 15) {
    const hh = String(h).padStart(2, '0')
    const mm = String(m).padStart(2, '0')
    TIME_SLOTS_24H.push(`${hh}:${mm}`)
  }
}

export function formatToFrenchTimeDisplay(time: string): string {
  if (!time) return ''
  const parts = time.split(':')
  if (parts.length < 2) return time
  const [h, m] = parts
  return `${h}h${m}`
}

export function TimePicker({
  label,
  value,
  onChange,
  required = false,
  className = '',
  id,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

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

  const formattedDisplay = formatToFrenchTimeDisplay(value || '17:00')

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-bold text-text-primary mb-1"
        >
          {label}
          {required && <span className="text-primary-600 ml-0.5">*</span>}
        </label>
      )}

      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-10 px-3 rounded-xl border bg-surface flex items-center justify-between text-left text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
          isOpen
            ? 'border-primary-500 ring-2 ring-primary-500/20'
            : 'border-border hover:border-primary-300'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Clock className="h-4 w-4 text-primary-600 flex-shrink-0" />
          <span className="font-mono text-xs sm:text-sm font-black text-text-primary">
            {formattedDisplay}
          </span>
          <span className="text-[10px] text-text-tertiary font-normal truncate">
            ({value || '17:00'})
          </span>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-text-tertiary flex-shrink-0" />
      </button>

      {/* Popover 24h Slots list */}
      {isOpen && (
        <div className="absolute z-50 mt-1 left-0 w-52 sm:w-60 max-h-52 overflow-y-auto bg-surface rounded-xl border border-border shadow-xl p-1.5 animate-in fade-in-50 zoom-in-95 duration-150">
          <div className="grid grid-cols-2 gap-1">
            {TIME_SLOTS_24H.map((slot) => {
              const isSelected = value === slot
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => {
                    onChange(slot)
                    setIsOpen(false)
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer text-left flex items-center justify-between ${
                    isSelected
                      ? 'bg-primary-600 text-white shadow-2xs'
                      : 'hover:bg-surface-secondary text-text-primary hover:text-primary-600'
                  }`}
                >
                  <span>{formatToFrenchTimeDisplay(slot)}</span>
                  <span className="text-[9px] opacity-60 font-normal">{slot}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
