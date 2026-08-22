import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY || 're_placeholder_for_build'

export const resend = new Resend(resendApiKey)

export const DEFAULT_EMAIL_FROM = process.env.EMAIL_FROM || 'OptiNote <contact@optinote.fr>'
export const NOREPLY_EMAIL_FROM = 'OptiNote <noreply@optinote.fr>'

