'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppProfile } from '@/lib/contexts/AppProfileContext'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { DatePicker } from '@/components/ui/DatePicker'
import { TimePicker, formatToFrenchTimeDisplay } from '@/components/ui/TimePicker'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { DashboardPlanningGrid } from '@/components/dashboard/DashboardPlanningGrid'
import { PaywallGuard } from '@/components/paywall/PaywallGuard'
import {
  CalendarDays,
  Upload,
  Plus,
  Trash2,
  Sparkles,
  Clock,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  Zap,
  Lock,
  Edit3,
  Check,
  Palette,
  Camera,
  FileImage,
  X,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { compressImage } from '@/lib/utils/image-compression'
import type { Schedule, Profile, PlanningSlot } from '@/types/database'

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const SHORT_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
// Plage horaire étendue de 5h00 du matin à 00h00 (Minuit)
const PLANNING_HOURS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0]

const DEFAULT_MOCK_SCHEDULE: Schedule = {
  id: 'sched-mock-001',
  user_id: 'mock-user-001',
  week_start: new Date().toISOString().split('T')[0],
  timetable_image_url: null,
  constraints: { maxDailyStudyHours: 3 },
  homework: [],
  generated_plan: [
    // LUNDI
    { day: 0, startTime: '08:00', endTime: '10:00', subject: 'Mathématiques', task: 'Cours obligatoire', type: 'class' },
    { day: 0, startTime: '10:00', endTime: '12:00', subject: 'Physique-Chimie', task: 'TP en laboratoire', type: 'class' },
    { day: 0, startTime: '14:00', endTime: '16:00', subject: 'Philosophie', task: 'Cours obligatoire', type: 'class' },
    { day: 0, startTime: '17:00', endTime: '18:00', subject: 'Mathématiques', task: 'Révision DS Dérivées & TVI', type: 'study' },
    { day: 0, startTime: '18:00', endTime: '19:00', subject: 'Physique-Chimie', task: 'Quiz formules Thermodynamique', type: 'study' },

    // MARDI
    { day: 1, startTime: '08:00', endTime: '10:00', subject: 'SES', task: 'Cours obligatoire', type: 'class' },
    { day: 1, startTime: '10:00', endTime: '12:00', subject: 'Histoire-Géo', task: 'Cours obligatoire', type: 'class' },
    { day: 1, startTime: '14:00', endTime: '16:00', subject: 'Mathématiques', task: 'Cours obligatoire', type: 'class' },
    { day: 1, startTime: '17:30', endTime: '18:30', subject: 'Histoire-Géo', task: 'Croquis géopolitique Europe', type: 'study' },

    // MERCREDI
    { day: 2, startTime: '08:00', endTime: '12:00', subject: 'Physique-Chimie', task: 'Cours & Exercices', type: 'class' },
    { day: 2, startTime: '14:00', endTime: '15:30', subject: 'Philosophie', task: 'Plan de dissertation La Vérité', type: 'study' },

    // JEUDI
    { day: 3, startTime: '08:00', endTime: '10:00', subject: 'Philosophie', task: 'Cours obligatoire', type: 'class' },
    { day: 3, startTime: '10:00', endTime: '12:00', subject: 'Mathématiques', task: 'Cours obligatoire', type: 'class' },
    { day: 3, startTime: '14:00', endTime: '16:00', subject: 'Anglais', task: 'Cours obligatoire', type: 'class' },
    { day: 3, startTime: '17:00', endTime: '18:30', subject: 'Mathématiques', task: 'Annales Bac TVI & Continuité', type: 'study' },

    // VENDREDI
    { day: 4, startTime: '08:00', endTime: '10:00', subject: 'Physique-Chimie', task: 'Cours obligatoire', type: 'class' },
    { day: 4, startTime: '10:00', endTime: '12:00', subject: 'Histoire-Géo', task: 'Cours obligatoire', type: 'class' },
    { day: 4, startTime: '14:00', endTime: '16:00', subject: 'Mathématiques', task: 'Cours obligatoire', type: 'class' },
    { day: 4, startTime: '18:00', endTime: '19:00', subject: 'Physique-Chimie', task: 'Exercices transferts thermiques', type: 'study' },

    // SAMEDI
    { day: 5, startTime: '10:00', endTime: '11:30', subject: 'Mathématiques', task: 'Synthèse du week-end', type: 'study' },
  ] as PlanningSlot[],
  status: 'active',
  created_at: new Date().toISOString(),
}

