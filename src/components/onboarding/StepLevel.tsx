import { CLASS_LEVELS } from '@/lib/constants'
import { CheckCircle2 } from 'lucide-react'

interface StepLevelProps {
  value: string
  onChange: (level: string) => void
}

export function StepLevel({ value, onChange }: StepLevelProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">
          Quel est ton niveau scolaire ? 🎒
        </h2>
        <p className="text-sm text-text-secondary max-w-sm mx-auto">
          OptiNote adaptera ses fiches, coefficients et salons d&apos;entraide à ton année.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
        {CLASS_LEVELS.map((level) => {
          const isSelected = value === level.value

          return (
            <button
              key={level.value}
              type="button"
              onClick={() => onChange(level.value)}
              className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? 'border-primary-500 bg-primary-50/50 shadow-sm'
                  : 'border-border bg-surface hover:border-border-hover hover:bg-surface-secondary'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{level.emoji}</span>
                {isSelected && (
                  <CheckCircle2 className="h-5 w-5 text-primary-600 fill-primary-100" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-base text-text-primary">
                  {level.label}
                </h3>
                <p className="text-xs text-text-tertiary mt-0.5">
                  {level.value === 'seconde' && 'Découverte & choix des spécialités'}
                  {level.value === 'premiere' && 'Bac de Français & 3 spécialités'}
                  {level.value === 'terminale' && 'Épreuves finales, Grand Oral & Parcoursup'}
                  {level.value === 'autre' && 'Candidat libre ou classe prépa'}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
