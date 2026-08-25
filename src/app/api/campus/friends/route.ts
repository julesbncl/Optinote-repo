import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Données spécifiques à l'utilisateur connecté (amis, demandes en attente) :
// ne doit jamais être mise en cache, sous peine d'afficher une liste périmée.
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ friends: [], pendingReceived: [], pendingSent: [], unreadMessagesCount: 0 })
    }

    // Récupérer toutes les relations de l'utilisateur
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select('*')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)

    if (error || !friendships) {
      return NextResponse.json({ friends: [], pendingReceived: [], pendingSent: [], unreadMessagesCount: 0 })
    }

    const { count: unreadMessagesCount } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', user.id)
      .eq('is_read', false)

    const acceptedFriendIds = friendships
      .filter((f) => f.status === 'accepted')
      .map((f) => (f.user_id === user.id ? f.friend_id : f.user_id))

    const pendingReceived = friendships.filter(
      (f) => f.friend_id === user.id && f.status === 'pending'
    )
    const pendingSent = friendships.filter(
      (f) => f.user_id === user.id && f.status === 'pending'
    )

    let friendsProfiles: any[] = []
    if (acceptedFriendIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, school_name, class_level, specialties, bio, is_verified')
        .in('id', acceptedFriendIds)
      friendsProfiles = profiles || []
    }

    // Enrichir les demandes reçues/envoyées avec le profil de l'autre personne
    const otherPartyIds = Array.from(
      new Set([
        ...pendingReceived.map((f) => f.user_id),
        ...pendingSent.map((f) => f.friend_id),
      ])
    )
    let otherPartyProfiles: Record<string, any> = {}
    if (otherPartyIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, school_name, class_level, specialties, is_verified')
        .in('id', otherPartyIds)
      otherPartyProfiles = Object.fromEntries((profiles || []).map((p) => [p.id, p]))
    }

    const pendingReceivedWithProfiles = pendingReceived.map((f) => ({
      ...f,
      friend_profile: otherPartyProfiles[f.user_id] || null,
    }))
    const pendingSentWithProfiles = pendingSent.map((f) => ({
      ...f,
      friend_profile: otherPartyProfiles[f.friend_id] || null,
    }))

    return NextResponse.json({
      friends: friendsProfiles,
      pendingReceived: pendingReceivedWithProfiles,
      pendingSent: pendingSentWithProfiles,
      unreadMessagesCount: unreadMessagesCount || 0,
    })
  } catch (error) {
    console.error('Error fetching friendships:', error)
    return NextResponse.json({ friends: [], pendingReceived: [], pendingSent: [] })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const { friendId, action } = body

    if (!friendId) {
      return NextResponse.json({ error: 'friendId requis' }, { status: 400 })
    }

    if (friendId === user.id) {
      return NextResponse.json({ error: 'Action impossible sur soi-même' }, { status: 400 })
    }

    if (action === 'request') {
      // Envoyer une demande d'ami
      const { data, error } = await supabase
        .from('friendships')
        .upsert(
          {
            user_id: user.id,
            friend_id: friendId,
            status: 'pending',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,friend_id' }
        )
        .select()
        .single()

      if (error) {
        console.error('Error sending friend request:', error)
        return NextResponse.json({ error: 'Erreur lors de l’envoi de la demande' }, { status: 500 })
      }

      return NextResponse.json({ success: true, friendship: data, message: 'Demande d’ami envoyée ! ✨' })
    }

    if (action === 'accept') {
      // Accepter une demande reçue
      const { data, error } = await supabase
        .from('friendships')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('user_id', friendId)
        .eq('friend_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Error accepting friend request:', error)
        return NextResponse.json({ error: 'Erreur lors de l’acceptation' }, { status: 500 })
      }

      return NextResponse.json({ success: true, friendship: data, message: 'Demande d’ami acceptée ! 🎉' })
    }

    if (action === 'decline' || action === 'remove') {
      // Refuser ou supprimer l'ami
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(
          `and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`
        )

      if (error) {
        console.error('Error removing friendship:', error)
        return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'Relation supprimée.' })
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
  } catch (error: any) {
    console.error('Error managing friendship:', error)
    return NextResponse.json({ error: error?.message || 'Erreur serveur' }, { status: 500 })
  }
}
