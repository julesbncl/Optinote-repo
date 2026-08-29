import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendVerificationEmail, sendVerificationEmailAsync } from '@/lib/email'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const sendVerificationSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  name: z.string().min(1).max(100).optional(),
  verificationUrl: z.string().url('URL de vérification invalide'),
  isAsync: z.boolean().default(true),
})

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rateLimit = await checkRateLimit(`email:verify:${ip}`, 5, 60_000)

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Trop de demandes de vérification. Veuillez patienter une minute.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const parsed = sendVerificationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 }
      )
    }

    const { email, name, verificationUrl, isAsync } = parsed.data

    if (isAsync) {
      // Exécution en arrière-plan non-bloquante (Zero latency pour l'inscription)
      sendVerificationEmailAsync(email, {
        name,
        verificationUrl,
        expiresInHours: 24,
      })

      return NextResponse.json({
        success: true,
        message: 'Email de vérification programmé avec succès en tâche de fond.',
        queued: true,
      })
    }

    // Exécution synchrone avec rapport de statut
    const result = await sendVerificationEmail(email, {
      name,
      verificationUrl,
      expiresInHours: 24,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erreur lors de l’envoi de l’email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      latencyMs: result.latencyMs,
    })
  } catch (err: unknown) {
    console.error('[API Send Verification] Erreur:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur interne' },
      { status: 500 }
    )
  }
}
