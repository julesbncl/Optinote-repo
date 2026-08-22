import { z } from 'zod'

// ═══════════════════════════════════════════════════════
// AI & Vision Validators
// ═══════════════════════════════════════════════════════

export const ocrRequestSchema = z.object({
  imageUrl: z
    .string()
    .min(1, 'Image requise pour l’analyse OCR')
    .refine(
      (url) => url.startsWith('data:image/') || url.startsWith('http://') || url.startsWith('https://'),
      { message: 'Format d’image ou URL invalide' }
    ),
})

export const scannerRequestSchema = z.object({
  imageUrl: z
    .string()
    .min(1, 'Image requise pour le scan')
    .refine(
      (url) => url.startsWith('data:image/') || url.startsWith('http://') || url.startsWith('https://'),
      { message: 'Format d’image ou URL invalide' }
    ),
  subjectHint: z.string().max(100).optional(),
})

export const scannerTimetableSchema = z.object({
  imageUrl: z
    .string()
    .min(1, 'Image de l’emploi du temps requise')
    .refine(
      (url) => url.startsWith('data:image/') || url.startsWith('http://') || url.startsWith('https://'),
      { message: 'Format d’image ou URL invalide' }
    ),
})

export type OcrRequestInput = z.infer<typeof ocrRequestSchema>
export type ScannerRequestInput = z.infer<typeof scannerRequestSchema>
export type ScannerTimetableInput = z.infer<typeof scannerTimetableSchema>
