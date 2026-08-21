'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import {
  OFFICIAL_SPECIALTIES,
  OPTIONAL_COURSES,
  generateOfficialSubjects,
  type OfficialSubjectTemplate,
} from '@/lib/curriculum'
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  BookOpen,
  Plus,
  ArrowRight,
  ShieldCheck,
  Layers,
} from 'lucide-react'

interface CurriculumSetupModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (subjects: OfficialSubjectTemplate[]) => void
  initialLevel?: 'seconde' | 'premiere' | 'terminale'
}

export function CurriculumSetupModal({
  isOpen,
  onClose,
  onComplete,
  initialLevel = 'terminale',
}: CurriculumSetupModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [level, setLevel] = useState<'seconde' | 'premiere' | 'terminale'>(initialLevel)
  const [specialtyIds, setSpecialtyIds] = useState<string[]>(
    initialLevel === 'terminale' ? ['maths', 'physique'] : initialLevel === 'premiere' ? ['maths', 'physique', 'svt'] : []
  )
  const [optionalIds, setOptionalIds] = useState<string[]>([])

  const requiredSpecialtiesCount = level === 'premiere' ? 3 : level === 'terminale' ? 2 : 0

  function toggleSpecialty(id: string) {
    if (specialtyIds.includes(id)) {
      setSpecialtyIds(specialtyIds.filter((s) => s !== id))
    } else {
      if (specialtyIds.length < requiredSpecialtiesCount) {
        setSpecialtyIds([...specialtyIds, id])
      }
    }
  }

  function toggleOption(id: string) {
    if (optionalIds.includes(id)) {
      setOptionalIds(optionalIds.filter((o) => o !== id))
    } else {
      setOptionalIds([...optionalIds, id])
    }
  }

  const generatedSubjects = generateOfficialSubjects({
    level,
    specialtyIds,
    optionalIds,
  })

  const totalCoefficients = generatedSubjects.reduce(
    (sum, s) => sum + s.coefficient,
    0
  )

  const isStep2Valid =
    level === 'seconde' ||
    (level === 'premiere' && specialtyIds.length === 3) ||
    (level === 'terminale' && specialtyIds.length === 2)

  function handleFinish() {
    onComplete(generatedSubjects)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configuration Officielle de ma Moyenne"
      size="lg"
    >
      <div className="space-y-5">
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs ${
                step === 1
                  ? 'bg-primary-600 text-white'
                  : 'bg-primary-50 text-primary-700'
              }`}
            >
              1
            </span>
            <span className={step === 1 ? 'font-bold text-text-primary' : 'text-text-tertiary'}>
              Niveau Scolaire
            </span>
          </div>

          <ChevronRight className="h-4 w-4 text-text-tertiary" />

          <div className="flex items-center gap-2">
            <span
              className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs ${
                step === 2
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-secondary text-text-tertiary'
              }`}
            >
              2
            </span>
            <span className={step === 2 ? 'font-bold text-text-primary' : 'text-text-tertiary'}>
              Spécialités & Options
            </span>
          </div>

          <ChevronRight className="h-4 w-4 text-text-tertiary" />

          <div className="flex items-center gap-2">
            <span
              className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs ${
                step === 3
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-secondary text-text-tertiary'
              }`}
            >
              3
            </span>
            <span className={step === 3 ? 'font-bold text-text-primary' : 'text-text-tertiary'}>
              Grille Officielle
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            ÉTAPE 1 : CHOIX DU NIVEAU SCOLAIRE
            ═══════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Sélectionne ta classe actuelle
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">
                OptiNote appliquera automatiquement les programmes et coefficients officiels de l&apos;Éducation Nationale.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Seconde */}
              <button
                type="button"
                onClick={() => {
                  setLevel('seconde')
                  setSpecialtyIds([])
                }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  level === 'seconde'
                    ? 'border-primary-600 bg-primary-50/50 ring-2 ring-primary-500/20'
                    : 'border-border bg-surface hover:border-primary-200'
                }`}
              >
                <span className="text-2xl mb-2 block">🌱</span>
                <p className="font-bold text-sm text-text-primary">Seconde Générale</p>
                <p className="text-[11px] text-text-secondary mt-1">
                  Tronc commun de 11 matières obligatoires + options.
                </p>
              </button>

              {/* Première */}
              <button
                type="button"
                onClick={() => {
                  setLevel('premiere')
                  if (specialtyIds.length !== 3) {
                    setSpecialtyIds(['maths', 'physique', 'svt'])
                  }
                }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  level === 'premiere'
                    ? 'border-primary-600 bg-primary-50/50 ring-2 ring-primary-500/20'
                    : 'border-border bg-surface hover:border-primary-200'
                }`}
              >
                <span className="text-2xl mb-2 block">🌿</span>
                <p className="font-bold text-sm text-text-primary">Première Générale</p>
                <p className="text-[11px] text-text-secondary mt-1">
                  Tronc commun + 3 Enseignements de Spécialité (Coef. 8).
                </p>
              </button>

              {/* Terminale */}
              <button
                type="button"
                onClick={() => {
                  setLevel('terminale')
                  if (specialtyIds.length !== 2) {
                    setSpecialtyIds(['maths', 'physique'])
                  }
                }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  level === 'terminale'
                    ? 'border-primary-600 bg-primary-50/50 ring-2 ring-primary-500/20'
                    : 'border-border bg-surface hover:border-primary-200'
                }`}
              >
                <span className="text-2xl mb-2 block">🎓</span>
                <p className="font-bold text-sm text-text-primary">Terminale Générale</p>
                <p className="text-[11px] text-text-secondary mt-1">
                  Tronc commun + 2 Spécialités Renforcées (Coef. 16 au Bac !).
                </p>
              </button>
            </div>

            <div className="flex justify-end pt-3">
              <Button onClick={() => setStep(2)} className="gap-1.5 font-bold">
                Étape suivante : Spécialités
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            ÉTAPE 2 : CHOIX DES ENSEIGNEMENTS & SPÉCIALITÉS
            ═══════════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-4">
            {level === 'seconde' ? (
              <div className="space-y-3">
                <div className="p-3 bg-surface-secondary rounded-xl border border-border text-xs">
                  <p className="font-bold text-text-primary">
                    ✓ Tronc commun officiel de Seconde (11 matières) :
                  </p>
                  <p className="text-text-secondary mt-1">
                    Français (coef 5), Maths (coef 5), Physique (coef 4), SVT (coef 3), H-G (coef 3), LVA (coef 3), LVB (coef 3), SES (coef 2), SNT (coef 2), EPS (coef 2), EMC (coef 1).
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-text-primary mb-2">
                    Enseignements Optionnels Facultatifs (Facultatif)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {OPTIONAL_COURSES.seconde.map((opt) => {
                      const isSelected = optionalIds.includes(opt.id)
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleOption(opt.id)}
                          className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-primary-50 border-primary-300 text-primary-900'
                              : 'bg-surface border-border text-text-secondary hover:border-primary-200'
                          }`}
                        >
                          <span>{opt.name}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-secondary">
                            Coef. {opt.coef}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">
                      {level === 'premiere'
                        ? 'Choisis tes 3 Enseignements de Spécialité'
                        : 'Choisis tes 2 Spécialités Renforcées de Terminale'}
                    </h3>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {level === 'premiere'
                        ? 'Sélectionne obligatoirement 3 spécialités parmi les 11 matières officielles.'
                        : 'Sélectionne les 2 spécialités conservées (Coefficient 16 chacune au Baccalauréat).'}
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      isStep2Valid
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {specialtyIds.length} / {requiredSpecialtiesCount} sélectionnées
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {OFFICIAL_SPECIALTIES.map((spec) => {
                    const isSelected = specialtyIds.includes(spec.id)
                    const canSelect = isSelected || specialtyIds.length < requiredSpecialtiesCount

                    return (
                      <button
                        key={spec.id}
                        type="button"
                        onClick={() => toggleSpecialty(spec.id)}
                        disabled={!canSelect}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-primary-600 bg-primary-50/70 text-primary-950 ring-1 ring-primary-500/20 cursor-pointer'
                            : canSelect
                            ? 'border-border bg-surface hover:border-primary-200 cursor-pointer'
                            : 'border-border/50 bg-surface opacity-40 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs flex items-center gap-1.5">
                            <span>{spec.emoji}</span>
                            <span>{spec.name}</span>
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-primary-600" />
                          )}
                        </div>
                        <p className="text-[10px] text-text-secondary line-clamp-1">
                          {spec.desc}
                        </p>
                      </button>
                    )
                  })}
                </div>

                {/* Options facultatives de Terminale ou Première */}
                <div className="pt-2">
                  <p className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">
                    Options Facultatives ({level === 'terminale' ? 'Maths Expertes, DGEMC...' : 'Arts, Latin...'})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(level === 'terminale'
                      ? OPTIONAL_COURSES.terminale
                      : OPTIONAL_COURSES.premiere
                    ).map((opt) => {
                      const isSelected = optionalIds.includes(opt.id)
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => toggleOption(opt.id)}
                          className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-primary-50 border-primary-300 text-primary-900'
                              : 'bg-surface border-border text-text-secondary hover:border-primary-200'
                          }`}
                        >
                          <span>{opt.name}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-secondary">
                            Coef. {opt.coef}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Button
                variant="secondary"
                onClick={() => setStep(1)}
                className="gap-1 text-xs"
              >
                <ChevronLeft className="h-4 w-4" />
                Retour
              </Button>

              <Button
                onClick={() => setStep(3)}
                disabled={!isStep2Valid}
                className="gap-1.5 font-bold text-xs"
              >
                Voir ma grille officielle
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            ÉTAPE 3 : APERÇU ET GÉNÉRATION DE LA GRILLE
            ═══════════════════════════════════════════════════════ */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-950">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-bold">
                    Programme officiel {level === 'seconde' ? 'Seconde' : level === 'premiere' ? 'Première Générale' : 'Terminale Générale'} validé
                  </p>
                  <p className="text-[11px] text-emerald-800">
                    {generatedSubjects.length} matières configurées • Total coefficients : <strong>{totalCoefficients}</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* List of generated subjects */}
            <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
              {generatedSubjects.map((sub, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-surface rounded-xl border border-border flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: sub.color }}
                    />
                    <span className="font-bold text-text-primary truncate">
                      {sub.name}
                    </span>
                    {sub.category === 'specialite' && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-primary-50 text-primary-700 uppercase">
                        Spécialité
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-text-secondary font-semibold">
                    {sub.hoursPerWeek && (
                      <span className="text-[11px] text-text-tertiary">
                        {sub.hoursPerWeek}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-surface-secondary text-text-primary font-bold">
                      Coef. {sub.coefficient}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <Button
                variant="secondary"
                onClick={() => setStep(2)}
                className="gap-1 text-xs"
              >
                <ChevronLeft className="h-4 w-4" />
                Modifier mes choix
              </Button>

              <Button
                onClick={handleFinish}
                className="gap-1.5 font-bold shadow-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                <Sparkles className="h-4 w-4" />
                Appliquer à mon simulateur 🚀
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
