import Link from 'next/link'
import { Sparkles, ArrowLeft, FileCheck } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'

export default function TermsPage() {
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold mb-3">
              <FileCheck className="h-3.5 w-3.5" />
              Conditions d&apos;Utilisation
            </div>
            <h1 className="text-3xl font-bold text-text-primary">
              Conditions Générales d&apos;Utilisation (CGU)
            </h1>
            <p className="text-sm text-text-tertiary mt-2">
              Règles régissant l&apos;accès et l&apos;utilisation de la plateforme OptiNote.
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-text-primary">
              1. Objet du Service
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              OptiNote fournit une suite logicielle d&apos;assistance pédagogique et d&apos;organisation pour les élèves de l&apos;enseignement secondaire : planning assisté par IA, simulateur de moyenne, générateur de fiches de révision et assistant de rédaction de messages pour le corps enseignant.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-text-primary">
              2. Responsabilité & Éthique Scolaire
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              OptiNote est un outil d&apos;accompagnement à la réussite et d&apos;optimisation du temps de travail. Il ne se substitue pas au travail personnel de l&apos;élève ni aux directives de l&apos;Éducation Nationale. Les messages générés doivent être relus et validés par l&apos;élève avant tout envoi à un enseignant.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-text-primary">
              3. Accès Gratuit & Abonnement Payant
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              OptiNote propose une version d&apos;essai gratuite aux fonctionnalités limitées, ainsi qu&apos;un abonnement payant <strong>OptiNote Pro</strong> donnant accès à l&apos;intégralité des fonctionnalités, au tarif de <strong>6,99&nbsp;€/mois</strong> (sans engagement) ou <strong>59,88&nbsp;€/an</strong> (facturé en une fois). Les tarifs à jour sont toujours affichés sur la page{' '}
              <Link href="/pricing" className="text-primary-600 hover:underline font-semibold">optinote.fr/pricing</Link>.
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">
              Les paiements sont traités par notre prestataire <strong>Stripe</strong>, certifié PCI-DSS niveau 1 ; OptiNote ne stocke ni ne manipule directement aucune donnée bancaire. L&apos;abonnement mensuel est résiliable à tout moment depuis l&apos;espace Paramètres, sans frais ni justification, et reste actif jusqu&apos;à la fin de la période déjà payée.
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">
              <strong>Droit de rétractation :</strong> conformément à l&apos;article L221-18 du Code de la consommation, tu disposes d&apos;un délai de 14 jours pour exercer ton droit de rétractation sur un abonnement payant. En souscrivant, tu demandes expressément l&apos;accès immédiat au service ; si tu utilises activement les fonctionnalités Pro pendant ce délai, tu reconnais renoncer à ce droit pour la période déjà consommée, conformément à l&apos;article L221-28 du même code.
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">
              <strong>Utilisateurs mineurs :</strong> OptiNote s&apos;adresse principalement à des lycéens mineurs. La souscription à une offre payante suppose la capacité juridique de contracter ou, à défaut, l&apos;autorisation et la validation du paiement par un représentant légal (parent ou tuteur). En procédant au paiement, tu certifies disposer de cette autorisation.
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">
              Un usage abusif ou automatisé (spams, attaques par déni de service) pourra entraîner la suspension immédiate du compte via notre système de limitation de requêtes (Rate Limiting).
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
