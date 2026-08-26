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

  const { data: reports, error } = await admin
    .from('message_reports')
    .select('*, reporter:reported_by(full_name, email), message:message_id(content, sender_id, created_at, sender:sender_id(full_name, email))')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching message reports:', error)
    return NextResponse.json({ reports: [] })
  }

  return NextResponse.json({ reports: reports || [] })
}

export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) {
    return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
  }

  const body = await request.json()
  const { reportId, status } = body

  if (!reportId || !['reviewed', 'dismissed'].includes(status)) {
    return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('message_reports')
    .update({ status })
    .eq('id', reportId)

  if (error) {
    console.error('Error updating report status:', error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
