'use client'

import { useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

export interface ComboboxOption {
  value: string
  label: string
  icon?: string
  group?: string
}

export interface ComboboxProps {
  name: string
  label?: string
  error?: string
  placeholder?: string
  defaultValue?: string
  options: ComboboxOption[]
  required?: boolean
  id?: string
  className?: string
}

function normalize(str: string) {
  const diacriticRange = String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f)
  const diacriticRegex = new RegExp('[' + diacriticRange + ']', 'g')
  return str.normalize('NFD').replace(diacriticRegex, '').toLowerCase().trim()
}

export function Combobox({
  name,
  label,
  error,
  placeholder,
  defaultValue = '',
  options,
  required,
  id,
  className,
}: ComboboxProps) {
  const [value, setValue] = useState(defaultValue)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  const filteredOptions = useMemo(() => {
    const q = normalize(value)
    if (!q) return options
    return options.filter((o) => normalize(o.label).includes(q))
  }, [value, options])

  const groupedOptions = useMemo(() => {
    const groups = new Map<string, ComboboxOption[]>()
    filteredOptions.forEach((o) => {
      const key = o.group || ''
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(o)
    })
    return Array.from(groups.entries())
  }, [filteredOptions])

  function selectOption(option: ComboboxOption) {
    setValue(option.label)
    setIsOpen(false)
  }

  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setIsOpen(false)
    }
  }

  return (
    <div className="w-full" ref={containerRef} onBlur={handleBlur}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs sm:text-sm font-semibold sm:font-medium text-text-primary mb-1 sm:mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          name={name}
          type="text"
          autoComplete="off"
          required={required}
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            setValue(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsOpen(false)
          }}
          className={cn(
            'w-full h-8 sm:h-10 px-2.5 sm:px-3 pr-8 sm:pr-10 text-xs sm:text-sm bg-surface border border-border rounded-lg sm:rounded-xl',
            'placeholder:text-text-tertiary',
            'transition-all duration-200',
            'hover:border-border-hover',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-danger-500 focus:ring-danger-500/20 focus:border-danger-500',
            className
          )}
        />
        <ChevronDown className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-text-tertiary pointer-events-none" />

        {isOpen && groupedOptions.length > 0 && (
          <div className="absolute z-30 mt-1 w-full max-h-56 overflow-y-auto rounded-lg sm:rounded-xl border border-border bg-surface shadow-lg py-1">
            {groupedOptions.map(([group, groupOptions]) => (
              <div key={group || 'ungrouped'}>
                {group && (
                  <p className="px-2.5 sm:px-3 pt-1.5 pb-0.5 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                    {group}
                  </p>
                )}
                {groupOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectOption(option)}
                    className="w-full flex items-center gap-2 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm text-left text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer"
                  >
                    {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                    <span className="truncate">{option.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs sm:text-sm text-danger-500">{error}</p>}
    </div>
  )
}
