import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { RATE_LIMITS } from '@/lib/constants'
import { notifyNewRevisionSession } from '@/lib/email/notifications'

// Sessions de révision partagées : ne doit jamais être mise en cache.
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Une session est considérée active/à venir tant qu'elle a moins de 3 jours ;
// au-delà elle sort naturellement de la liste plutôt que de s'accumuler indéfiniment.
const ACTIVE_WINDOW_MS = 3 * 24 * 60 * 60 * 1000

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const cutoff = new Date(Date.now() - ACTIVE_WINDOW_MS).toISOString()

    const { data: sessions, error } = await supabase
      .from('study_sessions')
      .select('*, profiles:host_id(full_name, avatar_url, school_name, is_verified)')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error || !sessions) {
      console.error('Error fetching study sessions:', error)
      return NextResponse.json({ sessions: [] })
    }

    const sessionIds = sessions.map((s) => s.id)
    let participants: { session_id: string; user_id: string }[] = []
    if (sessionIds.length > 0) {
      const { data } = await supabase
        .from('study_session_participants')
        .select('session_id, user_id')
        .in('session_id', sessionIds)
      participants = data || []
    }

    const mapped = sessions.map((s: any) => {
      const sessionParticipants = participants.filter((p) => p.session_id === s.id)
      return {
        id: s.id,
        subject: s.subject,
        title: s.title,
        type: s.type,
        location: s.location,
        date_time: s.date_time_label,
        host_id: s.host_id,
        host_name: s.profiles?.full_name || 'Lycéen',
        host_avatar: s.profiles?.full_name
          ? s.profiles.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
          : 'L',
        host_school: s.profiles?.school_name || 'Lycée',
        host_verified: Boolean(s.profiles?.is_verified),
        max_participants: s.max_participants,
        current_participants: sessionParticipants.length,
        joined: user ? sessionParticipants.some((p) => p.user_id === user.id) : false,
      }
    })

    return NextResponse.json({ sessions: mapped })
  } catch (error) {
    console.error('Error in study sessions GET:', error)
    return NextResponse.json({ sessions: [] })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const rateLimit = checkRateLimit(`create-session:${user.id}`, RATE_LIMITS.CHAT_MESSAGES_PER_MINUTE)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Trop de tentatives. Réessaie dans ${rateLimit.resetIn}s` },
        { status: 429 }
      )
    }

    const body = await request.json()
    const subject = typeof body.subject === 'string' ? body.subject.trim().slice(0, 80) : ''
    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 140) : ''
    const type = body.type === 'in_person' ? 'in_person' : 'online'
    const location = type === 'in_person' && typeof body.location === 'string' ? body.location.trim().slice(0, 140) : null
    const dateTimeLabel = typeof body.date_time === 'string' ? body.date_time.trim().slice(0, 60) : ''
    const maxParticipants = Number(body.max_participants) || 4

    if (!subject || !title || !dateTimeLabel) {
      return NextResponse.json({ error: 'Sujet, titre et date/heure requis' }, { status: 400 })
    }

    const { data: session, error } = await supabase
      .from('study_sessions')
      .insert({
        host_id: user.id,
        subject,
        title,
        type,
        location,
        date_time_label: dateTimeLabel,
        max_participants: Math.min(Math.max(maxParticipants, 2), 20),
      })
      .select('*, profiles:host_id(full_name, avatar_url, school_name, is_verified)')
      .single()

    if (error || !session) {
      console.error('Error creating study session:', error)
      return NextResponse.json({ error: 'Erreur lors de la création de la session' }, { status: 500 })
    }

    notifyNewRevisionSession(supabase, {
      hostId: user.id,
      hostName: session.profiles?.full_name || 'Un camarade',
      title: session.title,
      subject: session.subject,
    })

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        subject: session.subject,
        title: session.title,
        type: session.type,
        location: session.location,
        date_time: session.date_time_label,
        host_id: session.host_id,
        host_name: session.profiles?.full_name || 'Lycéen',
        host_avatar: session.profiles?.full_name
          ? session.profiles.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
          : 'L',
        host_school: session.profiles?.school_name || 'Lycée',
        host_verified: Boolean(session.profiles?.is_verified),
        max_participants: session.max_participants,
        current_participants: 1,
        joined: true,
      },
    })
  } catch (error: any) {
    console.error('Error in study sessions POST:', error)
    return NextResponse.json({ error: error?.message || 'Erreur serveur' }, { status: 500 })
  }
}
