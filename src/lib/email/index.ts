import { resend, DEFAULT_EMAIL_FROM } from './resend'
import {
  getWelcomeEmailHtml,
  getNotificationEmailHtml,
  getVerificationEmailHtml,
  getPlanningReminderEmailHtml,
  type VerificationEmailProps,
} from './templates'

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
  replyTo?: string
  timeoutMs?: number
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
  latencyMs?: number
}

/**
 * Envoie un email transactionnel générique via Resend avec gestion de timeout et logs structurés
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = 'OptiNote <contact@optinote.fr>',
  replyTo = 'contact@optinote.fr',
  timeoutMs = 6000,
}: SendEmailOptions): Promise<SendEmailResult> {
  const startTime = Date.now()
  const recipient = Array.isArray(to) ? to.join(', ') : to

  try {
    // Timeout safeguard pour éviter tout blocage réseau prolongé
    const sendPromise = resend.emails.send({
      from,
      to,
      subject,
      html: html || `<p>${text || ''}</p>`,
      text: text || undefined,
      replyTo,
    })

    const timeoutPromise = new Promise<{ data: null; error: { message: string; name: string } }>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout de l'API Resend après ${timeoutMs}ms`)), timeoutMs)
    )

    const response = await Promise.race([sendPromise, timeoutPromise])

    const latencyMs = Date.now() - startTime

    // Resend SDK renvoie { data, error } au lieu de lever une exception
    if (response?.error) {
      console.error(`[Email Service] ❌ Échec envoi à ${recipient} (${latencyMs}ms):`, response.error)
      return {
        success: false,
        error: response.error?.message || 'Erreur lors de l’envoi Resend',
        latencyMs,
      }
    }

    const messageId = response?.data?.id
    console.log(`[Email Service] ✅ Email envoyé avec succès à ${recipient} | ID: ${messageId} | ${latencyMs}ms`)

    return {
      success: true,
      messageId,
      latencyMs,
    }
  } catch (error: unknown) {
    const latencyMs = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Erreur inattendue lors de l’envoi de l’email'
    console.error(`[Email Service] ❌ Exception lors de l’envoi à ${recipient} (${latencyMs}ms):`, errorMessage)

    return {
      success: false,
      error: errorMessage,
      latencyMs,
    }
  }
}

/**
 * Envoie l'email de vérification de compte OptiNote avec lien sécurisé unique
 */
export async function sendVerificationEmail(
  to: string,
  options: {
    verificationUrl: string
    name?: string
    expiresInHours?: number
  }
): Promise<SendEmailResult> {
  const html = getVerificationEmailHtml({
    name: options.name,
    verificationUrl: options.verificationUrl,
    expiresInHours: options.expiresInHours || 24,
  })

  return sendEmail({
    to,
    from: 'OptiNote <contact@optinote.fr>',
    subject: 'Vérifie ton adresse email — OptiNote 🚀',
    html,
  })
}

/**
 * Envoi non-bloquant (fire-and-forget) en arrière-plan pour le flux d'inscription.
 * Ne bloque pas la réponse HTTP de l'inscription si l'API Resend est ralentie.
 */
export function sendVerificationEmailAsync(
  to: string,
  options: {
    verificationUrl: string
    name?: string
    expiresInHours?: number
  }
): void {
  // Exécution asynchrone découplée
  Promise.resolve().then(async () => {
    try {
      const result = await sendVerificationEmail(to, options)
      if (!result.success) {
        console.warn(`[Email Async Worker] ⚠️ Avertissement : Impossible d'envoyer l'email de vérification à ${to}: ${result.error}`)
      }
    } catch (err) {
      console.error(`[Email Async Worker] 💥 Erreur d'arrière-plan sur l'envoi de vérification à ${to}:`, err)
    }
  })
}

/**
 * Envoie un email de bienvenue à un nouvel utilisateur
 */
export async function sendWelcomeEmail(to: string, name?: string) {
  const html = getWelcomeEmailHtml({
    name,
    dashboardUrl: 'https://optinote.fr/dashboard',
  })

  return sendEmail({
    to,
    from: 'OptiNote <contact@optinote.fr>',
    subject: 'Bienvenue sur OptiNote 🚀 Ton espace de révision est prêt !',
    html,
  })
}

/**
 * Envoie un email de notification ou d'alerte
 */
export async function sendNotificationEmail(
  to: string,
  title: string,
  message: string,
  actionLabel?: string,
  actionUrl?: string
) {
  const html = getNotificationEmailHtml({
    title,
    message,
    actionLabel,
    actionUrl,
  })

  return sendEmail({
    to,
    from: 'OptiNote <contact@optinote.fr>',
    subject: `OptiNote : ${title}`,
    html,
  })
}

/**
 * Envoie l'e-mail de rappel matinal du planning du jour, avec un message de
 * motivation et un rappel de la moyenne actuelle.
 */
export async function sendPlanningReminderEmail(
  to: string,
  options: Parameters<typeof getPlanningReminderEmailHtml>[0]
): Promise<SendEmailResult> {
  const html = getPlanningReminderEmailHtml(options)

  return sendEmail({
    to,
    from: 'OptiNote <contact@optinote.fr>',
    subject: '☀️ Ton planning du jour — OptiNote',
    html,
  })
}

/**
 * Envoie un email de test pour valider la configuration
 */
export async function sendTestEmail(to: string) {
  return sendEmail({
    to,
    from: 'OptiNote <contact@optinote.fr>',
    subject: 'Test de configuration Resend — OptiNote ✅',
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #0F172A;">
        <h2>Test d'intégration Resend réussi ! 🚀</h2>
        <p>Ce message confirme que ton domaine <strong>optinote.fr</strong> et ta clé API Resend sont parfaitement connectés à OptiNote.</p>
        <p style="color: #64748B; font-size: 12px;">Expéditeur : OptiNote &lt;contact@optinote.fr&gt;</p>
        <p style="color: #64748B; font-size: 12px;">Date et heure du test : ${new Date().toLocaleString('fr-FR')}</p>
      </div>
    `,
  })
}

