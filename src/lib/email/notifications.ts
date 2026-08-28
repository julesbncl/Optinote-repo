import type { SupabaseClient } from '@supabase/supabase-js'
import { sendNotificationEmail } from './index'

// Envoi des notifications e-mail transactionnelles (message privé, demande d'ami,
// nouvelle session de révision). Chaque fonction est fire-and-forget : elle ne doit
// jamais ralentir ni faire échouer la requête API qui l'appelle — un envoi Resend
// raté reste silencieux côté utilisateur, seulement loggé côté serveur.

const APP_URL = 'https://optinote.fr'

interface RecipientPrefs {
  email: string | null
  full_name: string | null
  email_notif_messages: boolean | null
  email_notif_friends: boolean | null
  email_notif_revisions: boolean | null
}

async function getRecipientPrefs(supabase: SupabaseClient, userId: string): Promise<RecipientPrefs | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('email, full_name, email_notif_messages, email_notif_friends, email_notif_revisions')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return data
}

function fireAndForget(promise: Promise<unknown>, context: string) {
  promise.catch((err) => console.error(`[Email Notification] Erreur (${context}):`, err))
}

/**
 * Notifie un utilisateur qu'il a reçu un nouveau message privé.
 * Le compte de messages non lus doit être vérifié par l'appelant (`unreadCount`) :
 * on ne notifie que lorsqu'il s'agit du premier message non lu de la conversation,
 * pour éviter d'envoyer un e-mail à chaque nouveau message tant que la conversation
 * reste non lue par le destinataire.
 */
export function notifyNewMessage(
  supabase: SupabaseClient,
  params: { senderId: string; senderName: string; receiverId: string; content: string }
) {
  fireAndForget(
    (async () => {
      const recipient = await getRecipientPrefs(supabase, params.receiverId)
      if (!recipient?.email) return
      if (recipient.email_notif_messages === false) return

      const preview =
        params.content.length > 140 ? `${params.content.slice(0, 140)}…` : params.content

      await sendNotificationEmail(
        recipient.email,
        `Nouveau message de ${params.senderName}`,
        `${params.senderName} vient de t'envoyer un message sur OptiNote : « ${preview} »`,
        'Répondre sur OptiNote',
        `${APP_URL}/campus/messages?friendId=${params.senderId}`
      )
    })(),
    'nouveau message'
  )
}

/** Notifie un utilisateur qu'il a reçu une nouvelle demande d'ami. */
export function notifyFriendRequest(
  supabase: SupabaseClient,
  params: { senderId: string; senderName: string; receiverId: string }
) {
  fireAndForget(
    (async () => {
      const recipient = await getRecipientPrefs(supabase, params.receiverId)
      if (!recipient?.email) return
      if (recipient.email_notif_friends === false) return

      await sendNotificationEmail(
        recipient.email,
        `Nouvelle demande d'ami de ${params.senderName}`,
        `${params.senderName} souhaite t'ajouter en ami sur OptiNote pour échanger et réviser ensemble.`,
        'Voir la demande',
        `${APP_URL}/campus`
      )
    })(),
    'demande d’ami'
  )
}

/**
 * Notifie les amis (relations acceptées) d'un élève lorsqu'il publie une nouvelle
 * session de révision, pour qu'ils puissent la rejoindre.
 */
export function notifyNewRevisionSession(
  supabase: SupabaseClient,
  params: { hostId: string; hostName: string; title: string; subject: string }
) {
  fireAndForget(
    (async () => {
      const { data: friendships } = await supabase
        .from('friendships')
        .select('user_id, friend_id')
        .eq('status', 'accepted')
        .or(`user_id.eq.${params.hostId},friend_id.eq.${params.hostId}`)

      const friendIds = Array.from(
        new Set(
          (friendships || []).map((f: { user_id: string; friend_id: string }) =>
            f.user_id === params.hostId ? f.friend_id : f.user_id
          )
        )
      )
      if (friendIds.length === 0) return

      const { data: recipients } = await supabase
        .from('profiles')
        .select('email, email_notif_revisions')
        .in('id', friendIds)

      const targets = (recipients || []).filter(
        (r: { email: string | null; email_notif_revisions: boolean | null }) =>
          r.email && r.email_notif_revisions !== false
      )
      if (targets.length === 0) return

      await Promise.allSettled(
        targets.map((r: { email: string }) =>
          sendNotificationEmail(
            r.email,
            `${params.hostName} propose une session de révision`,
            `${params.hostName} vient de publier une nouvelle session de révision « ${params.title} » (${params.subject}) sur le Campus OptiNote. Rejoins-la si tu es dispo !`,
            'Voir la session',
            `${APP_URL}/campus`
          )
        )
      )
    })(),
    'nouvelle session de révision'
  )
}
