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

    if (!school || !school.name || !school.city) {
      return NextResponse.json(
        { error: 'Données de l’établissement incomplètes' },
        { status: 400 }
      )
    }

    // 1. Chercher si le lycée existe déjà dans la base Supabase (par nom et ville)
    let schoolId: string | null = null
    let dbSchool: any = null

    const { data: existingSchools } = await supabase
      .from('schools')
      .select('*')
      .ilike('name', school.name)
      .ilike('city', school.city)
      .limit(1)

    if (existingSchools && existingSchools.length > 0) {
      dbSchool = existingSchools[0]
      schoolId = dbSchool.id

      // Incrémenter le compteur d'élèves connectés
      await supabase
        .from('schools')
        .update({
          students_count: (dbSchool.students_count || 0) + 1,
          latitude: school.latitude || dbSchool.latitude,
          longitude: school.longitude || dbSchool.longitude,
        })
        .eq('id', schoolId)
    } else {
      // 2. Créer l'établissement dans la table schools
      const { data: newSchool, error: schoolErr } = await supabase
        .from('schools')
        .insert({
          name: school.name,
          city: school.city,
          postal_code: school.postal_code || '00000',
          academy: school.academy || '',
          latitude: Number(school.latitude) || 48.8566,
          longitude: Number(school.longitude) || 2.3522,
          students_count: 1,
        })
        .select()
        .single()

      if (schoolErr || !newSchool) {
        console.error('Error inserting new school in Supabase:', schoolErr)
        // Fallback avec ID temporaire si table absente
        dbSchool = {
          id: `sch-${Date.now()}`,
          name: school.name,
          city: school.city,
          postal_code: school.postal_code || '',
          academy: school.academy || '',
          latitude: Number(school.latitude),
          longitude: Number(school.longitude),
          students_count: 1,
        }
        schoolId = dbSchool.id
      } else {
        dbSchool = newSchool
        schoolId = newSchool.id
      }
    }

    // 3. Mettre à jour le profil de l'utilisateur dans Supabase (école + visibilité publique)
    const profileUpdateData: Record<string, any> = {
      school_id: schoolId,
      school_name: school.name,
      is_visible: true,
      is_visible_on_school: true,
      updated_at: new Date().toISOString(),
    }

    if (school.latitude && school.longitude) {
      profileUpdateData.latitude = Number(school.latitude)
      profileUpdateData.longitude = Number(school.longitude)
    }

    const { error: profileErr } = await supabase
      .from('profiles')
      .update(profileUpdateData)
      .eq('id', user.id)

    if (profileErr) {
      console.warn('Profile school update warning:', profileErr)
    }

    // 4. Créer / Vérifier le salon d'entraide pour ce lycée dans chat_channels
    let channelId = null
    try {
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
            description: `Salon officiel d'entraide des élèves du lycée ${school.name} (${school.city})`,
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

      // 5. Rejoindre automatiquement le salon
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
    } catch (channelErr) {
      console.warn('Channel creation warning:', channelErr)
    }

    return NextResponse.json({
      success: true,
      school: dbSchool,
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
