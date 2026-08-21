'use client'

import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string | number
  label: string
}

export interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs sm:text-sm font-semibold sm:font-medium text-text-primary mb-1 sm:mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full h-8 sm:h-10 px-2.5 sm:px-3 pr-8 sm:pr-10 text-xs sm:text-sm bg-surface border border-border rounded-lg sm:rounded-xl',
              'transition-all duration-200 appearance-none cursor-pointer',
              'hover:border-border-hover',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error &&
                'border-danger-500 focus:ring-danger-500/20 focus:border-danger-500',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-text-tertiary pointer-events-none" />
        </div>
        {error && (
          <p className="mt-1 text-xs sm:text-sm text-danger-500">{error}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export { Select }
