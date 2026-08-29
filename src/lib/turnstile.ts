// ═══════════════════════════════════════════════════════
// OptiNote — Vérification Cloudflare Turnstile (anti-bot)
// ═══════════════════════════════════════════════════════
// Turnstile est gratuit et ne suit pas les utilisateurs (contrairement à
// reCAPTCHA) — adapté à un public de lycéens. Nécessite deux clés obtenues
// gratuitement sur https://dash.cloudflare.com/?to=/:account/turnstile :
// NEXT_PUBLIC_TURNSTILE_SITE_KEY (publique, widget côté client) et
// TURNSTILE_SECRET_KEY (secrète, vérification côté serveur uniquement).

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/**
 * Vérifie un jeton Turnstile côté serveur. Si aucune clé secrète n'est
 * configurée, la vérification est ignorée (renvoie true) — permet de
 * déployer le code avant d'avoir créé les clés Cloudflare, sans bloquer le
 * formulaire en attendant. Configurer TURNSTILE_SECRET_KEY dès que possible.
 */
export async function verifyTurnstileToken(token: string | undefined, ip: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY
  if (!secretKey) {
    console.warn('TURNSTILE_SECRET_KEY non configurée — vérification anti-bot ignorée.')
    return true
  }

  if (!token) return false

  try {
    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
        remoteip: ip,
      }),
    })
    const data = await res.json()
    return Boolean(data.success)
  } catch (err) {
    console.error('Turnstile verification error:', err)
    // En cas de panne du service Cloudflare, on laisse passer plutôt que de
    // bloquer tout le formulaire — même logique que le rate limiter.
    return true
  }
}
