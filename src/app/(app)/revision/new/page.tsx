'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import {
  Sparkles,
  FileText,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Folder,
  Plus,
  Check,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { PaywallModal } from '@/components/paywall/PaywallModal'
import { cleanMathNotation } from '@/components/revision/RevisionContentRenderer'
import type { Folder as FolderType } from '@/types/database'

const DEFAULT_FOLDERS: FolderType[] = [
  { id: 'f-1', user_id: 'mock', name: 'Mathématiques', parent_id: null, position: 0, created_at: new Date().toISOString() },
  { id: 'f-2', user_id: 'mock', name: 'Physique-Chimie', parent_id: null, position: 1, created_at: new Date().toISOString() },
  { id: 'f-3', user_id: 'mock', name: 'Philosophie', parent_id: null, position: 2, created_at: new Date().toISOString() },
  { id: 'f-4', user_id: 'mock', name: 'Histoire-Géographie', parent_id: null, position: 3, created_at: new Date().toISOString() },
  { id: 'f-5', user_id: 'mock', name: 'SVT', parent_id: null, position: 4, created_at: new Date().toISOString() },
  { id: 'f-6', user_id: 'mock', name: 'SES', parent_id: null, position: 5, created_at: new Date().toISOString() },
]

// Générateur de révision structuré en 4 parties avec nettoyage mathématique complet
function generateLocalRevisionSheet(rawText: string, titleHint?: string, subjectHint?: string) {
  const cleanedText = cleanMathNotation(rawText)
  const rawLines = cleanedText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  const firstLine = rawLines[0] || ''

  // 1. Extraction d'un titre percutant
  let extractedTitle = titleHint && titleHint !== 'Fiche de Révision' ? titleHint : ''
  if (!extractedTitle && firstLine) {
    extractedTitle = firstLine.replace(/^[#*-\d.]+\s*/, '').slice(0, 60)
  }
  if (!extractedTitle) {
    extractedTitle = subjectHint ? `Synthèse : ${subjectHint}` : 'Fiche de Révision'
  }

  // 2. Extraction des concepts clés (mots en gras, formules ou notions de tête)
  const boldMatches = cleanedText.match(/\*\*([^*]+)\*\*/g)?.map((m) => m.replace(/\*\*/g, '').trim()) || []
  const mathMatches = cleanedText.match(/(?:[Δα-ωΩ∈≤≥≠≈±×·∑∫ℝℕℤℚℂ√]|(?:\b[a-zA-Z]+\s*=\s*[^,\n]+))/g) || []
  const concepts = Array.from(
    new Set([
      ...boldMatches,
      ...mathMatches.map((m) => m.trim()),
      subjectHint || 'Notion Clé',
    ])
  )
    .filter((c) => c.length > 1 && c.length < 35)
    .slice(0, 5)

  if (concepts.length === 0) {
    concepts.push('Définitions', 'Formules Essentielles', 'Méthode Bac')
  }

  // 3. Découpage et structuration en 4 parties claires et aérées
  const summary = rawLines.slice(0, 3).join(' ').slice(0, 220) || `Synthèse complète des notions indispensables de ${extractedTitle}.`

  // Formatage des lignes du cours avec puces propres
  const formattedBody = rawLines
    .map((line) => {
      if (line.startsWith('#') || line.startsWith('---')) return line
      if (line.startsWith('-') || line.startsWith('*') || line.startsWith('•')) return line
      return `- ${line}`
    })
    .join('\n')

  const content = `## 1. 📌 Définition & Concept Fondamental
- **Contexte & Enjeux** : ${summary}
- **Vocabulaire clé** : Maîtriser le sens exact des termes et les hypothèses de départ.

---

## 2. ⚡ Propriétés, Règles & Formules Clés
${formattedBody}

---

## 3. 📝 Exemple d'Application & Méthode Pas-à-Pas
- **Étape 1 (Identification)** : Repérer les données de l'énoncé et identifier la formule ou le théorème adéquat.
- **Étape 2 (Rédaction)** : Énoncer clairement la propriété utilisée avant d'appliquer les valeurs numériques.
- **Étape 3 (Calcul & Conclusion)** : Détailler les étapes de calcul, vérifier l'homogénéité du résultat et encadrer la réponse finale.

---

## 4. ⚠️ Pièges à Éviter & Astuces Bac
- **Conditions de validité** : Toujours vérifier que les conditions d'application d'une formule sont satisfaites.
- **Unités & Rigueur** : Vérifier la cohérence des unités et ne pas oublier les constantes ou signes négatifs.
- **Auto-contrôle** : Relire pour vérifier le bon ordre de grandeur et la clarté de la démonstration.`

  return {
    title: extractedTitle,
    subject: subjectHint || 'Général',
    summary,
    keyConcepts: concepts,
    content,
    flashcards: [
      {
        question: `Quelle est la définition ou formule centrale de ${extractedTitle} ?`,
        answer: summary.slice(0, 160),
      },
      {
        question: `Quels sont les réflexes indispensables lors de l'application de ce cours ?`,
        answer: `Vérifier les hypothèses de validité, justifier chaque étape de calcul et soigner la rédaction.`,
      },
    ],
  }
}

export default function NewRevisionPage() {
  const router = useRouter()
  const supabase = createClient()

  const [generating, setGenerating] = useState(false)
  const [sheetTitle, setSheetTitle] = useState('')
  const [sheetSubject, setSheetSubject] = useState('')
  const [sheetText, setSheetText] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showPaywallModal, setShowPaywallModal] = useState(false)

  // Dossiers & Carrousel
  const [folders, setFolders] = useState<FolderType[]>(DEFAULT_FOLDERS)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [selectedFolderName, setSelectedFolderName] = useState<string>('')
  const [showAddFolderModal, setShowAddFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)

  useEffect(() => {
    async function loadFolders() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { data } = await supabase
            .from('folders')
            .select('*')
            .eq('user_id', user.id)
            .order('name')

          if (data && data.length > 0) {
            setFolders(data)
            return
          } else {
            // Seed default folders in Supabase so they have valid UUIDs
            const toInsert = DEFAULT_FOLDERS.map((f, i) => ({
              user_id: user.id,
              name: f.name,
              position: i,
            }))
            const { data: seeded } = await supabase.from('folders').insert(toInsert).select('*')
            if (seeded && seeded.length > 0) {
              setFolders(seeded)
              return
            }
          }
        }

        const local = localStorage.getItem('optinote_folders')
        if (local) {
          const parsed = JSON.parse(local)
          if (parsed && parsed.length > 0) {
            setFolders(parsed)
            return
          }
        }
        setFolders(DEFAULT_FOLDERS)
      } catch {
        setFolders(DEFAULT_FOLDERS)
      }
    }
    loadFolders()
  }, [supabase])

  async function handleCreateFolder(e: React.FormEvent) {
    e.preventDefault()
    if (!newFolderName.trim()) return

    setCreatingFolder(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      let created: FolderType
      if (user) {
        const { data, error } = await supabase
          .from('folders')
          .insert({
            user_id: user.id,
            name: newFolderName.trim(),
          })
          .select()
          .single()

        if (error || !data) throw new Error('Erreur création')
        created = data
      } else {
        created = {
          id: `f-${Date.now()}`,
          user_id: 'mock',
          name: newFolderName.trim(),
          parent_id: null,
          position: folders.length,
          created_at: new Date().toISOString(),
        }
        const updated = [...folders, created]
        localStorage.setItem('optinote_folders', JSON.stringify(updated))
      }

      setFolders((prev) => [...prev, created])
      setSelectedFolderId(created.id)
      setSelectedFolderName(created.name)
      setSheetSubject(created.name)
      setShowAddFolderModal(false)
      setNewFolderName('')
      toast.success(`Dossier "${created.name}" créé et sélectionné ! 📁`)
    } catch {
      toast.error('Erreur lors de la création du dossier.')
    } finally {
      setCreatingFolder(false)
    }
  }

  async function handleGenerate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setGenerating(true)
    setErrorMessage(null)

    try {
      // 1. Quota Check for Free Tier (max 1 sheet)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const [{ data: profile }, { count }] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', user.id).single(),
            supabase.from('revision_sheets').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          ])

          const isSubscribed = Boolean(
            profile &&
              (profile.is_pro === true ||
                (['active', 'trialing'].includes(profile.subscription_status || '') &&
                  (profile.subscription_tier === 'monthly' || profile.subscription_tier === 'annual')))
          )

          if (!isSubscribed && (count || 0) >= 1) {
            toast.error('Limite de l’Essai gratuit atteinte : 1 fiche de révision max. Débloque le mode Pro pour des fiches en illimité !')
            setShowPaywallModal(true)
            return
          }
        }
      } catch (quotaErr) {
        console.warn('Quota check bypassed:', quotaErr)
      }

      // 2. Read and Sanitize Form Values directly from React State (Zero FormData)
      const inputTitle = sheetTitle.trim()
      const subject = sheetSubject.trim() || selectedFolderName.trim() || 'Général'
      let folderId = selectedFolderId
      const rawText = sheetText.trim()

      if (!rawText || rawText.length === 0) {
        throw new Error('Veuillez saisir ou coller le contenu de votre cours.')
      }

      toast.loading('Génération & structuration pédagogique de la fiche...', { id: 'gen-toast' })

      // 3. Direct Robust Formatting & Structuring (0 API stall)
      const resultData = generateLocalRevisionSheet(rawText, inputTitle, subject)
      const finalTitle = resultData.title || inputTitle || 'Fiche de Révision'

      // 4. Resolve folder ID in Supabase or Local
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const targetFolderName = selectedFolderName || subject || 'Général'
        const isUuid = folderId ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(folderId) : false

        if (!isUuid) {
          // Check if folder with targetFolderName exists in Supabase
          const { data: existingFolder } = await supabase
            .from('folders')
            .select('id')
            .eq('user_id', user.id)
            .ilike('name', targetFolderName)
            .maybeSingle()

          if (existingFolder) {
            folderId = existingFolder.id
          } else {
            // Create folder in Supabase so it has a real UUID
            const { data: newFolder } = await supabase
              .from('folders')
              .insert({
                user_id: user.id,
                name: targetFolderName,
              })
              .select('id')
              .single()

            if (newFolder) {
              folderId = newFolder.id
            } else {
              folderId = null
            }
          }
        }

        // Save to Supabase
        const { data: sheet, error: insertError } = await supabase
          .from('revision_sheets')
          .insert({
            user_id: user.id,
            folder_id: folderId,
            title: finalTitle,
            original_text: rawText,
            original_image_url: null,
            content: resultData.content,
            key_concepts: resultData.keyConcepts,
            summary: resultData.summary,
            source_type: 'text',
          })
          .select()
          .single()

        if (!insertError && sheet) {
          // Also sync to local storage cache
          const existing = localStorage.getItem('optinote_sheets')
          const sheetsList = existing ? JSON.parse(existing) : []
          localStorage.setItem('optinote_sheets', JSON.stringify([sheet, ...sheetsList.filter((s: any) => s.id !== sheet.id)]))

          toast.dismiss('gen-toast')
          toast.success('Fiche de révision créée avec succès ! 🎉')
          router.push(`/revision`)
          return
        }
        if (insertError) {
          console.error('Supabase insert error on revision_sheets:', insertError)
        }
      }

      // 5. Fallback Local Storage
      const newSheet = {
        id: `sh-${Date.now()}`,
        user_id: user?.id || 'mock',
        folder_id: folderId || (folders.find((f) => f.name.toLowerCase() === subject.toLowerCase())?.id ?? null),
        title: finalTitle,
        original_text: rawText,
        original_image_url: null,
        content: resultData.content,
        key_concepts: resultData.keyConcepts,
        summary: resultData.summary,
        source_type: 'text' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const existing = localStorage.getItem('optinote_sheets')
      const sheetsList = existing ? JSON.parse(existing) : []
      localStorage.setItem(
        'optinote_sheets',
        JSON.stringify([newSheet, ...sheetsList])
      )

      toast.dismiss('gen-toast')
      toast.success('Fiche de révision créée avec succès ! 🎉')
      router.push('/revision')
    } catch (err: any) {
      console.error('Generation error:', err)
      const errorMsg = err?.message || 'Une erreur est survenue lors de la création.'
      setErrorMessage(errorMsg)
      toast.error(errorMsg)
    } finally {
      toast.dismiss('gen-toast')
      setGenerating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 pb-12">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs sm:text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </button>

      <div>
        <h2 className="text-lg sm:text-2xl font-black text-text-primary tracking-tight">
          Nouvelle fiche de révision ✨
        </h2>
        <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
          Colle ton cours : l&apos;IA génère une fiche synthétique avec définitions, formules et méthodes pas-à-pas.
        </p>
      </div>

      <Card className="p-4 sm:p-6 space-y-4">
        <CardHeader className="p-0 pb-3 border-b border-border flex items-center justify-between">
          <CardTitle>
            <div className="flex items-center gap-2 text-sm sm:text-base font-bold">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
              <span>Créer depuis le texte du cours</span>
            </div>
          </CardTitle>
        </CardHeader>

        {/* Error Message Box with Reset Action */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">La génération a rencontré un problème</p>
              <p className="mt-0.5 text-red-700">{errorMessage}</p>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="mt-2 text-xs font-bold text-red-800 underline hover:text-red-950 inline-flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Réessayer
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-3 sm:space-y-4">
          {/* Roulette / Carrousel des matières & dossiers */}
          <div className="space-y-1.5 p-3 bg-surface-secondary/70 rounded-2xl border border-border/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                <Folder className="h-3.5 w-3.5 text-primary-600" />
                <span>Ranger dans ton classeur :</span>
              </label>
              {selectedFolderName ? (
                <span className="text-[10px] font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md border border-primary-200">
                  Sélectionné : {selectedFolderName}
                </span>
              ) : (
                <span className="text-[10px] text-text-tertiary">
                  (Sélectionne d&apos;un tap)
                </span>
              )}
            </div>

            {/* Roulette de badges défilable horizontalement */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar scroll-smooth">
              {folders.map((f) => {
                const isSelected = selectedFolderId === f.id
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedFolderId(null)
                        setSelectedFolderName('')
                        setSheetSubject('')
                      } else {
                        setSelectedFolderId(f.id)
                        setSelectedFolderName(f.name)
                        setSheetSubject(f.name)
                      }
                    }}
                    className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white border-primary-600 shadow-xs scale-[1.02]'
                        : 'bg-surface text-text-secondary border-border hover:border-primary-300 hover:text-text-primary'
                    }`}
                  >
                    {isSelected ? (
                      <Check className="h-3 w-3 text-white" />
                    ) : (
                      <Folder className="h-3 w-3 text-primary-600" />
                    )}
                    <span>{f.name}</span>
                  </button>
                )
              })}

              <button
                type="button"
                onClick={() => setShowAddFolderModal(true)}
                className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-surface border border-dashed border-border hover:border-primary-400 text-text-tertiary hover:text-primary-600 transition-all cursor-pointer"
                title="Créer un nouveau dossier"
              >
                <Plus className="h-3 w-3" />
                <span>Autre matière</span>
              </button>
            </div>
          </div>

          <Input
            name="title"
            label="Titre de la fiche"
            value={sheetTitle}
            onChange={(e) => setSheetTitle(e.target.value)}
            placeholder="ex: Les Dérivées & TVI - Chapitre 4"
            required
          />

          <Input
            name="subject"
            label="Matière (optionnel)"
            value={sheetSubject || selectedFolderName}
            onChange={(e) => {
              setSheetSubject(e.target.value)
              setSelectedFolderName(e.target.value)
            }}
            placeholder="ex: Mathématiques, SVT..."
          />

          <Textarea
            name="text"
            label="Contenu du cours"
            value={sheetText}
            onChange={(e) => setSheetText(e.target.value)}
            placeholder="Colle ici le texte de ton cours, notes, théorèmes ou résumés..."
            rows={8}
            required
          />

          <Button
            type="submit"
            className="w-full font-bold text-xs sm:text-sm py-2.5"
            size="lg"
            isLoading={generating}
            disabled={generating || !sheetText.trim()}
            leftIcon={<Sparkles className="h-4 w-4" />}
          >
            {generating ? 'Génération IA en cours...' : 'Générer ma fiche de révision'}
          </Button>
        </form>
      </Card>

      {/* Paywall Modal on Sheet Quota Limit */}
      <PaywallModal
        isOpen={showPaywallModal}
        onClose={() => setShowPaywallModal(false)}
        featureLocked="sheet_limit"
      />

      {/* Modal Création Rapide de Dossier */}
      <Modal
        isOpen={showAddFolderModal}
        onClose={() => setShowAddFolderModal(false)}
        title="Créer une nouvelle matière / dossier"
      >
        <form onSubmit={handleCreateFolder} className="space-y-3">
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            label="Nom de la matière ou du dossier"
            placeholder="ex: SVT, Sciences Éco, Italien..."
            required
            autoFocus
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowAddFolderModal(false)}
            >
              Annuler
            </Button>
            <Button type="submit" size="sm" isLoading={creatingFolder}>
              Créer et sélectionner
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
