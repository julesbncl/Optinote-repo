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

  const { data: codes, error } = await admin
    .from('creator_codes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching creator codes:', error)
    return NextResponse.json({ creators: [] })
  }

  // Agrège les gains par code (revenus générés, commission due, part déjà payée).
  const creators = await Promise.all(
    (codes || []).map(async (code) => {
      const [{ count: redemptions }, { data: earnings }] = await Promise.all([
        admin
          .from('creator_code_redemptions')
          .select('*', { count: 'exact', head: true })
          .eq('creator_code_id', code.id),
        admin
          .from('creator_earnings')
          .select('amount_cents, commission_cents, paid_out')
          .eq('creator_code_id', code.id),
      ])

      const totalRevenueCents = (earnings || []).reduce((sum, e) => sum + e.amount_cents, 0)
      const totalCommissionCents = (earnings || []).reduce((sum, e) => sum + e.commission_cents, 0)
      const paidOutCommissionCents = (earnings || [])
        .filter((e) => e.paid_out)
        .reduce((sum, e) => sum + e.commission_cents, 0)

      return {
        ...code,
        redemptions_count: redemptions || 0,
        total_revenue_cents: totalRevenueCents,
        total_commission_cents: totalCommissionCents,
        commission_due_cents: totalCommissionCents - paidOutCommissionCents,
      }
    })
  )

  return NextResponse.json({ creators })
}

export async function POST(request: Request) {
  const user = await requireAdmin()
  if (!user) {
    return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : ''
  const creatorName = typeof body.creatorName === 'string' ? body.creatorName.trim() : ''
  const creatorEmail = typeof body.creatorEmail === 'string' ? body.creatorEmail.trim().toLowerCase() : null
  const discountPercent = Number.isFinite(body.discountPercent) ? Number(body.discountPercent) : 15
  const commissionPercent = Number.isFinite(body.commissionPercent) ? Number(body.commissionPercent) : 15

  if (!code || !creatorName) {
    return NextResponse.json({ error: 'Code et nom du créateur requis' }, { status: 400 })
  }
  if (discountPercent <= 0 || discountPercent > 100 || commissionPercent <= 0 || commissionPercent > 100) {
    return NextResponse.json({ error: 'Pourcentages invalides' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Si un compte OptiNote existe déjà avec cet email, on le relie tout de suite
  // pour que le créateur ait accès à son dashboard sans étape manuelle en plus.
  let ownerUserId: string | null = null
  if (creatorEmail) {
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id')
      .eq('email', creatorEmail)
      .maybeSingle()
    ownerUserId = existingProfile?.id || null
  }

  const { data: created, error } = await admin
    .from('creator_codes')
    .insert({
      code,
      creator_name: creatorName,
      creator_email: creatorEmail,
      owner_user_id: ownerUserId,
      discount_percent: discountPercent,
      commission_percent: commissionPercent,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating creator code:', error)
    const message = error.code === '23505' ? 'Ce code existe déjà' : 'Erreur lors de la création du code'
    return NextResponse.json({ error: message }, { status: error.code === '23505' ? 409 : 500 })
  }

  return NextResponse.json({ creator: created })
}

export async function PATCH(request: Request) {
  const user = await requireAdmin()
  if (!user) {
    return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const { creatorCodeId, isActive, markPaidOut } = body

  if (!creatorCodeId) {
    return NextResponse.json({ error: 'creatorCodeId requis' }, { status: 400 })
  }

  const admin = createAdminClient()

  if (typeof isActive === 'boolean') {
    const { error } = await admin
      .from('creator_codes')
      .update({ is_active: isActive })
      .eq('id', creatorCodeId)
    if (error) {
      console.error('Error updating creator code status:', error)
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
    }
  }

  // Marque toute la commission en attente de ce créateur comme "payée" — usage
  // manuel après un virement réel, tant qu'aucun paiement automatisé n'existe.
  if (markPaidOut) {
    const { error } = await admin
      .from('creator_earnings')
      .update({ paid_out: true })
      .eq('creator_code_id', creatorCodeId)
      .eq('paid_out', false)
    if (error) {
      console.error('Error marking creator earnings as paid out:', error)
      return NextResponse.json({ error: 'Erreur lors du marquage comme payé' }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
