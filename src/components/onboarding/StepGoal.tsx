import { ACADEMIC_GOALS } from '@/lib/constants'
import { CheckCircle2 } from 'lucide-react'

interface StepGoalProps {
  value: string
  onChange: (goal: string) => void
}

export function StepGoal({ value, onChange }: StepGoalProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">
          Quel est ton objectif cette année ? 🎯
        </h2>
        <p className="text-sm text-text-secondary max-w-sm mx-auto">
          OptiNote calibrera tes temps de révision et ton simulateur de notes en fonction de ton ambition.
        </p>
      </div>

      <div className="space-y-3 pt-2">
        {ACADEMIC_GOALS.map((goal) => {
          const isSelected = value === goal.id

          return (
            <button
              key={goal.id}
              type="button"
              onClick={() => onChange(goal.id)}
              className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer flex items-center justify-between ${
                isSelected
                  ? 'border-primary-500 bg-primary-50/50 shadow-sm'
                  : 'border-border bg-surface hover:border-border-hover hover:bg-surface-secondary'
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="text-3xl flex-shrink-0">{goal.emoji}</span>
                <div>
                  <h3 className="font-bold text-base text-text-primary">
                    {goal.title}
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {goal.subtitle}
                  </p>
                </div>
              </div>

              {isSelected && (
                <CheckCircle2 className="h-5 w-5 text-primary-600 fill-primary-100 flex-shrink-0" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
