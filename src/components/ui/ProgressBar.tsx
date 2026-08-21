import { cn } from '@/lib/utils'

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
  className?: string
}

export function ProgressBar({ currentStep, totalSteps, className }: ProgressBarProps) {
  const percentage = Math.round((currentStep / totalSteps) * 100)

  return (
    <div className={cn('w-full space-y-2', className)}>
      <div className="flex items-center justify-between text-xs font-semibold text-text-tertiary">
        <span>Étape {currentStep} sur {totalSteps}</span>
        <span className="text-primary-600 font-bold">{percentage}%</span>
      </div>
      <div className="h-2 w-full bg-surface-tertiary rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
