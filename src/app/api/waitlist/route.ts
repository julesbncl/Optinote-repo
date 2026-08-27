import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { BETA_ACCESS_CODE } from '@/lib/constants'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Formulaire public (non authentifié) de liste d'attente TikTok. Renvoie le
// code Beta partagé immédiatement — pas besoin d'envoi d'e-mail pour ce petit
// volume attendu, le code est affiché directement à l'écran après inscription.
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rateLimit = checkRateLimit(`waitlist:${ip}`, 5, 60_000)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Trop de tentatives. Réessaie dans ${rateLimit.resetIn}s` },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const classLevel = typeof body.classLevel === 'string' ? body.classLevel.trim().slice(0, 100) : null

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Adresse e-mail invalide' }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase.from('waitlist').insert({ email, class_level: classLevel })

    // Un doublon (déjà inscrit) n'est pas une erreur pour l'utilisateur : on lui
    // renvoie son code comme s'il venait de s'inscrire.
    if (error && error.code !== '23505') {
      console.error('Error saving waitlist entry:', error)
      return NextResponse.json({ error: 'Erreur lors de l’inscription' }, { status: 500 })
    }

    return NextResponse.json({ success: true, code: BETA_ACCESS_CODE })
  } catch (err) {
    console.error('Error in waitlist route:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
