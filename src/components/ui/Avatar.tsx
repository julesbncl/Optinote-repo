import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  name?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Avatar({ src, name = '', size = 'md', className }: AvatarProps) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-base',
  }

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          'rounded-full object-cover ring-2 ring-surface',
          sizes[size],
          className
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold',
        'bg-primary-100 text-primary-700',
        sizes[size],
        className
      )}
    >
      {getInitials(name || '?')}
    </div>
  )
}
