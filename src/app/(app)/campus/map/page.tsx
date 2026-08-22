'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SchoolMap } from '@/components/campus/SchoolMap'
import { SchoolCard } from '@/components/campus/SchoolCard'
import { SchoolSearchAutocomplete } from '@/components/campus/SchoolSearchAutocomplete'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { PaywallModal } from '@/components/paywall/PaywallModal'
import {
  ArrowLeft,
  MapPin,
  Search,
  Shield,
  Sparkles,
  Lock,
  CheckCircle2,
  Users,
  Compass,
  GraduationCap,
  Navigation,
  Eye,
  EyeOff,
  Radio,
  MessageSquare,
  Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import type { School } from '@/types/campus'
import type { Profile } from '@/types/database'

export default function CampusMapPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [schools, setSchools] = useState<School[]>([])
  const [mapUsers, setMapUsers] = useState<Partial<Profile>[]>([])
  const [search, setSearch] = useState('')
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)
  const [activeTab, setActiveTab] = useState<'schools' | 'students'>('schools')
  const [loading, setLoading] = useState(true)
  const [showPaywallModal, setShowPaywallModal] = useState(false)

  // Gestion de la géolocalisation & visibilité
  const [isLocating, setIsLocating] = useState(false)
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>({
    latitude: 48.8456,
    longitude: 2.3486,
  })
  const [flyToTarget, setFlyToTarget] = useState<{ latitude: number; longitude: number; zoom?: number } | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [userBio, setUserBio] = useState('')
  const [showBioModal, setShowBioModal] = useState(false)
  const [savingBio, setSavingBio] = useState(false)

  const boundsDebounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Chargement dynamique des lycées par zone géographique (Bounds / BBox)
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

  // 1. Chargement des données (Profil, Lycées, Utilisateurs de la carte)
  useEffect(() => {
    async function loadCampusMapData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { data: pData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (pData) {
            setProfile(pData)
            setIsVisible(pData.is_visible ?? true)
            setUserBio(pData.bio || '')
            if (pData.latitude && pData.longitude) {
              const loc = {
                latitude: Number(pData.latitude),
                longitude: Number(pData.longitude),
              }
              setUserLocation(loc)
            } else if (typeof window !== 'undefined' && navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const loc = {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                  }
                  setUserLocation(loc)
                  fetch('/api/campus/users/location', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      latitude: loc.latitude,
                      longitude: loc.longitude,
                      is_visible: true,
                    }),
                  }).catch(() => {})
                },
                () => {},
                { enableHighAccuracy: true, timeout: 8000 }
              )
            }
          }
        }

        // Récupérer les lycées
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
      } catch (e) {
        console.error('Error loading campus map data:', e)
      } finally {
        setLoading(false)
      }
    }

    loadCampusMapData()
  }, [supabase])

  // Action : "Je suis élève dans ce lycée"
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

        // 1. Positionner l'élève sur le spot géographique de son lycée
        if (lat && lng) {
          fetch('/api/campus/users/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude: lat + (Math.random() - 0.5) * 0.003, // Légère variation pour être visible à côté du pin
              longitude: lng + (Math.random() - 0.5) * 0.003,
              is_visible: true,
              bio: userBio || undefined,
            }),
          }).catch(console.error)

          setUserLocation({ latitude: lat, longitude: lng })
        }

        // 2. Mettre à jour l'état local du profil
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

        // 3. Mettre à jour la liste des camarades affichés sur la carte
        setMapUsers((prev) => {
          const me: Partial<Profile> = {
            id: profile?.id || 'me',
            full_name: profile?.full_name || 'Moi',
            school_name: updatedSchool.name,
            class_level: profile?.class_level || 'terminale',
            specialties: profile?.specialties || [],
            latitude: lat + 0.0015,
            longitude: lng + 0.0015,
            bio: userBio || 'Élève connecté sur le salon du lycée !',
            is_visible: true,
          }
          const filtered = prev.filter((u) => u.id !== profile?.id)
          return [me, ...filtered]
        })

        // 4. Mettre à jour le compteur d'élèves de ce lycée
        setSchools((prev) =>
          prev.map((s) =>
            s.id === updatedSchool.id ||
            (s.name.toLowerCase() === updatedSchool.name.toLowerCase() &&
              s.city.toLowerCase() === updatedSchool.city.toLowerCase())
              ? { ...s, students_count: (s.students_count || 0) + 1 }
              : s
          )
        )

        // 5. Centrage fluide flyTo sur le lycée
        if (lat && lng) {
          setFlyToTarget({
            latitude: lat,
            longitude: lng,
            zoom: 15,
          })
        }

        toast.success(
          `Ton profil est désormais public et visible par les membres du salon de ce lycée ! 🎉 (${updatedSchool.name})`,
          { duration: 6000, icon: '🎓' }
        )
      } else {
        toast.error('Erreur lors de l’enregistrement de ton lycée.')
      }
    } catch {
      toast.error('Erreur de connexion au serveur.')
    }
  }

  // 2. Sélection d'un lycée depuis l'autocomplete de recherche (avec flyTo automatique)
  const handleSelectOfficialSchool = async (schoolData: any) => {
    try {
      const res = await fetch('/api/campus/schools/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ school: schoolData }),
      })

      if (res.ok) {
        const data = await res.json()
        const selected = data.school

        setSchools((prev) => {
          if (
            prev.some(
              (s) =>
                s.id === selected.id ||
                (s.name.toLowerCase() === selected.name.toLowerCase() &&
                  s.city.toLowerCase() === selected.city.toLowerCase())
            )
          ) {
            return prev.map((s) => (s.id === selected.id ? selected : s))
          }
          return [selected, ...prev]
        })

        setSelectedSchool(selected)

        // Déclencher le mouvement fluide flyTo sur la carte Leaflet
        if (selected.latitude && selected.longitude) {
          setFlyToTarget({
            latitude: Number(selected.latitude),
            longitude: Number(selected.longitude),
            zoom: 14,
          })
        }

        toast.success(
          `Lycée ${selected.name} sélectionné ! Carte centrée sur ${selected.city} 📍`,
          { duration: 5000, icon: '🎯' }
        )
      } else {
        toast.error('Erreur lors de la sélection du lycée.')
      }
    } catch {
      toast.error('Erreur de connexion au serveur.')
    }
  }

  // Vérification du statut Pro
  const isPro = Boolean(
    profile &&
      (profile.is_pro === true ||
        (['active', 'trialing'].includes(profile.subscription_status || '') &&
          (profile.subscription_tier === 'monthly' || profile.subscription_tier === 'annual')))
  )

  // 2. Partager sa position actuelle avec navigator.geolocation
  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      toast.error('La géolocalisation n’est pas supportée par ton navigateur.')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation({ latitude, longitude })
        setIsVisible(true)

        try {
          const res = await fetch('/api/campus/users/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude,
              longitude,
              is_visible: true,
            }),
          })

          if (res.ok) {
            toast.success('Position partagée avec succès ! Tu es visible sur la carte 📍')
            // Recharger les utilisateurs pour actualiser son propre marqueur
            const refreshRes = await fetch('/api/campus/users/location')
            if (refreshRes.ok) {
              const uData = await refreshRes.json()
              setMapUsers(uData.users || [])
            }
          } else {
            toast.error('Erreur lors de la synchronisation de la position.')
          }
        } catch {
          toast.error('Erreur de connexion au serveur.')
        } finally {
          setIsLocating(false)
        }
      },
      (err) => {
        setIsLocating(false)
        if (err.code === err.PERMISSION_DENIED) {
          toast.error('Autorise l’accès à la position dans ton navigateur pour apparaître sur la carte.')
        } else {
          toast.error('Impossible de récupérer ta position actuelle.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // 3. Basculer la visibilité (On/Off)
  const handleToggleVisibility = async () => {
    const nextVisibility = !isVisible
    setIsVisible(nextVisibility)

    try {
      const res = await fetch('/api/campus/users/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_visible: nextVisibility,
        }),
      })

      if (res.ok) {
        toast.success(
          nextVisibility
            ? 'Tu es désormais visible sur la carte du Campus ! 👁️'
            : 'Tu es maintenant en mode discret (masqué sur la carte) 🕶️'
        )
      }
    } catch {
      toast.error('Erreur lors de la modification de la visibilité.')
    }
  }

  // 4. Mettre à jour son statut / bio
  const handleSaveBio = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingBio(true)

    try {
      const res = await fetch('/api/campus/users/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: userBio.trim(),
        }),
      })

      if (res.ok) {
        toast.success('Ton message de statut a été mis à jour ! ✨')
        setShowBioModal(false)
      } else {
        toast.error('Erreur lors de l’enregistrement du statut.')
      }
    } catch {
      toast.error('Erreur réseau.')
    } finally {
      setSavingBio(false)
    }
  }

  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase()) ||
      s.postal_code.includes(search)
  )

  const filteredStudents = mapUsers.filter(
    (u) =>
      (u.full_name && u.full_name.toLowerCase().includes(search.toLowerCase())) ||
      (u.school_name && u.school_name.toLowerCase().includes(search.toLowerCase())) ||
      (u.specialties && u.specialties.some((s) => s.toLowerCase().includes(search.toLowerCase())))
  )

  const handleJoinSchool = async (school: School) => {
    if (!isPro) {
      setShowPaywallModal(true)
      return
    }

    try {
      // S'assurer que le salon de ce lycée est créé/rejoint
      const res = await fetch('/api/campus/schools/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ school }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.channelId) {
          router.push(`/campus/channels/${data.channelId}`)
          return
        }
      }
    } catch (e) {
      console.warn('Redirect fallback:', e)
    }

    router.push(`/campus?schoolId=${school.id}&schoolName=${encodeURIComponent(school.name)}`)
  }

  // Si non abonné (version gratuite d'essai), afficher l'écran de restriction Pro avec aperçu immersif
  if (!loading && !isPro) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-10">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/campus"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au Campus
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary-700 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
            <Lock className="h-3.5 w-3.5 text-primary-600" />
            <span>Fonctionnalité Réservée aux Abonnés</span>
          </div>
        </div>

        {/* Encadré Paywall / Verrouillage immersif avec aperçu en arrière-plan */}
        <div className="relative rounded-3xl overflow-hidden border border-border bg-surface shadow-xl">
          {/* Aperçu flouté de la carte */}
          <div className="absolute inset-0 filter blur-md opacity-40 pointer-events-none scale-105">
            <SchoolMap schools={schools.slice(0, 8)} users={mapUsers.slice(0, 6)} />
          </div>

          <div className="relative z-10 max-w-xl mx-auto py-12 px-6 sm:py-16 text-center space-y-5">
            <div className="h-16 w-16 rounded-3xl bg-gradient-to-tr from-primary-600 to-accent-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-primary-500/30">
              <Compass className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-primary-700 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
                ⚡ Campus Social & Carte Interactive
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
                Débloque la Carte Interactive de France
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-md mx-auto">
                Rejoins le réseau national des lycéens, géolocalise les groupes d’entraide et échange avec les élèves de tes spécialités partout en France.
              </p>
            </div>

            {/* Avantages */}
            <div className="bg-surface/90 backdrop-blur-md rounded-2xl border border-border p-4 text-left text-xs space-y-2.5 text-text-secondary font-medium">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>Localisation interactive des lycées et camarades d'étude</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>Accès illimité à l&apos;ensemble des salons de spécialités (Maths, Physique, Philo, etc.)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>Mise en relation ciblée pour préparer Parcoursup et les filières d&apos;excellence</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2.5 pt-2">
              <Link href="/pricing" className="block w-full">
                <Button size="lg" className="w-full gap-2 shadow-lg shadow-primary-600/25 font-black text-sm">
                  <Sparkles className="h-4 w-4" />
                  <span>Passer à l&apos;accès Pro (4,99 € / mois)</span>
                </Button>
              </Link>
              <Link href="/campus" className="block w-full">
                <Button variant="ghost" size="sm" className="w-full text-xs text-text-secondary">
                  Continuer sur le Campus standard
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <PaywallModal
          isOpen={showPaywallModal}
          onClose={() => setShowPaywallModal(false)}
          featureLocked="campus"
        />
      </div>
    )
  }

  // Vue débloquée pour les abonnés Pro
  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-10">
      {/* Top bar & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/campus"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au Campus
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-text-primary">
              Campus Social & Carte Interactive 🗺️
            </h1>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-800 border border-primary-200">
              Pro Illimité
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Partage ta position, découvre les lycées membres et échange avec tes camarades de spécialités.
          </p>
        </div>

        {/* Contrôles de géolocalisation & confidentialité */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Bouton Partager Position */}
          <Button
            size="sm"
            onClick={handleShareLocation}
            disabled={isLocating}
            className="gap-1.5 text-xs font-bold shadow-xs cursor-pointer"
          >
            {isLocating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Localisation...</span>
              </>
            ) : (
              <>
                <Navigation className="h-3.5 w-3.5" />
                <span>{userLocation ? 'Actualiser ma position' : 'Partager ma position'}</span>
              </>
            )}
          </Button>

          {/* Toggle Visibilité */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleToggleVisibility}
            className={`gap-1.5 text-xs font-semibold cursor-pointer ${
              isVisible
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                : 'bg-surface text-text-tertiary border-border hover:bg-surface-secondary'
            }`}
          >
            {isVisible ? (
              <>
                <Eye className="h-3.5 w-3.5 text-emerald-600" />
                <span>Visible</span>
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5 text-text-tertiary" />
                <span>Masqué</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Grid : Liste & Carte */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Colonne Gauche : Recherche & Onglets (Lycées / Élèves) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-surface p-3 rounded-2xl border border-border shadow-2xs space-y-2.5">
            {/* Onglets Lycées / Camarades */}
            <div className="grid grid-cols-2 p-1 bg-surface-secondary rounded-xl border border-border text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('schools')}
                className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'schools'
                    ? 'bg-surface text-primary-700 shadow-2xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                🏫 Lycées
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('students')}
                className={`py-1.5 px-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'students'
                    ? 'bg-surface text-primary-700 shadow-2xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                👥 Élèves
              </button>
            </div>

            {/* Input de recherche avec Autocomplete Éducation Nationale */}
            {activeTab === 'schools' ? (
              <SchoolSearchAutocomplete
                value={search}
                onChange={setSearch}
                onSelectSchool={handleSelectOfficialSchool}
                placeholder="Rechercher un lycée, ville, académie..."
              />
            ) : (
              <Input
                placeholder="Rechercher un élève, spécialité..."
                leftIcon={<Search className="h-4 w-4" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            )}
          </div>

          {/* Liste déroulante */}
          <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1 no-scrollbar">
            {activeTab === 'schools' ? (
              <>
                {filteredSchools.map((school) => {
                  const isSelected = selectedSchool?.id === school.id
                  const isUserSchool = Boolean(
                    (profile?.school_id && school.id === profile.school_id) ||
                      (profile?.school_name &&
                        school.name.toLowerCase().trim() ===
                          profile.school_name.toLowerCase().trim())
                  )

                  return (
                    <div
                      key={school.id}
                      onClick={() => {
                        setSelectedSchool(school)
                        if (school.latitude && school.longitude) {
                          setFlyToTarget({
                            latitude: Number(school.latitude),
                            longitude: Number(school.longitude),
                            zoom: 14,
                          })
                        }
                      }}
                      className={`cursor-pointer transition-all ${
                        isSelected ? 'ring-2 ring-amber-500 rounded-2xl scale-[1.01]' : ''
                      }`}
                    >
                      <SchoolCard
                        school={school}
                        isUserSchool={isUserSchool}
                        onJoinChannel={handleJoinSchool}
                        onSetUserSchool={handleSetUserSchool}
                      />
                    </div>
                  )
                })}

                {filteredSchools.length === 0 && (
                  <div className="p-6 text-center bg-surface rounded-2xl border border-border space-y-1.5">
                    <MapPin className="h-6 w-6 text-text-tertiary mx-auto" />
                    <p className="text-xs text-text-secondary font-medium">
                      Aucun établissement trouvé pour cette recherche.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {filteredStudents.map((student) => (
                  <div
                    key={student.id}
                    className="p-3 bg-surface hover:bg-surface-secondary rounded-2xl border border-border shadow-2xs transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center text-xs font-black">
                          {(student.full_name || 'L')[0].toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xs text-text-primary">
                            {student.full_name || 'Lycéen OptiNote'}
                          </h4>
                          <p className="text-[10px] text-text-secondary">
                            {student.school_name || 'Lycée'} • {student.class_level?.toUpperCase() || 'Terminale'}
                          </p>
                        </div>
                      </div>

                      <span className="text-[8.5px] font-bold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded-md border border-primary-200 shadow-2xs">
                        Abonnement Pro
                      </span>
                    </div>

                    {student.bio && (
                      <p className="text-[11px] text-text-secondary italic bg-surface-secondary/70 p-2 rounded-xl border border-border/80">
                        💬 &quot;{student.bio}&quot;
                      </p>
                    )}

                    {student.specialties && student.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {student.specialties.map((spec, i) => (
                          <span
                            key={i}
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}

                    <Link
                      href={`/campus?dmUserId=${student.id}&dmUserName=${encodeURIComponent(student.full_name || '')}`}
                      className="block w-full pt-1"
                    >
                      <button
                        type="button"
                        className="w-full h-7 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700 text-[11px] font-bold transition-all border border-primary-200 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <MessageSquare className="h-3 w-3" />
                        <span>Échanger en direct</span>
                      </button>
                    </Link>
                  </div>
                ))}

                {filteredStudents.length === 0 && (
                  <div className="p-6 text-center bg-surface rounded-2xl border border-border space-y-1.5">
                    <Users className="h-6 w-6 text-text-tertiary mx-auto" />
                    <p className="text-xs text-text-secondary font-medium">
                      Aucun élève trouvé pour cette recherche.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Colonne Droite : Carte Interactive Leaflet */}
        <div className="lg:col-span-8">
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
            onSelectSchool={(school) => {
              setSelectedSchool(school)
              handleJoinSchool(school)
            }}
            onSetUserSchool={handleSetUserSchool}
            onBoundsChange={handleBoundsChange}
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

      {/* Modale d'édition de Statut / Bio */}
      <Modal
        isOpen={showBioModal}
        onClose={() => setShowBioModal(false)}
        title="Mon message de statut sur la carte"
      >
        <form onSubmit={handleSaveBio} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1.5">
              Partage tes objectifs ou ton message d'entraide 💬
            </label>
            <Textarea
              placeholder="Ex: Objectif prépa MPSI / PASS, dispo pour réviser la spé Maths et la Physique !"
              value={userBio}
              onChange={(e) => setUserBio(e.target.value)}
              rows={3}
              maxLength={160}
            />
            <span className="text-[10px] text-text-tertiary mt-1 block text-right">
              {userBio.length}/160 caractères
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowBioModal(false)}
            >
              Annuler
            </Button>
            <Button type="submit" size="sm" disabled={savingBio}>
              {savingBio ? 'Enregistrement...' : 'Enregistrer mon statut'}
            </Button>
          </div>
        </form>
      </Modal>

      <PaywallModal
        isOpen={showPaywallModal}
        onClose={() => setShowPaywallModal(false)}
        featureLocked="campus"
      />
    </div>
  )
}
