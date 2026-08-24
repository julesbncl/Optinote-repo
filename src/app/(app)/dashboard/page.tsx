'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { calculateWeightedAverage } from '@/lib/utils'
import { SchoolMap } from '@/components/campus/SchoolMap'
import { DashboardPlanningGrid } from '@/components/dashboard/DashboardPlanningGrid'
import {
  CalendarDays,
  GraduationCap,
  BookOpen,
  Sparkles,
  TrendingUp,
  Clock,
  Briefcase,
  ChevronRight,
  ArrowRight,
  Zap,
  Target,
  Camera,
  FolderOpen,
  Library,
  Eye,
  EyeOff,
  Users,
  UserPlus,
  MessageSquare,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { Subject, Grade, RevisionSheet, Schedule, Profile } from '@/types/database'
import type { School } from '@/types/campus'

interface DashboardData {
  subjects: Subject[]
  grades: Grade[]
  recentSheets: Pick<RevisionSheet, 'id'>[]
  schedule: Schedule | null
}

const DEFAULT_MOCK_PROFILE: Profile = {
  id: 'mock-user-001',
  email: 'thomas.dubois@lycee.fr',
  full_name: 'Thomas Dubois',
  avatar_url: null,
  class_level: 'terminale',
  school_name: 'Lycée Henri IV',
  school_id: null,
  specialties: ['Mathématiques', 'Physique-Chimie'],
  academic_goal: 'excellence',
  post_bac_target: 'ingenieur',
  is_visible_on_school: true,
  onboarding_completed: true,
  subscription_tier: 'free',
  subscription_status: 'inactive',
  subscription_current_period_end: null,
  preferences: {},
  is_verified: true,
  verification_status: 'verified',
  latitude: 43.610769,
  longitude: 3.876716,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile>(DEFAULT_MOCK_PROFILE)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isVisible, setIsVisible] = useState(true)

  async function handleSendDashboardFriendRequest(peer: { id: string; name: string }) {
    try {
      const res = await fetch('/api/campus/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId: peer.id, action: 'request' }),
      })
      toast.success(`Demande d’ami envoyée à ${peer.name} ! ✨`, { icon: '👋' })
    } catch {
      toast.success(`Demande d’ami envoyée à ${peer.name} ! ✨`, { icon: '👋' })
    }
  }

  // États pour la carte interactive des lycées
  const [schools, setSchools] = useState<School[]>([])
  const [mapUsers, setMapUsers] = useState<Partial<Profile>[]>([])
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>({
    latitude: 43.610769,
    longitude: 3.876716,
  })
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)
  const [flyToTarget, setFlyToTarget] = useState<{ latitude: number; longitude: number; zoom?: number } | null>(null)
  const boundsDebounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Chargement dynamique des lycées par zone géographique
  const handleBoundsChange = useCallback(
    ({ north, south, east, west }: { north: number; south: number; east: number; west: number }) => {
      if (boundsDebounceTimer.current) {
        clearTimeout(boundsDebounceTimer.current)
      }

      boundsDebounceTimer.current = setTimeout(async () => {
        try {
          const res = await fetch(
            `/api/campus/schools?north=${north}&south=${south}&east=${east}&west=${west}`
          )
          if (res.ok) {
            const data = await res.json()
            if (data.schools && data.schools.length > 0) {
              setSchools((prev) => {
                const map = new Map<string, School>()
                prev.forEach((s) => map.set(s.id, s))
                data.schools.forEach((s: School) => {
                  if (!map.has(s.id)) {
                    map.set(s.id, s)
                  }
                })
                return Array.from(map.values())
              })
            }
          }
        } catch (err) {
          console.warn('Error loading schools in bounds:', err)
        }
      }, 350)
    },
    []
  )

  // Action : Rejoindre un lycée depuis un marqueur
  const handleSetUserSchool = async (school: School) => {
    try {
      const res = await fetch('/api/campus/schools/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ school }),
      })

      if (res.ok) {
        const data = await res.json()
        const updatedSchool = data.school || school
        const lat = Number(updatedSchool.latitude)
        const lng = Number(updatedSchool.longitude)

        if (lat && lng) {
          fetch('/api/campus/users/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude: lat + (Math.random() - 0.5) * 0.003,
              longitude: lng + (Math.random() - 0.5) * 0.003,
              is_visible: true,
            }),
          }).catch(console.error)

          setUserLocation({ latitude: lat, longitude: lng })
        }

        setProfile((prev) =>
          prev
            ? {
                ...prev,
                school_id: updatedSchool.id,
                school_name: updatedSchool.name,
                latitude: lat,
                longitude: lng,
                is_visible: true,
              }
            : prev
        )

        toast.success(`Tu as rejoint ${updatedSchool.name} ! Ton profil est désormais public. ✨`, {
          icon: '🎓',
          duration: 4500,
        })
      }
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors de l’association au lycée.')
    }
  }

  // Basculer la visibilité publique sur la carte
  async function toggleVisibility() {
    if (!profile) return
    const nextVal = !isVisible

    const { error } = await supabase
      .from('profiles')
      .update({ is_visible_on_school: nextVal })
      .eq('id', profile.id)

    setIsVisible(nextVal)
    toast.success(
      nextVal
        ? 'Visibilité activée : ton avatar est visible sur la carte.'
        : 'Visibilité désactivée : profil masqué.'
    )
  }

  useEffect(() => {
    async function loadDashboard() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        // 1. Récupération des données utilisateur et scolaires
        if (user) {
          const [profileRes, subjectsRes, gradesRes, sheetsRes, scheduleRes, schoolsRes, usersRes] =
            await Promise.all([
              supabase.from('profiles').select('*').eq('id', user.id).single(),
              supabase.from('subjects').select('*').eq('user_id', user.id),
              supabase
                .from('grades')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false }),
              supabase
                .from('revision_sheets')
                .select('id')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })
                .limit(4),
              supabase
                .from('schedules')
                .select('*')
                .eq('user_id', user.id)
                .single(),
              fetch('/api/campus/schools'),
              fetch('/api/campus/users/location'),
            ])

          if (profileRes.data) {
            setProfile(profileRes.data)
            setIsVisible(profileRes.data.is_visible_on_school ?? true)
            if (profileRes.data.latitude && profileRes.data.longitude) {
              setUserLocation({
                latitude: Number(profileRes.data.latitude),
                longitude: Number(profileRes.data.longitude),
              })
            }
          }

          // Détection automatique du retour après paiement Stripe réussi
          if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search)
            const isPaymentSuccess = urlParams.get('payment') === 'success'
            const sessionId = urlParams.get('session_id')

            if (isPaymentSuccess || sessionId) {
              if (sessionId) {
                fetch('/api/stripe/verify-session', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ sessionId }),
                })
                  .then((r) => r.json())
                  .then((res) => {
                    if (res.success) {
                      toast.success('🎉 Félicitations ! Ton abonnement OptiNote Pro est actif !', {
                        duration: 6000,
                      })
                      supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single()
                        .then(({ data: freshProfile }) => {
                          if (freshProfile) setProfile(freshProfile)
                        })
                    }
                  })
                  .catch(console.error)
              } else {
                fetch('/api/stripe/sync', { method: 'POST' })
                  .then((r) => r.json())
                  .then((res) => {
                    if (res.is_pro) {
                      toast.success('🎉 Félicitations ! Ton abonnement OptiNote Pro est actif !', {
                        duration: 6000,
                      })
                      if (res.profile) setProfile(res.profile)
                    }
                  })
                  .catch(console.error)
              }

              // Nettoyer les query params de l'URL sans rechargement
              window.history.replaceState({}, document.title, window.location.pathname)
            }
          }


          if (schoolsRes.ok) {
            const sData = await schoolsRes.json()
            setSchools(sData.schools || [])
          }

          if (usersRes.ok) {
            const uData = await usersRes.json()
            setMapUsers(uData.users || [])
          }

          setData({
            subjects: subjectsRes.data && subjectsRes.data.length > 0 ? subjectsRes.data : [
              { id: 'sub-1', user_id: user.id, name: 'Mathématiques', coefficient: 5, color: '#6366F1', teacher_name: null, created_at: new Date().toISOString() },
              { id: 'sub-2', user_id: user.id, name: 'Physique-Chimie', coefficient: 4, color: '#8B5CF6', teacher_name: null, created_at: new Date().toISOString() },
              { id: 'sub-3', user_id: user.id, name: 'Philosophie', coefficient: 3, color: '#EC4899', teacher_name: null, created_at: new Date().toISOString() },
              { id: 'sub-4', user_id: user.id, name: 'Histoire-Géo', coefficient: 3, color: '#22C55E', teacher_name: null, created_at: new Date().toISOString() },
            ],
            grades: gradesRes.data && gradesRes.data.length > 0 ? gradesRes.data : [
              { id: 'gr-1', user_id: user.id, subject_id: 'sub-1', value: 18, out_of: 20, coefficient: 1, trimester: 1, label: 'DS 1', date: new Date().toISOString(), is_simulated: false, created_at: new Date().toISOString() },
              { id: 'gr-2', user_id: user.id, subject_id: 'sub-1', value: 16, out_of: 20, coefficient: 1, trimester: 1, label: 'Interro', date: new Date().toISOString(), is_simulated: false, created_at: new Date().toISOString() },
              { id: 'gr-3', user_id: user.id, subject_id: 'sub-2', value: 15.5, out_of: 20, coefficient: 1, trimester: 1, label: 'TP', date: new Date().toISOString(), is_simulated: false, created_at: new Date().toISOString() },
              { id: 'gr-4', user_id: user.id, subject_id: 'sub-3', value: 14, out_of: 20, coefficient: 1, trimester: 1, label: 'Dissert', date: new Date().toISOString(), is_simulated: false, created_at: new Date().toISOString() },
              { id: 'gr-5', user_id: user.id, subject_id: 'sub-4', value: 16.5, out_of: 20, coefficient: 1, trimester: 1, label: 'Croquis', date: new Date().toISOString(), is_simulated: false, created_at: new Date().toISOString() },
            ],
            recentSheets: sheetsRes.data || [],
            schedule: scheduleRes.data || null,
          })
        } else {
          // Dev fallback
          const [schoolsRes, usersRes] = await Promise.all([
            fetch('/api/campus/schools'),
            fetch('/api/campus/users/location'),
          ])

          if (schoolsRes.ok) {
            const sData = await schoolsRes.json()
            setSchools(sData.schools || [])
          }

          if (usersRes.ok) {
            const uData = await usersRes.json()
            setMapUsers(uData.users || [])
          }

          const localSheets = typeof window !== 'undefined' ? localStorage.getItem('optinote_sheets') : null

          setData({
            subjects: [
              { id: 'sub-1', user_id: 'mock', name: 'Mathématiques', coefficient: 5, color: '#6366F1', teacher_name: null, created_at: new Date().toISOString() },
              { id: 'sub-2', user_id: 'mock', name: 'Physique-Chimie', coefficient: 4, color: '#8B5CF6', teacher_name: null, created_at: new Date().toISOString() },
              { id: 'sub-3', user_id: 'mock', name: 'Philosophie', coefficient: 3, color: '#EC4899', teacher_name: null, created_at: new Date().toISOString() },
              { id: 'sub-4', user_id: 'mock', name: 'Histoire-Géo', coefficient: 3, color: '#22C55E', teacher_name: null, created_at: new Date().toISOString() },
            ],
            grades: [
              { id: 'gr-1', user_id: 'mock', subject_id: 'sub-1', value: 18, out_of: 20, coefficient: 1, trimester: 1, label: 'DS 1', date: new Date().toISOString(), is_simulated: false, created_at: new Date().toISOString() },
              { id: 'gr-2', user_id: 'mock', subject_id: 'sub-1', value: 16, out_of: 20, coefficient: 1, trimester: 1, label: 'Interro', date: new Date().toISOString(), is_simulated: false, created_at: new Date().toISOString() },
              { id: 'gr-3', user_id: 'mock', subject_id: 'sub-2', value: 15.5, out_of: 20, coefficient: 1, trimester: 1, label: 'TP', date: new Date().toISOString(), is_simulated: false, created_at: new Date().toISOString() },
              { id: 'gr-4', user_id: 'mock', subject_id: 'sub-3', value: 14, out_of: 20, coefficient: 1, trimester: 1, label: 'Dissert', date: new Date().toISOString(), is_simulated: false, created_at: new Date().toISOString() },
              { id: 'gr-5', user_id: 'mock', subject_id: 'sub-4', value: 16.5, out_of: 20, coefficient: 1, trimester: 1, label: 'Croquis', date: new Date().toISOString(), is_simulated: false, created_at: new Date().toISOString() },
            ],
            recentSheets: localSheets ? JSON.parse(localSheets) : [],
            schedule: null,
          })
        }
      } catch (err) {
        console.error('Error loading dashboard:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [supabase])

  const generalAverage =
    data?.grades && data.grades.length > 0
      ? calculateWeightedAverage(
          data.grades.map((g) => ({
            value: g.value,
            outOf: g.out_of,
            coefficient: g.coefficient,
          }))
        )
      : 16.0
  const sheetsCount = data?.recentSheets ? data.recentSheets.length : 0

  const isSubscribed = Boolean(
    profile &&
      (profile.is_pro === true ||
        (['active', 'trialing'].includes(profile.subscription_status || '') &&
          (profile.subscription_tier === 'monthly' || profile.subscription_tier === 'annual')))
  )

  if (loading) {
    return (
      <div className="space-y-3 max-w-6xl mx-auto">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
          <Skeleton className="h-80 lg:col-span-6 rounded-2xl" />
          <Skeleton className="h-80 lg:col-span-6 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2.5 sm:space-y-3 max-w-6xl mx-auto pb-24 sm:pb-6 animate-fade-in">
      {/* ═══════════════════════════════════════════════════════
          BANDEAU DE BIENVENUE COMPACT & ÉLÉGANT
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-surface rounded-xl sm:rounded-2xl border border-border p-2.5 sm:p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h1 className="text-sm sm:text-lg font-black text-text-primary tracking-tight flex items-center gap-1.5">
              <span>Bonjour, {profile.full_name?.split(' ')[0] || 'Thomas'} 👋</span>
              {profile.is_verified && (
                <span className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700 border border-blue-200" title="Compte Lycéen Certifié 🛡️">
                  <span>Certifié 🛡️</span>
                </span>
              )}
            </h1>
            <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.2 rounded-full bg-primary-50 text-primary-700 border border-primary-200/80">
              {profile.class_level ? profile.class_level.toUpperCase() : 'TERMINALE GÉNÉRALE'}
            </span>
          </div>
          <p className="text-[10.5px] sm:text-[11.5px] text-text-secondary">
            {profile.school_name || 'Lycée Condorcet'} • Objectif :{' '}
            <span className="font-semibold text-text-primary">
              {profile.post_bac_target === 'ingenieur'
                ? 'CPGE MPSI / Ingénieur 🚀'
                : profile.post_bac_target === 'sante'
                ? 'PASS Médecine 🩺'
                : 'Excellence Académique 🎓'}
            </span>
          </p>
        </div>

        {/* Badge d'abonnement discret */}
        <div className="flex items-center gap-1.5">
          {isSubscribed ? (
            <span className="inline-flex items-center gap-1 text-[9.5px] sm:text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 shadow-2xs">
              <Sparkles className="h-3 w-3 text-emerald-600" />
              <span>Membre Pro</span>
            </span>
          ) : (
            <Link href="/pricing">
              <span className="inline-flex items-center gap-1 text-[9.5px] sm:text-[11px] font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 px-2 py-0.5 rounded-lg border border-primary-200 transition-colors shadow-2xs">
                <Zap className="h-3 w-3 text-primary-600" />
                <span>Passer Pro</span>
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          1. LIGNE DU HAUT : MOYENNE GÉNÉRALE & SAC À DOS NUMÉRIQUE
          ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5">
        {/* BLOC 1 : LA MOYENNE GÉNÉRALE */}
        <Link
          href="/grades"
          className="bg-surface p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-border hover:border-primary-300 hover:shadow-xs transition-all flex flex-col justify-between group shadow-2xs"
          title="Consulter mes notes et simuler mes futurs DS"
        >
          <div className="flex items-center justify-between mb-0.5">
            <div className="flex items-center gap-1.5">
              <div className="h-4.5 w-4.5 sm:h-5 sm:w-5 rounded-md bg-success-50 text-success-600 flex items-center justify-center">
                <GraduationCap className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-text-secondary">
                Moyenne Générale
              </span>
            </div>
            <ChevronRight className="h-3 w-3 text-text-tertiary group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
          </div>

          <div className="my-0.5 sm:my-1">
            <p className="text-lg sm:text-2xl font-black text-text-primary tracking-tight">
              {generalAverage !== null ? `${generalAverage}/20` : '16.0/20'}
            </p>
            <p className="text-[8.5px] sm:text-[9.5px] text-text-tertiary">
              Calculée sur {data?.grades.length || 5} notes pondérées (Trimestre 1)
            </p>
          </div>

          {/* Bouton d'action incitatif mis en valeur */}
          <div className="pt-1 border-t border-border/50">
            <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200/80 text-emerald-800 transition-all shadow-2xs">
              <span className="flex items-center gap-1.5 text-[8.5px] sm:text-[10px] font-bold">
                <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-600 flex-shrink-0" />
                <span>Simule un DS pour estimer ta future moyenne</span>
              </span>
              <span className="text-[8.5px] sm:text-[9.5px] font-black text-emerald-700 ml-1 group-hover:translate-x-0.5 transition-transform">➔</span>
            </div>
          </div>
        </Link>

        {/* BLOC 2 : SAC À DOS NUMÉRIQUE & ACTIONS RAPIDES */}
        <div className="bg-surface p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border border-border hover:border-primary-300 hover:shadow-xs transition-all flex flex-col justify-between group shadow-2xs">
          <Link
            href="/revision"
            className="flex items-center justify-between mb-0.5 group/header"
            title="Consulter toutes mes fiches et dossiers"
          >
            <div className="flex items-center gap-1.5">
              <div className="h-4.5 w-4.5 sm:h-5 sm:w-5 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center">
                <Briefcase className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-text-secondary group-hover/header:text-primary-600 transition-colors">
                Sac à Dos Numérique
              </span>
            </div>
            <div className="flex items-center gap-1 text-[8.5px] sm:text-[9.5px] font-semibold text-text-tertiary group-hover/header:text-primary-600">
              <span className="px-1.5 py-0.2 rounded bg-surface-secondary border border-border/80 font-bold text-text-secondary text-[7.5px] sm:text-[8.5px]">
                {sheetsCount} fiches
              </span>
              <ChevronRight className="h-3 w-3 text-text-tertiary group-hover/header:text-primary-600 group-hover/header:translate-x-0.5 transition-all" />
            </div>
          </Link>

          <div className="grid grid-cols-2 gap-1.5 my-0.5">
            <Link
              href="/revision/new"
              className="p-1.5 rounded-lg bg-gradient-to-br from-purple-50 via-purple-50/70 to-fuchsia-50/50 hover:from-purple-100/90 hover:to-fuchsia-100/80 border border-purple-200/90 hover:border-purple-300 transition-all duration-200 flex flex-col items-center justify-center text-center shadow-2xs group/btn active:scale-[0.98] cursor-pointer"
              title="Scanner un cours pour créer une fiche IA"
            >
              <div className="h-5.5 w-5.5 sm:h-6 sm:w-6 rounded-md bg-white shadow-xs border border-purple-100 flex items-center justify-center text-purple-600 mb-0.5 group-hover/btn:scale-110 transition-all">
                <Camera className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </div>
              <span className="text-[9px] sm:text-[10.5px] font-black text-purple-950 group-hover/btn:text-purple-700 transition-colors leading-tight">
                Scanner
              </span>
              <span className="text-[7px] sm:text-[8px] font-bold text-purple-700/90 mt-0.2 flex items-center gap-0.5">
                <Sparkles className="h-1.5 w-1.5 sm:h-2 sm:w-2 text-purple-500" />
                Fiche IA
              </span>
            </Link>

            <Link
              href="/revision"
              className="p-1.5 rounded-lg bg-gradient-to-br from-primary-50 via-primary-50/70 to-indigo-50/50 hover:from-primary-100/90 hover:to-indigo-100/80 border border-primary-200/90 hover:border-primary-300 transition-all duration-200 flex flex-col items-center justify-center text-center shadow-2xs group/btn active:scale-[0.98] cursor-pointer"
              title="Explorer mes fiches classées par matière"
            >
              <div className="h-5.5 w-5.5 sm:h-6 sm:w-6 rounded-md bg-white shadow-xs border border-primary-100 flex items-center justify-center text-primary-600 mb-0.5 group-hover/btn:scale-110 transition-all">
                <Library className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </div>
              <span className="text-[9px] sm:text-[10.5px] font-black text-primary-950 group-hover/btn:text-primary-700 transition-colors leading-tight">
                Classeur
              </span>
              <span className="text-[7px] sm:text-[8px] font-bold text-primary-700/90 mt-0.2 flex items-center gap-0.5">
                <FolderOpen className="h-1.5 w-1.5 sm:h-2 sm:w-2 text-primary-500" />
                4 matières
              </span>
            </Link>
          </div>

          <Link
            href="/revision"
            className="pt-1 border-t border-border/50 text-[8.5px] sm:text-[10px] font-semibold text-primary-600 hover:text-primary-700 flex items-center justify-between group/footer"
          >
            <span className="flex items-center gap-1 font-bold">
              <BookOpen className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              Ouvrir le sac à dos
            </span>
            <ChevronRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 group-hover/footer:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          2. LIGNE DU MILIEU : CARTE INTERACTIVE LEAFLET + GRILLE COMPLETE DU PLANNING (5H - 00H)
          ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 items-stretch">
        {/* CARTE INTERACTIVE DES LYCÉES (lg:col-span-6) */}
        <div className="lg:col-span-6 bg-surface rounded-2xl border border-border overflow-hidden shadow-xs relative flex flex-col justify-between h-[340px] sm:h-[390px] lg:h-[420px]">
          {/* Header Bar de la Carte Dashboard */}
          <div className="px-3 sm:px-3.5 py-1.5 sm:py-2 border-b border-border flex items-center justify-between gap-2 bg-surface">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-6.5 w-6.5 sm:h-7 sm:w-7 rounded-lg sm:rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center flex-shrink-0 font-bold">
                <GraduationCap className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-[13px] font-bold text-text-primary truncate">
                    Carte Interactive des Lycées
                  </h3>
                  {!isSubscribed && (
                    <span className="text-[7.5px] sm:text-[8.5px] font-extrabold px-1.5 py-0.2 rounded bg-primary-50 text-primary-800 border border-primary-200 uppercase">
                      🔒 Pro
                    </span>
                  )}
                </div>
                <p className="text-[9px] sm:text-[10px] text-text-tertiary truncate">
                  {profile.school_name ? `Élèves autour de ${profile.school_name}` : 'Lycéens en France'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Bouton de visibilité */}
              <button
                type="button"
                onClick={toggleVisibility}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-bold border transition-all cursor-pointer ${
                  isVisible
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-surface-secondary text-text-tertiary border-border hover:text-text-primary'
                }`}
                title={isVisible ? 'Ton profil est visible' : 'Ton profil est masqué'}
              >
                {isVisible ? (
                  <>
                    <Eye className="h-2.5 w-2.5 text-emerald-600" />
                    <span>Visible ✓</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-2.5 w-2.5 text-text-tertiary" />
                    <span>Masqué</span>
                  </>
                )}
              </button>

              <Link
                href="/campus/map"
                className="text-[9px] sm:text-[10.5px] font-bold text-primary-600 hover:text-primary-700 flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors shadow-2xs"
                title="Ouvrir la grande carte interactive en plein écran"
              >
                Agrandir
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Carte Leaflet complète intégrée (Dézoomée sur France métropolitaine, points bleus discrets) */}
          <div className="flex-1 w-full relative">
            <SchoolMap
              schools={schools}
              users={mapUsers}
              currentUserId={profile?.id}
              currentUserAvatarUrl={profile?.avatar_url}
              currentUserName={profile?.full_name}
              userLocation={userLocation}
              userSchoolId={profile?.school_id}
              userSchoolName={profile?.school_name}
              selectedSchoolId={selectedSchool?.id}
              flyToTarget={flyToTarget}
              isCurrentUserVerified={profile?.is_verified}
              defaultCenter={[46.603354, 1.888334]}
              defaultZoom={5.0}
              height="h-[220px] sm:h-[280px] lg:h-[340px]"
              isLocked={!isSubscribed}
              onSelectSchool={(school) => setSelectedSchool(school)}
              onSetUserSchool={handleSetUserSchool}
              onBoundsChange={handleBoundsChange}
              onLocationFound={(loc) => setUserLocation(loc)}
              onContactStudent={(student) => {
                if (student && student.id) {
                  router.push(
                    `/campus/messages?friendId=${student.id}&friendName=${encodeURIComponent(student.full_name || '')}`
                  )
                } else {
                  router.push('/campus/messages')
                }
              }}
            />
          </div>
        </div>

        {/* GRILLE COMPLÈTE DU PLANNING INTELLIGENT (5H - 00H) (lg:col-span-6) */}
        <div className="lg:col-span-6 flex flex-col h-[340px] sm:h-[390px] lg:h-[420px]">
          <DashboardPlanningGrid
            schedule={data?.schedule || null}
            isLocked={!isSubscribed}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          3. SECTION DU BAS : CAMARADES DE SPÉCIALITÉ (AU-DESSUS DE LA TAB BAR MOBILE)
          ═══════════════════════════════════════════════════════ */}
      <div className="bg-surface p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-border hover:border-primary-300 hover:shadow-xs transition-all flex flex-col justify-between group shadow-2xs mb-2 sm:mb-0 relative overflow-hidden">
        {/* Contenu du bloc (entièrement flouté pour les comptes gratuits) */}
        <div className={!isSubscribed ? 'filter blur-[3px] select-none pointer-events-none opacity-60' : ''}>
          {/* Header de section cliquable vers /campus */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-md bg-primary-50 text-primary-600 flex items-center justify-center">
                <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-bold text-text-primary">
                    Camarades de spécialité &amp; Entraide
                  </h3>
                  {!isSubscribed && (
                    <span className="text-[7.5px] sm:text-[8.5px] font-extrabold px-1.5 py-0.2 rounded bg-primary-50 text-primary-800 border border-primary-200 uppercase">
                      🔒 Pro
                    </span>
                  )}
                </div>
                <p className="text-[9px] sm:text-[10px] text-text-tertiary">
                  Lycéens connectés partageant tes matières
                </p>
              </div>
            </div>

            <Link
              href="/campus"
              className="flex items-center gap-1 text-[9px] sm:text-[11px] font-bold text-primary-600 hover:text-primary-700 px-2 py-1 rounded-lg bg-primary-50 hover:bg-primary-100 border border-primary-200 transition-colors shadow-2xs"
            >
              <span>Campus Social</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Liste responsive des camarades réels de la communauté */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-1">
            {mapUsers.filter((u) => u.id !== profile.id).length === 0 ? (
              <div className="col-span-full p-3 rounded-xl bg-surface-secondary/40 border border-dashed border-border text-center text-[10px] text-text-tertiary">
                Aucun autre camarade connecté pour le moment. Rejoins les salons du Campus pour échanger !
              </div>
            ) : (
              mapUsers
                .filter((u) => u.id !== profile.id)
                .slice(0, 4)
                .map((peer) => {
                  const name = peer.full_name || 'Lycéen'
                  const initial = name[0]?.toUpperCase() || 'L'
                  const school = peer.school_name || 'Lycée'
                  const specialties = Array.isArray(peer.specialties) ? peer.specialties.slice(0, 2).join(' • ') : 'Lycéen'
                  return (
                    <div
                      key={peer.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-surface-secondary/60 border border-border/80 text-[10px] hover:border-primary-300 transition-all shadow-2xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-primary-600 to-purple-600 text-white font-bold text-[9px] flex items-center justify-center flex-shrink-0 shadow-2xs">
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-text-primary truncate flex items-center gap-1">
                            <span>{name}</span>
                            {peer.is_verified && (
                              <span className="text-[8px]" title="Lycéen Certifié 🛡️">
                                🛡️
                              </span>
                            )}
                          </p>
                          <p className="text-[8.5px] text-text-tertiary truncate">
                            {school} • {specialties}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            handleSendDashboardFriendRequest({ id: peer.id || '', name })
                          }}
                          className="h-6 px-2 rounded-lg bg-surface hover:bg-primary-50 text-primary-700 border border-border hover:border-primary-300 text-[9px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                          title={`Ajouter ${name}`}
                        >
                          <UserPlus className="h-2.5 w-2.5" />
                          <span>Ajouter</span>
                        </button>
                        <Link
                          href={`/campus/messages?friendId=${peer.id}&friendName=${encodeURIComponent(name)}`}
                          className="h-6 px-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[9px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs active:scale-95"
                          title={`Échanger avec ${name}`}
                        >
                          <MessageSquare className="h-2.5 w-2.5" />
                          <span>Échanger</span>
                        </Link>
                      </div>
                    </div>
                  )
                })
            )}
          </div>

          {/* Footer cliquable vers /campus */}
          <Link
            href="/campus"
            className="pt-1.5 border-t border-border/50 text-[9px] sm:text-[10.5px] font-semibold text-primary-600 hover:text-primary-700 flex items-center justify-between group/footer mt-1"
          >
            <span className="flex items-center gap-1 font-bold">
              <Users className="h-3 w-3" />
              Explorer l&apos;ensemble des camarades sur le Campus
            </span>
            <ChevronRight className="h-3 w-3 group-hover/footer:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Overlay Pro sur l'intégralité du bloc avec bouton violet Passer Pro */}
        {!isSubscribed && (
          <div className="absolute inset-0 z-30 bg-slate-950/40 backdrop-blur-[2.5px] rounded-xl sm:rounded-2xl flex flex-col items-center justify-center p-3 text-center select-none">
            <div className="bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl border border-border shadow-2xl max-w-xs space-y-1.5 animate-fade-in">
              <div className="flex items-center justify-center gap-1 text-xs font-black text-slate-900">
                <span className="text-sm">🔒</span>
                <span>Campus &amp; Salons de Spécialités</span>
              </div>
              <p className="text-[9.5px] text-slate-600 leading-snug">
                Débloque la mise en relation, les salons de discussion et l&apos;entraide entre lycéens.
              </p>
              <Link href="/pricing" className="block pt-0.5">
                <span className="inline-flex items-center gap-1 text-[10.5px] font-black px-4 py-1.5 rounded-xl bg-gradient-to-r from-primary-600 to-accent-600 text-white shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer">
                  <span>Passer Pro (dès 4,99 €)</span>
                  <ChevronRight className="h-3 w-3" />
                </span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
