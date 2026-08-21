import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    const { messageId, reason, details } = body

    if (!messageId || !reason) {
      return NextResponse.json({ error: 'Données de signalement incomplètes' }, { status: 400 })
    }

    // Insert report
    const { error } = await supabase.from('message_reports').insert({
      message_id: messageId,
      reported_by: user.id,
      reason,
      details: details?.trim() || null,
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
