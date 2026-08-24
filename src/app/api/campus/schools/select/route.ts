import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    const { school } = body

    if (!school || !school.name) {
      return NextResponse.json(
        { error: 'Données de l’établissement incomplètes' },
        { status: 400 }
      )
    }

    // 1. Chercher si le lycée existe déjà dans la base Supabase
    let schoolId: string | null = null
    let dbSchool: any = null

    try {
      const { data: existingSchools } = await supabase
        .from('schools')
        .select('*')
        .ilike('name', school.name)
        .limit(1)

      if (existingSchools && existingSchools.length > 0) {
        dbSchool = existingSchools[0]
        schoolId = dbSchool.id

        await supabase
          .from('schools')
          .update({
            students_count: (dbSchool.students_count || 0) + 1,
            latitude: school.latitude || dbSchool.latitude,
            longitude: school.longitude || dbSchool.longitude,
          })
          .eq('id', schoolId)
      } else {
        const { data: newSchool, error: schoolErr } = await supabase
          .from('schools')
          .insert({
            name: school.name,
            city: school.city || '',
            postal_code: school.postal_code || '00000',
            academy: school.academy || '',
            latitude: Number(school.latitude) || 43.6108,
            longitude: Number(school.longitude) || 3.8767,
            students_count: 1,
          })
          .select()
          .single()

        if (!schoolErr && newSchool) {
          dbSchool = newSchool
          schoolId = newSchool.id
        }
      }
    } catch (e) {
      console.warn('Schools table lookup/insert note:', e)
    }

    if (!dbSchool) {
      schoolId = school.id || `sch-${Date.now()}`
      dbSchool = {
        ...school,
        id: schoolId,
      }
    }

    // 2. Mettre à jour le profil de l'utilisateur connecté dans Supabase (school_name, school_id, preferences)
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('preferences')
      .eq('id', user.id)
      .single()

    const currentPrefs =
      currentProfile && typeof currentProfile.preferences === 'object' && currentProfile.preferences !== null
        ? currentProfile.preferences
        : {}

    const updatedPrefs = {
      ...currentPrefs,
      ...(school.latitude ? { latitude: Number(school.latitude) } : {}),
      ...(school.longitude ? { longitude: Number(school.longitude) } : {}),
    }

    const { data: updatedProfile, error: profileErr } = await supabase
      .from('profiles')
      .update({
        school_id: schoolId,
        school_name: school.name,
        is_visible_on_school: true,
        preferences: updatedPrefs,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (profileErr) {
      console.error('Error updating profile school:', profileErr)
      return NextResponse.json({ error: profileErr.message }, { status: 500 })
    }

    // 3. Associer au salon d'entraide officiel du lycée
    let channelId = null
    try {
      if (schoolId) {
        const { data: existingChannels } = await supabase
          .from('chat_channels')
          .select('id')
          .eq('school_id', schoolId)
          .eq('type', 'school')
          .limit(1)

        if (existingChannels && existingChannels.length > 0) {
          channelId = existingChannels[0].id
        } else {
          const { data: newChannel } = await supabase
            .from('chat_channels')
            .insert({
              name: `Salon ${school.name}`,
              description: `Salon officiel d'entraide des élèves du lycée ${school.name} (${school.city || ''})`,
              type: 'school',
              school_id: schoolId,
              created_by: user.id,
              is_private: false,
            })
            .select()
            .single()

          if (newChannel) {
            channelId = newChannel.id
          }
        }

        if (channelId) {
          await supabase
            .from('channel_members')
            .upsert(
              {
                channel_id: channelId,
                user_id: user.id,
                role: 'member',
              },
              { onConflict: 'channel_id,user_id', ignoreDuplicates: true }
            )
        }
      }
    } catch (channelErr) {
      console.warn('Channel association note:', channelErr)
    }

    return NextResponse.json({
      success: true,
      school: dbSchool,
      profile: updatedProfile,
      channelId,
    })
  } catch (error: any) {
    console.error('Error selecting school:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la sélection du lycée' },
      { status: 500 }
    )
  }
}
