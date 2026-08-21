import { useState, useEffect } from 'react'
import { POST_BAC_TARGETS } from '@/lib/constants'
import { Input } from '@/components/ui/Input'
import { CheckCircle2, School as SchoolIcon, Shield, Search } from 'lucide-react'
import type { School } from '@/types/campus'

interface StepPostBacProps {
  postBacTarget: string
  onPostBacChange: (target: string) => void
  selectedSchoolId: string | null
  onSchoolChange: (schoolId: string | null, schoolName?: string) => void
  isVisibleOnSchool: boolean
  onVisibilityChange: (visible: boolean) => void
}

export function StepPostBac({
  postBacTarget,
  onPostBacChange,
  selectedSchoolId,
  onSchoolChange,
  isVisibleOnSchool,
  onVisibilityChange,
}: StepPostBacProps) {
  const [schools, setSchools] = useState<School[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchSchools() {
      setLoading(true)
      try {
        const res = await fetch('/api/campus/schools')
        if (res.ok) {
          const data = await res.json()
          setSchools(data.schools || [])
        }
      } catch (e) {
        console.error('Error loading schools:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchSchools()
  }, [])

  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">
          Ton projet d&apos;avenir & ton lycée 🚀
        </h2>
        <p className="text-sm text-text-secondary max-w-sm mx-auto">
          Dernière étape ! Rejoins la communauté de ton orientation et connecte-toi à ton établissement.
        </p>
      </div>

      {/* Post-Bac selection */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">
          Horizon Post-Bac envisagé
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {POST_BAC_TARGETS.map((target) => {
            const isSelected = postBacTarget === target.id

            return (
              <button
                key={target.id}
                type="button"
                onClick={() => onPostBacChange(target.id)}
                className={`p-3 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50/60 shadow-xs'
                    : 'border-border bg-surface hover:border-border-hover'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl flex-shrink-0">{target.emoji}</span>
                  <span className="font-semibold text-xs text-text-primary truncate">
                    {target.label}
                  </span>
                </div>
                {isSelected && (
                  <CheckCircle2 className="h-4 w-4 text-primary-600 flex-shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* School selection */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-text-primary uppercase tracking-wider">
            Ton Lycée (Optionnel)
          </label>
          <span className="text-xs text-text-tertiary">Pour rejoindre le salon de ton lycée</span>
        </div>

        <Input
          placeholder="Rechercher ton lycée par nom ou ville..."
          leftIcon={<Search className="h-4 w-4" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="max-h-40 overflow-y-auto border border-border rounded-xl divide-y divide-border bg-surface">
          {filteredSchools.slice(0, 6).map((school) => {
            const isSelected = selectedSchoolId === school.id

            return (
              <button
                key={school.id}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    onSchoolChange(null)
                  } else {
                    onSchoolChange(school.id, school.name)
                  }
                }}
                className={`w-full p-2.5 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected ? 'bg-primary-50 text-primary-900 font-semibold' : 'hover:bg-surface-secondary'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <SchoolIcon className="h-4 w-4 text-primary-500 flex-shrink-0" />
                  <div className="truncate">
                    <p className="font-medium text-text-primary truncate">{school.name}</p>
                    <p className="text-[11px] text-text-tertiary">{school.city} ({school.postal_code})</p>
                  </div>
                </div>
                {isSelected ? (
                  <span className="text-primary-600 font-bold text-xs">Sélectionné ✓</span>
                ) : (
                  <span className="text-text-tertiary text-xs">{school.students_count} élèves</span>
                )}
              </button>
            )
          })}
          {filteredSchools.length === 0 && (
            <p className="p-3 text-center text-xs text-text-tertiary">
              {loading ? 'Chargement des lycées...' : 'Aucun lycée trouvé.'}
            </p>
          )}
        </div>
      </div>

      {/* Privacy toggle */}
      <div className="p-3.5 bg-surface-secondary rounded-xl border border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <Shield className="h-4 w-4 text-success-600 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-text-primary">Visibilité sur le Campus</p>
            <p className="text-[11px] text-text-tertiary">Permettre aux élèves de mon lycée de voir mon profil anonymisé</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
          <input
            type="checkbox"
            checked={isVisibleOnSchool}
            onChange={(e) => onVisibilityChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-surface-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
        </label>
      </div>
    </div>
  )
}
