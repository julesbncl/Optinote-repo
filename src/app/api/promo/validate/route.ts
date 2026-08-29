import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { VALID_PROMO_CODES, PROMO_DISCOUNT_PERCENT } from '@/lib/constants'

// Endpoint public : vérifie un code (promo statique OU code créateur) sans
// jamais exposer la table creator_codes au client — seul le pourcentage de
// réduction est renvoyé, jamais le nom/email/commission du créateur.
// Rate-limité pour empêcher l'énumération de codes valides par force brute.
export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rateLimit = await checkRateLimit(`promo_validate:${ip}`, 20, 60_000)
  if (!rateLimit.success) {
    return NextResponse.json({ valid: false, error: 'Trop de tentatives. Réessaie dans un instant.' }, { status: 429 })
  }

  const body = await request.json().catch(() => ({}))
  const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : ''

  if (!code) {
    return NextResponse.json({ valid: false })
  }

  if ((VALID_PROMO_CODES as readonly string[]).includes(code)) {
    return NextResponse.json({ valid: true, discountPercent: PROMO_DISCOUNT_PERCENT })
  }

  const admin = createAdminClient()
  const { data } = await admin
    .from('creator_codes')
    .select('discount_percent')
    .eq('code', code)
    .eq('is_active', true)
    .maybeSingle()

  if (data) {
    return NextResponse.json({ valid: true, discountPercent: data.discount_percent })
  }

  return NextResponse.json({ valid: false })
}
