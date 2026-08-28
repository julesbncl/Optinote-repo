'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatPrice } from '@/lib/constants'
import toast from 'react-hot-toast'
import {
  ShieldAlert,
  ShieldCheck,
  Check,
  X,
  FileWarning,
  Flag,
  MessageCircle,
  Bug,
  Lightbulb,
  Rocket,
  Sparkles,
  Wallet,
} from 'lucide-react'

interface PendingVerification {
  id: string
  full_name: string | null
  email: string
  school_name: string | null
  class_level: string | null
  school_certificate_url: string | null
  certificate_signed_url: string | null
  verification_note: string | null
  updated_at: string
}

interface MessageReport {
  id: string
  message_id: string
  reason: string
  details: string | null
  status: 'pending' | 'reviewed' | 'dismissed'
  created_at: string
  reporter: { full_name: string | null; email: string } | null
  message: {
    content: string
    created_at: string
    sender: { full_name: string | null; email: string } | null
  } | null
}

interface FeedbackEntry {
  id: string
  type: 'bug' | 'idea' | 'other'
  message: string
  page_url: string | null
  status: 'new' | 'reviewed'
  created_at: string
  profiles: { full_name: string | null; email: string } | null
}

interface WaitlistEntry {
  id: string
  email: string
  class_level: string | null
  created_at: string
}

interface CreatorCodeStats {
  id: string
  code: string
  creator_name: string
  creator_email: string | null
  discount_percent: number
  commission_percent: number
  is_active: boolean
  redemptions_count: number
  total_revenue_cents: number
  total_commission_cents: number
  commission_due_cents: number
}

function eur(cents: number): string {
  return formatPrice(cents / 100)
}

const FEEDBACK_TYPE_LABELS: Record<string, { label: string; icon: typeof Bug }> = {
  bug: { label: 'Bug', icon: Bug },
  idea: { label: 'Idée', icon: Lightbulb },
  other: { label: 'Autre', icon: MessageCircle },
}

