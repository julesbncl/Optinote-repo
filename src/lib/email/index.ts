import { resend, DEFAULT_EMAIL_FROM, NOREPLY_EMAIL_FROM } from './resend'
import { getWelcomeEmailHtml, getNotificationEmailHtml } from './templates'

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
  replyTo?: string
}

/**
 * Envoie un email générique via Resend
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = DEFAULT_EMAIL_FROM,
  replyTo = 'contact@optinote.fr',
}: SendEmailOptions) {
  try {
    const data = await resend.emails.send({
      from,
      to,
      subject,
      html: html || `<p>${text || ''}</p>`,
      text: text || undefined,
      replyTo,
    })

    return { success: true, data }
  } catch (error: any) {
    console.error('❌ Erreur lors de l’envoi de l’email avec Resend:', error)
    return {
      success: false,
      error: error?.message || 'Erreur inattendue lors de l’envoi de l’email',
    }
  }
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
    from: DEFAULT_EMAIL_FROM,
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
    from: NOREPLY_EMAIL_FROM,
    subject: `OptiNote : ${title}`,
    html,
  })
}

/**
 * Envoie un email de test pour valider la configuration
 */
export async function sendTestEmail(to: string) {
  return sendEmail({
    to,
    from: DEFAULT_EMAIL_FROM,
    subject: 'Test de configuration Resend — OptiNote ✅',
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #0F172A;">
        <h2>Test d'intégration Resend réussi ! 🚀</h2>
        <p>Ce message confirme que ton domaine <strong>optinote.fr</strong> et ta clé API Resend sont parfaitement connectés à OptiNote.</p>
        <p style="color: #64748B; font-size: 12px;">Date et heure du test : ${new Date().toLocaleString('fr-FR')}</p>
      </div>
    `,
  })
}
