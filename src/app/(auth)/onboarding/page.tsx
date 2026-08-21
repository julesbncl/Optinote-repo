'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { StepLevel } from '@/components/onboarding/StepLevel'
import { StepSpecialties } from '@/components/onboarding/StepSpecialties'
import { StepGoal } from '@/components/onboarding/StepGoal'
import { StepPostBac } from '@/components/onboarding/StepPostBac'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [classLevel, setClassLevel] = useState('terminale')
  const [specialties, setSpecialties] = useState<string[]>(['maths', 'physique'])
  const [academicGoal, setAcademicGoal] = useState('progression')
  const [postBacTarget, setPostBacTarget] = useState('ingenieur')
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [schoolName, setSchoolName] = useState<string | undefined>(undefined)
  const [isVisibleOnSchool, setIsVisibleOnSchool] = useState(true)

  const handleNext = () => {
    if (step === 1 && !classLevel) {
      toast.error('Sélectionne ton niveau scolaire')
      return
    }
    if (step === 2 && specialties.length === 0) {
      toast.error('Choisis au moins une matière ou spécialité')
      return
    }
    if (step === 3 && !academicGoal) {
      toast.error('Sélectionne ton objectif')
      return
    }
    if (step < 4) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleFinish = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classLevel,
          specialties,
          academicGoal,
          postBacTarget,
          schoolId,
          schoolName,
          isVisibleOnSchool,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Erreur lors de la validation')
      }

      toast.success('Bienvenue sur OptiNote ! 🎉')
      router.push('/dashboard')
      router.refresh()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Une erreur est survenue'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card padding="lg" className="shadow-md border-border">
      {/* Progress Bar */}
      <div className="mb-8">
        <ProgressBar currentStep={step} totalSteps={4} />
      </div>

      {/* Steps Content */}
      <div className="min-h-[420px] flex flex-col justify-between">
        <div>
          {step === 1 && (
            <StepLevel value={classLevel} onChange={setClassLevel} />
          )}

          {step === 2 && (
            <StepSpecialties
              level={classLevel}
              selected={specialties}
              onChange={setSpecialties}
            />
          )}

          {step === 3 && (
            <StepGoal value={academicGoal} onChange={setAcademicGoal} />
          )}

          {step === 4 && (
            <StepPostBac
              postBacTarget={postBacTarget}
              onPostBacChange={setPostBacTarget}
              selectedSchoolId={schoolId}
              onSchoolChange={(id, name) => {
                setSchoolId(id)
                setSchoolName(name)
              }}
              isVisibleOnSchool={isVisibleOnSchool}
              onVisibilityChange={setIsVisibleOnSchool}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-8 border-t border-border mt-8">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            disabled={step === 1}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Précédent
          </Button>

          {step < 4 ? (
            <Button
              type="button"
              onClick={handleNext}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Continuer
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleFinish}
              isLoading={isSubmitting}
              leftIcon={<Sparkles className="h-4 w-4" />}
            >
              Terminer & Accéder à OptiNote
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
