import { z } from 'zod'

// ═══════════════════════════════════════════════════════
// Auth Validators
// ═══════════════════════════════════════════════════════

export const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z
    .string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
})

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, 'Le nom doit contenir au moins 2 caractères')
      .max(100, 'Le nom est trop long'),
    email: z.string().email('Adresse email invalide'),
    password: z
      .string()
      .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

export const forgotPasswordSchema = z.object({
  email: z.string().email('Adresse email invalide'),
})

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100)
    .optional(),
  classLevel: z
    .enum(['seconde', 'premiere', 'terminale'])
    .nullable()
    .optional(),
  schoolName: z.string().max(200).optional(),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
