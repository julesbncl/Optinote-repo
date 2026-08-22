import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { reportMessageSchema } from '@/lib/validators/campus'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = reportMessageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Données de signalement invalides' },
        { status: 400 }
      )
    }

    const { messageId, reason, details } = parsed.data

    // Insert report (requête paramétrée sécurisée)
    const { error } = await supabase.from('message_reports').insert({
      message_id: messageId,
      reported_by: user.id,
      reason,
      details: details ? details.trim() : null,
      status: 'pending',
    })

    if (error) {
      console.error('Error reporting message:', error)
      return NextResponse.json({ error: 'Erreur lors du signalement' }, { status: 500 })
    }

    // Flag the message
    await supabase
      .from('messages')
      .update({ is_flagged: true, flag_reason: `Signalé pour ${reason}` })
      .eq('id', messageId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Report error:', error)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }
}
