import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyTurnstileToken } from '@/lib/turnstile'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const verifyTurnstileSchema = z.object({
  token: z.string().min(1, 'Jeton de vérification manquant'),
})

// Vérifie côté serveur un jeton Turnstile obtenu par le widget affiché sur le
// formulaire d'inscription. L'inscription elle-même se fait ensuite en appelant
// directement Supabase Auth depuis le client (comme avant) — cette route ne
// sert qu'à confirmer qu'un humain a résolu le challenge avant d'autoriser le
// clic sur "Créer mon compte".
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rateLimit = await checkRateLimit(`turnstile:verify:${ip}`, 20, 60_000)

    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Trop de tentatives. Veuillez patienter une minute.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const parsed = verifyTurnstileSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 }
      )
    }

    const isHuman = await verifyTurnstileToken(parsed.data.token, ip)

    if (!isHuman) {
      return NextResponse.json(
        { success: false, error: 'Vérification anti-robot échouée. Réessaie.' },
        { status: 403 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[API Verify Turnstile] Erreur:', err)
    return NextResponse.json(
      { success: false, error: 'Erreur interne' },
      { status: 500 }
    )
  }
}
