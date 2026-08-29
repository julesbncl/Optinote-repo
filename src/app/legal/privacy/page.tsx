import Link from 'next/link'
import { Sparkles, ArrowLeft, Lock } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-surface-secondary">
      <header className="bg-surface border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-text-primary">{APP_NAME}</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l&apos;accueil
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-surface rounded-2xl border border-border p-6 sm:p-10 shadow-sm space-y-8">
          <div className="border-b border-border pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success-50 text-success-700 text-xs font-semibold mb-3">
              <Lock className="h-3.5 w-3.5" />
              Conformité RGPD & CNIL
            </div>
            <h1 className="text-3xl font-bold text-text-primary">
              Politique de Confidentialité
            </h1>
            <p className="text-sm text-text-tertiary mt-2">
              Protection stricte de la vie privée des lycéens et de leurs données scolaires.
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-text-primary">
              1. Principes Fondamentaux de Confidentialité
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              OptiNote applique le principe du <strong>Privacy by Design</strong>. Vos données scolaires (notes, cours, fiches, emplois du temps) sont privées, chiffrées et inaccessibles aux autres utilisateurs.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-text-primary">
              2. Sécurité au Niveau des Lignes (RLS)
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Toutes les données hébergées sur Supabase PostgreSQL bénéficient de la technologie <strong>Row Level Security (RLS)</strong>. Chaque requête est automatiquement filtrée avec la condition <code className="bg-surface-tertiary px-1.5 py-0.5 rounded text-primary-700">auth.uid() = user_id</code> garantissant une étanchéité absolue entre les comptes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-text-primary">
              3. Utilisation de l&apos;Intelligence Artificielle
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Les requêtes envoyées à nos modèles d&apos;intelligence artificielle (génération de planning, OCR de cours, rédaction de messages) transitent par des canaux chiffrés et <strong>ne sont jamais utilisées pour entraîner des modèles publics</strong>.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-text-primary">
              4. Vos Droits (RGPD)
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d&apos;un droit d&apos;accès, de rectification, de portabilité et de suppression de toutes vos données personnelles. Deux actions en libre-service sont disponibles directement depuis votre espace <strong>Paramètres</strong> :
            </p>
            <ul className="list-disc list-inside text-sm text-text-secondary space-y-1.5 pl-2">
              <li><strong>Exporter mes données</strong> : télécharge l&apos;intégralité de tes données personnelles (profil, notes, fiches, planning, amis, messages) au format JSON.</li>
              <li><strong>Supprimer mon compte</strong> : efface définitivement et immédiatement ton compte et toutes les données associées. Cette action résilie automatiquement tout abonnement Pro actif.</li>
            </ul>
            <p className="text-sm text-text-secondary leading-relaxed">
              Pour toute autre demande relative à tes données (rectification, question, réclamation), écris-nous à <strong><a href="mailto:contact@optinote.fr" className="text-primary-600 hover:underline">contact@optinote.fr</a></strong>.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
