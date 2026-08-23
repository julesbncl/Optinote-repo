import { Resend } from 'resend'

let cachedResend: Resend | null = null
let lastApiKey: string | null = null

export function getResendClient(): Resend {
  const apiKey =
    process.env.RESEND_API_KEY?.trim().replace(/^["']|["']$/g, '') ||
    're_placeholder_for_build'

  if (!cachedResend || lastApiKey !== apiKey) {
    lastApiKey = apiKey
    cachedResend = new Resend(apiKey)
  }

  return cachedResend
}

export const resend = new Proxy({} as Resend, {
  get(_target, prop, receiver) {
    const instance = getResendClient()
    const value = Reflect.get(instance, prop, receiver)
    return typeof value === 'function' ? value.bind(instance) : value
  },
})

export const DEFAULT_EMAIL_FROM =
  process.env.EMAIL_FROM || 'OptiNote <contact@optinote.fr>'
export const NOREPLY_EMAIL_FROM = 'OptiNote <noreply@optinote.fr>'


