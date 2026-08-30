import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateUserLocationSchema } from '@/lib/validators/campus'
import type { Profile } from '@/types/database'

// Même fenêtre "active" que /api/campus/sessions
const ACTIVE_SESSION_WINDOW_MS = 3 * 24 * 60 * 60 * 1000

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user: viewer },
    } = await supabase.auth.getUser()

    if (!viewer) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: dbUsers, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, school_name, class_level, specialties, academic_goal, post_bac_target, is_visible_on_school, is_pro, is_verified, preferences, updated_at')
      .order('updated_at', { ascending: false })
      .limit(100)

    if (error || !dbUsers) {
      console.warn('Error fetching profiles for campus map:', error)
      return NextResponse.json({ users: [] })
    }

    // Élèves ayant une session de révision active/à venir (créée ou rejointe) :
    // affiche un badge chapeau d'étudiant 🎓 sur leur marqueur, avec les infos
    // de la session pour permettre de la rejoindre directement depuis la carte.
    const cutoff = new Date(Date.now() - ACTIVE_SESSION_WINDOW_MS).toISOString()
    const { data: activeSessions } = await supabase
      .from('study_sessions')
      .select('id, subject, max_participants')
      .gte('created_at', cutoff)

    const sessionById = new Map((activeSessions || []).map((s) => [s.id, s]))
    const activeSessionIds = Array.from(sessionById.keys())

    // userId -> sessionId (un élève n'est rattaché qu'à une seule session pour l'affichage carte)
    const studyingUserSession = new Map<string, string>()
    const participantsBySession = new Map<string, number>()
    if (activeSessionIds.length > 0) {
      const { data: activeParticipants } = await supabase
        .from('study_session_participants')
        .select('user_id, session_id')
        .in('session_id', activeSessionIds)
      ;(activeParticipants || []).forEach((p) => {
        participantsBySession.set(p.session_id, (participantsBySession.get(p.session_id) || 0) + 1)
        if (!studyingUserSession.has(p.user_id)) {
          studyingUserSession.set(p.user_id, p.session_id)
        }
      })
    }

    const mappedUsers = dbUsers
      .filter((u: Partial<Profile>) => {
        if (u.is_visible_on_school === false) return false
        if (u.email && (u.email.includes('mock') || u.email.includes('test.com') || u.email === 'thomas.dubois@lycee.fr')) return false
        return true
      })
      .map((u: Partial<Profile> & { id: string }) => {
        const prefs: Record<string, unknown> = typeof u.preferences === 'object' && u.preferences !== null ? u.preferences : {}
        const rawLat = prefs.latitude ?? u.latitude ?? null
        const rawLng = prefs.longitude ?? u.longitude ?? null
        const lat = rawLat !== null && !isNaN(Number(rawLat)) ? Number(rawLat) : null
        const lng = rawLng !== null && !isNaN(Number(rawLng)) ? Number(rawLng) : null

        const safeAvatarUrl =
          typeof u.avatar_url === 'string' && u.avatar_url.length <= 4000 ? u.avatar_url : null

        const sessionId = studyingUserSession.get(u.id) || null
        const session = sessionId ? sessionById.get(sessionId) : null
        const sessionCurrent = sessionId ? participantsBySession.get(sessionId) || 0 : null

        return {
          id: u.id,
          full_name: u.full_name || u.email?.split('@')[0] || 'Lycéen',
          email: u.email,
          avatar_url: safeAvatarUrl,
          school_name: u.school_name || 'Lycée',
          class_level: u.class_level || 'terminale',
          specialties: Array.isArray(u.specialties) ? u.specialties : [],
          academic_goal: u.academic_goal,
          post_bac_target: u.post_bac_target,
          latitude: lat,
          longitude: lng,
          is_visible: u.is_visible_on_school ?? true,
          is_verified: Boolean(u.is_verified),
          is_studying: Boolean(sessionId),
          study_session_id: sessionId,
          study_session_subject: session?.subject || null,
          study_session_current: sessionCurrent,
          study_session_max: session?.max_participants ?? null,
          study_session_joined_by_me: Boolean(
            viewer && sessionId && studyingUserSession.get(viewer.id) === sessionId
          ),
          bio: prefs.bio || (u.specialties?.length ? `Spécialités : ${u.specialties.join(', ')}` : 'Élève actif sur OptiNote'),
        }
      })

    return NextResponse.json({ users: mappedUsers })
  } catch (err) {
    console.error('Error fetching map users:', err)
    return NextResponse.json({ users: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateUserLocationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Coordonnées de position invalides' },
        { status: 400 }
      )
    }

    const { latitude, longitude, is_visible, bio } = parsed.data

    // Récupérer les préférences actuelles
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('preferences, is_visible_on_school')
      .eq('id', user.id)
      .single()

    const currentPrefs = (existingProfile && typeof existingProfile.preferences === 'object' && existingProfile.preferences !== null)
      ? existingProfile.preferences
      : {}

    const updatedPrefs = {
      ...currentPrefs,
      ...(latitude !== undefined ? { latitude } : {}),
      ...(longitude !== undefined ? { longitude } : {}),
      ...(bio !== undefined ? { bio: bio.trim() } : {}),
    }

    const updatePayload: Partial<Profile> = {
      preferences: updatedPrefs,
      updated_at: new Date().toISOString(),
    }

    if (is_visible !== undefined) {
      updatePayload.is_visible_on_school = is_visible
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating user location in Supabase:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      profile: {
        ...data,
        latitude,
        longitude,
        bio,
        is_visible: data.is_visible_on_school,
      },
    })
  } catch (err: unknown) {
    console.error('Location update error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la position' },
      { status: 500 }
    )
  }
}
