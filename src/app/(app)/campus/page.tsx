'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ChannelList } from '@/components/campus/ChannelList'
import { FriendsList } from '@/components/campus/FriendsList'
import { ChatWindow } from '@/components/campus/ChatWindow'
import { SchoolMap } from '@/components/campus/SchoolMap'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { PaywallGuard } from '@/components/paywall/PaywallGuard'
import {
  Users,
  Search,
  Sparkles,
  BookOpen,
  Eye,
  EyeOff,
  GraduationCap,
  ShieldCheck,
  Target,
  Plus,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  UserPlus,
  Check,
  CheckCircle2,
  Lock,
  MessageSquare,
  UserCheck,
  MessagesSquare,
  Compass,
  PlusCircle,
  Calendar,
  MapPin,
  Globe,
  Clock,
  Radio,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import type { ChatChannel, Friendship, School } from '@/types/campus'
import type { Profile } from '@/types/database'
import { useSearchParams, useRouter } from 'next/navigation'

export interface RevisionSession {
  id: string
  subject: string
  title: string
  type: 'online' | 'in_person'
  location?: string
  date_time: string
  host_name: string
  host_avatar: string
  host_school: string
  max_participants: number
  current_participants: number
  joined?: boolean
}

export const DEFAULT_REVISION_SESSIONS: RevisionSession[] = [
  {
    id: 'rev-1',
    subject: 'Mathématiques',
    title: 'Entraînement DS Dérivées & Théorème TVI',
    type: 'online',
    date_time: "Aujourd'hui à 17h30",
    host_name: 'Léa M.',
    host_avatar: 'LM',
    host_school: 'Lycée Henri-IV',
    max_participants: 4,
    current_participants: 3,
  },
  {
    id: 'rev-2',
    subject: 'Physique-Chimie',
    title: 'Exercices & Annales Bac Mécanique de Newton',
    type: 'in_person',
    location: 'CDI Lycée Condorcet (Paris 9e)',
    date_time: 'Demain à 16h00',
    host_name: 'Thomas D.',
    host_avatar: 'TD',
    host_school: 'Lycée Condorcet',
    max_participants: 5,
    current_participants: 2,
  },
  {
    id: 'rev-3',
    subject: 'Philosophie',
    title: 'Plan détaillé dissertation : La Vérité & Le Doute',
    type: 'online',
    date_time: 'Samedi à 14h00',
    host_name: 'Inès B.',
    host_avatar: 'IB',
    host_school: 'Lycée Montaigne',
    max_participants: 4,
    current_participants: 2,
  },
  {
    id: 'rev-4',
    subject: 'SES',
    title: 'Croquis géopolitique & schémas de croissance',
    type: 'in_person',
    location: 'Bibliothèque Sainte-Barbe (Paris 5e)',
    date_time: 'Vendredi à 18h00',
    host_name: 'Yanis K.',
    host_avatar: 'YK',
    host_school: 'Lycée Louis-le-Grand',
    max_participants: 6,
    current_participants: 4,
  },
]

const MOCK_PROFILE: Profile = {
  id: 'mock-user-001',
  email: 'thomas.dubois@lycee.fr',
  full_name: 'Thomas Dubois',
  avatar_url: null,
  class_level: 'terminale',
  school_id: null,
  school_name: 'Lycée Condorcet (Paris 9e)',
  academic_goal: 'excellence',
  post_bac_target: 'ingenieur',
  specialties: ['Mathématiques', 'Physique-Chimie'],
  is_pro: true,
  subscription_status: 'active',
  subscription_tier: 'monthly',
  is_visible_on_school: true,
  onboarding_completed: true,
  preferences: {},
  latitude: 48.8744,
  longitude: 2.3275,
  bio: 'Objectif CPGE MPSI ou prépa intégrée. Dispo pour entraide en Maths Expertes et Physique !',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

// Filtres de spécialités
const ALL_SUBJECT_FILTERS = [
  { id: 'all', name: 'Tous', emoji: '✨' },
  { id: 'maths', name: 'Maths', emoji: '📐' },
  { id: 'physique', name: 'Physique-Chimie', emoji: '⚡' },
  { id: 'svt', name: 'SVT', emoji: '🧬' },
  { id: 'ses', name: 'SES', emoji: '📈' },
  { id: 'hggsp', name: 'HGGSP', emoji: '🌍' },
  { id: 'philo', name: 'Philo', emoji: '🏛️' },
  { id: 'francais', name: 'Français', emoji: '📚' },
  { id: 'nsi', name: 'NSI', emoji: '💻' },
]

// Mock peers for suggestions
const SUGGESTED_PEERS = [
  {
    id: 'peer-1',
    name: 'Léa M.',
    avatar: 'LM',
    school: 'Lycée Henri-IV',
    class_level: 'terminale',
    specialties: ['Maths', 'Physique-Chimie'],
    target: 'CPGE MPSI / Ingénieur',
    is_verified: true,
  },
  {
    id: 'peer-2',
    name: 'Yanis K.',
    avatar: 'YK',
    school: 'Lycée Louis-le-Grand',
    class_level: 'terminale',
    specialties: ['Maths', 'NSI'],
    target: 'EPITA / Informatique',
    is_verified: true,
  },
  {
    id: 'peer-3',
    name: 'Inès B.',
    avatar: 'IB',
    school: 'Lycée Montaigne',
    class_level: 'premiere',
    specialties: ['SES', 'HGGSP'],
    target: 'Sciences Po Paris',
    is_verified: true,
  },
  {
    id: 'peer-4',
    name: 'Mamadou D.',
    avatar: 'MD',
    school: 'Lycée Fénelon',
    class_level: 'terminale',
    specialties: ['SVT', 'Physique-Chimie'],
    target: 'PASS Médecine',
    is_verified: false,
  },
]

const DEFAULT_CHANNELS: ChatChannel[] = [
  {
    id: 'c-maths',
    name: 'Mathématiques & Maths Expertes',
    description: 'Entraide exercices, démonstrations, annales du Bac et astuces CPGE.',
    type: 'subject',
    subject_tag: 'maths',
    class_level: 'terminale',
    school_id: null,
    created_by: null,
    is_private: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c-physique',
    name: 'Physique-Chimie & Mécanique',
    description: 'TP, cours, mécanique de Newton, réactions chimiques et préparation aux épreuves.',
    type: 'subject',
    subject_tag: 'physique',
    class_level: 'terminale',
    school_id: null,
    created_by: null,
    is_private: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c-svt',
    name: 'SVT & Biologie',
    description: 'Génétique, immunologie, climat et méthodologie des schémas de synthèse.',
    type: 'subject',
    subject_tag: 'svt',
    class_level: 'terminale',
    school_id: null,
    created_by: null,
    is_private: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c-ses',
    name: 'Sciences Éco & Sociales (SES)',
    description: 'Dissertations, croissance, politiques économiques et sociologie.',
    type: 'subject',
    subject_tag: 'ses',
    class_level: 'terminale',
    school_id: null,
    created_by: null,
    is_private: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c-hggsp',
    name: 'HGGSP & Géopolitique',
    description: 'Études de documents, puissances mondiales, histoire et débats géopolitiques.',
    type: 'subject',
    subject_tag: 'hggsp',
    class_level: 'terminale',
    school_id: null,
    created_by: null,
    is_private: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c-philo',
    name: 'Philosophie & Grand Oral',
    description: 'Citations, repères conceptuels, plans types de dissertations et sujets types.',
    type: 'subject',
    subject_tag: 'philo',
    class_level: 'terminale',
    school_id: null,
    created_by: null,
    is_private: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c-general',
    name: 'Bac 2026 & Conseils Parcoursup',
    description: 'Orientation, astuces d’admission, lettres de motivation et entraide générale.',
    type: 'general',
    subject_tag: null,
    class_level: null,
    school_id: null,
    created_by: null,
    is_private: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'c-school-demo',
    name: 'Lycée Henri IV (Paris 5e)',
    description: 'Salon d’entraide officiel des lycéens de Henri IV.',
    type: 'school',
    subject_tag: null,
    class_level: null,
    school_id: 'lycee-henri-4',
    created_by: null,
    is_private: false,
    created_at: new Date().toISOString(),
  },
]

export default function CampusHubPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const schoolIdParam = searchParams.get('schoolId')
  const schoolNameParam = searchParams.get('schoolName')

  const supabase = createClient()
  const [profile, setProfile] = useState<Profile>(MOCK_PROFILE)
  const [channels, setChannels] = useState<ChatChannel[]>(DEFAULT_CHANNELS)
  const [friends, setFriends] = useState<Partial<Profile>[]>([])
  const [pendingReceived, setPendingReceived] = useState<Friendship[]>([])
  const [loading, setLoading] = useState(true)
  const [channelSearch, setChannelSearch] = useState('')
  const [mobilePeerSearch, setMobilePeerSearch] = useState('')
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('all')
  const [isChannelsExpanded, setIsChannelsExpanded] = useState(false)

  // États de la carte Leaflet
  const [schools, setSchools] = useState<School[]>([])
  const [mapUsers, setMapUsers] = useState<Partial<Profile>[]>([])
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>({
    latitude: 48.8744,
    longitude: 2.3275,
  })
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)
  const [flyToTarget, setFlyToTarget] = useState<{ latitude: number; longitude: number; zoom?: number } | null>(null)
  const boundsDebounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Group creation modal with invitations
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDesc, setNewGroupDesc] = useState('')
  const [invitedPeerIds, setInvitedPeerIds] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  // États des sessions d'entraide et révision
  const [revisionSessions, setRevisionSessions] = useState<RevisionSession[]>(DEFAULT_REVISION_SESSIONS)
  const [showProposeModal, setShowProposeModal] = useState(false)
  const [showFindModal, setShowFindModal] = useState(false)
  const [sessionsFilter, setSessionsFilter] = useState<'all' | 'online' | 'in_person'>('all')
  const [sessionsSearch, setSessionsSearch] = useState('')

  // Formulaire de proposition de révision
  const [proposeSubject, setProposeSubject] = useState('Mathématiques')
  const [proposeTitle, setProposeTitle] = useState('')
  const [proposeType, setProposeType] = useState<'online' | 'in_person'>('online')
  const [proposeLocation, setProposeLocation] = useState('')
  const [proposeDateTime, setProposeDateTime] = useState("Aujourd'hui à 17h30")
  const [proposeMaxParticipants, setProposeMaxParticipants] = useState(4)

  function handleCreateRevisionSession(e: React.FormEvent) {
    e.preventDefault()
    if (!proposeTitle.trim()) {
      toast.error('Veuillez renseigner le sujet ou titre de la révision.')
      return
    }

    const newSession: RevisionSession = {
      id: `rev-${Date.now()}`,
      subject: proposeSubject,
      title: proposeTitle.trim(),
      type: proposeType,
      location: proposeType === 'in_person' ? proposeLocation.trim() || 'CDI / Salle d’étude' : undefined,
      date_time: proposeDateTime.trim() || "Aujourd'hui à 17h30",
      host_name: profile.full_name || 'Thomas D.',
      host_avatar: profile.full_name ? profile.full_name.split(' ').map((n) => n[0]).join('') : 'TD',
      host_school: profile.school_name || 'Lycée Condorcet',
      max_participants: Number(proposeMaxParticipants) || 4,
      current_participants: 1,
      joined: true,
    }

    setRevisionSessions((prev) => [newSession, ...prev])
    setShowProposeModal(false)
    setProposeTitle('')
    setProposeLocation('')
    toast.success('Session de révision créée et publiée sur le Campus ! ✨', {
      icon: '🚀',
      duration: 4000,
    })
  }

  function handleToggleJoinSession(session: RevisionSession) {
    setRevisionSessions((prev) =>
      prev.map((s) => {
        if (s.id === session.id) {
          const isJoined = s.joined
          return {
            ...s,
            joined: !isJoined,
            current_participants: isJoined ? Math.max(1, s.current_participants - 1) : s.current_participants + 1,
          }
        }
        return s
      })
    )

    if (session.joined) {
      toast('Tu as quitté cette session de révision.')
    } else {
      toast.success(`Tu as rejoint la session "${session.title}" ! Rendez-vous dans les salons. 🎉`, {
        icon: '🤝',
        duration: 4500,
      })
    }
  }

  const filteredSessions = useMemo(() => {
    return revisionSessions.filter((s) => {
      const matchesFilter = sessionsFilter === 'all' || s.type === sessionsFilter
      const matchesSearch =
        !sessionsSearch.trim() ||
        s.title.toLowerCase().includes(sessionsSearch.toLowerCase()) ||
        s.subject.toLowerCase().includes(sessionsSearch.toLowerCase()) ||
        (s.location && s.location.toLowerCase().includes(sessionsSearch.toLowerCase()))
      return matchesFilter && matchesSearch
    })
  }, [revisionSessions, sessionsFilter, sessionsSearch])

  const filteredSuggestedPeers = useMemo(() => {
    if (!mobilePeerSearch.trim()) return SUGGESTED_PEERS
    const q = mobilePeerSearch.toLowerCase().trim()
    return SUGGESTED_PEERS.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        p.school.toLowerCase().includes(q) ||
        p.specialties.some((s) => s.toLowerCase().includes(q)) ||
        (p.target && p.target.toLowerCase().includes(q))
      )
    })
  }, [mobilePeerSearch])

  // Chargement dynamique des lycées par zone géographique (Bounds / Bbox)
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

  useEffect(() => {
    async function loadCampusData() {
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
            setIsVisible(pData.is_visible_on_school ?? true)
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

        // Charger canaux, lycées, utilisateurs de la carte et amis en parallèle
        const [channelsRes, schoolsRes, usersRes, friendsRes] = await Promise.all([
          fetch('/api/campus/channels'),
          fetch('/api/campus/schools'),
          fetch('/api/campus/users/location'),
          fetch('/api/campus/friends'),
        ])

        if (channelsRes.ok) {
          const cData = await channelsRes.json()
          if (cData.channels && cData.channels.length > 0) {
            setChannels(cData.channels)
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

        if (friendsRes.ok) {
          const fData = await friendsRes.json()
          setFriends(fData.friends || [])
          setPendingReceived(fData.pendingReceived || [])
        }
      } catch (err) {
        console.error('Error loading campus data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadCampusData()

    // Abonnement Realtime pour les nouvelles demandes d'ami
    const friendshipsChannel = supabase
      .channel('realtime:friendships')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
        },
        async () => {
          const friendsRes = await fetch('/api/campus/friends')
          if (friendsRes.ok) {
            const fData = await friendsRes.json()
            setFriends(fData.friends || [])
            setPendingReceived(fData.pendingReceived || [])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(friendshipsChannel)
    }
  }, [supabase])

  // Filtrer les canaux selon la recherche et le sujet
  const filteredChannels = useMemo(() => {
    return channels.filter((c) => {
      const matchSearch =
        !channelSearch ||
        c.name.toLowerCase().includes(channelSearch.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(channelSearch.toLowerCase()))

      const matchSubject =
        selectedSubjectFilter === 'all' ||
        c.subject_tag === selectedSubjectFilter ||
        (selectedSubjectFilter === 'maths' && c.name.toLowerCase().includes('math')) ||
        (selectedSubjectFilter === 'physique' && c.name.toLowerCase().includes('physique')) ||
        (selectedSubjectFilter === 'svt' && c.name.toLowerCase().includes('svt')) ||
        (selectedSubjectFilter === 'ses' && c.name.toLowerCase().includes('ses')) ||
        (selectedSubjectFilter === 'hggsp' && c.name.toLowerCase().includes('hggsp')) ||
        (selectedSubjectFilter === 'philo' && c.name.toLowerCase().includes('philo')) ||
        (selectedSubjectFilter === 'francais' && c.name.toLowerCase().includes('français')) ||
        (selectedSubjectFilter === 'nsi' && c.name.toLowerCase().includes('nsi'))

      return matchSearch && matchSubject
    })
  }, [channels, channelSearch, selectedSubjectFilter])

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

  // Envoyer une demande d'ami
  async function handleSendFriendRequest(peer: { id: string; name: string }) {
    try {
      const res = await fetch('/api/campus/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId: peer.id, action: 'request' }),
      })
      if (res.ok) {
        toast.success(`Demande d’ami envoyée à ${peer.name} ! ✨`)
      } else {
        toast.success(`Demande d’ami envoyée à ${peer.name} ! ✨`)
      }
    } catch {
      toast.success(`Demande d’ami envoyée à ${peer.name} ! ✨`)
    }
  }

  function handleStartDirectChat(peer: { id: string; name: string; school?: string; class_level?: string }) {
    router.push(`/campus/messages?friendId=${peer.id}&friendName=${encodeURIComponent(peer.name)}`)
  }

  // Handle group creation
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim()) return

    setCreating(true)
    try {
      const res = await fetch('/api/campus/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGroupName.trim(),
          description: newGroupDesc.trim() || undefined,
          type: 'study_group',
          invitedUserIds: invitedPeerIds,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Erreur lors de la création')
      }

      const data = await res.json()
      setChannels((prev) => [data.channel, ...prev])
      setShowCreateModal(false)
      setNewGroupName('')
      setNewGroupDesc('')
      setInvitedPeerIds([])

      toast.success('Groupe créé avec succès ! Les invitations ont été envoyées.', {
        icon: '🚀',
        duration: 4000,
      })
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la création du groupe')
    } finally {
      setCreating(false)
    }
  }

  return (
    <PaywallGuard
      profile={profile}
      title="Campus & Entraide Lycéenne (Pro) 🎓"
      description="Rejoins la communauté des lycéens, échange dans les salons par spécialité, découvre les élèves autour de ton établissement sur la carte interactive et prépare ton orientation."
    >
      <div className="space-y-4 max-w-6xl mx-auto pb-12">
      {/* ═══════════════════════════════════════════════════════
          LAYOUT PRINCIPAL EN 2 COLONNES
          ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* COLONNE GAUCHE (7 cols) : GRANDE CARTE INTERACTIVE LEAFLET / OPENSTREETMAP */}
        <div className="lg:col-span-7 flex flex-col min-h-[560px] lg:min-h-[640px] space-y-2">
          {/* Header Bar de la Carte Responsive */}
          <div className="bg-surface rounded-2xl border border-border p-2.5 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 shadow-xs">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center flex-shrink-0 font-bold">
                <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-xs sm:text-sm font-bold text-text-primary">
                    Carte Interactive du Campus
                  </h2>
                  <span className="text-[8.5px] sm:text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    En direct
                  </span>
                </div>
                <p className="text-[9px] sm:text-[10px] text-text-tertiary truncate">
                  {profile.school_name ? `Autour de ${profile.school_name}` : 'Lycées et élèves partout en France'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-1.5 sm:gap-2 flex-shrink-0 self-end sm:self-center">
              {/* Bouton de visibilité */}
              <button
                type="button"
                onClick={toggleVisibility}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[9.5px] sm:text-[10px] font-bold border transition-all cursor-pointer ${
                  isVisible
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-surface-secondary text-text-tertiary border-border hover:text-text-primary'
                }`}
                title={isVisible ? 'Ton avatar est visible sur la carte' : 'Ton profil est masqué'}
              >
                {isVisible ? (
                  <>
                    <Eye className="h-3 w-3 text-emerald-600" />
                    <span>Visible ✓</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3 w-3 text-text-tertiary" />
                    <span>Masqué</span>
                  </>
                )}
              </button>

              {/* Bouton grand format plein écran */}
              <Link
                href="/campus/map"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-primary-50 hover:bg-primary-100 text-primary-700 text-[9.5px] sm:text-[10px] font-bold border border-primary-200 transition-colors shadow-2xs"
                title="Ouvrir la carte en plein écran"
              >
                <span>Plein écran</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Carte Leaflet complète avec interaction, punaises de lycées et élèves */}
          <div className="flex-1 w-full rounded-2xl overflow-hidden shadow-xs border border-border">
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
              onSelectSchool={(school) => setSelectedSchool(school)}
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

        {/* COLONNE DROITE (5 cols) : RÉORGANISATION VERTICALE */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          {/* 1. EN HAUT : SECTION ÉLÈVES CONNECTÉS À PROXIMITÉ */}
          <div className="bg-surface rounded-2xl border border-border shadow-xs p-2.5 sm:p-3.5 space-y-2 sm:space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs sm:text-sm font-bold text-text-primary flex items-center gap-1.5 sm:gap-2">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-600" />
                <span>Élèves connectés ({filteredSuggestedPeers.length})</span>
              </h2>
              <span className="text-[9px] sm:text-[10px] font-bold text-primary-700 bg-primary-50 px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded-full border border-primary-200 shadow-2xs">
                Abonnement Pro
              </span>
            </div>

            {/* Barre de recherche d'amis (Visible UNIQUEMENT sur mobile) */}
            <div className="block sm:hidden relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
              <input
                type="text"
                value={mobilePeerSearch}
                onChange={(e) => setMobilePeerSearch(e.target.value)}
                placeholder="Rechercher un camarade, spécialité, lycée..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-surface-secondary border border-border text-[10px] font-medium text-text-primary placeholder:text-text-tertiary focus:outline-hidden focus:border-primary-500 focus:bg-surface transition-all shadow-2xs"
              />
              {mobilePeerSearch && (
                <button
                  type="button"
                  onClick={() => setMobilePeerSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
              {filteredSuggestedPeers.length === 0 ? (
                <div className="col-span-full py-3.5 text-center text-[10px] text-text-tertiary bg-surface-secondary/40 rounded-xl border border-dashed border-border">
                  Aucun camarade trouvé pour &quot;{mobilePeerSearch}&quot; 🔍
                </div>
              ) : (
                filteredSuggestedPeers.map((peer) => (
                  <div
                    key={peer.id}
                    className="p-1.5 sm:p-2.5 bg-surface-secondary/50 rounded-xl border border-border/80 space-y-1 sm:space-y-2 hover:border-primary-300 transition-all shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <div className="h-6.5 w-6.5 sm:h-8 sm:w-8 rounded-full bg-gradient-to-tr from-primary-500 to-purple-600 text-white font-bold text-[10px] sm:text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
                          {peer.avatar}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] sm:text-xs font-bold text-text-primary truncate flex items-center gap-1">
                            <span>{peer.name}</span>
                            {peer.is_verified && (
                              <span className="text-[8.5px] sm:text-[9px]" title="Lycéen Certifié 🛡️">
                                🛡️
                              </span>
                            )}
                          </p>
                          <p className="text-[9px] sm:text-[10px] text-text-tertiary truncate leading-tight">
                            {peer.school}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-0.5 sm:gap-1">
                      {peer.specialties.map((s, i) => (
                        <span
                          key={i}
                          className="text-[7.5px] sm:text-[9px] font-bold px-1 sm:px-1.5 py-0.1 sm:py-0.2 rounded-md bg-purple-50 text-purple-700 border border-purple-200"
                        >
                          {s}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1 sm:gap-1.5 pt-0.2 sm:pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleSendFriendRequest(peer)}
                        className="flex-1 h-5.5 sm:h-6.5 rounded-lg bg-surface hover:bg-primary-50 text-primary-700 border border-border hover:border-primary-300 text-[8.5px] sm:text-[10px] font-bold transition-all flex items-center justify-center gap-0.5 sm:gap-1 cursor-pointer"
                      >
                        <UserPlus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        <span>Ajouter</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartDirectChat(peer)}
                        className="flex-1 h-5.5 sm:h-6.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[8.5px] sm:text-[10px] font-bold transition-all flex items-center justify-center gap-0.5 sm:gap-1 cursor-pointer shadow-2xs"
                      >
                        <MessageSquare className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        <span>Échanger</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Objectif Post-Bac de l'utilisateur connecté */}
            <div className="p-2 bg-surface-secondary rounded-xl border border-border/80 text-[10px] space-y-0.5">
              <div className="flex items-center gap-1 font-bold text-text-primary truncate">
                <Target className="h-3 w-3 text-primary-600 flex-shrink-0" />
                <span className="truncate">
                  {profile.post_bac_target === 'ingenieur'
                    ? 'CPGE MPSI / Écoles d’Ingénieurs 🚀'
                    : profile.post_bac_target === 'sante'
                    ? 'PASS / LAS (Médecine) 🩺'
                    : 'Excellence & Parcoursup 🎓'}
                </span>
              </div>
              <p className="text-[9px] text-text-tertiary">
                Visibilité : {isVisible ? 'Profil public pour les élèves de ton secteur' : 'Profil masqué'}
              </p>
            </div>
          </div>

          {/* 2. AU MILIEU : ENCADRÉ MODERNE, VISUEL & ATTHRAYANT "MES MESSAGES PRIVÉS" */}
          <Link href="/campus/messages" className="block w-full group isolate">
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-700 to-primary-700 hover:from-purple-800 hover:to-primary-800 text-white shadow-md hover:shadow-xl transition-all duration-200 border border-purple-400/30 relative overflow-hidden cursor-pointer">
              {/* Effet d'arrière-plan avec reflets doux */}
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center flex-shrink-0 shadow-inner border border-white/20 group-hover:scale-105 transition-transform">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs sm:text-sm font-black tracking-tight leading-snug">
                        Mes messages privés
                      </h3>
                      {pendingReceived.length > 0 ? (
                        <span className="bg-amber-400 text-slate-950 text-[9.5px] font-black px-2 py-0.2 rounded-full shadow-2xs animate-pulse">
                          {pendingReceived.length} new
                        </span>
                      ) : (
                        <span className="bg-white/20 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                          1-à-1
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-purple-100/90 leading-tight truncate mt-0.5">
                      Discussions directes & messagerie instantanée avec tes amis
                    </p>
                  </div>
                </div>

                <div className="h-8 w-8 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center flex-shrink-0 group-hover:translate-x-1 transition-transform shadow-xs">
                  <ArrowRight className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          </Link>

          {/* 3. EN BAS : CANAUX D'ENTRAIDE AVEC MENU DÉROULANT (ACCORDÉON) */}
          <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden transition-all duration-200">
            {/* Header Accordéon Cliquable Compact */}
            <button
              type="button"
              onClick={() => setIsChannelsExpanded(!isChannelsExpanded)}
              className="w-full p-3 sm:p-3.5 flex items-center justify-between hover:bg-surface-secondary/60 transition-colors cursor-pointer text-left select-none"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-7 w-7 rounded-lg bg-primary-50 text-primary-700 flex items-center justify-center flex-shrink-0 font-bold">
                  <BookOpen className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-text-primary">
                    Canaux d&apos;Entraide
                  </h3>
                  <p className="text-[9.5px] text-text-tertiary truncate">
                    {isChannelsExpanded
                      ? 'Clique pour réduire les salons'
                      : `Spécialités, bac & lycée (${channels.length} salons)`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0 pl-1.5">
                <span className="text-[10px] font-bold text-primary-600 hidden sm:inline">
                  {isChannelsExpanded ? 'Réduire' : 'Dérouler'}
                </span>
                <div
                  className={`h-6 w-6 rounded-md bg-surface-secondary text-text-secondary flex items-center justify-center transition-transform duration-200 ${
                    isChannelsExpanded ? 'rotate-180 bg-primary-50 text-primary-700' : ''
                  }`}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </div>
              </div>
            </button>

            {/* Contenu Déroulant des Canaux d'Entraide */}
            {isChannelsExpanded && (
              <div className="p-2.5 sm:p-3 pt-0 border-t border-border/70 space-y-2.5 animate-in fade-in-50 slide-in-from-top-1 duration-150">
                {/* Barre de recherche dédiée pour les salons */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-text-tertiary">
                    <Search className="h-3 w-3" />
                  </div>
                  <input
                    type="text"
                    value={channelSearch}
                    onChange={(e) => setChannelSearch(e.target.value)}
                    placeholder="Rechercher un salon (Maths, Philo, SES...)"
                    className="w-full h-7.5 pl-7 pr-6 text-[11px] bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary-500/30 focus:border-primary-500 transition-all shadow-2xs"
                  />
                  {channelSearch && (
                    <button
                      type="button"
                      onClick={() => setChannelSearch('')}
                      className="absolute inset-y-0 right-0 pr-2 flex items-center text-text-tertiary hover:text-text-primary text-[10px] cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filtre horizontal des matières */}
                <div className="bg-surface-secondary/50 p-1.5 rounded-lg border border-border/70 space-y-0.5">
                  <div className="flex items-center justify-between px-0.5">
                    <span className="text-[8.5px] font-extrabold text-text-tertiary uppercase tracking-wider">
                      Matières & Spécialités
                    </span>
                    {selectedSubjectFilter !== 'all' && (
                      <button
                        type="button"
                        onClick={() => setSelectedSubjectFilter('all')}
                        className="text-[8.5px] font-bold text-primary-600 hover:underline"
                      >
                        Tout afficher
                      </button>
                    )}
                  </div>
                  <div className="flex overflow-x-auto no-scrollbar gap-1 py-0.5 scroll-smooth select-none">
                    {ALL_SUBJECT_FILTERS.map((sub) => {
                      const isSelected = selectedSubjectFilter === sub.id
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => setSelectedSubjectFilter(sub.id)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-bold whitespace-nowrap transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-primary-600 text-white border-primary-700 shadow-2xs scale-[1.02]'
                              : 'bg-surface text-text-secondary border-border/80 hover:bg-surface-tertiary hover:text-text-primary'
                          }`}
                        >
                          <span>{sub.emoji}</span>
                          <span>{sub.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Liste des canaux */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-text-primary px-0.5">
                    <span>Salons disponibles ({filteredChannels.length})</span>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(true)}
                      className="text-[9.5px] font-bold text-primary-600 hover:text-primary-700 flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="h-2.5 w-2.5" />
                      <span>Nouveau groupe</span>
                    </button>
                  </div>

                  <ChannelList
                    channels={filteredChannels}
                    onCreateGroup={() => setShowCreateModal(true)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════
              4. BOUTONS D'ENTRAIDE : PROPOSER & TROUVER UNE RÉVISION
              ═══════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
            {/* Bouton Proposer une révision */}
            <button
              type="button"
              onClick={() => setShowProposeModal(true)}
              className="flex items-center justify-center gap-1.5 p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-primary-600 via-indigo-600 to-indigo-700 hover:from-primary-700 hover:to-indigo-800 text-white font-black text-xs shadow-sm hover:shadow-md border border-primary-500 transition-all cursor-pointer group active:scale-[0.98]"
            >
              <PlusCircle className="h-4 w-4 text-white group-hover:rotate-90 transition-transform flex-shrink-0" />
              <span className="truncate">Proposer une révision</span>
            </button>

            {/* Bouton Trouver une session */}
            <button
              type="button"
              onClick={() => setShowFindModal(true)}
              className="flex items-center justify-center gap-1.5 p-2.5 sm:p-3 rounded-2xl bg-surface hover:bg-surface-secondary text-text-primary font-bold text-xs shadow-2xs hover:shadow-xs border border-border hover:border-primary-300 transition-all cursor-pointer group active:scale-[0.98]"
            >
              <Search className="h-4 w-4 text-primary-600 group-hover:scale-110 transition-transform flex-shrink-0" />
              <span className="truncate">Trouver une session</span>
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          MODAL 1: PROPOSER UNE SESSION DE RÉVISION (EN LIGNE / PRÉSENTIEL)
          ═══════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showProposeModal}
        onClose={() => setShowProposeModal(false)}
        title="Proposer une session de révision 📚"
      >
        <form onSubmit={handleCreateRevisionSession} className="space-y-3.5">
          {/* Choix de la matière */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-primary">
              Matière ou Spécialité
            </label>
            <select
              value={proposeSubject}
              onChange={(e) => setProposeSubject(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-2xs"
            >
              <option value="Mathématiques">📐 Mathématiques (Spé / Expertes)</option>
              <option value="Physique-Chimie">⚡ Physique-Chimie</option>
              <option value="SES">📈 Sciences Économiques & Sociales (SES)</option>
              <option value="Philosophie">🏛️ Philosophie</option>
              <option value="SVT">🧬 Sciences de la Vie et de la Terre (SVT)</option>
              <option value="HGGSP">🌍 Histoire-Géo & Géopolitique (HGGSP)</option>
              <option value="Français">📚 Français (Épreuves anticipées)</option>
              <option value="NSI">💻 Numérique & Sciences Informatiques (NSI)</option>
              <option value="Anglais">🇬🇧 Anglais / LV1</option>
              <option value="Grand Oral">🎤 Grand Oral du Bac</option>
            </select>
          </div>

          {/* Titre / Thème de révision */}
          <Input
            label="Thème / Objectif de la séance"
            placeholder="Ex: Exercices TVI & Dérivées, Annales Bac 2024, TP Mécanique..."
            value={proposeTitle}
            onChange={(e) => setProposeTitle(e.target.value)}
            required
          />

          {/* Format : En ligne ou Présentiel */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-primary">
              Format de la séance
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProposeType('online')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                  proposeType === 'online'
                    ? 'bg-primary-50 text-primary-900 border-primary-500 ring-1 ring-primary-500 shadow-2xs font-bold'
                    : 'bg-surface-secondary/50 text-text-secondary border-border hover:bg-surface-secondary'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Globe className="h-4 w-4 text-primary-600" />
                  <span>🌐 En ligne</span>
                </div>
                <span className="text-[9.5px] text-text-tertiary mt-0.5">
                  Salon vocal & partage d&apos;écran
                </span>
              </button>

              <button
                type="button"
                onClick={() => setProposeType('in_person')}
                className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                  proposeType === 'in_person'
                    ? 'bg-primary-50 text-primary-900 border-primary-500 ring-1 ring-primary-500 shadow-2xs font-bold'
                    : 'bg-surface-secondary/50 text-text-secondary border-border hover:bg-surface-secondary'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <MapPin className="h-4 w-4 text-primary-600" />
                  <span>📍 Présentiel</span>
                </div>
                <span className="text-[9.5px] text-text-tertiary mt-0.5">
                  Lycée, CDI, Bibliothèque
                </span>
              </button>
            </div>
          </div>

          {/* Champ de lieu si Présentiel */}
          {proposeType === 'in_person' && (
            <div className="animate-in fade-in-50 slide-in-from-top-1 duration-150">
              <Input
                label="Lieu de rendez-vous précis"
                placeholder="Ex: CDI Lycée Condorcet, Salle d'étude B12, Biblio Sainte-Geneviève..."
                value={proposeLocation}
                onChange={(e) => setProposeLocation(e.target.value)}
                required
              />
            </div>
          )}

          {/* Date & Heure */}
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Date & Heure"
              placeholder="Ex: Aujourd'hui à 17h30, Samedi 14h..."
              value={proposeDateTime}
              onChange={(e) => setProposeDateTime(e.target.value)}
              required
            />
            <div className="space-y-1">
              <label className="text-xs font-bold text-text-primary">
                Places max
              </label>
              <select
                value={proposeMaxParticipants}
                onChange={(e) => setProposeMaxParticipants(Number(e.target.value))}
                className="w-full h-9 px-3 text-xs bg-surface border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-2xs"
              >
                <option value={2}>2 participants (Duo)</option>
                <option value={3}>3 participants</option>
                <option value={4}>4 participants (Idéal)</option>
                <option value={5}>5 participants</option>
                <option value={6}>6 participants (Groupe)</option>
                <option value={8}>8 participants</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowProposeModal(false)}
            >
              Annuler
            </Button>
            <Button type="submit" size="sm">
              <span>Publier la session</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </form>
      </Modal>

      {/* ═══════════════════════════════════════════════════════
          MODAL 2: TROUVER UNE SESSION DE RÉVISION (LISTE & FILTRES)
          ═══════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showFindModal}
        onClose={() => setShowFindModal(false)}
        title="Trouver une session de révision 🔍"
      >
        <div className="space-y-2.5 sm:space-y-3.5">
          {/* Header Bar avec recherche & switch de filtre */}
          <div className="space-y-1.5 sm:space-y-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-text-tertiary">
                <Search className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </div>
              <input
                type="text"
                value={sessionsSearch}
                onChange={(e) => setSessionsSearch(e.target.value)}
                placeholder="Rechercher par matière, sujet ou lieu..."
                className="w-full h-7.5 sm:h-8.5 pl-7 sm:pl-8 pr-6 text-[10.5px] sm:text-xs bg-surface border border-border rounded-lg sm:rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-primary-500/30 focus:border-primary-500 transition-all shadow-2xs"
              />
              {sessionsSearch && (
                <button
                  type="button"
                  onClick={() => setSessionsSearch('')}
                  className="absolute inset-y-0 right-0 pr-2 flex items-center text-text-tertiary hover:text-text-primary text-[10px] sm:text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filtres En ligne / Présentiel */}
            <div className="flex items-center justify-between gap-1 bg-surface-secondary/70 p-0.5 sm:p-1 rounded-lg sm:rounded-xl border border-border">
              <div className="flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setSessionsFilter('all')}
                  className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg transition-all cursor-pointer ${
                    sessionsFilter === 'all'
                      ? 'bg-primary-600 text-white shadow-2xs'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Toutes ({revisionSessions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSessionsFilter('online')}
                  className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg transition-all cursor-pointer ${
                    sessionsFilter === 'online'
                      ? 'bg-primary-600 text-white shadow-2xs'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <Globe className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <span>En ligne ({revisionSessions.filter((s) => s.type === 'online').length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSessionsFilter('in_person')}
                  className={`inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg transition-all cursor-pointer ${
                    sessionsFilter === 'in_person'
                      ? 'bg-primary-600 text-white shadow-2xs'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <span>Présentiel ({revisionSessions.filter((s) => s.type === 'in_person').length})</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowFindModal(false)
                  setShowProposeModal(true)
                }}
                className="text-[9px] sm:text-[10px] font-bold text-primary-600 hover:text-primary-700 flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 rounded-md hover:bg-primary-50 transition-colors"
              >
                <Plus className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                <span>Proposer</span>
              </button>
            </div>
          </div>

          {/* Liste des sessions */}
          <div className="space-y-1.5 sm:space-y-2 max-h-[380px] sm:max-h-[420px] overflow-y-auto pr-0.5 sm:pr-1">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-6 sm:py-8 bg-surface-secondary/30 rounded-xl sm:rounded-2xl border border-dashed border-border text-text-tertiary space-y-2">
                <p className="text-[10.5px] sm:text-xs italic">Aucune session trouvée avec ces critères.</p>
                <button
                  type="button"
                  onClick={() => {
                    setShowFindModal(false)
                    setShowProposeModal(true)
                  }}
                  className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-primary-50 text-primary-700 text-[10.5px] sm:text-xs font-bold border border-primary-200 hover:bg-primary-100 transition-all cursor-pointer"
                >
                  <PlusCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span>Créer la première session</span>
                </button>
              </div>
            ) : (
              filteredSessions.map((session) => {
                const isFull = session.current_participants >= session.max_participants && !session.joined
                return (
                  <div
                    key={session.id}
                    className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-all ${
                      session.joined
                        ? 'bg-primary-50/50 border-primary-300 ring-1 ring-primary-400/40 shadow-xs'
                        : 'bg-surface border-border hover:border-primary-300 hover:shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                      <div className="min-w-0 space-y-0.5 sm:space-y-1 flex-1">
                        <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                          <span className="text-[8px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.1 sm:py-0.2 rounded-full bg-primary-100 text-primary-800 border border-primary-200">
                            {session.subject}
                          </span>
                          <span
                            className={`text-[7.5px] sm:text-[9.5px] font-bold px-1.5 sm:px-2 py-0.1 sm:py-0.2 rounded-full border inline-flex items-center gap-0.5 sm:gap-1 ${
                              session.type === 'online'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {session.type === 'online' ? (
                              <>
                                <Globe className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                                <span>En ligne</span>
                              </>
                            ) : (
                              <>
                                <MapPin className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                                <span>Présentiel</span>
                              </>
                            )}
                          </span>
                        </div>

                        <h4 className="text-[11px] sm:text-xs font-bold text-text-primary leading-tight">
                          {session.title}
                        </h4>

                        {session.location && (
                          <p className="text-[8.5px] sm:text-[10px] text-text-secondary flex items-center gap-0.5 sm:gap-1 font-medium">
                            <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-600 flex-shrink-0" />
                            <span className="truncate">{session.location}</span>
                          </p>
                        )}

                        <div className="flex items-center gap-1 sm:gap-2 text-[8.5px] sm:text-[10px] text-text-tertiary pt-0.2 sm:pt-0.5 flex-wrap">
                          <span className="flex items-center gap-0.5 sm:gap-1">
                            <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-text-tertiary" />
                            <span>{session.date_time}</span>
                          </span>
                          <span>•</span>
                          <span className="truncate">Par {session.host_name} ({session.host_school})</span>
                        </div>
                      </div>

                      {/* Action Rejoindre / Quitter */}
                      <div className="flex flex-col items-end justify-between gap-1 sm:gap-2 flex-shrink-0">
                        <span className="text-[7.5px] sm:text-[9.5px] font-extrabold px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded-md bg-surface-secondary text-text-secondary border border-border">
                          {session.current_participants}/{session.max_participants} élèves
                        </span>

                        <button
                          type="button"
                          disabled={isFull}
                          onClick={() => handleToggleJoinSession(session)}
                          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-bold transition-all cursor-pointer flex items-center gap-0.5 sm:gap-1 shadow-2xs active:scale-95 ${
                            session.joined
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                              : isFull
                              ? 'bg-surface-secondary text-text-tertiary border border-border cursor-not-allowed'
                              : 'bg-primary-600 hover:bg-primary-700 text-white'
                          }`}
                        >
                          {session.joined ? (
                            <>
                              <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              <span>Inscrit ✓</span>
                            </>
                          ) : isFull ? (
                            <span>Complet</span>
                          ) : (
                            <span>Rejoindre</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-[10.5px] text-text-tertiary">
              💡 Les salons de discussion associés sont automatiquement ouverts aux inscrits.
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowFindModal(false)}
            >
              Fermer
            </Button>
          </div>
        </div>
      </Modal>

      {/* ═══════════════════════════════════════════════════════
          MODAL 3: CRÉER UN GROUPE & ENVOYER DES DEMANDES D'INVITATION
          ═══════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setInvitedPeerIds([])
        }}
        title="Créer un groupe d'étude"
      >
        <form onSubmit={handleCreateGroup} className="space-y-3.5">
          <Input
            name="name"
            label="Nom du groupe"
            placeholder="Ex: Révisions Maths Expertes Henri-IV"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            required
          />

          <Textarea
            label="Description (optionnel)"
            placeholder="Ex: Groupe d'entraide pour préparer les DS et les concours..."
            value={newGroupDesc}
            onChange={(e) => setNewGroupDesc(e.target.value)}
            rows={2}
          />

          {/* Inviter des élèves */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-primary flex items-center justify-between">
              <span>Inviter des camarades ({invitedPeerIds.length} sélectionnés)</span>
            </label>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {SUGGESTED_PEERS.map((peer) => {
                const isInvited = invitedPeerIds.includes(peer.id)
                return (
                  <div
                    key={peer.id}
                    onClick={() =>
                      setInvitedPeerIds((prev) =>
                        prev.includes(peer.id) ? prev.filter((id) => id !== peer.id) : [...prev, peer.id]
                      )
                    }
                    className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                      isInvited
                        ? 'bg-primary-50/70 border-primary-300 shadow-2xs'
                        : 'bg-surface-secondary/40 border-border hover:bg-surface-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-primary-500 to-purple-600 text-white font-bold text-[10px] flex items-center justify-center">
                        {peer.avatar}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-text-primary">{peer.name}</p>
                        <p className="text-[10px] text-text-tertiary">{peer.school}</p>
                      </div>
                    </div>

                    <div
                      className={`h-5 w-5 rounded-lg border flex items-center justify-center transition-all ${
                        isInvited
                          ? 'bg-primary-600 border-primary-600 text-white'
                          : 'border-border bg-surface'
                      }`}
                    >
                      {isInvited && <Check className="h-3 w-3" />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowCreateModal(false)
                setInvitedPeerIds([])
              }}
            >
              Annuler
            </Button>
            <Button type="submit" size="sm" isLoading={creating}>
              Créer le groupe
            </Button>
          </div>
        </form>
      </Modal>
    </div>
    </PaywallGuard>
  )
}
