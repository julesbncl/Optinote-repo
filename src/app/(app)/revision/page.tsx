'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { checkIsPro } from '@/lib/hooks/useIsPro'
import { useAppProfile } from '@/lib/contexts/AppProfileContext'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal, ConfirmDeleteModal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { PaywallModal } from '@/components/paywall/PaywallModal'
import {
  Plus,
  BookOpen,
  FolderOpen,
  FolderPlus,
  Trash2,
  Search,
  Sparkles,
  Briefcase,
  Folder,
  FolderInput,
  Check,
  FileUp,
  Upload,
  FileText,
  CheckCircle2,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { RevisionSheet, Folder as FolderType, Profile } from '@/types/database'
import { cleanPlainText } from '@/components/revision/RevisionContentRenderer'

const DEFAULT_FOLDERS: FolderType[] = [
  { id: 'f-1', user_id: 'mock', name: 'Mathématiques', parent_id: null, position: 0, created_at: new Date().toISOString() },
  { id: 'f-2', user_id: 'mock', name: 'Physique-Chimie', parent_id: null, position: 1, created_at: new Date().toISOString() },
  { id: 'f-3', user_id: 'mock', name: 'Philosophie', parent_id: null, position: 2, created_at: new Date().toISOString() },
  { id: 'f-4', user_id: 'mock', name: 'Histoire-Géographie', parent_id: null, position: 3, created_at: new Date().toISOString() },
  { id: 'f-5', user_id: 'mock', name: 'SVT', parent_id: null, position: 4, created_at: new Date().toISOString() },
  { id: 'f-6', user_id: 'mock', name: 'SES', parent_id: null, position: 5, created_at: new Date().toISOString() },
]

const DEFAULT_SHEETS: RevisionSheet[] = [
  {
    id: 'sh-1',
    user_id: 'mock',
    folder_id: 'f-1',
    subject_id: 'sub-1',
    title: 'Dérivées & Théorème des Valeurs Intermédiaires (TVI)',
    content: '### I. Définition et Continuité\nUne fonction continue sur un intervalle [a, b] prend toutes les valeurs intermédiaires.',
    summary: 'Théorèmes de continuité, calculs de limites et extrema locaux.',
    key_concepts: ['Théorème TVI', 'Dérivabilité', 'Tangente à la courbe'],
    original_text: 'Cours de Mathématiques sur les dérivées',
    original_image_url: null,
    source_type: 'photo',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'sh-2',
    user_id: 'mock',
    folder_id: 'f-2',
    subject_id: 'sub-2',
    title: 'Thermodynamique & Transferts Thermiques',
    content: '### I. Transferts d\'Énergie\nConduction, convection et rayonnement.',
    summary: 'Loi de Fourier, résistance thermique et premier principe de la thermodynamique.',
    key_concepts: ['Conduction', 'Flux thermique', 'Capacité calorifique'],
    original_text: 'Cours de Physique',
    original_image_url: null,
    source_type: 'text',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export default function RevisionPage() {
  const router = useRouter()
  const supabase = createClient()
  const { userId } = useAppProfile()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sheets, setSheets] = useState<RevisionSheet[]>([])
  const [folders, setFolders] = useState<FolderType[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [showAddFolder, setShowAddFolder] = useState(false)
  const [showPaywallModal, setShowPaywallModal] = useState(false)
  const [moveTarget, setMoveTarget] = useState<RevisionSheet | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'sheet' | 'folder'
    id: string
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // États pour l'import de PDF
  const [showImportPdfModal, setShowImportPdfModal] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfTitle, setPdfTitle] = useState('')
  const [pdfFolderId, setPdfFolderId] = useState<string | null>(null)
  const [isImportingPdf, setIsImportingPdf] = useState(false)

  const isSubscribed = checkIsPro(profile)

  function handleCreateSheet() {
    if (!isSubscribed && sheets.length >= 1) {
      toast.error('Limite de l’Essai gratuit atteinte : 1 fiche de révision max. Débloque le mode Pro pour créer des fiches en illimité !')
      setShowPaywallModal(true)
      return
    }
    router.push('/revision/new')
  }

  async function handleMoveSheet(targetFolderId: string | null) {
    if (!moveTarget) return
    setIsSubmitting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        await supabase
          .from('revision_sheets')
          .update({
            folder_id: targetFolderId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', moveTarget.id)
      }

      // Update local state
      const updatedSheets = sheets.map((s) =>
        s.id === moveTarget.id
          ? {
              ...s,
              folder_id: targetFolderId,
              updated_at: new Date().toISOString(),
            }
          : s
      )
      setSheets(updatedSheets)
      localStorage.setItem('optinote_sheets', JSON.stringify(updatedSheets))

      const targetFolderName =
        folders.find((f) => f.id === targetFolderId)?.name || 'Général (non classé)'
      toast.success(`Fiche déplacée vers ${targetFolderName} ! 📁`)
      setMoveTarget(null)
    } catch (err) {
      console.error('Error moving sheet:', err)
      toast.error('Erreur lors du déplacement de la fiche.')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      if (userId) {
        const [profileRes, sheetsRes, foldersRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', userId).single(),
          supabase
            .from('revision_sheets')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false }),
          supabase
            .from('folders')
            .select('*')
            .eq('user_id', userId)
            .order('name'),
        ])

        if (profileRes.data) setProfile(profileRes.data)
        
        // Fiches réelles de la base
        const realSheets = sheetsRes.data || []
        setSheets(realSheets)
        localStorage.setItem('optinote_sheets', JSON.stringify(realSheets))

        // Dossiers avec seeding automatique en Supabase si vide
        let realFolders = foldersRes.data || []
        if (realFolders.length === 0) {
          const toInsert = DEFAULT_FOLDERS.map((f, idx) => ({
            user_id: userId,
            name: f.name,
            position: idx,
          }))
          const { data: seeded } = await supabase.from('folders').insert(toInsert).select('*')
          if (seeded && seeded.length > 0) {
            realFolders = seeded
          } else {
            realFolders = DEFAULT_FOLDERS
          }
        }
        setFolders(realFolders)
        localStorage.setItem('optinote_folders', JSON.stringify(realFolders))
      } else {
        const hasInit = localStorage.getItem('optinote_revision_initialized')
        if (!hasInit) {
          localStorage.setItem('optinote_folders', JSON.stringify(DEFAULT_FOLDERS))
          localStorage.setItem('optinote_sheets', JSON.stringify(DEFAULT_SHEETS))
          localStorage.setItem('optinote_revision_initialized', 'true')
          setFolders(DEFAULT_FOLDERS)
          setSheets(DEFAULT_SHEETS)
        } else {
          const localFolders = localStorage.getItem('optinote_folders')
          const localSheets = localStorage.getItem('optinote_sheets')
          setFolders(localFolders ? JSON.parse(localFolders) : DEFAULT_FOLDERS)
          setSheets(localSheets ? JSON.parse(localSheets) : [])
        }
      }
    } catch {
      setFolders(DEFAULT_FOLDERS)
      setSheets([])
    } finally {
      setLoading(false)
    }
  }

  async function handleAddFolder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data, error } = await supabase
          .from('folders')
          .insert({
            user_id: user.id,
            name,
          })
          .select()
          .single()

        if (!error && data) {
          setFolders((prev) => [...prev, data])
        }
      } else {
        const newFolder: FolderType = {
          id: `f-${Date.now()}`,
          user_id: 'mock',
          name,
          parent_id: null,
          position: folders.length,
          created_at: new Date().toISOString(),
        }
        const updated = [...folders, newFolder]
        setFolders(updated)
        localStorage.setItem('optinote_folders', JSON.stringify(updated))
      }

      toast.success('Dossier créé !')
      setShowAddFolder(false)
    } catch {
      toast.error('Erreur lors de la création du dossier')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    setIsSubmitting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (deleteTarget.type === 'sheet') {
        if (user) {
          await supabase
            .from('revision_sheets')
            .delete()
            .eq('id', deleteTarget.id)
        }
        const updated = sheets.filter((s) => s.id !== deleteTarget.id)
        setSheets(updated)
        localStorage.setItem('optinote_sheets', JSON.stringify(updated))
        toast.success('Fiche supprimée ! 🗑️')
      } else {
        if (user) {
          await supabase.from('folders').delete().eq('id', deleteTarget.id)
          await supabase
            .from('revision_sheets')
            .update({ folder_id: null })
            .eq('folder_id', deleteTarget.id)
        }
        const updatedFolders = folders.filter((f) => f.id !== deleteTarget.id)
        const updatedSheets = sheets.map((s) =>
          s.folder_id === deleteTarget.id ? { ...s, folder_id: null } : s
        )
        setFolders(updatedFolders)
        setSheets(updatedSheets)
        localStorage.setItem('optinote_folders', JSON.stringify(updatedFolders))
        localStorage.setItem('optinote_sheets', JSON.stringify(updatedSheets))
        if (selectedFolder === deleteTarget.id) {
          setSelectedFolder(null)
        }
        toast.success('Dossier supprimé ! Les fiches ont été déplacées vers Non classé.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Erreur lors de la suppression')
    } finally {
      setDeleteTarget(null)
      setIsSubmitting(false)
    }
  }

  async function handleImportPdf(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!pdfFile) {
      toast.error('Veuillez sélectionner un fichier PDF.')
      return
    }

    setIsImportingPdf(true)
    const finalTitle = pdfTitle.trim() || pdfFile.name.replace(/\.pdf$/i, '')
    const selectedFolderObj = folders.find((f) => f.id === pdfFolderId)
    const folderName = selectedFolderObj?.name || 'Général'
    const fileSizeKo = Math.round(pdfFile.size / 1024)

    // Lecture du fichier PDF sous forme de Data URL pour consultation directe sans traitement IA
    let pdfDataUrl = ''
    try {
      pdfDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => resolve('')
        reader.readAsDataURL(pdfFile)
      })
    } catch {
      pdfDataUrl = ''
    }

    const content = `## 📄 Document de Cours Attaché (PDF Brut)
- **Nom du fichier** : \`${pdfFile.name}\` (${fileSizeKo} Ko)
- **Dossier / Matière** : **${folderName}**
- **Date d'importation** : ${new Date().toLocaleDateString('fr-FR')}

> Ce document PDF est stocké tel quel dans votre espace de révision sans modification par IA.`

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      let createdSheet: RevisionSheet | null = null

      if (user) {
        let resolvedFolderId = pdfFolderId
        if (resolvedFolderId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resolvedFolderId)) {
          const { data: existingFolder } = await supabase
            .from('folders')
            .select('id')
            .eq('user_id', user.id)
            .ilike('name', folderName)
            .maybeSingle()

          if (existingFolder) {
            resolvedFolderId = existingFolder.id
          } else {
            const { data: newFolder } = await supabase
              .from('folders')
              .insert({ user_id: user.id, name: folderName })
              .select('id')
              .single()
            resolvedFolderId = newFolder?.id || null
          }
        }

        const { data: sheet, error: insertError } = await supabase
          .from('revision_sheets')
          .insert({
            user_id: user.id,
            folder_id: resolvedFolderId,
            title: finalTitle,
            original_text: pdfFile.name,
            original_image_url: pdfDataUrl || null,
            content: content,
            key_concepts: ['Document PDF', finalTitle, folderName],
            summary: `Document PDF de cours brut "${pdfFile.name}" (${fileSizeKo} Ko).`,
            source_type: 'manual',
          })
          .select()
          .single()

        if (!insertError && sheet) {
          createdSheet = sheet
        }
      }

      const finalSheet: RevisionSheet = createdSheet || {
        id: `sh-${Date.now()}`,
        user_id: user?.id || 'mock',
        folder_id: pdfFolderId,
        subject_id: null,
        title: finalTitle,
        original_text: pdfFile.name,
        original_image_url: pdfDataUrl || null,
        content: content,
        key_concepts: ['Document PDF', finalTitle, folderName],
        summary: `Document PDF de cours brut "${pdfFile.name}" (${fileSizeKo} Ko).`,
        source_type: 'manual',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const updatedSheets: RevisionSheet[] = [
        finalSheet,
        ...sheets.filter((s) => s.id !== finalSheet.id),
      ]
      setSheets(updatedSheets)
      localStorage.setItem('optinote_sheets', JSON.stringify(updatedSheets))

      toast.success(`Document PDF "${finalTitle}" stocké dans ${folderName} ! 📄🎉`)
      setShowImportPdfModal(false)
      setPdfFile(null)
      setPdfTitle('')
      setPdfFolderId(null)
    } catch (err) {
      console.error('Error importing PDF:', err)
      toast.error("Erreur lors de l'importation du document PDF.")
    } finally {
      setIsImportingPdf(false)
    }
  }

  const filteredSheets = sheets.filter((sheet) => {
    const matchesSearch =
      cleanPlainText(sheet.title).toLowerCase().includes(search.toLowerCase()) ||
      (sheet.summary && cleanPlainText(sheet.summary).toLowerCase().includes(search.toLowerCase())) ||
      (sheet.key_concepts &&
        sheet.key_concepts.some((c) => c.toLowerCase().includes(search.toLowerCase())))

    let matchesFolder = true
    if (selectedFolder === 'unorganized') {
      matchesFolder =
        !sheet.folder_id ||
        !folders.some(
          (f) =>
            f.id === sheet.folder_id ||
            (f.name && f.name.toLowerCase() === sheet.folder_id?.toLowerCase())
        )
    } else if (selectedFolder !== null) {
      const activeFolder = folders.find((f) => f.id === selectedFolder)
      matchesFolder =
        sheet.folder_id === selectedFolder ||
        Boolean(
          activeFolder &&
            sheet.folder_id &&
            folders.find((f) => f.id === sheet.folder_id)?.name.toLowerCase() === activeFolder.name.toLowerCase()
        ) ||
        Boolean(
          activeFolder &&
            sheet.folder_id &&
            sheet.folder_id.toLowerCase() === activeFolder.name.toLowerCase()
        )
    }

    return matchesSearch && matchesFolder
  })

  const unclassifiedCount = sheets.filter(
    (s) =>
      !s.folder_id ||
      !folders.some(
        (f) =>
          f.id === s.folder_id ||
          (f.name && f.name.toLowerCase() === s.folder_id?.toLowerCase())
      )
  ).length

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2.5 sm:space-y-4 max-w-5xl mx-auto pb-8">
      {/* Free Tier Quota Notice (Couleur bleue élégante et signature) */}
      {!isSubscribed && (
        <div className="p-2.5 sm:p-3.5 bg-primary-50 border border-primary-200 rounded-xl sm:rounded-2xl flex items-center justify-between gap-2 sm:gap-3 text-[10.5px] sm:text-sm text-primary-900 shadow-2xs">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="text-sm sm:text-base">⚡</span>
            <span className="truncate">
              <strong>Version Découverte :</strong> 1 fiche de révision gratuite ({sheets.length >= 1 ? '1/1 atteinte' : '0/1'}).
            </span>
          </div>
          <Link
            href="/pricing"
            className="text-primary-700 hover:text-primary-800 font-bold whitespace-nowrap text-[10px] sm:text-xs underline flex-shrink-0"
          >
            Passer Pro ➔
          </Link>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          HEADER BAR COMPACTE & BOUTONS D'ACTION
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 bg-surface p-3 sm:p-3.5 rounded-2xl border border-border shadow-2xs">
        <div>
          <h1 className="text-base sm:text-xl font-black text-text-primary tracking-tight flex items-center gap-1.5">
            <span>Sac à Dos & Fiches de Révision IA</span>
            <span className="text-base">🎒</span>
          </h1>
          <p className="text-[10px] sm:text-xs text-text-secondary mt-0.5">
            Génère tes fiches de cours par IA, importe tes PDF et classe-les dans tes dossiers par matière.
          </p>
        </div>

        {/* Boutons d'action : Grille responsive (compacte sur mobile, fluide sur desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 sm:flex sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowAddFolder(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-surface-secondary hover:bg-surface-tertiary text-text-primary text-[11px] sm:text-xs font-bold border border-border transition-all cursor-pointer shadow-2xs active:scale-95 text-center truncate"
          >
            <FolderPlus className="h-3.5 w-3.5 text-primary-600 flex-shrink-0" />
            <span className="truncate">Nouveau dossier</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPdfFile(null)
              setPdfTitle('')
              setPdfFolderId(selectedFolder !== 'unorganized' ? selectedFolder : null)
              setShowImportPdfModal(true)
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100/80 text-indigo-700 text-[11px] sm:text-xs font-bold border border-indigo-200 transition-all cursor-pointer shadow-2xs active:scale-95 text-center truncate"
          >
            <FileUp className="h-3.5 w-3.5 text-indigo-600 flex-shrink-0" />
            <span className="truncate">Importer un cours (PDF)</span>
          </button>

          <button
            type="button"
            onClick={handleCreateSheet}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-[11px] sm:text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 text-center truncate"
          >
            <Plus className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">Créer une fiche IA</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          CLASSEUR DE DOSSIERS EN GRILLE PURE DE 2 COLONNES (SANS GRAND ENCADRÉ)
          ═══════════════════════════════════════════════════════ */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-[10px] sm:text-xs font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1">
              <Briefcase className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary-600" />
              Classeur de cours ({folders.length} matières)
            </h3>
            {selectedFolder !== null && (
              <button
                type="button"
                onClick={() => setSelectedFolder(null)}
                className="text-[10px] sm:text-[11px] font-bold text-primary-600 hover:text-primary-800 underline cursor-pointer"
              >
                Afficher tout
              </button>
            )}
          </div>
          <span className="text-[10px] sm:text-xs text-text-tertiary font-medium">
            {sheets.length} fiche{sheets.length > 1 ? 's' : ''} enregistrée{sheets.length > 1 ? 's' : ''}
          </span>
        </div>

        {/* Grille pure de dossiers */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
          {folders.map((folder) => {
            const isSelected = selectedFolder === folder.id
            const folderCount = sheets.filter(
              (s) =>
                s.folder_id === folder.id ||
                Boolean(
                  s.folder_id &&
                    folders.find((f) => f.id === s.folder_id)?.name.toLowerCase() === folder.name.toLowerCase()
                ) ||
                Boolean(
                  s.folder_id &&
                    s.folder_id.toLowerCase() === folder.name.toLowerCase()
                )
            ).length

            return (
              <div
                key={folder.id}
                className={`p-1.5 sm:p-2 rounded-xl border transition-all flex items-center justify-between gap-1 ${
                  isSelected
                    ? 'bg-primary-50 text-primary-900 border-primary-400 ring-1 ring-primary-500/20 shadow-2xs font-bold'
                    : 'bg-surface border-border text-text-secondary hover:border-primary-300 hover:bg-surface-secondary hover:text-text-primary'
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setSelectedFolder(selectedFolder === folder.id ? null : folder.id)
                  }
                  className="flex items-center gap-1 min-w-0 flex-1 text-left cursor-pointer"
                  title={`Filtrer les fiches de ${folder.name}`}
                >
                  <Folder className={`h-3 w-3 flex-shrink-0 ${isSelected ? 'text-primary-700' : 'text-primary-600'}`} />
                  <span className="text-[10px] sm:text-[11px] font-bold truncate">{folder.name}</span>
                </button>

                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <span
                    className={`text-[8px] sm:text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-primary-200 text-primary-900'
                        : 'bg-surface-secondary text-text-tertiary'
                    }`}
                  >
                    {folderCount}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setDeleteTarget({ type: 'folder', id: folder.id })
                    }
                    className="text-text-tertiary hover:text-error-600 p-0.5 rounded cursor-pointer leading-none text-[10px]"
                    title="Supprimer ce dossier"
                  >
                    ×
                  </button>
                </div>
              </div>
            )
          })}

          {/* Dossier Non Classé si des fiches n'ont pas de dossier assigné */}
          {unclassifiedCount > 0 && (
            <div
              className={`p-1.5 sm:p-2 rounded-xl border transition-all flex items-center justify-between gap-1 ${
                selectedFolder === 'unorganized'
                  ? 'bg-amber-50 text-amber-900 border-amber-400 ring-1 ring-amber-500/20 shadow-2xs font-bold'
                  : 'bg-surface border-border text-text-secondary hover:border-amber-300 hover:bg-amber-50/40 hover:text-text-primary'
              }`}
            >
              <button
                type="button"
                onClick={() =>
                  setSelectedFolder(selectedFolder === 'unorganized' ? null : 'unorganized')
                }
                className="flex items-center gap-1 min-w-0 flex-1 text-left cursor-pointer"
                title="Filtrer les fiches non classées"
              >
                <FolderOpen className={`h-3 w-3 flex-shrink-0 ${selectedFolder === 'unorganized' ? 'text-amber-700' : 'text-amber-600'}`} />
                <span className="text-[10px] sm:text-[11px] font-bold truncate">Non classé</span>
              </button>

              <div className="flex items-center gap-0.5 flex-shrink-0">
                <span
                  className={`text-[8px] sm:text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                    selectedFolder === 'unorganized'
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-surface-secondary text-text-tertiary'
                  }`}
                >
                  {unclassifiedCount}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          BARRE DE RECHERCHE COMPACTE : "Rechercher une notion"
          ═══════════════════════════════════════════════════════ */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary" />
        <input
          type="text"
          placeholder="Rechercher une notion"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8.5 pr-3 py-1.5 h-8 sm:h-8.5 rounded-xl border border-border bg-surface text-[11px] sm:text-xs text-text-primary placeholder:text-text-tertiary focus:outline-hidden focus:border-primary-400 transition-all shadow-2xs"
        />
      </div>

      {/* Grille des Fiches de Révision */}
      {filteredSheets.length === 0 ? (
        <Card className="text-center py-8">
          <BookOpen className="h-8 w-8 text-text-tertiary mx-auto mb-1.5 opacity-60" />
          <h3 className="font-bold text-xs sm:text-sm text-text-primary">
            {search
              ? 'Aucune fiche ne correspond à cette notion'
              : 'Aucune fiche dans ce dossier'}
          </h3>
          <p className="text-[10px] sm:text-xs text-text-secondary mt-0.5">
            {search
              ? 'Essaie un autre mot-clé ou efface la recherche.'
              : 'Colle le texte de ton cours pour générer instantanément ta première fiche synthétique.'}
          </p>
          <button
            type="button"
            onClick={handleCreateSheet}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-[11px] font-bold shadow-2xs mt-2 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="h-3 w-3" />
            Créer une fiche IA
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
          {filteredSheets.map((sheet) => {
            const folder = folders.find((f) => f.id === sheet.folder_id)
            const isPdf = Boolean(
              sheet.key_concepts?.includes('Document PDF') ||
              sheet.original_image_url?.startsWith('data:application/pdf') ||
              sheet.original_text?.toLowerCase().endsWith('.pdf')
            )

            return (
              <Card
                key={sheet.id}
                className={`p-2.5 sm:p-3 hover:border-primary-300 hover:shadow-xs transition-all flex flex-col justify-between group ${
                  isPdf ? 'border-indigo-100 bg-gradient-to-b from-indigo-50/20 to-surface' : ''
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1.5 mb-1">
                    <div className="flex flex-wrap items-center gap-1">
                      {folder ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-primary-50 text-primary-700 border border-primary-100">
                          <Folder className="h-2 w-2 text-primary-600" />
                          {folder.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.2 rounded-md bg-surface-secondary text-text-tertiary border border-border">
                          Non classé
                        </span>
                      )}
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-md ${
                          isPdf
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-surface-secondary text-text-tertiary'
                        }`}
                      >
                        {isPdf
                          ? '📄 Document PDF'
                          : sheet.source_type === 'photo'
                          ? '📸 Scan Photo'
                          : '📝 Texte'}
                      </span>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {/* Bouton de déplacement rapide */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setMoveTarget(sheet)
                        }}
                        className="text-text-tertiary hover:text-primary-700 hover:bg-primary-50 p-1 rounded-md transition-all cursor-pointer flex items-center gap-0.5 text-[9px] font-semibold"
                        title="Déplacer vers un autre dossier"
                      >
                        <FolderInput className="h-3 w-3 text-primary-600" />
                        <span className="hidden sm:inline">Ranger</span>
                      </button>

                      {/* Bouton suppression */}
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({ type: 'sheet', id: sheet.id })
                        }
                        className="text-text-tertiary hover:text-error-600 p-1 rounded-md opacity-70 hover:opacity-100 transition-all cursor-pointer"
                        title="Supprimer la fiche"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  <Link href={`/revision/${sheet.id}`}>
                    <h3 className="font-bold text-xs sm:text-sm text-text-primary group-hover:text-primary-600 transition-colors line-clamp-2">
                      {cleanPlainText(sheet.title)}
                    </h3>
                  </Link>

                  {sheet.summary && (
                    <p className="text-[10px] sm:text-[11px] text-text-secondary mt-0.5 line-clamp-2 leading-relaxed">
                      {cleanPlainText(sheet.summary)}
                    </p>
                  )}

                  {sheet.key_concepts && sheet.key_concepts.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {sheet.key_concepts.slice(0, 2).map((concept, idx) => (
                        <span
                          key={idx}
                          className="text-[8px] sm:text-[9px] font-medium px-1.5 py-0.2 rounded bg-surface-secondary text-text-secondary border border-border"
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-1.5 mt-1.5 border-t border-border flex items-center justify-between text-[9px] sm:text-[10px] text-text-tertiary">
                  <span>
                    {sheet.updated_at
                      ? new Date(sheet.updated_at).toLocaleDateString('fr-FR')
                      : 'Récemment'}
                  </span>
                  <Link
                    href={`/revision/${sheet.id}`}
                    className={`font-bold inline-flex items-center gap-0.5 hover:underline ${
                      isPdf ? 'text-indigo-600' : 'text-primary-600'
                    }`}
                  >
                    <span>{isPdf ? 'Ouvrir le PDF' : 'Réviser'}</span>
                    <span>➔</span>
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal Ajout Dossier */}
      <Modal
        isOpen={showAddFolder}
        onClose={() => setShowAddFolder(false)}
        title="Créer un nouveau dossier de matière"
      >
        <form onSubmit={handleAddFolder} className="space-y-3">
          <Input
            name="name"
            label="Nom de la matière ou du dossier"
            placeholder="ex: SVT, Sciences Éco, Espagnol..."
            required
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowAddFolder(false)}
            >
              Annuler
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Créer le dossier
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Déplacement Rapide vers un Dossier */}
      <Modal
        isOpen={moveTarget !== null}
        onClose={() => setMoveTarget(null)}
        title="Classer dans un dossier"
      >
        <div className="space-y-4">
          <div className="p-2.5 rounded-xl bg-surface-secondary border border-border">
            <p className="text-[11px] text-text-tertiary font-semibold uppercase tracking-wider">
              Fiche sélectionnée
            </p>
            <p className="text-xs sm:text-sm font-bold text-text-primary mt-0.5 line-clamp-1">
              {moveTarget ? cleanPlainText(moveTarget.title) : ''}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold text-text-primary mb-2">
              Choisir le dossier de destination :
            </p>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {/* Option Non classé / Général */}
              <button
                type="button"
                onClick={() => handleMoveSheet(null)}
                disabled={isSubmitting}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                  moveTarget?.folder_id === null
                    ? 'bg-primary-50 border-primary-300 text-primary-900 ring-1 ring-primary-400'
                    : 'bg-surface hover:bg-surface-secondary border-border text-text-secondary hover:text-text-primary'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">🗂️</span>
                  <span>Non classé (Général)</span>
                </div>
                {moveTarget?.folder_id === null && (
                  <Check className="h-4 w-4 text-primary-600" />
                )}
              </button>

              {/* Liste des dossiers existants */}
              {folders.map((f) => {
                const isCurrent = moveTarget?.folder_id === f.id
                const count = sheets.filter((s) => s.folder_id === f.id).length

                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleMoveSheet(f.id)}
                    disabled={isSubmitting}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-primary-50 border-primary-300 text-primary-900 ring-1 ring-primary-400'
                        : 'bg-surface hover:bg-surface-secondary border-border text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-primary-600" />
                      <span>{f.name}</span>
                      <span className="text-[10px] text-text-tertiary font-normal">
                        ({count} fiche{count > 1 ? 's' : ''})
                      </span>
                    </div>
                    {isCurrent && (
                      <Check className="h-4 w-4 text-primary-600" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setMoveTarget(null)
                setShowAddFolder(true)
              }}
              className="text-xs font-bold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nouveau dossier</span>
            </button>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setMoveTarget(null)}
            >
              Fermer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Confirmation Suppression */}
      <ConfirmDeleteModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={
          deleteTarget?.type === 'sheet'
            ? 'Supprimer cette fiche ?'
            : 'Supprimer ce dossier ?'
        }
        message={
          deleteTarget?.type === 'sheet'
            ? 'Cette action est irréversible.'
            : 'Les fiches présentes dans ce dossier ne seront pas supprimées, mais déplacées.'
        }
        isLoading={isSubmitting}
      />

      {/* Modal Importer un cours (PDF) */}
      <Modal
        isOpen={showImportPdfModal}
        onClose={() => {
          if (!isImportingPdf) setShowImportPdfModal(false)
        }}
        title="Importer un cours (PDF) 📄"
      >
        <form onSubmit={handleImportPdf} className="space-y-3.5 sm:space-y-4">
          {/* Zone de sélection du fichier PDF */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1.5">
              Fichier PDF du cours <span className="text-red-500">*</span>
            </label>

            {pdfFile ? (
              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                      <p className="text-xs font-bold text-text-primary truncate">
                        {pdfFile.name}
                      </p>
                    </div>
                    <p className="text-[10px] text-text-tertiary">
                      {Math.round(pdfFile.size / 1024)} Ko • Document PDF prêt
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPdfFile(null)
                    setPdfTitle('')
                  }}
                  className="p-1 rounded-lg text-text-tertiary hover:text-error-600 hover:bg-error-50 transition-colors cursor-pointer"
                  title="Changer de fichier"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-1.5 h-28 border-2 border-dashed border-border hover:border-indigo-400 hover:bg-indigo-50/20 rounded-xl transition-all cursor-pointer text-center p-3">
                <Upload className="h-6 w-6 text-indigo-600" />
                <span className="text-xs font-bold text-text-primary">
                  Sélectionner un fichier PDF
                </span>
                <p className="text-[10px] text-text-tertiary">
                  Polycopié ou cours rédigé (PDF jusqu&apos;à 20 Mo)
                </p>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setPdfFile(file)
                      if (!pdfTitle) {
                        setPdfTitle(file.name.replace(/\.pdf$/i, ''))
                      }
                    }
                  }}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Titre du cours */}
          <Input
            value={pdfTitle}
            onChange={(e) => setPdfTitle(e.target.value)}
            label="Titre de la fiche / du cours"
            placeholder="ex: Les Fonctions Exponentielles - Chapitre 2"
            required
          />

          {/* Choix du dossier / matière */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-1.5 flex items-center justify-between">
              <span>Ranger dans la matière / dossier :</span>
              {pdfFolderId && (
                <span className="text-[10px] text-primary-700 font-semibold">
                  {folders.find((f) => f.id === pdfFolderId)?.name}
                </span>
              )}
            </label>

            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => setPdfFolderId(null)}
                className={`p-2 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  pdfFolderId === null
                    ? 'bg-amber-50 border-amber-300 text-amber-900 ring-1 ring-amber-400'
                    : 'bg-surface border-border text-text-secondary hover:border-border-hover'
                }`}
              >
                <span className="truncate">Non classé</span>
                {pdfFolderId === null && <Check className="h-3 w-3 text-amber-600 flex-shrink-0" />}
              </button>

              {folders.map((f) => {
                const isSelected = pdfFolderId === f.id
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setPdfFolderId(f.id)}
                    className={`p-2 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-primary-50 border-primary-300 text-primary-900 ring-1 ring-primary-400'
                        : 'bg-surface border-border text-text-secondary hover:border-primary-300'
                    }`}
                  >
                    <span className="truncate">{f.name}</span>
                    {isSelected && <Check className="h-3 w-3 text-primary-600 flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowImportPdfModal(false)}
              disabled={isImportingPdf}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isImportingPdf}
              disabled={!pdfFile || isImportingPdf}
              leftIcon={<FileUp className="h-3.5 w-3.5" />}
            >
              Importer et classer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Paywall Quota */}
      <PaywallModal
        isOpen={showPaywallModal}
        onClose={() => setShowPaywallModal(false)}
        featureLocked="sheet_limit"
      />
    </div>
  )
}
