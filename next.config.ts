import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

// Content Security Policy (CSP) robuste adaptée à OptiNote (Supabase, Stripe, OpenStreetMap)
// 'unsafe-eval' n'est nécessaire qu'en développement (React s'en sert pour de
// meilleurs messages d'erreur) — ni React ni Next.js ne l'utilisent en
// production, donc on ne l'autorise plus qu'en dev, ce qui réduit la surface
// XSS en production. 'unsafe-inline' reste nécessaire (les scripts injectés
// par Next.js pour l'hydratation) : le retirer proprement demanderait un CSP
// à base de nonce, qui impose de rendre TOUTES les pages dynamiquement (plus
// aucune page statique), un changement d'architecture bien plus lourd — hors
// scope ici sans validation explicite.
const cspHeader = `
  default-src 'self' https://optinote.fr https://*.optinote.fr;
  script-src 'self'${isProduction ? '' : " 'unsafe-eval'"} 'unsafe-inline' https://js.stripe.com https://challenges.cloudflare.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: blob: https: https://*.tile.openstreetmap.org https://*.supabase.co https://images.unsplash.com;
  font-src 'self' data: https://fonts.gstatic.com;
  connect-src 'self' https://optinote.fr https://*.optinote.fr https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://api.openai.com https://api.resend.com https://challenges.cloudflare.com;
  frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://challenges.cloudflare.com;
  frame-ancestors 'none';
  form-action 'self' https://checkout.stripe.com;
  object-src 'none';
  base-uri 'self';
  ${isProduction ? "upgrade-insecure-requests;" : ""}
`.replace(/\s{2,}/g, " ").trim();

const nextConfig: NextConfig = {
  devIndicators: false,

  // En-têtes HTTP de sécurité globaux (Équivalent Helmet standard de production)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
          {
            key: "X-Frame-Options",
            value: "DENY", // Anti-Clickjacking
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff", // Anti-MIME sniffing
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(self)",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload", // HSTS 2 ans
          },
        ],
      },
    ];
  },
};

export default nextConfig;
