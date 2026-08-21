import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Seed mock peers réels pour peupler la carte interactive
const MOCK_MAP_STUDENTS = [
  {
    id: 'peer-geo-1',
    full_name: 'Léa Moreau',
    school_name: 'Lycée Henri IV',
    class_level: 'terminale',
    specialties: ['Mathématiques', 'Physique-Chimie'],
    academic_goal: 'excellence',
    latitude: 48.8458,
    longitude: 2.3486,
    is_visible: true,
    is_verified: true,
    bio: 'Objectif MPSI à Henri IV / Louis-le-Grand 📐 Entraide en maths et physique !',
  },
  {
    id: 'peer-geo-2',
    full_name: 'Yanis Khelifi',
    school_name: 'Lycée Louis-le-Grand',
    class_level: 'terminale',
    specialties: ['Mathématiques', 'NSI'],
    academic_goal: 'excellence',
    latitude: 48.8480,
    longitude: 2.3444,
    is_visible: true,
    is_verified: true,
    bio: 'Passionné de code & algo Python 💻 Prépa MP2I.',
  },
  {
    id: 'peer-geo-3',
    full_name: 'Inès Benali',
    school_name: 'Lycée du Parc',
    class_level: 'premiere',
    specialties: ['SES', 'HGGSP'],
    academic_goal: 'progression',
    latitude: 45.7705,
    longitude: 4.8569,
    is_visible: true,
    is_verified: true,
    bio: 'Objectif Sciences Po Paris 🏛️ On révise la géopolitique ensemble !',
  },
  {
    id: 'peer-geo-4',
    full_name: 'Mamadou Diallo',
    school_name: 'Lycée Thiers',
    class_level: 'terminale',
    specialties: ['SVT', 'Physique-Chimie'],
    academic_goal: 'excellence',
    latitude: 43.2989,
    longitude: 5.3831,
    is_visible: true,
    is_verified: false,
    bio: 'Futur étudiant PASS / Médecine 🩺 Motivation maximale !',
  },
  {
    id: 'peer-geo-5',
    full_name: 'Camille Leroy',
    school_name: 'Lycée Pierre-de-Fermat',
    class_level: 'terminale',
    specialties: ['Mathématiques', 'SES'],
    academic_goal: 'excellence',
    latitude: 43.6033,
    longitude: 1.4398,
    is_visible: true,
    is_verified: true,
    bio: 'Prépa ECG ou Dauphine 📈 Toujours dispo pour un groupe de travail.',
  },
  {
    id: 'peer-geo-6',
    full_name: 'Antoine Marchand',
    school_name: 'Lycée Clemenceau',
    class_level: 'terminale',
    specialties: ['Physique-Chimie', 'SVT'],
    academic_goal: 'bac_mention',
    latitude: 47.2197,
    longitude: -1.5456,
    is_visible: true,
    is_verified: false,
    bio: 'Objectif mention TB et écoles d’ingénieurs post-bac 🚀',
  },
]

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: dbUsers, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, school_name, class_level, specialties, academic_goal, post_bac_target, latitude, longitude, is_visible, is_verified, verification_status, bio')
      .eq('is_visible', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)

    if (error || !dbUsers || dbUsers.length === 0) {
      return NextResponse.json({ users: MOCK_MAP_STUDENTS })
    }

    // Fusionner les données de la base avec des mocks si peu d'utilisateurs
    const combinedUsers = [...dbUsers]
    if (combinedUsers.length < 4) {
      MOCK_MAP_STUDENTS.forEach((mock) => {
        if (!combinedUsers.some((u) => u.id === mock.id)) {
          combinedUsers.push(mock as any)
        }
      })
    }

    return NextResponse.json({ users: combinedUsers })
  } catch (err) {
    console.error('Error fetching map users:', err)
    return NextResponse.json({ users: MOCK_MAP_STUDENTS })
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
    const { latitude, longitude, is_visible, bio } = body

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (latitude !== undefined) updatePayload.latitude = latitude
    if (longitude !== undefined) updatePayload.longitude = longitude
    if (is_visible !== undefined) updatePayload.is_visible = is_visible
    if (bio !== undefined) updatePayload.bio = bio

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

    return NextResponse.json({ success: true, profile: data })
  } catch (err: any) {
    console.error('Location update error:', err)
    return NextResponse.json(
      { error: err.message || 'Erreur lors de la mise à jour de la position' },
      { status: 500 }
    )
  }
}
