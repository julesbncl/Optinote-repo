'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, Edit2 } from 'lucide-react'

interface EditableCoefficientBadgeProps {
  subjectId: string
  subjectName: string
  currentCoefficient: number
  onUpdate: (subjectId: string, newCoefficient: number) => Promise<void> | void
}

const PRESET_COEFFICIENTS = [1, 2, 3, 4, 5, 6, 8, 16]

export function EditableCoefficientBadge({
  subjectId,
  subjectName,
  currentCoefficient,
  onUpdate,
}: EditableCoefficientBadgeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [coefValue, setCoefValue] = useState<string>(String(currentCoefficient))
  const [isSaving, setIsSaving] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Synchroniser la valeur avec les props, pendant le rendu plutôt que dans un effect
  // (pattern recommandé par React pour "adjuster un state quand une prop change").
  const [prevCoefficient, setPrevCoefficient] = useState(currentCoefficient)
  if (currentCoefficient !== prevCoefficient) {
    setPrevCoefficient(currentCoefficient)
    setCoefValue(String(currentCoefficient))
  }

  // Focus automatique de l'input à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 50)
    }
  }, [isOpen])

  // Fermer le popover au clic en dehors
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (isOpen) {
          handleCommit()
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, coefValue, currentCoefficient])

  async function handleCommit(valueToCommit?: number) {
    const val = valueToCommit !== undefined ? valueToCommit : parseFloat(coefValue)
    if (isNaN(val) || val <= 0) {
      setCoefValue(String(currentCoefficient))
      setIsOpen(false)
      return
    }

    if (val === currentCoefficient) {
      setIsOpen(false)
      return
    }

    setIsSaving(true)
    try {
      await onUpdate(subjectId, val)
      setIsOpen(false)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCommit()
    } else if (e.key === 'Escape') {
      setCoefValue(String(currentCoefficient))
      setIsOpen(false)
    }
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Badge cliquable avec style discret conservé */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-md transition-all cursor-pointer inline-flex items-center gap-0.5 select-none ${
          isOpen
            ? 'bg-primary-600 text-white border border-primary-700 shadow-2xs scale-105'
            : 'bg-surface-secondary text-text-secondary border border-border hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50/60 active:scale-95'
        }`}
        title={`Cliquer pour modifier le coefficient de ${subjectName}`}
      >
        <span>Coef. {currentCoefficient}</span>
        <Edit2 className="h-2.5 w-2.5 opacity-40 hover:opacity-100 transition-opacity ml-0.5" />
      </button>

      {/* Menu déroulant minimaliste / Popover de modification rapide */}
      {isOpen && (
        <div
          className="absolute left-0 top-full mt-1.5 z-50 bg-surface rounded-xl border border-border shadow-xl p-2.5 w-48 space-y-2 animate-in fade-in-50 zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between text-[10.5px] font-extrabold text-text-primary">
            <span>Coefficient</span>
            <span className="text-[9px] text-text-tertiary font-normal truncate max-w-[90px]">
              {subjectName}
            </span>
          </div>

          {/* Saisie directe */}
          <div className="flex items-center gap-1.5">
            <input
              ref={inputRef}
              type="number"
              min="0.5"
              max="30"
              step="0.5"
              value={coefValue}
              onChange={(e) => setCoefValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSaving}
              className="w-full h-7 px-2 text-xs font-black bg-surface-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-center"
              placeholder="Coef"
            />
            <button
              type="button"
              onClick={() => handleCommit()}
              disabled={isSaving}
              className="h-7 px-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-[10px] font-bold transition-all flex items-center justify-center cursor-pointer flex-shrink-0 shadow-2xs"
              title="Valider (Entrée)"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Pastilles rapides de coefficients officiels */}
          <div>
            <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">
              Valeurs usuelles :
            </span>
            <div className="grid grid-cols-4 gap-1">
              {PRESET_COEFFICIENTS.map((p) => {
                const isCurrent = currentCoefficient === p
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setCoefValue(String(p))
                      handleCommit(p)
                    }}
                    className={`h-6 rounded-md text-[10px] font-black transition-all cursor-pointer border ${
                      isCurrent
                        ? 'bg-primary-50 text-primary-700 border-primary-300 font-extrabold'
                        : 'bg-surface-secondary text-text-secondary border-border/80 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200'
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