export default function PlanningPage() {
  const supabase = createClient()
  const { userId } = useAppProfile()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activeSchedule, setActiveSchedule] = useState<Schedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [selectedMobileDay, setSelectedMobileDay] = useState<number>(0)
  const [viewMode, setViewMode] = useState<'condensed' | 'full'>('full')
  const [timetableUrl, setTimetableUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('Ajoute une séance de sport tous les soirs de 19h30 à 20h')

  // Événement en cours d'édition / suppression
  const [editingSlot, setEditingSlot] = useState<{
    index: number
    isNew?: boolean
    day: number
    startTime: string
    endTime: string
    subject: string
    task: string
    type: 'class' | 'study' | 'break' | 'other' | 'homework' | 'revision'
    activity?: string
  } | null>(null)
  const [savingSlot, setSavingSlot] = useState(false)

  async function handleSaveSlot(e: React.FormEvent) {
    e.preventDefault()
    if (!editingSlot) return

    setSavingSlot(true)
    try {
      const rawPlan = activeSchedule?.generated_plan || []
      let newPlan: PlanningSlot[]
      const resolvedSubject =
        editingSlot.type === 'other' && editingSlot.activity
          ? editingSlot.activity
          : editingSlot.subject.trim() || (editingSlot.type === 'other' ? 'Activité' : 'Séance')

      const resolvedTask =
        editingSlot.task.trim() ||
        (editingSlot.type === 'other'
          ? editingSlot.activity || 'Activité personnelle'
          : editingSlot.type === 'break'
          ? 'Pause détente'
          : 'Révision')

      if (editingSlot.isNew) {
        newPlan = [
          ...rawPlan,
          {
            day: editingSlot.day,
            startTime: editingSlot.startTime,
            endTime: editingSlot.endTime,
            subject: resolvedSubject,
            task: resolvedTask,
            type: editingSlot.type,
            activity: editingSlot.activity,
          },
        ]
      } else {
        newPlan = rawPlan.map((slot, idx) =>
          idx === editingSlot.index
            ? {
                ...slot,
                day: editingSlot.day,
                startTime: editingSlot.startTime,
                endTime: editingSlot.endTime,
                subject: resolvedSubject,
                task: resolvedTask,
                type: editingSlot.type,
                activity: editingSlot.activity,
              }
            : slot
        )
      }

      // Tri chronologique : Jour (0-6) puis heure de début
      newPlan.sort((a, b) => {
        if (a.day !== b.day) return a.day - b.day
        return a.startTime.localeCompare(b.startTime)
      })

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const weekStart = activeSchedule?.week_start || new Date().toISOString().split('T')[0]
        const { data: saved, error } = await supabase
          .from('schedules')
          .upsert(
            {
              user_id: user.id,
              week_start: weekStart,
              generated_plan: newPlan,
              homework: activeSchedule?.homework || [],
              constraints: activeSchedule?.constraints || {},
              status: 'active',
            },
            { onConflict: 'user_id,week_start' }
          )
          .select()
          .single()

        if (error) throw error
        setActiveSchedule(saved)
      } else {
        const updated = { ...activeSchedule, generated_plan: newPlan } as Schedule
        setActiveSchedule(updated)
        localStorage.setItem('optinote_schedule', JSON.stringify(updated))
      }

      toast.success(editingSlot.isNew ? 'Créneau ajouté au planning ! ✨' : 'Créneau mis à jour ! 📅')
      setEditingSlot(null)
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors de la mise à jour du créneau.')
    } finally {
      setSavingSlot(false)
    }
  }

  async function handleDeleteSlot(slotIndex: number) {
    if (!activeSchedule) return
    setSavingSlot(true)
    try {
      const rawPlan = activeSchedule.generated_plan || []
      const newPlan = rawPlan.filter((_, idx) => idx !== slotIndex)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const weekStart = activeSchedule.week_start || new Date().toISOString().split('T')[0]
        const { data: saved, error } = await supabase
          .from('schedules')
          .upsert(
            {
              user_id: user.id,
              week_start: weekStart,
              generated_plan: newPlan,
              homework: activeSchedule.homework || [],
              constraints: activeSchedule.constraints || {},
              status: 'active',
            },
            { onConflict: 'user_id,week_start' }
          )
          .select()
          .single()

        if (error) throw error
        setActiveSchedule(saved)
      } else {
        const updated = { ...activeSchedule, generated_plan: newPlan }
        setActiveSchedule(updated)
        localStorage.setItem('optinote_schedule', JSON.stringify(updated))
      }

      toast.success('Créneau supprimé du planning ! 🗑️')
      setEditingSlot(null)
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors de la suppression.')
    } finally {
      setSavingSlot(false)
    }
  }

  // ═══════════════════════════════════════════════════════
  // SCANNER D'EMPLOI DU TEMPS PAR PHOTO (IA VISION)
  // ═══════════════════════════════════════════════════════
  const [showScanModal, setShowScanModal] = useState(false)
  const [scanPhotoUrl, setScanPhotoUrl] = useState<string | null>(null)
  const [scanPhotoName, setScanPhotoName] = useState<string>('')
  const [scanPhotoSize, setScanPhotoSize] = useState<number>(0)
  const [compressingPhoto, setCompressingPhoto] = useState(false)
  const [scanningTimetable, setScanningTimetable] = useState(false)
  const [replaceExistingClassesOnly, setReplaceExistingClassesOnly] = useState(true)
  const scanFileInputRef = useRef<HTMLInputElement>(null)

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setCompressingPhoto(true)
    try {
      toast.loading('Optimisation de la photo pour l’IA...', { id: 'scan-compress' })
      const compressed = await compressImage(file, {
        maxWidth: 1800,
        maxHeight: 1800,
        quality: 0.85,
        format: 'image/jpeg',
      })
      toast.dismiss('scan-compress')
      setScanPhotoUrl(compressed.dataUrl)
      setScanPhotoName(file.name)
      setScanPhotoSize(compressed.compressedSizeBytes)
      toast.success('Photo prête pour l’analyse IA ! 📸')
    } catch {
      toast.error('Impossible de charger cette image.')
    } finally {
      setCompressingPhoto(false)
    }
  }

  function handleResetScanPhoto() {
    setScanPhotoUrl(null)
    setScanPhotoName('')
    setScanPhotoSize(0)
    if (scanFileInputRef.current) {
      scanFileInputRef.current.value = ''
    }
  }

  async function handleExecuteScanTimetable(e: React.FormEvent) {
    e.preventDefault()
    if (!scanPhotoUrl) {
      toast.error('Veuillez importer une photo de votre emploi du temps.')
      return
    }

    setScanningTimetable(true)
    toast.loading('L\'IA Vision analyse l\'emploi du temps...', { id: 'scan-ai' })

    try {
      const res = await fetch('/api/ai/scanner-timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: scanPhotoUrl,
        }),
      })

      toast.dismiss('scan-ai')

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.error || 'Erreur lors de l’analyse.')
      }

      const data = await res.json()
      const newClasses: PlanningSlot[] = data.timetable || []

      if (newClasses.length === 0) {
        throw new Error('Aucun cours n’a pu être extrait. Assure-toi que la photo est nette.')
      }

      const existingPlan = activeSchedule?.generated_plan || []
      let mergedPlan: PlanningSlot[]

      if (replaceExistingClassesOnly) {
        const nonClasses = existingPlan.filter((s) => s.type !== 'class')
        mergedPlan = [...nonClasses, ...newClasses]
      } else {
        mergedPlan = [...newClasses]
      }

      mergedPlan.sort((a, b) => {
        if (a.day !== b.day) return a.day - b.day
        return a.startTime.localeCompare(b.startTime)
      })

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const weekStart = activeSchedule?.week_start || new Date().toISOString().split('T')[0]
        const { data: saved, error } = await supabase
          .from('schedules')
          .upsert(
            {
              user_id: user.id,
              week_start: weekStart,
              timetable_image_url: scanPhotoUrl,
              generated_plan: mergedPlan,
              homework: activeSchedule?.homework || [],
              constraints: activeSchedule?.constraints || {},
              status: 'active',
            },
            { onConflict: 'user_id,week_start' }
          )
          .select()
          .single()

        if (error) throw error
        setActiveSchedule(saved)
      } else {
        const updatedSchedule = {
          ...activeSchedule,
          timetable_image_url: scanPhotoUrl,
          generated_plan: mergedPlan,
        } as Schedule
        setActiveSchedule(updatedSchedule)
        localStorage.setItem('optinote_schedule', JSON.stringify(updatedSchedule))
      }

      toast.success(`✨ ${newClasses.length} cours officiels importés et positionnés !`)
      setShowScanModal(false)
      handleResetScanPhoto()
    } catch (err: unknown) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Échec de l’analyse automatique.')
    } finally {
      setScanningTimetable(false)
    }
  }

  async function loadSchedule() {
    try {
      const { data: pData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (pData) setProfile(pData)

      const { data } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data && data.generated_plan) {
        setActiveSchedule(data)
      } else {
        setActiveSchedule(null)
      }
    } catch {
      setActiveSchedule(null)
    } finally {
      setLoading(false)
    }
  }

  // Réinitialise pendant le rendu quand il n'y a pas (ou plus) d'utilisateur
  // (plutôt qu'un setState synchrone dans l'effect, qui ne garde alors que l'appel
  // asynchrone à loadSchedule). Valeurs constantes : React ignore les re-renders
  // si l'état est déjà identique, donc pas besoin de détecter un changement ici.
  if (!userId) {
    setActiveSchedule(null)
    setLoading(false)
  }

  useEffect(() => {
    if (!userId) return
    // loadSchedule() commence par un await avant tout setState : aucun re-render en
    // cascade réel, mais l'analyse statique ne trace pas l'intérieur de l'appel.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSchedule()
  }, [userId])

  async function handleUploadTimetable(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const fileName = `${user.id}/${Date.now()}-${file.name}`
        const { error } = await supabase.storage
          .from('timetable-images')
          .upload(fileName, file)

        if (!error) {
          const {
            data: { publicUrl },
          } = supabase.storage
            .from('timetable-images')
            .getPublicUrl(fileName)

          setTimetableUrl(publicUrl)
          toast.success('Emploi du temps importé !')
        }
      } else {
        setTimetableUrl(URL.createObjectURL(file))
        toast.success('Emploi du temps chargé !')
      }
    } catch {
      toast.success('Emploi du temps chargé !')
    } finally {
      setUploading(false)
    }
  }

  async function handleAdjustWithAI(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setGenerating(true)

    const promptToSend = aiPrompt.trim() || 'Ajoute une séance de sport tous les soirs de 19h30 à 20h'

    try {
      const response = await fetch('/api/ai/adjust-planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend,
          currentPlan: activeSchedule?.generated_plan || [],
          weekStart: activeSchedule?.week_start || new Date().toISOString().split('T')[0],
        }),
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}))
        throw new Error(errJson.error || 'Erreur lors de l’ajustement.')
      }

      const data = await response.json()
      const updatedPlan = data.plan || []

      const updatedSchedule: Schedule = {
        ...(activeSchedule || DEFAULT_MOCK_SCHEDULE),
        generated_plan: updatedPlan,
        updated_at: new Date().toISOString(),
      }

      setActiveSchedule(updatedSchedule)
      try {
        localStorage.setItem('optinote_mock_schedule', JSON.stringify(updatedSchedule))
      } catch {}

      toast.success(
        data.message || 'Emploi du temps ajusté avec l’IA ! ✨',
        { duration: 5000, icon: '🪄' }
      )
    } catch (err: unknown) {
      console.error('Error adjusting timetable with AI:', err)
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l’ajustement avec l’IA.')
    } finally {
      setGenerating(false)
    }
  }

  // Ancien fallback / génération de base
  async function handleGenerate(e: React.FormEvent<HTMLFormElement>) {
    await handleAdjustWithAI(e)
  }

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto pb-10">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    )
  }

  const generatedPlan = (activeSchedule?.generated_plan as Array<{
    day: number
    startTime: string
    endTime: string
    subject: string
    task: string
    type: 'class' | 'study' | 'break' | 'other' | 'homework' | 'revision'
    activity?: string
  }>) || []

  // Filter tasks for selected mobile day
  const dailyTasks = generatedPlan.filter((s) => s.day === selectedMobileDay)
  const studyTasksCount = dailyTasks.filter((s) => s.type === 'study').length

  return (
    <PaywallGuard
      profile={profile}
      title="Planning Hebdomadaire & IA (Pro) ⚡"
      description="Génère automatiquement ton emploi du temps de travail équilibré par IA, gère tes devoirs et optimise ton temps de révision."
    >
      <div className="space-y-2.5 sm:space-y-4 max-w-5xl mx-auto pb-24 sm:pb-10 animate-fade-in">
      {/* Header & Controls - Ultra compact & discret sur mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 bg-surface p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-border shadow-2xs">
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-xs sm:text-lg font-bold text-text-primary tracking-tight">
              Planning Intelligent IA 📅
            </h1>
            <span className="text-[8px] sm:text-[9.5px] font-bold px-1.5 py-0.2 rounded-full bg-primary-50 text-primary-700 border border-primary-100">
              Semaine active
            </span>
          </div>
          <p className="text-[9px] sm:text-xs text-text-tertiary mt-0.2">
            Séances de révision adaptées à tes devoirs & créneaux libres.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Bouton Scanner Emploi du Temps */}
          <button
            type="button"
            onClick={() => setShowScanModal(true)}
            className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 shadow-2xs transition-all cursor-pointer active:scale-95"
          >
            <Camera className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span>Scanner emploi du temps</span>
          </button>

          {/* Notification switch */}
          <button
            type="button"
            onClick={() => {
              const next = !notificationsEnabled
              setNotificationsEnabled(next)
              toast.success(next ? 'Rappels IA activés' : 'Rappels désactivés')
            }}
            className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-bold border transition-all cursor-pointer ${
              notificationsEnabled
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs'
                : 'bg-surface-secondary text-text-tertiary border-border'
            }`}
          >
            <span>🔔</span>
            <span className="font-extrabold">{notificationsEnabled ? 'Rappels actifs' : 'Rappels off'}</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          GRILLE D'EMPLOI DU TEMPS & RÉVISIONS
          (Composant, dimensions et styles strictement identiques au Dashboard)
          ═══════════════════════════════════════════════════════ */}
      {!activeSchedule && (
        <div className="h-[180px] sm:h-[220px] rounded-2xl border border-dashed border-border bg-surface-secondary/40 flex flex-col items-center justify-center text-center gap-1.5 px-4">
          <Sparkles className="h-6 w-6 text-primary-500" />
          <p className="text-xs sm:text-sm font-bold text-text-primary">Aucun planning pour le moment</p>
          <p className="text-[10px] sm:text-[11px] text-text-tertiary max-w-xs">
            Génère ton emploi du temps avec l&apos;IA juste en dessous, ou scanne ton emploi du temps papier.
          </p>
        </div>
      )}

      {activeSchedule && (
        <div className="h-[290px] sm:h-[340px]">
          <DashboardPlanningGrid
            schedule={activeSchedule}
            isLocked={false}
            title="Mon Emploi du Temps"
            subtitle="Grille compacte (5h - 00h) • Clique pour modifier"
            showManageButton={false}
            onSlotClick={(slot, rawIndex) => {
              setEditingSlot({
                index: rawIndex,
                isNew: false,
                day: slot.day,
                startTime: slot.startTime,
                endTime: slot.endTime,
                subject: slot.subject,
                task: slot.task,
                type: slot.type,
                activity: slot.activity,
              })
            }}
            onAddSlot={(dayIdx, hour) => {
              setEditingSlot({
                index: -1,
                isNew: true,
                day: dayIdx,
                startTime: `${String(hour).padStart(2, '0')}:00`,
                endTime: `${String(hour === 23 ? 0 : hour + 1).padStart(2, '0')}:00`,
                subject: '',
                task: '',
                type: 'study',
              })
            }}
          />
        </div>
      )}

      {/* Generator form */}
      <Card className="p-3.5 sm:p-5">
        <CardHeader className="p-0 pb-3 border-b border-border mb-3">
          <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary-600" />
            <span>Générer ou ajuster mon planning IA</span>
          </CardTitle>
        </CardHeader>

        <form onSubmit={handleGenerate} className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Week start (Datepicker localisé en français) */}
            <DatePicker
              name="weekStart"
              label="Semaine du"
              defaultValue={new Date().toISOString().split('T')[0]}
              required
            />

            {/* Timetable upload */}
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1">
                Photo de l&apos;emploi du temps (Optionnel)
              </label>
              <label className="flex items-center justify-center gap-2 h-10 border border-dashed border-border rounded-xl hover:border-primary-400 hover:bg-primary-50/20 transition-all cursor-pointer px-3">
                <Upload className="h-4 w-4 text-primary-600" />
                <span className="text-xs text-text-secondary truncate">
                  {uploading
                    ? 'Upload...'
                    : timetableUrl
                    ? 'Photo importée ✓'
                    : 'Importer une photo'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadTimetable}
                  className="hidden"
                />
              </label>
            </div>
          </div>



          {/* Champ de requête IA en langage naturel */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-text-primary flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary-600" />
                <span>Que souhaites-tu ajouter ou modifier dans ton planning ?</span>
              </span>
              <span className="text-[10px] text-text-tertiary font-normal">Langage naturel</span>
            </label>
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ex: Ajoute une séance de sport tous les soirs de 19h30 à 20h"
              rows={2}
              className="text-xs focus:border-primary-500 rounded-xl"
            />
            {/* Suggestions rapides cliquables */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <span className="text-[10px] font-bold text-text-tertiary self-center">Idées :</span>
              {[
                '⚽ Sport tous les soirs 19h30-20h',
                '📐 Révision Maths mercredi 14h-15h30',
                '⚡ TP Physique samedi 10h-11h',
                '🎵 Piano mardi et jeudi 18h-19h',
              ].map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setAiPrompt(sug.slice(2).trim())}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-surface-secondary hover:bg-primary-50 text-text-secondary hover:text-primary-700 border border-border/80 transition-colors cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full font-bold text-xs sm:text-sm py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white shadow-xs"
            size="lg"
            isLoading={generating}
            leftIcon={<Sparkles className="h-4 w-4" />}
          >
            {generating ? 'Ajustement en cours par l’IA...' : "Ajuste mon emploi du temps avec l'IA"}
          </Button>
        </form>
      </Card>

      {/* Modal d'édition / déplacement / suppression de créneau */}
      <Modal
        isOpen={editingSlot !== null}
        onClose={() => setEditingSlot(null)}
        title={editingSlot?.isNew ? 'Ajouter un créneau au planning' : 'Modifier le créneau'}
      >
        <form onSubmit={handleSaveSlot} className="space-y-3.5">
          {/* Switcher Type de créneau avec catégorie "Autre" */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1.5">
              Type de créneau :
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setEditingSlot((prev) => (prev ? { ...prev, type: 'study' } : null))
                }
                className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                  editingSlot?.type === 'study'
                    ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                    : 'bg-surface-secondary text-text-secondary border-border hover:text-text-primary'
                }`}
              >
                <span>⚡ Révision IA</span>
                <span className="text-[9px] font-normal opacity-80">Extrascolaire</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setEditingSlot((prev) => (prev ? { ...prev, type: 'class' } : null))
                }
                className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                  editingSlot?.type === 'class'
                    ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                    : 'bg-surface-secondary text-text-secondary border-border hover:text-text-primary'
                }`}
              >
                <span>🏫 Cours Lycée</span>
                <span className="text-[9px] font-normal opacity-80">Créneau occupé</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setEditingSlot((prev) => (prev ? { ...prev, type: 'break' } : null))
                }
                className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                  editingSlot?.type === 'break'
                    ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                    : 'bg-surface-secondary text-text-secondary border-border hover:text-text-primary'
                }`}
              >
                <span>☕ Pause</span>
                <span className="text-[9px] font-normal opacity-80">Détente</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setEditingSlot((prev) =>
                    prev
                      ? {
                          ...prev,
                          type: 'other',
                          activity: prev.activity || 'Sport',
                          subject: prev.subject || 'Sport',
                        }
                      : null
                  )
                }
                className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-0.5 ${
                  editingSlot?.type === 'other'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-surface-secondary text-text-secondary border-border hover:text-text-primary'
                }`}
              >
                <span>🎨 Autre</span>
                <span className="text-[9px] font-normal opacity-80">Sport, Loisir...</span>
              </button>
            </div>
          </div>

          {/* Section dynamique pour la catégorie "Autre" */}
          {editingSlot?.type === 'other' && (
            <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2">
              <label className="block text-xs font-bold text-indigo-950">
                Préciser l&apos;activité :
              </label>

              {/* Pastilles rapides d'activités */}
              <div className="flex flex-wrap gap-1">
                {[
                  { label: '⚽ Sport', val: 'Sport' },
                  { label: '🎨 Loisir / Art', val: 'Loisir' },
                  { label: '🎵 Musique', val: 'Musique' },
                  { label: '🩺 Rendez-vous', val: 'Rendez-vous' },
                  { label: '🎉 Sortie', val: 'Sortie' },
                  { label: '📚 Lecture', val: 'Lecture' },
                  { label: '💼 Stage / Job', val: 'Stage' },
                ].map((act) => (
                  <button
                    key={act.val}
                    type="button"
                    onClick={() =>
                      setEditingSlot((prev) =>
                        prev
                          ? {
                              ...prev,
                              activity: act.val,
                              subject: act.val,
                              task: prev.task || act.val,
                            }
                          : null
                      )
                    }
                    className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                      editingSlot.activity === act.val
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                        : 'bg-surface text-indigo-900 border-indigo-200 hover:bg-indigo-100'
                    }`}
                  >
                    {act.label}
                  </button>
                ))}
              </div>

              <Input
                value={editingSlot.activity || ''}
                onChange={(e) => {
                  const val = e.target.value
                  setEditingSlot((prev) =>
                    prev
                      ? {
                          ...prev,
                          activity: val,
                          subject: val || prev.subject,
                        }
                      : null
                  )
                }}
                placeholder="ex: Football, Tennis, Cours de guitare, Médecin..."
                required
              />
            </div>
          )}

          {/* Matière / Intitulé */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              {editingSlot?.type === 'other' ? 'Titre affiché :' : 'Matière :'}
            </label>
            <Input
              value={editingSlot?.subject || ''}
              onChange={(e) =>
                setEditingSlot((prev) => (prev ? { ...prev, subject: e.target.value } : null))
              }
              placeholder={
                editingSlot?.type === 'other'
                  ? 'ex: Entraînement de foot, Piano...'
                  : 'ex: Mathématiques, Physique-Chimie, Histoire...'
              }
              required
            />
          </div>

          {/* Jour de la semaine */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1.5">
              Jour de la semaine :
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
              {DAYS.map((dName, dIdx) => {
                const isSelected = editingSlot?.day === dIdx
                return (
                  <button
                    key={dIdx}
                    type="button"
                    onClick={() =>
                      setEditingSlot((prev) => (prev ? { ...prev, day: dIdx } : null))
                    }
                    className={`py-1.5 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      isSelected
                        ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                        : 'bg-surface-secondary text-text-secondary border-border hover:bg-surface'
                    }`}
                  >
                    {SHORT_DAYS[dIdx]}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Horaires : Début & Fin au format 24h français */}
          <div className="grid grid-cols-2 gap-2">
            <TimePicker
              label="Heure de début :"
              value={editingSlot?.startTime || '17:00'}
              onChange={(val) =>
                setEditingSlot((prev) => (prev ? { ...prev, startTime: val } : null))
              }
              required
            />
            <TimePicker
              label="Heure de fin :"
              value={editingSlot?.endTime || '18:00'}
              onChange={(val) =>
                setEditingSlot((prev) => (prev ? { ...prev, endTime: val } : null))
              }
              required
            />
          </div>

          {/* Tâche ou Objectif */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1">
              {editingSlot?.type === 'other' ? 'Détails / Lieu :' : 'Objectif ou Tâche associée :'}
            </label>
            <Input
              value={editingSlot?.task || ''}
              onChange={(e) =>
                setEditingSlot((prev) => (prev ? { ...prev, task: e.target.value } : null))
              }
              placeholder={
                editingSlot?.type === 'other'
                  ? 'ex: Stade municipal, Chapitre 3, Match à domicile...'
                  : 'ex: Révision DS Dérivées, Exercices p.128, Annales Bac...'
              }
              required
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
            {!editingSlot?.isNew ? (
              <button
                type="button"
                onClick={() => handleDeleteSlot(editingSlot!.index)}
                disabled={savingSlot}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-error-600 bg-error-50 hover:bg-error-100 border border-error-200 transition-all cursor-pointer inline-flex items-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Supprimer</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setEditingSlot(null)}
                disabled={savingSlot}
              >
                Annuler
              </Button>
              <Button type="submit" size="sm" isLoading={savingSlot}>
                {editingSlot?.isNew ? 'Ajouter au planning' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* ═══════════════════════════════════════════════════════
          MODAL SCANNER D'EMPLOI DU TEMPS PAR PHOTO (IA VISION)
          ═══════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showScanModal}
        onClose={() => {
          if (!scanningTimetable) {
            setShowScanModal(false)
          }
        }}
        title="Scanner mon emploi du temps en photo 📸"
      >
        <form onSubmit={handleExecuteScanTimetable} className="space-y-4">
          <p className="text-xs text-text-secondary leading-relaxed">
            Prends en photo ton emploi du temps (capture Pronote, ÉcoleDirecte, tableau ou polycopié papier). L&apos;IA Vision extrait automatiquement tous tes cours officiels du lundi au vendredi et les intègre instantanément à ton planning.
          </p>

          {/* Photo Dropzone / Camera Area */}
          {!scanPhotoUrl ? (
            <label
              htmlFor="timetable-scan-file"
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                compressingPhoto
                  ? 'border-primary-400 bg-primary-50/20 opacity-75 pointer-events-none'
                  : 'border-border hover:border-primary-500 hover:bg-primary-50/10'
              }`}
            >
              <input
                id="timetable-scan-file"
                ref={scanFileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                disabled={compressingPhoto}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2.5 shadow-2xs">
                <Camera className="h-6 w-6" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-text-primary">
                {compressingPhoto ? 'Optimisation en cours...' : 'Prendre une photo ou importer un fichier'}
              </p>
              <p className="text-[10px] sm:text-xs text-text-tertiary mt-1">
                PNG, JPG, HEIC jusqu&apos;à 15 Mo • Traitement IA instantané
              </p>
            </label>
          ) : (
            /* Photo Preview */
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50/30 p-3 space-y-3">
              <div className="relative rounded-xl overflow-hidden max-h-56 bg-surface flex items-center justify-center border border-indigo-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={scanPhotoUrl}
                  alt="Aperçu emploi du temps"
                  className="max-h-56 w-auto object-contain rounded-xl"
                />
                <button
                  type="button"
                  onClick={handleResetScanPhoto}
                  disabled={scanningTimetable}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all cursor-pointer shadow-md"
                  title="Supprimer cette photo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-indigo-950 font-bold min-w-0">
                  <FileImage className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                  <span className="truncate">{scanPhotoName || 'emploi-du-temps.jpg'}</span>
                  {scanPhotoSize > 0 && (
                    <span className="text-[10px] text-indigo-600/80 font-normal flex-shrink-0">
                      ({Math.round(scanPhotoSize / 1024)} Ko)
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => scanFileInputRef.current?.click()}
                  disabled={scanningTimetable}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                >
                  Changer de photo
                </button>
              </div>
            </div>
          )}

          {/* Merge Option */}
          <div className="p-3 rounded-xl bg-surface-secondary border border-border space-y-2">
            <p className="text-[11px] font-bold text-text-primary">
              Mode d&apos;intégration au planning :
            </p>
            <div className="space-y-1.5">
              <label className="flex items-start gap-2 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="mergeMode"
                  checked={replaceExistingClassesOnly}
                  onChange={() => setReplaceExistingClassesOnly(true)}
                  className="mt-0.5 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span className="font-bold text-text-primary">
                    Mettre à jour les cours officiels (Recommandé)
                  </span>
                  <p className="text-[10px] text-text-tertiary">
                    Conserve tes séances de révision IA, devoirs et activités extrascolaires existants.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-2 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="mergeMode"
                  checked={!replaceExistingClassesOnly}
                  onChange={() => setReplaceExistingClassesOnly(false)}
                  className="mt-0.5 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span className="font-bold text-text-primary">
                    Remplacer tout le planning
                  </span>
                  <p className="text-[10px] text-text-tertiary">
                    Repart à neuf avec uniquement les cours détectés sur la photo.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 border-t border-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowScanModal(false)
                handleResetScanPhoto()
              }}
              disabled={scanningTimetable}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={scanningTimetable}
              disabled={!scanPhotoUrl || compressingPhoto}
              className="bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white font-bold"
              leftIcon={<Sparkles className="h-4 w-4" />}
            >
              {scanningTimetable ? 'Analyse Vision en cours...' : 'Analyser et intégrer à mon planning ✨'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
    </PaywallGuard>
  )
}
