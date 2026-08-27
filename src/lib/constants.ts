// ═══════════════════════════════════════════════════════
// OptiNote — Constantes Globales
// ═══════════════════════════════════════════════════════

import type { PricingPlan } from '@/types/subscription'

export const APP_NAME = 'OptiNote'
export const APP_DESCRIPTION =
  "L'application tout-en-un pour optimiser ta vie scolaire au lycée."

// Navigation items for sidebar/bottom nav
export const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard' as const,
  },
  {
    label: 'Campus',
    href: '/campus',
    icon: 'Users' as const,
  },
  {
    label: 'Planning',
    href: '/planning',
    icon: 'CalendarDays' as const,
  },
  {
    label: 'Révision',
    href: '/revision',
    icon: 'BookOpen' as const,
  },
  {
    label: 'Notes',
    href: '/grades',
    icon: 'GraduationCap' as const,
  },
] as const

// Class levels for French lycée
export const CLASS_LEVELS = [
  { value: 'seconde', label: 'Seconde', emoji: '🌱' },
  { value: 'premiere', label: 'Première', emoji: '🌿' },
  { value: 'terminale', label: 'Terminale', emoji: '🎓' },
  { value: 'autre', label: 'Autre niveau', emoji: '📚' },
] as const

// Specialties for Premiere & Terminale
export const SPECIALTIES = [
  { id: 'maths', label: 'Mathématiques', emoji: '📐', desc: 'Analyse, probas & géométrie' },
  { id: 'physique', label: 'Physique-Chimie', emoji: '⚡', desc: 'Mécanique, ondes & chimie' },
  { id: 'svt', label: 'SVT', emoji: '🧬', desc: 'Génétique, immunologie & Terre' },
  { id: 'ses', label: 'SES', emoji: '📈', desc: 'Économie, sociologie & marchés' },
  { id: 'nsi', label: 'NSI', emoji: '💻', desc: 'Python, algo & architectures' },
  { id: 'hggsp', label: 'HGGSP', emoji: '🏛️', desc: 'Géopolitique, histoire & conflits' },
  { id: 'hlp', label: 'HLP', emoji: '✍️', desc: 'Philosophie, parole & littérature' },
  { id: 'llcer', label: 'LLCER Anglais', emoji: '🌍', desc: 'Littérature & monde anglophone' },
  { id: 'si', label: 'Sciences de l’Ingénieur', emoji: '⚙️', desc: 'Systèmes & ingénierie' },
  { id: 'arts', label: 'Arts plastiques / Musique', emoji: '🎨', desc: 'Création & histoire des arts' },
] as const

// Academic goals
export const ACADEMIC_GOALS = [
  {
    id: 'excellence',
    title: 'Excellence (16+/20)',
    subtitle: 'Mention Très Bien & Prépas / Écoles sélectives',
    emoji: '🏆',
    color: 'from-amber-500 to-yellow-400',
  },
  {
    id: 'progression',
    title: 'Progression continue (14-15/20)',
    subtitle: 'Mention Bien & dossier solide Parcoursup',
    emoji: '📈',
    color: 'from-primary-500 to-accent-500',
  },
  {
    id: 'bac_mention',
    title: 'Assurer le Bac (11-13/20)',
    subtitle: 'Objectif régularité & sérénité',
    emoji: '🎯',
    color: 'from-success-500 to-emerald-400',
  },
  {
    id: 'rattrapage',
    title: 'Remise à niveau & Rattrapage',
    subtitle: 'Combler les lacunes et reprendre confiance',
    emoji: '💪',
    color: 'from-purple-500 to-indigo-400',
  },
] as const

// Post-Bac Horizons
export const POST_BAC_TARGETS = [
  { id: 'scientifique', label: 'Sciences & Prépas MPSI/PCSI', emoji: '🔬' },
  { id: 'sante', label: 'Santé & Médecine (PASS / LAS)', emoji: '🩺' },
  { id: 'eco_droit', label: 'Commerce, Droit & Sciences Po', emoji: '⚖️' },
  { id: 'ingenieur', label: 'Écoles d’Ingénieurs & Tech', emoji: '🚀' },
  { id: 'litteraire', label: 'Lettres, Langues & Sciences Humaines', emoji: '📖' },
  { id: 'art', label: 'Art, Design & Architecture', emoji: '🎨' },
  { id: 'autre', label: 'Autre filière / En réflexion', emoji: '✨' },
] as const

// Trimesters
export const TRIMESTERS = [
  { value: 1, label: 'Trimestre 1' },
  { value: 2, label: 'Trimestre 2' },
  { value: 3, label: 'Trimestre 3' },
] as const

// Message types
export const MESSAGE_TYPES = [
  { value: 'absence', label: "Demande d'absence", emoji: '📝' },
  { value: 'retard', label: 'Justification de retard', emoji: '⏰' },
  { value: 'question', label: 'Question sur un cours', emoji: '❓' },
  { value: 'rdv', label: 'Demande de rendez-vous', emoji: '📅' },
  { value: 'rattrapage', label: 'Rattrapage de note', emoji: '📊' },
  { value: 'autre', label: 'Autre demande', emoji: '✉️' },
] as const

// Message report reasons (anti-harassment)
export const REPORT_REASONS = [
  { id: 'harcelement', label: 'Harcèlement ou intimidation' },
  { id: 'propos_inappropries', label: 'Propos insultants ou inappropriés' },
  { id: 'divulgation_donnees', label: 'Divulgation d’informations privées' },
  { id: 'spam', label: 'Spam ou publicité abusive' },
  { id: 'autre', label: 'Autre motif' },
] as const

// Default subject colors
export const SUBJECT_COLORS = [
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#A855F7', // Purple
] as const

