import { OFFICIAL_SPECIALTIES } from '@/lib/curriculum'
import { Check } from 'lucide-react'

interface StepSpecialtiesProps {
  level: string
  selected: string[]
  onChange: (specialties: string[]) => void
}

// Stocke le nom affiché (ex: "Mathématiques"), pas un id interne — c'est ce
// que lisent /settings, la carte du Campus et le générateur de programme
// officiel. Utiliser un id ici causait un décompte et un affichage incohérents
// dès que l'utilisateur rouvrait ses spécialités dans Paramètres.
export function StepSpecialties({ level, selected, onChange }: StepSpecialtiesProps) {
  const isPremiere = level === 'premiere'
  const isTerminale = level === 'terminale'
  const maxSelections = isPremiere ? 3 : isTerminale ? 2 : 4

  const toggleSpecialty = (name: string) => {
    if (selected.includes(name)) {
      onChange(selected.filter((s) => s !== name))
    } else {
      if (selected.length >= maxSelections) {
        // Replace oldest or keep max
        onChange([...selected.slice(1), name])
      } else {
        onChange([...selected, name])
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">
          Quelles sont tes spécialités ou matières clés ? 📚
        </h2>
        <p className="text-sm text-text-secondary max-w-md mx-auto">
          {isPremiere && 'Sélectionne tes 3 spécialités de Première.'}
          {isTerminale && 'Sélectionne tes 2 spécialités conservées en Terminale.'}
          {!isPremiere && !isTerminale && 'Choisis jusqu\'à 4 matières principales ou options.'}
        </p>
        <div className="inline-block px-3 py-1 bg-surface-tertiary rounded-full text-xs font-semibold text-text-secondary">
          {selected.length} / {maxSelections} sélectionnée(s)
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1 no-scrollbar">
        {OFFICIAL_SPECIALTIES.map((spec) => {
          const isSelected = selected.includes(spec.name)

          return (
            <button
              key={spec.id}
              type="button"
              onClick={() => toggleSpecialty(spec.name)}
              className={`p-3.5 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer flex items-center justify-between ${
                isSelected
                  ? 'border-primary-500 bg-primary-50/60 shadow-xs'
                  : 'border-border bg-surface hover:border-border-hover hover:bg-surface-secondary'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl flex-shrink-0">{spec.emoji}</span>
                <div className="truncate">
                  <h4 className="font-bold text-sm text-text-primary truncate">
                    {spec.name}
                  </h4>
                  <p className="text-xs text-text-tertiary truncate">
                    {spec.desc}
                  </p>
                </div>
              </div>

              <div
                className={`h-5 w-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'border-border bg-surface'
                }`}
              >
                {isSelected && <Check className="h-3.5 w-3.5" />}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
