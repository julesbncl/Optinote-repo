import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Classement limité aux amis (relation acceptée) qui ont explicitement activé
// "Classement entre amis" dans leurs paramètres — jamais un classement global,
// et jamais quelqu'un qui n'a pas opté in, même parmi les amis de l'utilisateur.
// On lit current_streak / last_known_average (déjà calculés et stockés côté
// profil pour d'autres fonctionnalités) via la clé de service, plutôt que de
// recalculer depuis la table grades — ça évite de jamais avoir à lire les
// notes individuelles d'un autre utilisateur.
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const rateLimit = await checkRateLimit(`leaderboard:${user.id}`, 30, 60_000)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Trop de requêtes. Réessaie dans ${rateLimit.resetIn}s` },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') === 'average' ? 'average' : 'streak'

    const { data: friendships, error: friendshipsError } = await supabase
      .from('friendships')
      .select('user_id, friend_id')
      .eq('status', 'accepted')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)

    if (friendshipsError) {
      console.error('Error fetching friendships for leaderboard:', friendshipsError)
      return NextResponse.json({ entries: [] })
    }

    const friendIds = Array.from(
      new Set(
        (friendships || []).map((f) => (f.user_id === user.id ? f.friend_id : f.user_id))
      )
    )

    const admin = createAdminClient()
    const { data: profiles, error: profilesError } = await admin
      .from('profiles')
      .select('id, full_name, avatar_url, current_streak, last_known_average, leaderboard_opt_in')
      .in('id', [...friendIds, user.id])

    if (profilesError) {
      console.error('Error fetching profiles for leaderboard:', profilesError)
      return NextResponse.json({ entries: [] })
    }

    const eligible = (profiles || []).filter((p) => p.id === user.id || p.leaderboard_opt_in)

    const entries = eligible
      .map((p) => ({
        id: p.id,
        full_name: p.full_name || 'Lycéen',
        avatar_url: p.avatar_url,
        value: type === 'average' ? (p.last_known_average ?? null) : (p.current_streak || 0),
        isMe: p.id === user.id,
      }))
      .filter((e) => e.value !== null)
      .sort((a, b) => (b.value as number) - (a.value as number))

    return NextResponse.json({ entries, type })
  } catch (err) {
    console.error('Error building leaderboard:', err)
    return NextResponse.json({ entries: [] })
  }
}