const REASON_LABELS: Record<string, string> = {
  harcelement: 'Harcèlement',
  propos_inappropries: 'Propos inappropriés',
  spam: 'Spam',
  divulgation_donnees: 'Divulgation de données',
  autre: 'Autre',
}

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [verifications, setVerifications] = useState<PendingVerification[]>([])
  const [reports, setReports] = useState<MessageReport[]>([])
  const [feedbackEntries, setFeedbackEntries] = useState<FeedbackEntry[]>([])
  const [waitlistCount, setWaitlistCount] = useState(0)
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([])
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [creators, setCreators] = useState<CreatorCodeStats[]>([])
  const [creatingCreator, setCreatingCreator] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newCreatorName, setNewCreatorName] = useState('')
  const [newCreatorEmail, setNewCreatorEmail] = useState('')

  useEffect(() => {
    async function checkAccess() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      if (!profile?.is_admin) {
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
      setChecking(false)
    }

    checkAccess()
  }, [supabase, router])

  useEffect(() => {
    if (!isAdmin) return

    async function loadData() {
      try {
        const [verifRes, reportsRes, feedbackRes, waitlistRes, creatorsRes] = await Promise.all([
          fetch('/api/admin/verifications'),
          fetch('/api/admin/reports'),
          fetch('/api/admin/feedback'),
          fetch('/api/admin/waitlist'),
          fetch('/api/admin/creators'),
        ])
        if (verifRes.ok) {
          const data = await verifRes.json()
          setVerifications(data.verifications || [])
        }
        if (reportsRes.ok) {
          const data = await reportsRes.json()
          setReports((data.reports || []).filter((r: MessageReport) => r.status === 'pending'))
        }
        if (feedbackRes.ok) {
          const data = await feedbackRes.json()
          setFeedbackEntries((data.feedback || []).filter((f: FeedbackEntry) => f.status === 'new'))
        }
        if (waitlistRes.ok) {
          const data = await waitlistRes.json()
          setWaitlistCount(data.count || 0)
          setWaitlistEntries(data.entries || [])
        }
        if (creatorsRes.ok) {
          const data = await creatorsRes.json()
          setCreators(data.creators || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isAdmin])

  async function handleVerificationDecision(profileId: string, decision: 'verified' | 'rejected') {
    setProcessingId(profileId)
    try {
      const res = await fetch('/api/admin/verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, decision }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        toast.error(data?.error || 'Erreur lors de la mise à jour')
        return
      }
      setVerifications((prev) => prev.filter((v) => v.id !== profileId))
      toast.success(decision === 'verified' ? 'Compte vérifié ✅' : 'Certificat rejeté')
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setProcessingId(null)
    }
  }

  async function handleReportDecision(reportId: string, status: 'reviewed' | 'dismissed') {
    setProcessingId(reportId)
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, status }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        toast.error(data?.error || 'Erreur lors de la mise à jour')
        return
      }
      setReports((prev) => prev.filter((r) => r.id !== reportId))
      toast.success(status === 'reviewed' ? 'Signalement traité' : 'Signalement classé sans suite')
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setProcessingId(null)
    }
  }

  async function handleFeedbackDecision(feedbackId: string) {
    setProcessingId(feedbackId)
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackId, status: 'reviewed' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        toast.error(data?.error || 'Erreur lors de la mise à jour')
        return
      }
      setFeedbackEntries((prev) => prev.filter((f) => f.id !== feedbackId))
      toast.success('Retour marqué comme traité')
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setProcessingId(null)
    }
  }

  async function handleCreateCreator(e: React.FormEvent) {
    e.preventDefault()
    if (!newCode.trim() || !newCreatorName.trim()) return

    setCreatingCreator(true)
    try {
      const res = await fetch('/api/admin/creators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode.trim(),
          creatorName: newCreatorName.trim(),
          creatorEmail: newCreatorEmail.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.error || 'Erreur lors de la création du code')
        return
      }
      setCreators((prev) => [{ ...data.creator, redemptions_count: 0, total_revenue_cents: 0, total_commission_cents: 0, commission_due_cents: 0 }, ...prev])
      setNewCode('')
      setNewCreatorName('')
      setNewCreatorEmail('')
      toast.success(`Code ${data.creator.code} créé ! 🎉`)
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors de la création du code')
    } finally {
      setCreatingCreator(false)
    }
  }

  async function handleToggleCreatorActive(creatorCodeId: string, isActive: boolean) {
    setProcessingId(creatorCodeId)
    try {
      const res = await fetch('/api/admin/creators', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorCodeId, isActive }),
      })
      if (!res.ok) {
        toast.error('Erreur lors de la mise à jour')
        return
      }
      setCreators((prev) => prev.map((c) => (c.id === creatorCodeId ? { ...c, is_active: isActive } : c)))
      toast.success(isActive ? 'Code réactivé' : 'Code désactivé')
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setProcessingId(null)
    }
  }

  async function handleMarkCreatorPaidOut(creatorCodeId: string) {
    setProcessingId(creatorCodeId)
    try {
      const res = await fetch('/api/admin/creators', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorCodeId, markPaidOut: true }),
      })
      if (!res.ok) {
        toast.error('Erreur lors du marquage comme payé')
        return
      }
      setCreators((prev) =>
        prev.map((c) => (c.id === creatorCodeId ? { ...c, commission_due_cents: 0 } : c))
      )
      toast.success('Commission marquée comme versée')
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors du marquage comme payé')
    } finally {
      setProcessingId(null)
    }
  }

  if (checking) {
    return (
      <div className="space-y-3 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-primary-600" />
        <h1 className="text-lg font-black text-text-primary">Administration</h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      ) : (
        <>
          {/* Certificats en attente */}
          <Card className="p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <ShieldCheck className="h-4 w-4 text-primary-600" />
              <h2 className="text-sm font-bold text-text-primary">
                Certificats en attente ({verifications.length})
              </h2>
            </div>

            {verifications.length === 0 ? (
              <p className="text-xs text-text-tertiary py-3 text-center">
                Aucun certificat en attente de vérification.
              </p>
            ) : (
              <div className="space-y-2">
                {verifications.map((v) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-xl border border-border bg-surface-secondary/40 flex flex-col sm:flex-row sm:items-center gap-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-text-primary truncate">
                        {v.full_name || 'Sans nom'} <span className="text-text-tertiary font-normal">— {v.email}</span>
                      </p>
                      <p className="text-[10.5px] text-text-secondary truncate">
                        {v.school_name || 'Établissement non renseigné'} • {v.class_level || '—'}
                      </p>
                      {v.verification_note && (
                        <p className="text-[10px] text-amber-700 mt-0.5 truncate">
                          IA : {v.verification_note}
                        </p>
                      )}
                    </div>

                    {v.certificate_signed_url && (
                      <a
                        href={v.certificate_signed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10.5px] font-bold text-primary-600 hover:text-primary-700 underline flex-shrink-0"
                      >
                        Voir le document
                      </a>
                    )}

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={processingId === v.id}
                        onClick={() => handleVerificationDecision(v.id, 'rejected')}
                        className="gap-1"
                      >
                        <X className="h-3.5 w-3.5" />
                        Rejeter
                      </Button>
                      <Button
                        size="sm"
                        disabled={processingId === v.id}
                        onClick={() => handleVerificationDecision(v.id, 'verified')}
                        className="gap-1"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Valider
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Signalements de messages */}
          <Card className="p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <Flag className="h-4 w-4 text-primary-600" />
              <h2 className="text-sm font-bold text-text-primary">
                Signalements en attente ({reports.length})
              </h2>
            </div>

            {reports.length === 0 ? (
              <p className="text-xs text-text-tertiary py-3 text-center">
                Aucun signalement en attente.
              </p>
            ) : (
              <div className="space-y-2">
                {reports.map((r) => (
                  <div key={r.id} className="p-3 rounded-xl border border-border bg-surface-secondary/40 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 flex items-center gap-1">
                        <FileWarning className="h-3 w-3" />
                        {REASON_LABELS[r.reason] || r.reason}
                      </span>
                      <span className="text-[10px] text-text-tertiary">
                        {new Date(r.created_at).toLocaleString('fr-FR')}
                      </span>
                    </div>

                    <p className="text-[10.5px] text-text-secondary">
                      Signalé par <strong>{r.reporter?.full_name || r.reporter?.email || 'inconnu'}</strong>
                      {r.message?.sender && (
                        <> • Auteur du message : <strong>{r.message.sender.full_name || r.message.sender.email}</strong></>
                      )}
                    </p>

                    {r.message?.content && (
                      <p className="text-xs text-text-primary bg-surface p-2 rounded-lg border border-border/80 italic">
                        « {r.message.content} »
                      </p>
                    )}

                    {r.details && (
                      <p className="text-[10.5px] text-text-secondary">Détails : {r.details}</p>
                    )}

                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={processingId === r.id}
                        onClick={() => handleReportDecision(r.id, 'dismissed')}
                      >
                        Classer sans suite
                      </Button>
                      <Button
                        size="sm"
                        disabled={processingId === r.id}
                        onClick={() => handleReportDecision(r.id, 'reviewed')}
                        className="gap-1"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Marquer traité
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Retours utilisateurs (bugs / idées) */}
          <Card className="p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <MessageCircle className="h-4 w-4 text-primary-600" />
              <h2 className="text-sm font-bold text-text-primary">
                Retours utilisateurs ({feedbackEntries.length})
              </h2>
            </div>

            {feedbackEntries.length === 0 ? (
              <p className="text-xs text-text-tertiary py-3 text-center">
                Aucun retour en attente.
              </p>
            ) : (
              <div className="space-y-2">
                {feedbackEntries.map((f) => {
                  const typeInfo = FEEDBACK_TYPE_LABELS[f.type] || FEEDBACK_TYPE_LABELS.other
                  const TypeIcon = typeInfo.icon
                  return (
                    <div key={f.id} className="p-3 rounded-xl border border-border bg-surface-secondary/40 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200 flex items-center gap-1">
                          <TypeIcon className="h-3 w-3" />
                          {typeInfo.label}
                        </span>
                        <span className="text-[10px] text-text-tertiary">
                          {new Date(f.created_at).toLocaleString('fr-FR')}
                        </span>
                      </div>

                      <p className="text-[10.5px] text-text-secondary">
                        Par <strong>{f.profiles?.full_name || f.profiles?.email || 'inconnu'}</strong>
                        {f.page_url && <> • page <code className="text-[10px]">{f.page_url}</code></>}
                      </p>

                      <p className="text-xs text-text-primary bg-surface p-2 rounded-lg border border-border/80 whitespace-pre-wrap">
                        {f.message}
                      </p>

                      <div className="flex items-center justify-end">
                        <Button
                          size="sm"
                          disabled={processingId === f.id}
                          onClick={() => handleFeedbackDecision(f.id)}
                          className="gap-1"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Marquer traité
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Liste d'attente Beta (TikTok) */}
          <Card className="p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <Rocket className="h-4 w-4 text-primary-600" />
              <h2 className="text-sm font-bold text-text-primary">
                Liste d&apos;attente Beta ({waitlistCount})
              </h2>
            </div>

            {waitlistEntries.length === 0 ? (
              <p className="text-xs text-text-tertiary py-3 text-center">
                Aucune inscription pour le moment.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {waitlistEntries.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg border border-border bg-surface-secondary/40 text-[11px]"
                  >
                    <span className="text-text-primary font-medium truncate">{w.email}</span>
                    <div className="flex items-center gap-2 flex-shrink-0 text-text-tertiary">
                      {w.class_level && (
                        <span className="px-1.5 py-0.2 rounded-full bg-primary-50 text-primary-700 border border-primary-200 text-[9.5px] font-bold uppercase">
                          {w.class_level}
                        </span>
                      )}
                      <span>{new Date(w.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Programme partenaire créateurs */}
          <Card className="p-3.5 space-y-3">
            <div className="flex items-center gap-2 border-b border-border pb-2">
              <Sparkles className="h-4 w-4 text-primary-600" />
              <h2 className="text-sm font-bold text-text-primary">
                Créateurs partenaires ({creators.length})
              </h2>
            </div>

            <form onSubmit={handleCreateCreator} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
              <Input
                label="Code (ex: PSEUDO15)"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="PSEUDO15"
                required
              />
              <Input
                label="Nom du créateur"
                value={newCreatorName}
                onChange={(e) => setNewCreatorName(e.target.value)}
                placeholder="Pseudo TikTok"
                required
              />
              <Input
                label="Email (optionnel)"
                type="email"
                value={newCreatorEmail}
                onChange={(e) => setNewCreatorEmail(e.target.value)}
                placeholder="Relie son compte OptiNote"
              />
              <Button type="submit" isLoading={creatingCreator} className="w-full">
                Créer le code
              </Button>
            </form>
            <p className="text-[10px] text-text-tertiary -mt-1">
              -15% pour sa communauté et 15% de commission par défaut, y compris sur les renouvellements. Si l&apos;email correspond à un compte OptiNote existant, le créateur peut se connecter et voir ses stats sur <code className="text-[9.5px]">/creator</code>.
            </p>

            {creators.length === 0 ? (
              <p className="text-xs text-text-tertiary py-3 text-center">
                Aucun code créateur pour le moment.
              </p>
            ) : (
              <div className="space-y-2">
                {creators.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center gap-2.5 ${
                      c.is_active ? 'border-border bg-surface-secondary/40' : 'border-border/60 bg-surface-secondary/20 opacity-70'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-text-primary truncate">
                        {c.code} <span className="text-text-tertiary font-normal">— {c.creator_name}</span>
                        {!c.is_active && (
                          <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-danger-50 text-danger-700 border border-danger-200">
                            Inactif
                          </span>
                        )}
                      </p>
                      <p className="text-[10.5px] text-text-secondary">
                        {c.redemptions_count} abonné{c.redemptions_count > 1 ? 's' : ''} • {eur(c.total_revenue_cents)} générés • {eur(c.total_commission_cents)} de commission totale
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {c.commission_due_cents > 0 && (
                        <span className="text-[10.5px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg flex items-center gap-1">
                          <Wallet className="h-3 w-3" />
                          {eur(c.commission_due_cents)} dû
                        </span>
                      )}
                      {c.commission_due_cents > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={processingId === c.id}
                          onClick={() => handleMarkCreatorPaidOut(c.id)}
                        >
                          Marquer versé
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant={c.is_active ? 'danger' : 'secondary'}
                        disabled={processingId === c.id}
                        onClick={() => handleToggleCreatorActive(c.id, !c.is_active)}
                      >
                        {c.is_active ? 'Désactiver' : 'Réactiver'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
