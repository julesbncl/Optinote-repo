'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, School as SchoolIcon, MapPin, Loader2, Check, ArrowRight, Sparkles } from 'lucide-react'
import type { School } from '@/types/campus'

interface SchoolSearchResult {
  uai?: string
  name: string
  type?: string
  city: string
  postal_code: string
  academy: string
  latitude: number
  longitude: number
  address?: string
}

interface SchoolSearchAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelectSchool: (school: Partial<SchoolSearchResult>) => void
  placeholder?: string
  className?: string
}

export function SchoolSearchAutocomplete({
  value,
  onChange,
  onSelectSchool,
  placeholder = 'Rechercher un lycée, ville, académie...',
  className = '',
}: SchoolSearchAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<SchoolSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Fermeture si clic extérieur
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Recherche debouncée vers data.education.gouv.fr API
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!value || value.trim().length < 2) {
      setSuggestions([])
      setLoading(false)
      return
    }

    setLoading(true)
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/campus/schools/search?q=${encodeURIComponent(value.trim())}`)
        if (res.ok) {
          const data = await res.json()
          setSuggestions(data.results || [])
          setIsOpen(true)
        }
      } catch (err) {
        console.error('Error fetching school suggestions:', err)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [value])

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true)
          }}
          placeholder={placeholder}
          className="w-full h-10 pl-9 pr-8 text-xs bg-surface border border-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-2xs"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange('')
              setSuggestions([])
              setIsOpen(false)
            }}
            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-text-tertiary hover:text-text-primary text-xs cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown Suggestions Lycées */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1.5 left-0 right-0 max-h-72 overflow-y-auto bg-surface rounded-2xl border border-border shadow-xl p-1.5 space-y-1 animate-in fade-in-50 zoom-in-95 duration-100 no-scrollbar">
          <div className="px-2.5 py-1 text-[10.5px] font-bold text-text-tertiary flex items-center justify-between border-b border-border/50">
            <span>Lycées suggérés</span>
            <span className="text-[10px] text-text-tertiary font-semibold">{suggestions.length} résultat{suggestions.length > 1 ? 's' : ''}</span>
          </div>

          {suggestions.map((school, index) => (
            <button
              key={`${school.uai || 'sch'}-${index}`}
              type="button"
              onClick={() => {
                onSelectSchool(school)
                setIsOpen(false)
              }}
              className="w-full p-2 rounded-xl text-left hover:bg-primary-50/70 hover:border-primary-200 border border-transparent transition-all flex items-start gap-2.5 group cursor-pointer"
            >
              <div className="h-7 w-7 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                <SchoolIcon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-extrabold text-xs text-text-primary group-hover:text-primary-700 truncate">
                    {school.name}
                  </h4>
                  {school.type && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-surface-secondary text-text-secondary border border-border/80 flex-shrink-0">
                      {school.type}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10.5px] text-text-secondary mt-0.5">
                  <MapPin className="h-3 w-3 text-text-tertiary flex-shrink-0" />
                  <span className="truncate">
                    {school.city} ({school.postal_code}) • {school.academy}
                  </span>
                </div>
              </div>
              <div className="self-center pl-1 text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
