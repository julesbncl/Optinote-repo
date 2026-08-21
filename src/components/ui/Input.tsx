'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs sm:text-sm font-semibold sm:font-medium text-text-primary mb-1 sm:mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-text-tertiary">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-8 sm:h-10 px-2.5 sm:px-3 text-xs sm:text-sm bg-surface border border-border rounded-lg sm:rounded-xl',
              'placeholder:text-text-tertiary',
              'transition-all duration-200',
              'hover:border-border-hover',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              leftIcon && 'pl-8 sm:pl-10',
              error && 'border-danger-500 focus:ring-danger-500/20 focus:border-danger-500',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-xs sm:text-sm text-danger-500">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1 text-xs sm:text-sm text-text-tertiary">{hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
