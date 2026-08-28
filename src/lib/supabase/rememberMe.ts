import { parse, serialize } from 'cookie'

// @supabase/ssr stocke la session dans des cookies "sb-<ref>-auth-token" (parfois
// segmentés en "sb-<ref>-auth-token.0", ".1", ...) avec une durée de vie fixe de
// 400 jours, sans option pour la faire varier par connexion. Quand l'utilisateur
// décoche "Se souvenir de moi", on réécrit ces cookies juste après la connexion
// pour retirer leur date d'expiration : ils redeviennent des cookies de session,
// effacés à la fermeture du navigateur, sans toucher au comportement par défaut
// (coché) ni aux mécanismes internes de la librairie.
const AUTH_COOKIE_PATTERN = /^sb-.+-auth-token(\.\d+)?$/

export function applyRememberMePreference(remember: boolean): void {
  if (remember || typeof document === 'undefined') return

  const cookies = parse(document.cookie)
  const isSecure = typeof location !== 'undefined' && location.protocol === 'https:'

  for (const [name, value] of Object.entries(cookies)) {
    if (!value || !AUTH_COOKIE_PATTERN.test(name)) continue

    document.cookie = serialize(name, value, {
      path: '/',
      sameSite: 'lax',
      secure: isSecure,
    })
  }
}
