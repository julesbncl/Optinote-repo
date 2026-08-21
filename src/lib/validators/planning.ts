import { z } from 'zod'

// ═══════════════════════════════════════════════════════
// Planning Validators
// ═══════════════════════════════════════════════════════

export const homeworkItemSchema = z.object({
  subject: z.string().min(1),
  description: z.string().min(1),
  dueDate: z.string(), // ISO date string
  estimatedMinutes: z.number().min(5).max(480).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
})

export const constraintsSchema = z.object({
  activities: z
    .array(
      z.object({
        name: z.string(),
        dayOfWeek: z.number().min(0).max(6), // 0=Monday
        startTime: z.string(), // HH:mm
        endTime: z.string(),
      })
    )
    .optional(),
  preferences: z
    .object({
      preferredStudyTime: z
        .enum(['morning', 'afternoon', 'evening'])
        .optional(),
      maxSessionMinutes: z.number().min(15).max(180).default(45),
      breakMinutes: z.number().min(5).max(30).default(10),
      fatigueLevel: z.enum(['low', 'medium', 'high']).optional(),
    })
    .optional(),
})

export const generatePlanningSchema = z.object({
  weekStart: z.string(), // ISO date of Monday
  homework: z.array(homeworkItemSchema).optional().default([]),
  constraints: constraintsSchema.optional(),
  timetableText: z.string().optional(), // OCR-extracted timetable text
})

export const generateMessageSchema = z.object({
  messageType: z.enum([
    'absence',
    'retard',
    'question',
    'rdv',
    'rattrapage',
    'autre',
  ]),
  context: z
    .string()
    .min(5, 'Donne un peu plus de contexte')
    .max(2000, 'Le contexte est trop long'),
  teacherName: z.string().max(100).optional(),
  studentName: z.string().max(100).optional(),
})

export type HomeworkItem = z.infer<typeof homeworkItemSchema>
export type Constraints = z.infer<typeof constraintsSchema>
export type GeneratePlanningInput = z.infer<
  typeof generatePlanningSchema
>
export type GenerateMessageInput = z.infer<
  typeof generateMessageSchema
>
