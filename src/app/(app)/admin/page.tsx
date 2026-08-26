'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
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
  const [processingId, setProcessingId] = useState<string | null>(null)

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
        const [verifRes, reportsRes, feedbackRes] = await Promise.all([
          fetch('/api/admin/verifications'),
          fetch('/api/admin/reports'),
          fetch('/api/admin/feedback'),
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
        </>
      )}
    </div>
  )
}
