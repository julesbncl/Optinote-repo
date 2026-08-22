// ═══════════════════════════════════════════════════════
// OptiNote — Standalone Express / Node.js Security Config
// (Helmet, Content Security Policy, Strict CORS, HSTS)
// ═══════════════════════════════════════════════════════

export interface SecurityConfigOptions {
  isProduction?: boolean
  allowedOrigins?: string[]
}

/**
 * Configuration Helmet pour Express / Node.js
 * À utiliser avec : app.use(helmet(getHelmetConfig()))
 */
export function getHelmetConfig(options: SecurityConfigOptions = {}) {
  const isProduction = options.isProduction ?? process.env.NODE_ENV === 'production'

  return {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", 'https://optinote.fr', 'https://*.optinote.fr'],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://js.stripe.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https:',
          'https://*.tile.openstreetmap.org',
          'https://*.supabase.co',
          'https://images.unsplash.com',
        ],
        fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],
        connectSrc: [
          "'self'",
          'https://optinote.fr',
          'https://*.optinote.fr',
          'https://*.supabase.co',
          'wss://*.supabase.co',
          'https://api.stripe.com',
          'https://api.openai.com',
          'https://api.resend.com',
        ],
        frameSrc: ["'self'", 'https://js.stripe.com', 'https://checkout.stripe.com'],
        frameAncestors: ["'none'"], // Anti-Clickjacking
        formAction: ["'self'", 'https://checkout.stripe.com'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        upgradeInsecureRequests: isProduction ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false, // Permet le chargement d'assets externes (cartes Leaflet, fonts)
    crossOriginResourcePolicy: { policy: 'cross-origin' as const },
    frameguard: { action: 'deny' as const }, // X-Frame-Options: DENY
    hsts: {
      maxAge: 63072000, // 2 ans
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true, // X-Content-Type-Options: nosniff
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' as const },
  }
}

/**
 * Configuration CORS stricte pour Express / Node.js
 * À utiliser avec : app.use(cors(getCorsConfig()))
 */
export function getCorsConfig(options: SecurityConfigOptions = {}) {
  const isProduction = options.isProduction ?? process.env.NODE_ENV === 'production'

  const allowedOrigins =
    options.allowedOrigins ||
    (isProduction
      ? ['https://optinote.fr', 'https://www.optinote.fr']
      : [
          'https://optinote.fr',
          'https://www.optinote.fr',
          'http://localhost:3000',
          'http://127.0.0.1:3000',
        ])

  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Autoriser les requêtes sans Origin (ex: webhooks Stripe serveur à serveur, mobile apps)
      if (!origin) {
        return callback(null, true)
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(
        new Error(`[CORS Security] Requête bloquée : l'origine '${origin}' n'est pas autorisée. Seul https://optinote.fr a accès à l'API.`),
        false
      )
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    maxAge: 86400, // 24 heures de cache pour les requêtes Preflight
    optionsSuccessStatus: 204,
  }
}
