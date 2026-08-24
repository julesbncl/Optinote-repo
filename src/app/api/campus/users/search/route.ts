import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')?.trim() || ''

    const supabase = await createClient()

    let query = supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, class_level, specialties, academic_goal, post_bac_target, school_id, school_name, is_visible_on_school, is_pro, preferences, created_at')
      .order('created_at', { ascending: false })
      .limit(60)

    if (q) {
      // Recherche insensible à la casse et partielle sur le nom, prénom, email, établissement
      const cleanQ = q.replace(/[%_]/g, '')
      query = query.or(
        `full_name.ilike.%${cleanQ}%,email.ilike.%${cleanQ}%,school_name.ilike.%${cleanQ}%`
      )
    }

    const { data: profiles, error } = await query

    if (error) {
      console.error('Error searching profiles in Supabase:', error)
      return NextResponse.json({ users: [] })
    }

    const mappedUsers = (profiles || [])
      .filter((p: any) => {
        if (p.is_visible_on_school === false) return false
        if (p.email && (p.email.includes('mock') || p.email.includes('test.com') || p.email === 'thomas.dubois@lycee.fr')) return false
        return true
      })
      .map((p: any) => {
        const prefs = (typeof p.preferences === 'object' && p.preferences !== null) ? p.preferences : {}
        const safeAvatarUrl =
          typeof p.avatar_url === 'string' && p.avatar_url.length <= 4000 ? p.avatar_url : null
        return {
          id: p.id,
          full_name: p.full_name || p.email?.split('@')[0] || 'Lycéen',
          email: p.email,
          avatar_url: safeAvatarUrl,
          class_level: p.class_level || 'terminale',
          specialties: Array.isArray(p.specialties) ? p.specialties : [],
          academic_goal: p.academic_goal,
          post_bac_target: p.post_bac_target,
          school_id: p.school_id,
          school_name: p.school_name || 'Lycée',
          is_visible_on_school: p.is_visible_on_school ?? true,
          is_visible: p.is_visible_on_school ?? true,
          is_pro: Boolean(p.is_pro),
          is_verified: Boolean(prefs.is_verified || p.is_pro),
          latitude: prefs.latitude ?? null,
          longitude: prefs.longitude ?? null,
          bio: prefs.bio || (p.specialties?.length ? `Spécialités : ${p.specialties.join(', ')}` : 'Élève actif sur OptiNote'),
        }
      })

    return NextResponse.json({ users: mappedUsers })
  } catch (err: any) {
    console.error('User search error:', err)
    return NextResponse.json({ users: [] })
  }
}
