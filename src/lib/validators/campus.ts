import { z } from 'zod'

// ═══════════════════════════════════════════════════════
// Campus & Social Validators
// ═══════════════════════════════════════════════════════

export const sendMessageSchema = z.object({
  channelId: z.string().uuid().optional().nullable(),
  receiverId: z.string().uuid().optional().nullable(),
  content: z
    .string()
    .min(1, 'Le message ne peut pas être vide')
    .max(2000, 'Le message ne peut pas dépasser 2 000 caractères')
    .transform((val) => val.trim()),
}).refine((data) => data.channelId || data.receiverId, {
  message: 'Un salon (channelId) ou un destinataire (receiverId) est requis',
})

export const reportMessageSchema = z.object({
  messageId: z.string().uuid('Identifiant de message invalide'),
  reason: z.enum(['harassment', 'inappropriate', 'spam', 'hate_speech', 'other'], {
    message: 'Motif de signalement invalide',
  }),
  details: z.string().max(500, 'Les détails ne peuvent pas dépasser 500 caractères').optional(),
})

export const updateUserLocationSchema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  is_visible: z.boolean().optional(),
  bio: z.string().max(280, 'La bio ne doit pas dépasser 280 caractères').optional(),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type ReportMessageInput = z.infer<typeof reportMessageSchema>
export type UpdateUserLocationInput = z.infer<typeof updateUserLocationSchema>
