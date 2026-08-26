'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { DatePicker } from '@/components/ui/DatePicker'
import { Select } from '@/components/ui/Select'
import { Combobox } from '@/components/ui/Combobox'
import { Modal, ConfirmDeleteModal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { calculateWeightedAverage } from '@/lib/utils'
import { TRIMESTERS, SUBJECT_COLORS } from '@/lib/constants'
import {
  Plus,
  Trash2,
  Calculator,
  TrendingUp,
  BarChart3,
  Eye,
  EyeOff,
  Sparkles,
  LineChart,
} from 'lucide-react'
import { GradeEvolutionModal } from '@/components/grades/GradeEvolutionModal'
import toast from 'react-hot-toast'
import type { Subject, Grade, Profile } from '@/types/database'
import { checkIsPro } from '@/lib/hooks/useIsPro'
import { PaywallModal } from '@/components/paywall/PaywallModal'
import { CurriculumSetupModal } from '@/components/grades/CurriculumSetupModal'
import { EditableCoefficientBadge } from '@/components/grades/EditableCoefficientBadge'
import { SUBJECT_SUGGESTIONS, type OfficialSubjectTemplate } from '@/lib/curriculum'
import Link from 'next/link'

export default function GradesPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTrimester, setSelectedTrimester] = useState(1)
  const [showSimulated, setShowSimulated] = useState(true)
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [showAddGrade, setShowAddGrade] = useState(false)
  const [selectedSubjectForGrade, setSelectedSubjectForGrade] = useState<string | null>(null)
  const [showPaywallModal, setShowPaywallModal] = useState(false)
  const [showCurriculumModal, setShowCurriculumModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'subject' | 'grade'; id: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showEvolutionModal, setShowEvolutionModal] = useState(false)

  const isSubscribed = checkIsPro(profile)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      const [profileRes, subjectsRes, gradesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('subjects').select('*').eq('user_id', user.id).order('name'),
        supabase.from('grades').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      ])

      if (profileRes.data) setProfile(profileRes.data)
      setSubjects(subjectsRes.data || [])
      setGrades(gradesRes.data || [])
    } catch (err) {
      console.error('Error loading grades data:', err)
      toast.error('Erreur lors du chargement de tes notes')
    } finally {
      setLoading(false)
    }
  }

  // Open add grade modal for a specific subject
  function openAddGradeForSubject(subjectId: string) {
    // Si l'utilisateur est Pro, les limites sont 100% levées (notes illimitées)
    if (!isSubscribed) {
      const existingGrades = grades.filter(
        (g) => g.subject_id === subjectId && g.trimester === selectedTrimester && !g.is_simulated
      )
      if (existingGrades.length >= 2) {
        toast.error('Limite de la version gratuite atteinte : 2 notes max par matière. Débloque le mode Pro pour des notes illimitées !')
        setShowPaywallModal(true)
        return
      }
    }

    setSelectedSubjectForGrade(subjectId)
    setShowAddGrade(true)
  }

  // Handle Official Curriculum Generation from QCM
  async function handleApplyCurriculum(officialSubjects: OfficialSubjectTemplate[]) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const newSubs: Subject[] = officialSubjects.map((sub, idx) => ({
        id: `sub-official-${Date.now()}-${idx}`,
        user_id: user?.id || 'mock',
        name: sub.name,
        coefficient: sub.coefficient,
        teacher_name: null,
        color: sub.color,
        created_at: new Date().toISOString(),
      }))

      if (user) {
        // Replace in database
        await supabase.from('subjects').delete().eq('user_id', user.id)
        await supabase.from('subjects').insert(
          newSubs.map((s) => ({
            user_id: user.id,
            name: s.name,
            coefficient: s.coefficient,
            color: s.color,
          }))
        )
      }

      setSubjects(newSubs)
      localStorage.setItem('optinote_subjects', JSON.stringify(newSubs))
      toast.success(`Grille officielle appliquée avec succès (${newSubs.length} matières) !`)
    } catch (err) {
      console.error(err)
      toast.success('Grille officielle générée !')
    }
  }

  async function handleAddSubject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const coefficient = parseFloat(formData.get('coefficient') as string) || 1
    const teacherName = (formData.get('teacherName') as string) || null
    const color = (formData.get('color') as string) || SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length]

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data, error } = await supabase
          .from('subjects')
          .insert({
            user_id: user.id,
            name,
            coefficient,
            teacher_name: teacherName,
            color,
          })
          .select()
          .single()

        if (!error && data) {
          setSubjects((prev) => [...prev, data])
        }
      } else {
        const newSub: Subject = {
          id: `sub-${Date.now()}`,
          user_id: 'mock',
          name,
          coefficient,
          teacher_name: teacherName,
          color,
          created_at: new Date().toISOString(),
        }
        const updated = [...subjects, newSub]
        setSubjects(updated)
        localStorage.setItem('optinote_subjects', JSON.stringify(updated))
      }

      toast.success('Matière ajoutée !')
      setShowAddSubject(false)
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors de l\'ajout')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAddGrade(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const subjectId = (formData.get('subjectId') as string) || selectedSubjectForGrade || subjects[0]?.id
    const isSimulated = formData.get('isSimulated') === 'on'
    const value = parseFloat(formData.get('value') as string)
    const outOf = parseFloat(formData.get('outOf') as string) || 20
    const coefficient = parseFloat(formData.get('coefficient') as string) || 1
    const label = (formData.get('label') as string) || null
    const date = (formData.get('date') as string) || new Date().toISOString()

    // Quota check: seuls les comptes gratuits sans abonnement Pro sont limités à 2 notes par matière
    if (!isSubscribed && !isSimulated) {
      const existingGrades = grades.filter(
        (g) => g.subject_id === subjectId && g.trimester === selectedTrimester && !g.is_simulated
      )
      if (existingGrades.length >= 2) {
        setIsSubmitting(false)
        setShowAddGrade(false)
        setShowPaywallModal(true)
        toast.error('Limite de la version gratuite atteinte : 2 notes max par matière. Débloque le mode Pro pour des notes illimitées !')
        return
      }
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data, error } = await supabase
          .from('grades')
          .insert({
            user_id: user.id,
            subject_id: subjectId,
            value,
            out_of: outOf,
            coefficient,
            label,
            trimester: selectedTrimester,
            date,
            is_simulated: isSimulated,
          })
          .select()
          .single()

        if (!error && data) {
          setGrades((prev) => [data, ...prev])

          if (!isSimulated) {
            fetch('/api/grades/notify-evolution', { method: 'POST' }).catch((err) =>
              console.warn('Error checking grade evolution:', err)
            )
          }
        }
      } else {
        const newGrade: Grade = {
          id: `gr-${Date.now()}`,
          user_id: 'mock',
          subject_id: subjectId,
          value,
          out_of: outOf,
          coefficient,
          label,
          trimester: selectedTrimester as 1 | 2 | 3,
          date,
          is_simulated: isSimulated,
          created_at: new Date().toISOString(),
        }
        const updated = [newGrade, ...grades]
        setGrades(updated)
        localStorage.setItem('optinote_grades', JSON.stringify(updated))
      }

      toast.success(isSimulated ? 'Note simulée ajoutée !' : 'Note enregistrée !')
      setShowAddGrade(false)
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setIsSubmitting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const table = deleteTarget.type === 'subject' ? 'subjects' : 'grades'
        await supabase.from(table).delete().eq('id', deleteTarget.id)
      }

      if (deleteTarget.type === 'subject') {
        const updated = subjects.filter((s) => s.id !== deleteTarget.id)
        setSubjects(updated)
        localStorage.setItem('optinote_subjects', JSON.stringify(updated))
      } else {
        const updated = grades.filter((g) => g.id !== deleteTarget.id)
        setGrades(updated)
        localStorage.setItem('optinote_grades', JSON.stringify(updated))
      }

      toast.success(
        deleteTarget.type === 'subject' ? 'Matière supprimée' : 'Note supprimée'
      )
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors de la suppression')
    } finally {
      setIsSubmitting(false)
      setDeleteTarget(null)
    }
  }

  // Modification rapide du coefficient d'une matière
  async function handleUpdateSubjectCoefficient(subjectId: string, newCoefficient: number) {
    if (isNaN(newCoefficient) || newCoefficient <= 0) return

    // 1. Mise à jour optimiste dans le state & localStorage
    const updated = subjects.map((s) =>
      s.id === subjectId ? { ...s, coefficient: newCoefficient } : s
    )
    setSubjects(updated)
    try {
      localStorage.setItem('optinote_subjects', JSON.stringify(updated))
    } catch {}

    const subjectName = subjects.find((s) => s.id === subjectId)?.name || 'Matière'

    // 2. Persistance dans Supabase si connecté
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        await supabase
          .from('subjects')
          .update({ coefficient: newCoefficient })
          .eq('id', subjectId)
          .eq('user_id', user.id)
      }

      toast.success(`Coefficient de ${subjectName} mis à jour : Coef. ${newCoefficient} ✨`, {
        duration: 3000,
        icon: '📊',
      })
    } catch (err) {
      console.error('Error updating subject coefficient:', err)
      toast.error('Erreur lors de la mise à jour du coefficient')
    }
  }

  // Filter grades by trimester and simulation mode
  const filteredGrades = grades.filter(
    (g) =>
      g.trimester === selectedTrimester &&
      (showSimulated || !g.is_simulated)
  )

  // Calculate averages
  function getSubjectAverage(subjectId: string): number | null {
    const subjectGrades = filteredGrades.filter(
      (g) => g.subject_id === subjectId
    )
    return calculateWeightedAverage(
      subjectGrades.map((g) => ({
        value: g.value,
        outOf: g.out_of,
        coefficient: g.coefficient,
      }))
    )
  }

  const generalAvg = calculateWeightedAverage(
    filteredGrades.map((g) => {
      const subject = subjects.find((s) => s.id === g.subject_id)
      return {
        value: g.value,
        outOf: g.out_of,
        coefficient: g.coefficient * (subject?.coefficient || 1),
      }
    })
  )

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-2.5 sm:space-y-6 max-w-5xl mx-auto pb-24 sm:pb-10 animate-fade-in">
      {/* Free Tier Quota Notice (Couleur bleue élégante et signature) */}
      {!isSubscribed && (
        <div className="p-2 sm:p-3.5 bg-primary-50 border border-primary-200 rounded-xl sm:rounded-2xl flex items-center justify-between gap-2 sm:gap-3 text-[10.5px] sm:text-sm text-primary-900 shadow-2xs">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="text-sm sm:text-base">⚡</span>
            <span className="truncate">
              <strong>Version Découverte :</strong> 1 note max par matière.
            </span>
          </div>
          <Link
            href="/pricing"
            className="text-primary-700 hover:text-primary-800 font-bold whitespace-nowrap text-[10px] sm:text-xs underline flex-shrink-0"
          >
            Illimité ➔
          </Link>
        </div>
      )}

      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4">
        <div>
          <h1 className="text-sm sm:text-2xl font-black text-text-primary tracking-tight">
            Simulateur de Notes & Moyenne 📊
          </h1>
          <p className="text-[10px] sm:text-sm text-text-secondary mt-0.2 sm:mt-0.5">
            Suis tes résultats réels et simule tes prochains DS avec les coefficients officiels.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowCurriculumModal(true)}
            className="text-[10px] sm:text-xs font-bold gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border-primary-200 bg-primary-50/70 hover:bg-primary-100 text-primary-900 shadow-2xs"
          >
            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary-600" />
            <span>Grille officielle (QCM Bac)</span>
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowEvolutionModal(true)}
            className="text-[10px] sm:text-xs font-bold gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 shadow-2xs"
          >
            <LineChart className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-indigo-600" />
            <span>Évolution de la moyenne</span>
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowAddSubject(true)}
            className="text-[10px] sm:text-xs font-semibold gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl"
          >
            <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span>Ajouter une matière</span>
          </Button>
        </div>
      </div>

      <GradeEvolutionModal isOpen={showEvolutionModal} onClose={() => setShowEvolutionModal(false)} />

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
        {/* Moyenne générale */}
        <Card padding="md" className="sm:col-span-2 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="h-7 w-7 sm:h-12 sm:w-12 rounded-lg sm:rounded-2xl bg-success-50 flex items-center justify-center text-success-600 flex-shrink-0">
                <Calculator className="h-3.5 w-3.5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-[8.5px] sm:text-xs font-bold text-text-tertiary uppercase tracking-wider truncate">
                  Moyenne Générale (T{selectedTrimester})
                </p>
                <div className="flex items-baseline gap-1.5 sm:gap-2">
                  <span className="text-xl sm:text-3xl font-black text-text-primary tracking-tight">
                    {generalAvg !== null ? `${generalAvg}/20` : '—'}
                  </span>
                  {showSimulated && (
                    <span className="text-[8.5px] sm:text-xs text-text-tertiary truncate">
                      (avec simulations)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowSimulated(!showSimulated)}
                className={`inline-flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[9.5px] sm:text-xs font-bold border transition-all cursor-pointer ${
                  showSimulated
                    ? 'bg-amber-50 text-amber-800 border-amber-200 shadow-2xs'
                    : 'bg-surface-secondary text-text-tertiary border-border'
                }`}
              >
                {showSimulated ? (
                  <>
                    <Eye className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-amber-600" />
                    <span>Simulations ON</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-text-tertiary" />
                    <span>Notes réelles</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </Card>

        {/* Trimester selector */}
        <Card padding="md" className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl">
          <p className="text-[8.5px] sm:text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1 sm:mb-2">
            Trimestre actif
          </p>
          <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
            {TRIMESTERS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setSelectedTrimester(t.value)}
                className={`py-1 sm:py-2 px-1 sm:px-1.5 rounded-lg sm:rounded-xl text-[10.5px] sm:text-xs font-bold transition-all cursor-pointer ${
                  selectedTrimester === t.value
                    ? 'bg-primary-600 text-white shadow-2xs'
                    : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Subject list and grades */}
      <div className="space-y-2 sm:space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-base font-bold text-text-primary">
            Matières & Notes du T{selectedTrimester} ({subjects.length})
          </h2>
          <span className="text-[9.5px] sm:text-xs text-text-tertiary">
            Total notes : {filteredGrades.length}
          </span>
        </div>

        {subjects.length === 0 ? (
          <Card className="text-center py-8 sm:py-12 rounded-xl sm:rounded-2xl">
            <BarChart3 className="h-8 w-8 sm:h-12 sm:w-12 text-text-tertiary mx-auto mb-2 sm:mb-3 opacity-60" />
            <p className="text-xs sm:text-base font-bold text-text-primary">
              Aucune matière configurée
            </p>
            <p className="text-[10px] sm:text-xs text-text-secondary mt-1 max-w-sm mx-auto">
              Utilise le configurateur officiel pour charger automatiquement le programme de ton niveau (Seconde, Première, Terminale).
            </p>
            <Button
              onClick={() => setShowCurriculumModal(true)}
              className="mt-3 sm:mt-4 font-bold gap-1.5 text-xs sm:text-sm rounded-lg sm:rounded-xl"
            >
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Lancer le QCM officiel
            </Button>
          </Card>
        ) : (
          <div className="space-y-1.5 sm:space-y-2.5">
            {subjects.map((subject) => {
              const subjectGrades = filteredGrades.filter(
                (g) => g.subject_id === subject.id
              )
              const avg = getSubjectAverage(subject.id)

              return (
                <div
                  key={subject.id}
                  className="bg-surface rounded-xl sm:rounded-2xl border border-border/80 p-2 sm:p-3 shadow-2xs hover:border-primary-300 transition-all space-y-1 sm:space-y-1.5"
                >
                  {/* Ligne 1 : Nom Matière, Coef, Badge Essai gratuit, Bouton + Note, Moyenne & Corbeille */}
                  <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                    {/* Gauche : Pastille couleur + Nom + Coef + Badge Quota */}
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-wrap">
                      <span
                        className="h-2 w-2 sm:h-3 sm:w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: subject.color }}
                      />
                      <h3 className="font-extrabold text-[11.5px] sm:text-sm text-text-primary truncate">
                        {subject.name}
                      </h3>
                      <EditableCoefficientBadge
                        subjectId={subject.id}
                        subjectName={subject.name}
                        currentCoefficient={subject.coefficient}
                        onUpdate={handleUpdateSubjectCoefficient}
                      />
                      {!isSubscribed && (
                        <span className="text-[7.5px] sm:text-[9px] font-bold px-1 sm:px-1.5 py-0.1 sm:py-0.2 rounded-md bg-primary-50 text-primary-900 border border-primary-200">
                          1 note max
                        </span>
                      )}
                    </div>

                    {/* Droite : Bouton "+ Note", Moyenne & Supprimer */}
                    <div className="flex items-center gap-1 sm:gap-2.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => openAddGradeForSubject(subject.id)}
                        className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700 text-[9px] sm:text-xs font-bold border border-primary-200 shadow-2xs transition-all active:scale-95 cursor-pointer"
                        title={`Ajouter une note en ${subject.name}`}
                      >
                        <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-600" />
                        <span className="hidden sm:inline">Ajouter une note</span>
                        <span className="sm:hidden">Note</span>
                      </button>

                      <div className="flex items-center gap-0.5 sm:gap-1 bg-surface-secondary px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg border border-border/80">
                        <span className="text-[8px] text-text-tertiary font-bold uppercase hidden sm:inline">
                          Moy.
                        </span>
                        <span className="text-[11px] sm:text-sm font-black text-text-primary">
                          {avg !== null ? `${avg}/20` : '—'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({ type: 'subject', id: subject.id })
                        }
                        className="p-0.5 sm:p-1 rounded-lg text-text-tertiary hover:text-error-600 hover:bg-error-50 transition-colors"
                        title="Supprimer la matière"
                      >
                        <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Ligne 2 : Pastilles des notes (Compactes) */}
                  <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap pt-0.5 sm:pt-1 border-t border-border/40">
                    {subjectGrades.length === 0 ? (
                      <div className="flex items-center justify-between w-full text-[9px] sm:text-[11px] py-0.1">
                        <span className="text-text-tertiary italic">
                          Aucune note enregistrée ce trimestre.
                        </span>
                        <button
                          type="button"
                          onClick={() => openAddGradeForSubject(subject.id)}
                          className="font-bold text-primary-600 hover:text-primary-700 hover:underline inline-flex items-center gap-0.5 cursor-pointer text-[9px] sm:text-[11px]"
                        >
                          <Plus className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                          <span>Saisir la 1ère note</span>
                        </button>
                      </div>
                    ) : (
                      subjectGrades.map((grade) => (
                        <div
                          key={grade.id}
                          className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-md sm:rounded-lg border text-[9px] sm:text-[11px] font-semibold shadow-2xs ${
                            grade.is_simulated
                              ? 'bg-amber-50/80 border-amber-300 text-amber-900 border-dashed'
                              : 'bg-surface-secondary/90 border-border text-text-primary'
                          }`}
                        >
                          <span className="font-black text-[9.5px] sm:text-[11px]">
                            {grade.value}/{grade.out_of}
                          </span>
                          {grade.coefficient !== 1 && (
                            <span className="text-[7.5px] sm:text-[8px] text-text-tertiary">
                              (x{grade.coefficient})
                            </span>
                          )}
                          {grade.label && (
                            <span className="text-[8px] sm:text-[10px] text-text-secondary font-normal truncate max-w-[80px] sm:max-w-[100px]">
                              • {grade.label}
                            </span>
                          )}
                          {grade.is_simulated && (
                            <span className="text-[6.5px] sm:text-[7px] font-extrabold px-0.5 py-0 rounded bg-amber-200/80 text-amber-900 uppercase">
                              Simulé
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget({ type: 'grade', id: grade.id })
                            }
                            className="text-text-tertiary hover:text-error-600 ml-0.5 text-[10px] sm:text-xs font-bold leading-none cursor-pointer"
                            title="Supprimer cette note"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal: Add Subject */}
      <Modal
        isOpen={showAddSubject}
        onClose={() => setShowAddSubject(false)}
        title="Ajouter une matière"
      >
        <form onSubmit={handleAddSubject} className="space-y-4">
          <Combobox
            name="name"
            label="Nom de la matière"
            placeholder="ex: Mathématiques, Philosophie..."
            options={SUBJECT_SUGGESTIONS.map((s) => ({
              value: s.name,
              label: s.name,
              icon: s.emoji,
              group: s.group,
            }))}
            required
          />
          <Input
            name="coefficient"
            label="Coefficient"
            type="number"
            step="0.5"
            min="0.5"
            defaultValue="1"
            required
          />
          <Input
            name="teacherName"
            label="Nom du professeur (optionnel)"
            placeholder="ex: M. Roche"
          />

          <div className="flex justify-end gap-2 pt-1.5 sm:pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowAddSubject(false)}
            >
              Annuler
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Ajouter la matière
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Grade */}
      <Modal
        isOpen={showAddGrade}
        onClose={() => setShowAddGrade(false)}
        title="Ajouter une note"
      >
        <form onSubmit={handleAddGrade} className="space-y-2 sm:space-y-3.5">
          <Select
            name="subjectId"
            label="Matière"
            defaultValue={selectedSubjectForGrade || subjects[0]?.id}
            options={subjects.map((s) => ({ value: s.id, label: s.name }))}
            required
          />
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Input
              name="value"
              label="Note obtenue"
              type="number"
              step="0.25"
              min="0"
              placeholder="ex: 15.5"
              required
            />
            <Input
              name="outOf"
              label="Sur"
              type="number"
              defaultValue="20"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <Input
              name="coefficient"
              label="Coefficient"
              type="number"
              step="0.5"
              defaultValue="1"
              required
            />
            <DatePicker
              name="date"
              label="Date"
              defaultValue={new Date().toISOString().split('T')[0]}
            />
          </div>
          <Input
            name="label"
            label="Intitulé du devoir (optionnel)"
            placeholder="ex: DS Dérivées, Interro..."
          />

          {/* Toggle Simulated Mode */}
          <div className="p-2 sm:p-2.5 bg-amber-50/90 rounded-xl border border-amber-200 flex items-center justify-between text-[11px] sm:text-xs gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-amber-900 text-[11px] sm:text-xs">Mode Simulation d&apos;hypothèse DS</p>
              <p className="text-[10px] sm:text-[11px] text-amber-700 leading-tight">
                Coche pour tester l&apos;impact sans enregistrer une note réelle.
              </p>
            </div>
            <input
              type="checkbox"
              name="isSimulated"
              id="isSimulated"
              className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500 cursor-pointer flex-shrink-0"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1.5 sm:pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowAddGrade(false)}
            >
              Annuler
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Ajouter la note
            </Button>
          </div>
        </form>
      </Modal>

      {/* Curriculum QCM Modal */}
      <CurriculumSetupModal
        isOpen={showCurriculumModal}
        onClose={() => setShowCurriculumModal(false)}
        onComplete={handleApplyCurriculum}
      />

      {/* Paywall Pro Upgrade Modal */}
      <PaywallModal
        isOpen={showPaywallModal}
        onClose={() => setShowPaywallModal(false)}
        featureLocked="grade_limit"
        description="En version Découverte, le simulateur est limité à 1 seule note par matière. Passe à l'offre Pro pour enregistrer toutes tes notes réelles et prédictions de DS !"
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={
          deleteTarget?.type === 'subject'
            ? 'Supprimer cette matière ?'
            : 'Supprimer cette note ?'
        }
        message={
          deleteTarget?.type === 'subject'
            ? 'Toutes les notes associées à cette matière seront également supprimées définitivement.'
            : 'Cette note sera retirée du calcul de tes moyennes pondérées.'
        }
        isLoading={isSubmitting}
      />
    </div>
  )
}
