'use client'

import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-text-primary mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full min-h-[100px] px-3 py-2.5 text-sm bg-surface border border-border rounded-lg',
            'placeholder:text-text-tertiary',
            'transition-all duration-200 resize-y',
            'hover:border-border-hover',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error &&
              'border-danger-500 focus:ring-danger-500/20 focus:border-danger-500',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-danger-500">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-text-tertiary">{hint}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export { Textarea }
