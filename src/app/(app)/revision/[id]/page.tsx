'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDeleteModal } from '@/components/ui/Modal'
import { formatDateFR } from '@/lib/utils'
import { ArrowLeft, Edit3, Save, X, BookOpen, Sparkles, Copy, Check, Share2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import type { RevisionSheet } from '@/types/database'
import { RevisionContentRenderer, cleanPlainText } from '@/components/revision/RevisionContentRenderer'

export default function RevisionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [sheet, setSheet] = useState<RevisionSheet | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)

  // Safari iOS refuse souvent d'afficher/naviguer vers une URI "data:" volumineuse
  // (iframe blanche ou onglet qui ne s'ouvre pas). On convertit une seule fois en
  // Blob URL, fiable sur tous les navigateurs mobiles, sans changer le stockage
  // (toujours en base64 côté DB).
  //
  // Le cas non-"data:" est réglé pendant le rendu (plutôt qu'un setState synchrone
  // dans l'effect ci-dessous), qui ne garde alors que la conversion asynchrone.
  const [prevImageUrl, setPrevImageUrl] = useState(sheet?.original_image_url)
  if (sheet?.original_image_url !== prevImageUrl) {
    setPrevImageUrl(sheet?.original_image_url)
    if (!sheet?.original_image_url?.startsWith('data:')) {
      setPdfPreviewUrl(sheet?.original_image_url || null)
    }
  }

  useEffect(() => {
    if (!sheet?.original_image_url?.startsWith('data:')) {
      return
    }

    let objectUrl: string | null = null
    let cancelled = false

    fetch(sheet.original_image_url)
      .then((res) => res.blob())
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setPdfPreviewUrl(objectUrl)
      })
      .catch(() => {
        if (!cancelled) setPdfPreviewUrl(sheet.original_image_url)
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [sheet?.original_image_url])

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('revision_sheets')
          .select('*')
          .eq('id', id)
          .single()

        if (data) {
          setSheet(data)
          setEditContent(data.content)
          setEditTitle(data.title)
          setLoading(false)
          return
        }
      } catch {
        // Fallback
      }

      // Check localStorage
      try {
        const local = localStorage.getItem('optinote_sheets')
        if (local) {
          const list: RevisionSheet[] = JSON.parse(local)
          const found = list.find((s) => s.id === id)
          if (found) {
            setSheet(found)
            setEditContent(found.content)
            setEditTitle(found.title)
            setLoading(false)
            return
          }
        }
      } catch {}

      // Default mock fallback
      const defaultSheet: RevisionSheet = {
        id,
        user_id: 'mock',
        folder_id: 'f-1',
        subject_id: 'sub-1',
        title: id === 'sh-2' ? 'Thermodynamique & Transferts Thermiques' : 'Dérivées & Théorème des Valeurs Intermédiaires (TVI)',
        content: id === 'sh-2'
          ? '## 1. 📌 Résumé Express & Contexte\nTransferts d\'énergie par conduction, convection et rayonnement.\n\n## 2. 🔑 Définitions, Théorèmes & Formules Clés\n- **Loi de Fourier** : Le flux thermique est proportionnel au gradient de température.\n- **Résistance thermique** : $R_{th} = e / (\\lambda \\cdot S)$\n\n## 3. 🎯 Points Essentiels & Pièges à Éviter pour le Bac\n- Ne pas confondre puissance thermique et énergie thermique.'
          : '## 1. 📌 Résumé Express & Contexte\nLe TVI garantit qu\'une fonction continue prend toutes les valeurs intermédiaires.\n\n## 2. 🔑 Définitions, Théorèmes & Formules Clés\n- **Continuité** : Courbe traçable sans lever le crayon.\n- **Corollaire d\'unicité** : Si $f$ est strictement monotone sur $[a, b]$, alors $f(x) = k$ admet une unique solution $\\alpha$.\n\n## 3. 🎯 Points Essentiels & Pièges à Éviter pour le Bac\n- Ne jamais oublier de justifier la continuité et la stricte monotonie avant d\'appliquer le TVI.',
        summary: 'Fiche condensée pour réviser l\'essentiel des définitions, méthodes et réflexes indispensables pour les épreuves du Bac.',
        key_concepts: ['Théorème TVI', 'Dérivabilité', 'Continuité', 'Méthode Bac'],
        original_text: null,
        original_image_url: null,
        source_type: 'text',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setSheet(defaultSheet)
      setEditContent(defaultSheet.content)
      setEditTitle(defaultSheet.title)
      setLoading(false)
    }
    load()
  }, [id, supabase])

  async function handleSave() {
    if (!sheet) return
    setSaving(true)

    const { error } = await supabase
      .from('revision_sheets')
      .update({
        title: editTitle,
        content: editContent,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sheet.id)

    if (error) {
      toast.error('Erreur lors de la sauvegarde')
    } else {
      toast.success('Fiche sauvegardée !')
      setSheet({ ...sheet, title: editTitle, content: editContent })
      setEditing(false)
    }
    setSaving(false)
  }

  async function handleDeleteSheet() {
    if (!sheet) return
    setIsDeleting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        await supabase
          .from('revision_sheets')
          .delete()
          .eq('id', sheet.id)
      }

      // Update localStorage
      const local = localStorage.getItem('optinote_sheets')
      if (local) {
        const list: RevisionSheet[] = JSON.parse(local)
        const updated = list.filter((s) => s.id !== sheet.id)
        localStorage.setItem('optinote_sheets', JSON.stringify(updated))
      }

      toast.success('Fiche supprimée avec succès ! 🗑️')
      router.push('/revision')
    } catch (err) {
      console.error('Delete sheet error:', err)
      toast.error('Erreur lors de la suppression de la fiche')
    } finally {
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  function handleCopy() {
    if (!sheet) return
    const textToCopy = `${cleanPlainText(sheet.title)}\n\n${sheet.summary ? `RÉSUMÉ :\n${cleanPlainText(sheet.summary)}\n\n` : ''}${cleanPlainText(sheet.content)}`
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    toast.success('Fiche copiée dans le presse-papier ! 📋')
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="h-6 w-32 bg-surface-secondary rounded animate-pulse" />
        <div className="h-8 w-3/4 bg-surface-secondary rounded animate-pulse" />
        <div className="h-96 rounded-xl bg-surface-secondary animate-pulse" />
      </div>
    )
  }

  if (!sheet) {
    return (
      <div className="text-center py-20">
        <BookOpen className="h-12 w-12 text-text-tertiary mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-text-primary">
          Fiche introuvable
        </h2>
        <Button variant="secondary" className="mt-4" onClick={() => router.push('/revision')}>
          Retour aux fiches
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
      {/* Back & Actions bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/revision')}
          className="flex items-center gap-1.5 text-xs sm:text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux fiches
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface border border-border hover:bg-surface-secondary text-text-secondary hover:text-text-primary transition-all cursor-pointer shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-600">Copié !</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copier</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-surface border border-border hover:bg-error-50 text-text-tertiary hover:text-error-600 transition-all cursor-pointer shadow-2xs"
            title="Supprimer la fiche"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Supprimer</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {editing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-lg sm:text-xl font-bold"
            />
          ) : (
            <h1 className="text-xl sm:text-2xl font-black text-text-primary break-words">
              {cleanPlainText(sheet.title)}
            </h1>
          )}
          <div className="flex items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2">
            <Badge
              variant={
                sheet.key_concepts?.includes('Document PDF') || sheet.original_image_url?.startsWith('data:application/pdf')
                  ? 'primary'
                  : sheet.source_type === 'photo'
                  ? 'primary'
                  : 'default'
              }
              size="sm"
            >
              {sheet.key_concepts?.includes('Document PDF') || sheet.original_image_url?.startsWith('data:application/pdf')
                ? '📄 Document PDF'
                : sheet.source_type === 'photo'
                ? '📷 Photo Vision'
                : sheet.source_type === 'text'
                  ? '📝 Cours'
                  : '✏️ Manuel'}
            </Badge>
            <span className="text-xs text-text-tertiary">
              {formatDateFR(sheet.updated_at)}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {editing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditing(false)
                  setEditContent(sheet.content)
                  setEditTitle(sheet.title)
                }}
                leftIcon={<X className="h-4 w-4" />}
              >
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                isLoading={saving}
                leftIcon={<Save className="h-4 w-4" />}
              >
                Sauvegarder
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditing(true)}
              leftIcon={<Edit3 className="h-4 w-4" />}
            >
              Modifier
            </Button>
          )}
        </div>
      </div>

      {/* PDF Direct Viewer if sheet is an attached raw PDF */}
      {(sheet.key_concepts?.includes('Document PDF') || sheet.original_image_url?.startsWith('data:application/pdf')) && (
        <Card className="p-4 space-y-4 border-indigo-200 bg-indigo-50/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-indigo-50/80 rounded-xl border border-indigo-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs flex-shrink-0">
                PDF
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-text-primary truncate">
                  {sheet.original_text || sheet.title}
                </p>
                <p className="text-[10px] text-text-tertiary">
                  Document de cours brut attaché • Prêt pour consultation
                </p>
              </div>
            </div>

            {pdfPreviewUrl && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={pdfPreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Ouvrir dans un onglet</span>
                </a>
                <a
                  href={pdfPreviewUrl}
                  download={`${cleanPlainText(sheet.title)}.pdf`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-indigo-200 hover:bg-indigo-50 text-indigo-700 text-xs font-bold shadow-2xs transition-all cursor-pointer"
                >
                  <span>Télécharger</span>
                </a>
              </div>
            )}
          </div>

          {pdfPreviewUrl ? (
            <div className="rounded-xl overflow-hidden border border-border bg-white shadow-xs">
              <iframe
                src={pdfPreviewUrl}
                title={sheet.title}
                className="w-full h-[650px] sm:h-[750px] border-0"
              />
            </div>
          ) : (
            <div className="p-8 text-center bg-surface rounded-xl border border-dashed border-border text-xs text-text-tertiary">
              Aperçu intégré non disponible pour ce document.
            </div>
          )}
        </Card>
      )}

      {/* Summary (Only for non-PDF or additional notes) */}
      {sheet.summary && !sheet.key_concepts?.includes('Document PDF') && (
        <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary-50/90 to-blue-50/50 border border-primary-100 shadow-2xs">
          <div className="flex items-center gap-1.5 mb-1.5 text-primary-800 text-xs sm:text-sm font-black">
            <span>📌</span>
            <span>Résumé du Cours</span>
          </div>
          <p className="text-xs sm:text-sm text-primary-900 leading-relaxed">
            {cleanPlainText(sheet.summary)}
          </p>
        </div>
      )}

      {/* Key concepts */}
      {sheet.key_concepts && sheet.key_concepts.length > 0 && !sheet.key_concepts?.includes('Document PDF') && (
        <Card className="p-3 sm:p-4">
          <h3 className="text-xs sm:text-sm font-bold text-text-primary mb-2 flex items-center gap-1.5">
            <span>💡</span>
            <span>Notions Clés & Vocabulaire</span>
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {sheet.key_concepts.map((concept, i) => (
              <span
                key={i}
                className="text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 border border-primary-100 shadow-2xs"
              >
                {cleanPlainText(concept)}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Content (For standard generated sheets or note view) */}
      {!sheet.key_concepts?.includes('Document PDF') && (
        <Card>
          {editing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full min-h-[400px] p-0 text-sm bg-transparent border-0 resize-y focus:outline-none text-text-primary font-mono leading-relaxed"
            />
          ) : (
            <RevisionContentRenderer content={sheet.content} />
          )}
        </Card>
      )}

      {/* Modal Confirmation Suppression */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteSheet}
        title="Supprimer cette fiche ?"
        message="Cette action est irréversible. La fiche sera définitivement supprimée."
        isLoading={isDeleting}
      />
    </div>
  )
}
