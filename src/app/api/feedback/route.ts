import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const VALID_TYPES = ['bug', 'idea', 'other'] as const

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const rateLimit = checkRateLimit(`feedback:${user.id}`, 5, 60_000)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Trop d'envois. Réessaie dans ${rateLimit.resetIn}s` },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const type = VALID_TYPES.includes(body.type) ? body.type : null
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 2000) : ''
    const pageUrl = typeof body.pageUrl === 'string' ? body.pageUrl.slice(0, 300) : null

    if (!type) {
      return NextResponse.json({ error: 'Type de retour invalide' }, { status: 400 })
    }
    if (message.length < 5) {
      return NextResponse.json({ error: 'Décris un peu plus ton message (5 caractères min.)' }, { status: 400 })
    }

    const { error } = await supabase.from('feedback').insert({
      user_id: user.id,
      type,
      message,
      page_url: pageUrl,
    })

    if (error) {
      console.error('Error saving feedback:', error)
      return NextResponse.json({ error: 'Erreur lors de l’envoi' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error in feedback route:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
