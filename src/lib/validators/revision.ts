import { z } from 'zod'

// ═══════════════════════════════════════════════════════
// Revision Sheets & Folders Validators
// ═══════════════════════════════════════════════════════

export const createFolderSchema = z.object({
  name: z
    .string()
    .min(1, 'Le nom du dossier est requis')
    .max(100, 'Le nom est trop long'),
  parentId: z.string().uuid().nullable().optional(),
})

export const updateFolderSchema = createFolderSchema.partial()

export const createRevisionSheetSchema = z.object({
  title: z
    .string()
    .min(1, 'Le titre est requis')
    .max(200, 'Le titre est trop long'),
  folderId: z.string().uuid().nullable().optional(),
  subjectId: z.string().uuid().nullable().optional(),
  originalText: z.string().max(50000).optional(),
  content: z.string().min(1, 'Le contenu est requis'),
  keyConcepts: z.array(z.string()).optional(),
  summary: z.string().optional(),
  sourceType: z.enum(['text', 'photo', 'manual']),
})

export const updateRevisionSheetSchema =
  createRevisionSheetSchema.partial()

export const generateRevisionSchema = z.object({
  text: z
    .string()
    .min(1, 'Veuillez saisir ou coller le contenu de votre cours ou formule')
    .max(50000, 'Le texte est trop long (maximum 50 000 caractères)'),
  subjectHint: z.string().optional(),
})

export type CreateFolderInput = z.infer<typeof createFolderSchema>
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>
export type CreateRevisionSheetInput = z.infer<
  typeof createRevisionSheetSchema
>
export type GenerateRevisionInput = z.infer<
  typeof generateRevisionSchema
>
