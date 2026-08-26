import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  return profile?.is_admin ? user : null
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) {
    return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
  }

  const admin = createAdminClient()

  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id, full_name, email, school_name, class_level, school_certificate_url, verification_note, updated_at')
    .eq('verification_status', 'pending')
    .order('updated_at', { ascending: true })

  if (error) {
    console.error('Error fetching pending verifications:', error)
    return NextResponse.json({ verifications: [] })
  }

  // Génère une URL signée temporaire (10 min) pour chaque certificat, stocké
  // dans un bucket privé — l'admin doit pouvoir le regarder sans y avoir accès
  // en permanence.
  const verifications = await Promise.all(
    (profiles || []).map(async (p) => {
      let certificateUrl: string | null = null
      if (p.school_certificate_url) {
        const { data: signed } = await admin.storage
          .from('school-certificates')
          .createSignedUrl(p.school_certificate_url, 600)
        certificateUrl = signed?.signedUrl || null
      }
      return { ...p, certificate_signed_url: certificateUrl }
    })
  )

  return NextResponse.json({ verifications })
}

export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) {
    return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
  }

  const body = await request.json()
  const { profileId, decision } = body

  if (!profileId || !['verified', 'rejected'].includes(decision)) {
    return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({
      verification_status: decision,
      is_verified: decision === 'verified',
      verification_note: decision === 'verified' ? 'Validé manuellement par un administrateur' : 'Rejeté manuellement par un administrateur',
      updated_at: new Date().toISOString(),
    })
    .eq('id', profileId)

  if (error) {
    console.error('Error updating verification decision:', error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
