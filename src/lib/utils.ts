import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes with proper conflict resolution.
 * Uses clsx for conditional classes + tailwind-merge for deduplication.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date in French locale.
 */
export function formatDateFR(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * Format a short date (DD/MM).
 */
export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
  })
}

/**
 * Calculate weighted average from an array of { value, coefficient }.
 */
export function calculateWeightedAverage(
  items: { value: number; outOf: number; coefficient: number }[]
): number | null {
  if (items.length === 0) return null

  let sumWeighted = 0
  let sumCoefficients = 0

  for (const item of items) {
    // Normalize to /20
    const normalized = (item.value / item.outOf) * 20
    sumWeighted += normalized * item.coefficient
    sumCoefficients += item.coefficient
  }

  if (sumCoefficients === 0) return null
  return Math.round((sumWeighted / sumCoefficients) * 100) / 100
}

/**
 * Truncate text to a maximum length with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + '…'
}

/**
 * Generate initials from a name.
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Sleep utility for async operations.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
