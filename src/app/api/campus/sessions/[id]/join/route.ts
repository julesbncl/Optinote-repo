import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: sessionId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const action = body.action === 'leave' ? 'leave' : 'join'

    if (action === 'join') {
      const { data: session } = await supabase
        .from('study_sessions')
        .select('max_participants')
        .eq('id', sessionId)
        .single()

      if (!session) {
        return NextResponse.json({ error: 'Session introuvable' }, { status: 404 })
      }

      const { count } = await supabase
        .from('study_session_participants')
        .select('user_id', { count: 'exact', head: true })
        .eq('session_id', sessionId)

      if ((count || 0) >= session.max_participants) {
        return NextResponse.json({ error: 'Cette session est déjà complète' }, { status: 409 })
      }

      const { error } = await supabase
        .from('study_session_participants')
        .upsert({ session_id: sessionId, user_id: user.id }, { onConflict: 'session_id,user_id' })

      if (error) {
        console.error('Error joining study session:', error)
        return NextResponse.json({ error: 'Erreur lors de l’inscription' }, { status: 500 })
      }
    } else {
      const { error } = await supabase
        .from('study_session_participants')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error leaving study session:', error)
        return NextResponse.json({ error: 'Erreur lors du départ de la session' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in study session join/leave:', error)
    return NextResponse.json({ error: error?.message || 'Erreur serveur' }, { status: 500 })
  }
}
