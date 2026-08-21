'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { CLASS_LEVELS } from '@/lib/constants'
import { OFFICIAL_SPECIALTIES } from '@/lib/curriculum'
import {
  Save,
  LogOut,
  Shield,
  CreditCard,
  CheckCircle2,
  Zap,
  GraduationCap,
  Lock,
  Camera,
  Loader2,
  Check,
  Upload,
  Image as ImageIcon,
  ShieldCheck,
  FileText,
  BadgeCheck,
  Clock,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import type { Profile } from '@/types/database'

const DEFAULT_PROFILE: Profile = {
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
  is_verified: true,
  verification_status: 'verified',
  preferences: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE)
  const [specialties, setSpecialties] = useState<string[]>(['Mathématiques', 'Physique-Chimie'])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingIdCard, setUploadingIdCard] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const idCardInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

          if (data) {
            setProfile(data)
            setIsVisible(data.is_visible_on_school ?? true)
            setSpecialties(
              data.specialties && data.specialties.length > 0
                ? data.specialties
                : ['Mathématiques', 'Physique-Chimie']
            )
          }
        } else {
          const local = localStorage.getItem('optinote_mock_profile')
          if (local) {
            const p: Profile = JSON.parse(local)
            setProfile(p)
            setIsVisible(p.is_visible_on_school ?? true)
            setSpecialties(p.specialties || ['Mathématiques', 'Physique-Chimie'])
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase])

  function toggleSpecialty(name: string) {
    if (specialties.includes(name)) {
      setSpecialties(specialties.filter((s) => s !== name))
    } else {
      if (specialties.length < 3) {
        setSpecialties([...specialties, name])
      } else {
        toast.error('Tu peux sélectionner au maximum 3 spécialités.')
      }
    }
  }

  // 1. Upload de la photo de profil vers Supabase Storage & Profile
  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner un fichier image valide.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('L’image est trop volumineuse (maximum 5 Mo).')
      return
    }

    setUploadingAvatar(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      let finalUrl: string | null = null

      if (user) {
        const fileExt = file.name.split('.').pop() || 'jpg'
        const filePath = `${user.id}/${Date.now()}.${fileExt}`

        const { error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, { upsert: true })

        if (!uploadErr) {
          const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
          finalUrl = data.publicUrl
        }
      }

      // Fallback si bucket non créé ou mode local
      if (!finalUrl) {
        finalUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
      }

      if (user && finalUrl) {
        await supabase
          .from('profiles')
          .update({
            avatar_url: finalUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
      }

      setProfile((prev) => {
        const updated = { ...prev, avatar_url: finalUrl }
        localStorage.setItem('optinote_mock_profile', JSON.stringify(updated))
        return updated
      })

      toast.success('Photo de profil mise à jour avec succès ! 📸')
    } catch (err) {
      console.error('Error uploading avatar:', err)
      toast.error('Erreur lors du téléchargement de l’avatar.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  // 1b. Upload de la carte de lycéen / pièce d'identité vers Supabase Storage
  async function handleIdCardUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 8 * 1024 * 1024) {
      toast.error('Le document est trop volumineux (maximum 8 Mo).')
      return
    }

    setUploadingIdCard(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      let finalUrl: string | null = null

      if (user) {
        const fileExt = file.name.split('.').pop() || 'jpg'
        const filePath = `${user.id}/${Date.now()}.${fileExt}`

        const { error: uploadErr } = await supabase.storage
          .from('id-documents')
          .upload(filePath, file, { upsert: true })

        if (!uploadErr) {
          const { data } = supabase.storage.from('id-documents').getPublicUrl(filePath)
          finalUrl = data.publicUrl
        }
      }

      if (!finalUrl) {
        finalUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
      }

      if (user) {
        await supabase
          .from('profiles')
          .update({
            id_card_url: finalUrl,
            verification_status: 'pending',
            is_verified: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
      }

      setProfile((prev) => {
        const updated: Profile = {
          ...prev,
          id_card_url: finalUrl,
          verification_status: 'pending',
          is_verified: false,
        }
        localStorage.setItem('optinote_mock_profile', JSON.stringify(updated))
        return updated
      })

      toast.success(
        'Document d’identité transmis ! Vérification de l’âge (< 19 ans) et du statut lycéen en cours ⏳',
        { duration: 5500, icon: '🛡️' }
      )
    } catch (err) {
      console.error('Error uploading ID card:', err)
      toast.error('Erreur lors du transfert du document d’identité.')
    } finally {
      setUploadingIdCard(false)
    }
  }

  // 1c. Simulation / Validation instantanée pour démonstration
  async function handleToggleVerification(targetStatus: 'verified' | 'none') {
    const isNowVerified = targetStatus === 'verified'
    const newStatus = isNowVerified ? 'verified' : 'none'

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        await supabase
          .from('profiles')
          .update({
            is_verified: isNowVerified,
            verification_status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
      }

      setProfile((prev) => {
        const updated: Profile = {
          ...prev,
          is_verified: isNowVerified,
          verification_status: newStatus,
        }
        localStorage.setItem('optinote_mock_profile', JSON.stringify(updated))
        return updated
      })

      if (isNowVerified) {
        toast.success('Félicitations ! Ton compte est désormais Lycéen Certifié 🛡️ ✨', {
          icon: '🎓',
          duration: 4500,
        })
      } else {
        toast('Statut de vérification réinitialisé.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors de la mise à jour.')
    }
  }

  // 2. Sauvegarde des informations avec état dynamique "Validé ✓"
  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)

    const formData = new FormData(e.currentTarget)
    const fullName = formData.get('fullName') as string
    const classLevel = (formData.get('classLevel') as Profile['class_level']) || 'terminale'
    const schoolName = (formData.get('schoolName') as string) || 'Lycée Henri IV'

    const updatedProfile: Profile = {
      ...profile,
      full_name: fullName,
      class_level: classLevel,
      school_name: schoolName,
      specialties: specialties,
      is_visible_on_school: isVisible,
      updated_at: new Date().toISOString(),
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            class_level: classLevel,
            school_name: schoolName,
            specialties: specialties,
            is_visible_on_school: isVisible,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
      }

      setProfile(updatedProfile)
      localStorage.setItem('optinote_mock_profile', JSON.stringify(updatedProfile))
      setSaved(true)

      // Réinitialiser l'état validé après 2.8 secondes
      setTimeout(() => {
        setSaved(false)
      }, 2800)
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        router.push('/pricing')
      }
    } catch {
      toast.error('Erreur d’accès au portail Stripe')
    } finally {
      setPortalLoading(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-2">
        <div className="h-6 w-36 skeleton rounded-lg" />
        <div className="h-40 skeleton rounded-2xl" />
      </div>
    )
  }

  const isSubscribed = Boolean(
    profile &&
      (profile.is_pro === true ||
        (['active', 'trialing'].includes(profile.subscription_status || '') &&
          (profile.subscription_tier === 'monthly' || profile.subscription_tier === 'annual')))
  )

  return (
    <div className="max-w-2xl mx-auto space-y-2.5 sm:space-y-3.5 pb-8">
      {/* ═══════════════════════════════════════════════════════
          1. EN PREMIER (TOUT EN HAUT) : INFORMATIONS SCOLAIRES
          ═══════════════════════════════════════════════════════ */}
      <Card className="p-2.5 sm:p-3 space-y-2 shadow-2xs">
        <div className="border-b border-border pb-1 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5 text-primary-600" />
            <h2 className="text-xs sm:text-sm font-bold text-text-primary">
              Informations Scolaires
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            {profile?.is_verified && (
              <span className="text-[8.5px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5">
                <span>Certifié</span>
                <ShieldCheck className="h-2.5 w-2.5" />
              </span>
            )}
            <span className="text-[9px] font-bold text-text-tertiary">
              Lycée Général & Techno
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-2.5">
          {/* Input fichier caché pour l'upload de photo */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarUpload}
            accept="image/*"
            className="hidden"
          />

          {/* Header Identité avec Upload Photo interactif */}
          <div className="flex items-center gap-2.5 p-2 bg-surface-secondary/50 rounded-2xl border border-border/60">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative group cursor-pointer flex-shrink-0"
              title="Cliquer pour changer de photo de profil"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || 'Avatar'}
                  className="h-10 w-10 sm:h-11 sm:w-11 rounded-full object-cover border-2 border-primary-500 shadow-2xs"
                />
              ) : (
                <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-gradient-to-tr from-primary-500 to-accent-500 text-white flex items-center justify-center font-black text-sm shadow-2xs">
                  {profile?.full_name?.charAt(0) || 'T'}
                </div>
              )}

              {/* Overlay au survol */}
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                {uploadingAvatar ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </div>

              {/* Badge icône caméra */}
              <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary-600 text-white flex items-center justify-center border border-white shadow-2xs">
                <Camera className="h-2.5 w-2.5" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 min-w-0">
                  <p className="font-bold text-xs sm:text-sm text-text-primary truncate">
                    {profile?.full_name || 'Thomas Dubois'}
                  </p>
                  {profile?.is_verified && (
                    <span className="text-[10px]" title="Lycéen Certifié 🛡️">
                      🛡️
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="text-[10px] font-bold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-2 py-0.5 rounded-md border border-primary-200 transition-colors cursor-pointer"
                >
                  {uploadingAvatar ? 'Envoi...' : 'Modifier la photo'}
                </button>
              </div>
              <p className="text-[10px] text-text-tertiary truncate">
                {profile?.email || 'thomas.dubois@lycee.fr'}
              </p>
            </div>
          </div>

          {/* Champ : Nom et Prénom */}
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-0.5">
              Nom et Prénom
            </label>
            <input
              type="text"
              name="fullName"
              defaultValue={profile?.full_name || 'Thomas Dubois'}
              required
              placeholder="ex: Thomas Dubois"
              className="w-full h-7.5 px-2.5 text-xs bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-primary-400 focus:outline-hidden transition-all"
            />
          </div>

          {/* Grille 2 Colonnes : Niveau & Établissement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-0.5">
                Classe
              </label>
              <select
                name="classLevel"
                defaultValue={profile?.class_level || 'terminale'}
                className="w-full h-7.5 px-2 text-xs bg-surface border border-border rounded-lg text-text-primary focus:border-primary-400 focus:outline-hidden transition-all"
              >
                {CLASS_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-0.5">
                Lycée / Établissement
              </label>
              <input
                type="text"
                name="schoolName"
                defaultValue={profile?.school_name || 'Lycée Henri IV'}
                placeholder="ex: Lycée Henri IV"
                className="w-full h-7.5 px-2.5 text-xs bg-surface border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:border-primary-400 focus:outline-hidden transition-all"
              />
            </div>
          </div>

          {/* Sélection des Spécialités */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                Spécialités ({specialties.length}/3)
              </label>
              <span className="text-[9px] text-text-tertiary">
                Clique pour ajouter ou retirer
              </span>
            </div>

            <div className="flex flex-wrap gap-1">
              {OFFICIAL_SPECIALTIES.map((spec) => {
                const isSelected = specialties.includes(spec.name)
                return (
                  <button
                    key={spec.id}
                    type="button"
                    onClick={() => toggleSpecialty(spec.name)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9.5px] font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-primary-50 text-primary-800 border-primary-300 shadow-2xs scale-[1.01]'
                        : 'bg-surface text-text-secondary border-border/80 hover:bg-surface-secondary'
                    }`}
                  >
                    <span>{spec.emoji}</span>
                    <span>{spec.name}</span>
                    {isSelected && <Check className="h-2.5 w-2.5 text-primary-700" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Toggle Visibilité Publique sur la Carte */}
          <div className="flex items-center justify-between p-2 bg-surface-secondary/40 rounded-xl border border-border/80">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-text-primary">
                  Visibilité carte campus
                </p>
                <p className="text-[8px] text-text-secondary">
                  Visible auprès des camarades de ton lycée
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsVisible(!isVisible)}
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[9px] font-bold border transition-all cursor-pointer flex-shrink-0 ${
                isVisible
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs'
                  : 'bg-surface-tertiary text-text-tertiary border-border'
              }`}
            >
              {isVisible ? 'Visible ✓' : 'Masqué'}
            </button>
          </div>

          {/* Bouton Sauvegarder avec États Dynamiques */}
          <button
            type="submit"
            disabled={saving}
            className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer h-8 sm:h-8.5 ${
              saved
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 scale-[1.01]'
                : saving
                ? 'bg-primary-500 text-white opacity-85 cursor-wait'
                : 'bg-primary-600 hover:bg-primary-700 text-white active:scale-[0.99]'
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Enregistrement en cours...</span>
              </>
            ) : saved ? (
              <>
                <Check className="h-3.5 w-3.5 text-white stroke-[3]" />
                <span>Enregistré</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>Enregistrer mes informations</span>
              </>
            )}
          </button>
        </form>
      </Card>

      {/* ═══════════════════════════════════════════════════════
          2. VÉRIFICATION DU COMPTE & BADGE LYCÉEN CERTIFIÉ 🛡️
          ═══════════════════════════════════════════════════════ */}
      <Card className="p-2.5 sm:p-3 space-y-2.5 shadow-2xs">
        <div className="border-b border-border pb-1 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary-600" />
            <h2 className="text-xs sm:text-sm font-bold text-text-primary">
              Vérification du Compte & Badge Lycéen 🛡️
            </h2>
          </div>
          {profile?.is_verified ? (
            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5">
              <span>Lycéen Certifié</span>
              <Check className="h-2.5 w-2.5" />
            </span>
          ) : profile?.verification_status === 'pending' ? (
            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-0.5">
              <span>Vérification en cours ⏳</span>
            </span>
          ) : (
            <span className="text-[9px] font-bold text-text-tertiary">
              Non vérifié
            </span>
          )}
        </div>

        {/* Contenu dynamique selon statut */}
        {profile?.is_verified ? (
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-teal-50/50 to-emerald-50/80 border border-emerald-200 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-xs flex-shrink-0">
                🛡️
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-emerald-950 flex items-center gap-1">
                  <span>Compte Lycéen Certifié & Validé (-19 ans)</span>
                  <BadgeCheck className="h-4 w-4 text-emerald-600 inline" />
                </p>
                <p className="text-[10px] text-emerald-800 leading-snug">
                  Ton statut d&apos;élève et ton âge ont été validés. Le badge officiel protège ton compte et apparaît sur ton profil et sur la carte interactive.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-emerald-200/70 text-[9.5px]">
              <span className="text-emerald-700 font-semibold">
                Justificatif officiel validé (Passeport / Carte d’identité / Carte de lycéen) ✓
              </span>
              <button
                type="button"
                onClick={() => handleToggleVerification('none')}
                className="text-emerald-700 hover:text-emerald-800 underline font-bold cursor-pointer"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        ) : profile?.verification_status === 'pending' ? (
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-50/80 via-yellow-50/50 to-amber-50/80 border border-amber-200 space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-sm shadow-xs flex-shrink-0 animate-pulse">
                ⏳
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-amber-950">
                  Vérification en cours par nos équipes ⏳
                </p>
                <p className="text-[10px] text-amber-800 leading-snug">
                  Ton justificatif a été reçu. Notre système vérifie ta date de naissance (&lt; 19 ans) et ton établissement sous 24h ouvrées.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-amber-200/70">
              <span className="text-[9.5px] text-amber-700 font-semibold">
                Contrôle d&apos;âge &amp; de scolarité en cours
              </span>
              <button
                type="button"
                onClick={() => handleToggleVerification('verified')}
                className="inline-flex items-center gap-1 text-[9.5px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-2 py-0.5 rounded-lg shadow-2xs transition-all cursor-pointer"
                title="Valider immédiatement (Mode Démo)"
              >
                <Sparkles className="h-2.5 w-2.5" />
                <span>Valider le compte (Démo)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Note de Sécurité & Protection des Mineurs */}
            <div className="p-2 sm:p-2.5 bg-blue-50/70 rounded-xl border border-blue-200/90 text-blue-900 space-y-1">
              <div className="flex items-center gap-1.5 font-extrabold text-[10.5px] text-blue-950">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                <span>Espace 100% sécurisé réservé aux lycéens (Moins de 19 ans)</span>
              </div>
              <p className="text-[9.5px] sm:text-[10px] text-blue-800 leading-relaxed">
                Afin de garantir un environnement d&apos;entraide sécurisé, bienveillant et strictement réservé aux élèves, la date de naissance sur ton document d&apos;identité doit prouver que tu as <strong className="text-blue-950 font-bold">moins de 19 ans</strong> (couvrant l&apos;ensemble du cursus jusqu&apos;à la fin de Terminale).
              </p>
            </div>

            <div className="p-2.5 rounded-2xl bg-surface-secondary/60 border border-border space-y-2">
              <div>
                <p className="text-[10.5px] text-text-primary font-bold">
                  Pièces d&apos;identité officielles acceptées :
                </p>
                <p className="text-[10px] text-text-secondary">
                  <strong>Passeport, carte d&apos;identité ou carte d&apos;étudiant/lycéen</strong>.
                </p>
              </div>

              <input
                type="file"
                ref={idCardInputRef}
                onChange={handleIdCardUpload}
                accept="image/*,application/pdf"
                className="hidden"
              />

              <div
                onClick={() => idCardInputRef.current?.click()}
                className="border-2 border-dashed border-primary-300 hover:border-primary-500 bg-primary-50/40 hover:bg-primary-50/70 rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
              >
                {uploadingIdCard ? (
                  <div className="flex items-center gap-2 text-primary-700 text-xs font-bold">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Téléchargement sécurisé en cours...</span>
                  </div>
                ) : (
                  <>
                    <div className="h-7 w-7 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                      <Upload className="h-3.5 w-3.5" />
                    </div>
                    <p className="text-xs font-bold text-primary-900 leading-snug">
                      Cliquer pour importer : Passeport, carte d&apos;identité ou carte d&apos;étudiant/lycéen
                    </p>
                    <p className="text-[9.5px] text-text-tertiary mt-0.5">
                      Formats acceptés : JPG, PNG ou PDF (Max 8 Mo) • Données chiffrées &amp; strictement confidentielles
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Démo rapide de validation */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => handleToggleVerification('verified')}
                className="text-[9.5px] font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 cursor-pointer"
              >
                <span>⚡ Valider automatiquement mon justificatif &lt; 19 ans (Mode Démo)</span>
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* ═══════════════════════════════════════════════════════
          2. EN SECOND (AU MILIEU) : FORMULE & ABONNEMENT (LIMITATIONS MISES EN AVANT)
          ═══════════════════════════════════════════════════════ */}
      <div className="space-y-1">
        <h2 className="text-xs sm:text-sm font-bold text-text-primary flex items-center gap-1.5 px-0.5">
          <CreditCard className="h-3.5 w-3.5 text-primary-600" />
          <span>Formule & Abonnement</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
          {/* Bloc Gauche : Version Découverte (Limitations mises en avant, mot 'Gratuit' supprimé) */}
          <div
            className={`p-2.5 rounded-2xl border transition-all flex flex-col justify-between ${
              !isSubscribed
                ? 'bg-surface border-primary-300 shadow-2xs ring-1 ring-primary-400/20'
                : 'bg-surface-secondary/50 border-border opacity-70'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-xs font-black text-text-primary">
                  Version Découverte
                </span>
                <span
                  className={`text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase border ${
                    !isSubscribed
                      ? 'bg-primary-100 text-primary-800 border-primary-200'
                      : 'bg-surface-secondary text-text-tertiary border-border'
                  }`}
                >
                  {!isSubscribed ? 'Actuel' : 'Limitée'}
                </span>
              </div>

              {/* Liste des fonctionnalités verrouillées et limitations */}
              <ul className="text-[9.5px] sm:text-[10px] text-text-secondary space-y-0.5">
                <li className="flex items-center gap-1 text-text-secondary">
                  <span className="text-primary-600 font-black text-xs leading-none">✕</span>
                  <span className="leading-tight">Carte des lycéens & salons d&apos;entraide verrouillés</span>
                </li>
                <li className="flex items-center gap-1 text-text-secondary">
                  <span className="text-primary-600 font-black text-xs leading-none">✕</span>
                  <span className="leading-tight">Planning IA verrouillé</span>
                </li>
                <li className="flex items-center gap-1 text-text-secondary">
                  <span className="text-primary-600 font-black text-xs leading-none">!</span>
                  <span className="leading-tight">Limité à 1 note par matière</span>
                </li>
                <li className="flex items-center gap-1 text-text-secondary">
                  <span className="text-primary-600 font-black text-xs leading-none">!</span>
                  <span className="leading-tight">Fiches de révision limitées</span>
                </li>
              </ul>
            </div>

            <div className="pt-1.5 mt-1.5 border-t border-border/60 flex items-center justify-between">
              <span className="text-[9px] font-bold text-text-tertiary">
                Mode Découverte
              </span>
              {!isSubscribed && (
                <span className="text-[8px] font-bold text-primary-700 bg-primary-50 px-1 py-0.2 rounded">
                  Fonctionnalités bridées
                </span>
              )}
            </div>
          </div>

          {/* Bloc Droite : Option Pro (Illimitée) */}
          <div
            className={`p-2.5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
              isSubscribed
                ? 'bg-emerald-50/40 border-emerald-500 shadow-2xs'
                : 'bg-primary-50/40 border-primary-500 shadow-2xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-xs font-black text-primary-950 flex items-center gap-1">
                  <span>Formule Pro</span>
                  <span className="text-primary-600">✨</span>
                </span>
                <span className="text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase bg-primary-600 text-white shadow-2xs">
                  {isSubscribed ? 'Abonné' : 'Illimité'}
                </span>
              </div>

              <ul className="text-[9.5px] sm:text-[10px] text-primary-900 font-medium space-y-0.5">
                <li className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-primary-600 flex-shrink-0" />
                  <span className="leading-tight">Fiches & Scans photo illimités</span>
                </li>
                <li className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-primary-600 flex-shrink-0" />
                  <span className="leading-tight">Planning IA & Agenda auto</span>
                </li>
                <li className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-primary-600 flex-shrink-0" />
                  <span className="leading-tight">Simulateur & Moyennes complètes</span>
                </li>
              </ul>
            </div>

            <div className="pt-1.5 mt-1.5 border-t border-primary-200/70">
              {isSubscribed ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleManageBilling}
                  isLoading={portalLoading}
                  className="w-full text-[10px] font-bold h-7"
                >
                  Gérer mon abonnement
                </Button>
              ) : (
                <Link href="/pricing" className="block w-full">
                  <button
                    type="button"
                    className="w-full inline-flex items-center justify-center gap-1 px-2 py-1 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-[10px] sm:text-[11px] font-bold shadow-2xs transition-all cursor-pointer h-7"
                  >
                    <Zap className="h-3 w-3" />
                    <span>Passer Pro (dès 5,99 €) ➔</span>
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          3. EN DERNIER (TOUT EN BAS) : COMPTE & DÉCONNEXION
          ═══════════════════════════════════════════════════════ */}
      <Card className="p-2.5 sm:p-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold text-text-primary">
              Session active
            </p>
            <p className="text-[9px] text-text-secondary">
              Connecté en tant que <span className="font-semibold text-text-primary">{profile?.email}</span>
            </p>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={handleSignOut}
            leftIcon={<LogOut className="h-3 w-3" />}
            className="text-[11px] font-bold h-7 px-3 w-full sm:w-auto shadow-2xs cursor-pointer"
          >
            Se déconnecter
          </Button>
        </div>
      </Card>
    </div>
  )
}
