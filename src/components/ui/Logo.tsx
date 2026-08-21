'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { APP_NAME } from '@/lib/constants'

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  href?: string
  className?: string
  iconClassName?: string
  textClassName?: string
}

const sizeMap = {
  xs: {
    icon: 'h-4 w-4',
    box: 'h-6 w-6 rounded-lg p-0.5',
    text: 'text-sm font-black',
  },
  sm: {
    icon: 'h-5 w-5',
    box: 'h-7 w-7 rounded-lg p-1',
    text: 'text-base font-black',
  },
  md: {
    icon: 'h-6 w-6',
    box: 'h-8.5 w-8.5 rounded-xl p-1',
    text: 'text-lg font-black',
  },
  lg: {
    icon: 'h-8 w-8',
    box: 'h-11 w-11 rounded-2xl p-1.5',
    text: 'text-2xl font-black',
  },
  xl: {
    icon: 'h-10 w-10',
    box: 'h-14 w-14 rounded-2xl p-2',
    text: 'text-3xl font-black',
  },
}

/**
 * OptiNote Modern Brand Icon:
 * - Geometric "O" with ascending growth spark
 * - Vibrant Indigo -> Violet -> Electric Blue gradient
 */
export function LogoIcon({ className }: { className?: string }) {
  const uniqueId = React.useId()
  const ringGradId = `optinote-ring-${uniqueId}`
  const foldGradId = `optinote-fold-${uniqueId}`

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-full h-full flex-shrink-0 select-none', className)}
    >
      <defs>
        {/* Dégradé Principal Violet -> Indigo -> Cyan */}
        <linearGradient id={ringGradId} x1="4" y1="44" x2="44" y2="4" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="50%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>

        {/* Dégradé Accent Spark */}
        <linearGradient id={foldGradId} x1="20" y1="4" x2="44" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#818CF8" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
      </defs>

      {/* Anneau "O" dynamique & moderne */}
      <circle
        cx="24"
        cy="24"
        r="17"
        stroke={`url(#${ringGradId})`}
        strokeWidth="5.5"
        strokeLinecap="round"
        strokeDasharray="92 20"
      />

      {/* Flèche d'ascension / Pli de cours supérieur */}
      <path
        d="M 28 6 L 42 20 L 31 20 C 29.34 20 28 18.66 28 17 Z"
        fill={`url(#${foldGradId})`}
      />

      {/* Point central d'excellence */}
      <circle cx="24" cy="24" r="3.5" fill={`url(#${ringGradId})`} />
    </svg>
  )
}

export function Logo({
  size = 'md',
  showText = true,
  href,
  className,
  iconClassName,
  textClassName,
}: LogoProps) {
  const currentSize = sizeMap[size]

  const content = (
    <div className={cn('flex items-center gap-2 min-w-0 select-none group', className)}>
      {/* Icon Badge */}
      <div
        className={cn(
          'flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100/70 border border-primary-200/80 shadow-xs transition-transform duration-200 group-hover:scale-105',
          currentSize.box,
          iconClassName
        )}
      >
        <LogoIcon className={currentSize.icon} />
      </div>

      {/* Typography */}
      {showText && (
        <span
          className={cn(
            'tracking-tight font-black truncate transition-colors leading-none',
            currentSize.text,
            textClassName
          )}
        >
          <span className="text-text-primary">Opti</span>
          <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            Note
          </span>
        </span>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center focus:outline-hidden">
        {content}
      </Link>
    )
  }

  return content
}
