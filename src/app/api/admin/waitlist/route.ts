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

  const [{ count }, { data: entries, error }] = await Promise.all([
    admin.from('waitlist').select('*', { count: 'exact', head: true }),
    admin.from('waitlist').select('*').order('created_at', { ascending: false }).limit(100),
  ])

  if (error) {
    console.error('Error fetching waitlist:', error)
    return NextResponse.json({ count: count || 0, entries: [] })
  }

  return NextResponse.json({ count: count || 0, entries: entries || [] })
}
