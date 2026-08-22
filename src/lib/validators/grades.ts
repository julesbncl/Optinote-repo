import { z } from 'zod'

// ═══════════════════════════════════════════════════════
// Grades & Subjects Validators
// ═══════════════════════════════════════════════════════

export const createSubjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Le nom de la matière est requis')
    .max(100, 'Le nom est trop long'),
  coefficient: z
    .number()
    .min(0.25, 'Le coefficient minimum est 0.25')
    .max(20, 'Le coefficient maximum est 20'),
  teacherName: z.string().max(100).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur hexadécimale invalide')
    .optional(),
})

export const updateSubjectSchema = createSubjectSchema.partial()

export const createGradeSchema = z.object({
  subjectId: z.string().uuid('Matière invalide'),
  value: z
    .number()
    .min(0, 'La note ne peut pas être négative')
    .max(20, 'La note ne peut pas dépasser 20'),
  outOf: z
    .number()
    .min(1, 'Le barème minimum est 1')
    .max(100, 'Le barème maximum est 100')
    .default(20),
  coefficient: z
    .number()
    .min(0.25, 'Le coefficient minimum est 0.25')
    .max(20, 'Le coefficient maximum est 20')
    .default(1),
  label: z.string().max(200).optional(),
  trimester: z.number().int().min(1).max(3),
  date: z.string().optional(),
  isSimulated: z.boolean().default(false),
})

export const updateGradeSchema = createGradeSchema.partial()

export const simulatedGradeItemSchema = z.object({
  subjectId: z.string().min(1, 'Identifiant de matière requis'),
  value: z.number().min(0, 'Note minimale 0').max(20, 'Note maximale 20'),
  outOf: z.number().min(1).max(100).default(20),
  coefficient: z.number().min(0.25).max(20).default(1),
  label: z.string().max(200).optional(),
})

export const simulateAverageSchema = z.object({
  trimester: z.number().int().min(1).max(3),
  targetAverage: z.number().min(0).max(20).optional(),
  simulatedGrades: z.array(simulatedGradeItemSchema).max(50, 'Nombre maximum de notes simulées atteint'),
})

export type CreateSubjectInput = z.infer<typeof createSubjectSchema>
export type UpdateSubjectInput = z.infer<typeof updateSubjectSchema>
export type CreateGradeInput = z.infer<typeof createGradeSchema>
export type UpdateGradeInput = z.infer<typeof updateGradeSchema>
export type SimulateAverageInput = z.infer<typeof simulateAverageSchema>
export type SimulatedGradeItemInput = z.infer<typeof simulatedGradeItemSchema>