// Rate limiting
export const RATE_LIMITS = {
  AI_CALLS_PER_MINUTE: 10,
  AUTH_ATTEMPTS_PER_MINUTE: 5,
  CHAT_MESSAGES_PER_MINUTE: 20,
} as const

// Subscription Pricing Plans (Free, Monthly, Annual)
export const PROMO_DISCOUNT_PERCENT = 15
export const VALID_PROMO_CODES = [
  'INFLUENCEUR15',
  'BAC2026',
  'OPTINOTE15',
  'PASS15',
  'TIKTOK15',
  'MENTION15',
  'REVISION15',
  'PROMO15',
] as const

/**
 * Calcule le prix remisé avec le pourcentage de réduction d'affiliation
 */
export function getDiscountedPrice(price: number, discountPercent: number = PROMO_DISCOUNT_PERCENT): number {
  return Math.round(price * (1 - discountPercent / 100) * 100) / 100
}

/**
 * Formate un nombre en devise euro française (ex: 6.99 -> "6,99 €")
 */
export function formatPrice(price: number): string {
  return price.toFixed(2).replace('.', ',') + ' €'
}

// Les variables d'environnement Stripe (configurées à la main sur Vercel) finissent
// régulièrement avec un espace ou un saut de ligne collé par erreur, ce qui rend
// l'ID invalide aux yeux de Stripe sans que ce soit visible dans le dashboard.
const cleanEnvPriceId = (value: string | undefined) => value?.trim() || undefined

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Version Gratuite (Découverte)',
    description: 'Pour tester les outils essentiels d’OptiNote avant de passer au niveau supérieur.',
    price: 0,
    displayPrice: '0 €',
    billingPeriod: 'gratuit',
    badge: undefined,
    highlighted: false,
    ctaLabel: 'Commencer gratuitement',
    features: [
      '1 fiche de révision offerte (Scan photo & IA)',
      'Simulateur de notes limité à 1 seule note par matière',
      'Calcul automatique des moyennes de base',
      'Accès au tableau de bord avec aperçu des fonctionnalités',
    ],
    limitations: [
      'Planning IA 7j/7 verrouillé (rideau grisé)',
      'Campus Social, Salons Spécialités & Carte verrouillés',
      'Fiches et notes illimitées verrouillées',
    ],
  },
  {
    id: 'monthly',
    name: 'Abonnement Mensuel',
    description: 'Accès 100% complet et illimité à tous les outils, sans aucun engagement.',
    price: 6.99,
    displayPrice: '6,99 €',
    billingPeriod: 'par mois',
    stripePriceId: cleanEnvPriceId(process.env.STRIPE_PRICE_ID) || cleanEnvPriceId(process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY) || 'price_1U6SrGRwM4B48KWbLvdM5LSU',
    badge: undefined,
    highlighted: false,
    ctaLabel: 'Choisir l’offre Mensuelle',
    features: [
      'Accès 100% ILLIMITÉ à toutes les fonctionnalités',
      'Fiches de Révision IA & Scan OCR illimités',
      'Simulateur de notes, coefficients & prédictions illimités',
      'Planning Intelligent IA avec notifications 7j/7',
      'Campus Social, Salons Spécialités & Carte des Ambitions',
      'Sans engagement, résiliable en 1 clic à tout moment',
    ],
  },
  {
    id: 'annual',
    name: 'Abonnement Annuel',
    description: 'La formule recommandée pour toute l’année scolaire avec le tarif le plus avantageux.',
    price: 59.88,
    displayPrice: '4,99 €',
    billingPeriod: 'par mois',
    annualBillingTotal: 'Soit 59,88 € facturés pour 1 an (2 mois offerts)',
    equivalentMonthlyPrice: '4,99 € / mois',
    savingsBadge: 'Économise ~29% (2 mois offerts)',
    stripePriceId: cleanEnvPriceId(process.env.STRIPE_PRICE_ID_ANNUAL) || cleanEnvPriceId(process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL) || 'price_1U7H5KRwM4B48KWbDoLCFGzq',
    badge: 'MEILLEURE OFFRE 🔥',
    highlighted: true,
    ctaLabel: 'Profiter de l’offre Annuelle (59,88 €)',
    features: [
      'Accès 100% ILLIMITÉ à toutes les fonctionnalités d’OptiNote',
      'Tarif réduit à 4,99 € / mois (au lieu de 6,99 € / mois)',
      'Total de 59,88 € facturés en une seule fois pour 12 mois',
      '2 mois complets offerts par rapport au paiement mensuel',
      'Planning IA, Salons de spécialités & Carte débloqués',
      'Support prioritaire 7j/7 pour les examens et le Bac',
    ],
  },
]

// ═══════════════════════════════════════════════════════
// Accès Beta temporaire (liste d'attente TikTok)
// ═══════════════════════════════════════════════════════
// Code partagé distribué à tous les inscrits sur la liste d'attente : donne
// un accès Pro complet, mais seulement pendant les 48h précédant le
// lancement officiel du 1er septembre 2026, quelle que soit la date à
// laquelle le code a été saisi.
export const BETA_ACCESS_CODE = process.env.NEXT_PUBLIC_BETA_ACCESS_CODE?.trim() || 'RENTREE2026'
export const BETA_ACCESS_WINDOW_START = new Date('2026-08-30T00:00:00+02:00')
export const BETA_ACCESS_WINDOW_END = new Date('2026-09-01T00:00:00+02:00')

export function isBetaAccessWindowActive(): boolean {
  const now = new Date()
  return now >= BETA_ACCESS_WINDOW_START && now < BETA_ACCESS_WINDOW_END
}

export function hasBetaAccess(
  profile: { beta_access_redeemed_at?: string | null } | null | undefined
): boolean {
  return Boolean(profile?.beta_access_redeemed_at) && isBetaAccessWindowActive()
}

