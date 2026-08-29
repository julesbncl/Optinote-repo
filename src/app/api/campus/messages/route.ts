import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { moderateMessage } from '@/lib/moderation/filter'
import { checkRateLimit } from '@/lib/rate-limit'
import { RATE_LIMITS } from '@/lib/constants'
import { isUserSubscribed } from '@/lib/stripe/server'
import { sendMessageSchema } from '@/lib/validators/campus'
import { notifyNewMessage } from '@/lib/email/notifications'
import type { Message } from '@/types/campus'

import { z } from 'zod'

// Conversations privées : jamais de cache, sinon un utilisateur peut voir
// une conversation périmée après un nouveau message ou une nouvelle amitié.
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rawChannelId = searchParams.get('channelId')
    const rawReceiverId = searchParams.get('receiverId')

    const uuidSchema = z.string().uuid()

    const channelId = rawChannelId && uuidSchema.safeParse(rawChannelId).success ? rawChannelId : null
    const receiverId = rawReceiverId && uuidSchema.safeParse(rawReceiverId).success ? rawReceiverId : null

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // 1. Récupération des messages d'un salon de groupe
    if (channelId) {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*, profiles:user_id(full_name, avatar_url, class_level)')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) {
        return NextResponse.json({ messages: [] })
      }

      return NextResponse.json({ messages: messages || [] })
    }

    // 2. Récupération d'une conversation privée directe entre 2 élèves
    if (receiverId && user) {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*, profiles:sender_id(full_name, avatar_url, class_level)')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) {
        return NextResponse.json({ messages: [] })
      }

      // Marquer comme lus les messages reçus dans cette conversation
      // (attendu avant la réponse : une fonction serverless peut être coupée
      // dès qu'une réponse est renvoyée, un appel non attendu ne partirait pas)
      const { error: readError } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', receiverId)
        .eq('receiver_id', user.id)
        .eq('is_read', false)
      if (readError) console.error('Error marking messages as read:', readError)

      return NextResponse.json({ messages: messages || [] })
    }

    return NextResponse.json({ error: 'channelId ou receiverId requis' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ messages: [] })
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

    // Vérification de l'abonnement actif pour le Campus Social
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!isUserSubscribed(profile)) {
      return NextResponse.json(
        {
          error:
            'L’envoi de messages et l’accès au Campus Social sont réservés aux membres abonnés. Passez à l’abonnement Mensuel ou Annuel pour discuter avec vos camarades !',
          code: 'UPGRADE_REQUIRED',
        },
        { status: 403 }
      )
    }

    // Rate limit
    const rateLimit = await checkRateLimit(`chat:${user.id}`, RATE_LIMITS.CHAT_MESSAGES_PER_MINUTE)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Envoi trop rapide. Attends ${rateLimit.resetIn}s` },
        { status: 429 }
      )
    }

    const body = await request.json()
    const parsed = sendMessageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Données de message invalides' },
        { status: 400 }
      )
    }

    const { channelId, receiverId, content } = parsed.data

    // Modération automatique anti-harcèlement
    const moderation = moderateMessage(content)

    // Insertion du message
    const insertPayload: Partial<Message> = {
      user_id: user.id,
      sender_id: user.id,
      content: moderation.cleanedContent,
      is_flagged: !moderation.isSafe,
      flag_reason: moderation.flagReason || null,
    }

    if (channelId) {
      insertPayload.channel_id = channelId
    }

    if (receiverId) {
      insertPayload.receiver_id = receiverId
    }

    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert(insertPayload)
      .select('*, profiles:user_id(full_name, avatar_url, class_level)')
      .single()

    if (insertError) {
      console.error('Error inserting message:', insertError)
      return NextResponse.json({ error: 'Erreur lors de l’envoi du message' }, { status: 500 })
    }

    // Notification e-mail (message privé uniquement, pas les salons de groupe) :
    // on ne notifie que si c'est le seul message non lu de la conversation, pour
    // éviter de spammer le destinataire tant qu'il n'a pas lu le précédent.
    if (receiverId) {
      const { count: unreadCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('sender_id', user.id)
        .eq('receiver_id', receiverId)
        .eq('is_read', false)

      if ((unreadCount || 0) <= 1) {
        notifyNewMessage(supabase, {
          senderId: user.id,
          senderName: profile?.full_name || 'Un lycéen',
          receiverId,
          content: moderation.cleanedContent,
        })
      }
    }

    return NextResponse.json({ message, isFlagged: !moderation.isSafe })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
