import { cn } from '@/lib/utils'
import { type HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({
  className,
  hover = false,
  padding = 'md',
  children,
  ...props
}: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-5 sm:p-6',
  }

  return (
    <div
      className={cn(
        'bg-surface rounded-xl border border-border shadow-card',
        hover && 'card-hover cursor-pointer',
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-between mb-4', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'text-base font-semibold text-text-primary',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
}
