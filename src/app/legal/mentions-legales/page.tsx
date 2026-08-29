import Link from 'next/link'
import { Sparkles, ArrowLeft, ShieldCheck } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
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

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-surface rounded-2xl border border-border p-6 sm:p-10 shadow-sm space-y-8">
          <div className="border-b border-border pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold mb-3">
              <ShieldCheck className="h-3.5 w-3.5" />
              Informations Légales Obligatoires
            </div>
            <h1 className="text-3xl font-bold text-text-primary">
              Mentions Légales
            </h1>
            <p className="text-sm text-text-tertiary mt-2">
              Dernière mise à jour : 18 août 2026 — En conformité avec la loi n°2004-575 pour la confiance dans l&apos;économie numérique (LCEN).
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-text-primary">
              1. Éditeur de l&apos;Application
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              Le service <strong>OptiNote</strong> est édité et développé par l&apos;équipe OptiNote France.
            </p>
            <div className="p-4 bg-surface-secondary rounded-xl text-sm text-text-secondary space-y-1">
              <p><strong>Dénomination :</strong> OptiNote SAS</p>
              <p><strong>Siège social :</strong> Paris, France</p>
              <p><strong>Contact :</strong> <a href="mailto:contact@optinote.fr" className="text-primary-600 hover:underline">contact@optinote.fr</a></p>
              <p><strong>Directeur de la publication :</strong> Direction OptiNote</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-text-primary">
              2. Hébergement de l&apos;Application
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              L&apos;infrastructure web et les bases de données sont hébergées par des prestataires de rang mondial garantissant une sécurité et une disponibilité maximales :
            </p>
            <ul className="list-disc list-inside text-sm text-text-secondary space-y-1.5 pl-2">
              <li><strong>Hébergement Frontend & Serveur :</strong> Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723.</li>
              <li><strong>Base de Données & Authentification :</strong> Supabase Inc., 970 Toa Payoh North #07-04, Singapore (Région Europe / Frankfurt - Chiffrement AES-256 au repos).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-text-primary">
              3. Propriété Intellectuelle
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              L&apos;ensemble des éléments composant le site et l&apos;application OptiNote (textes, graphismes, logiciels, photographies, images, logos, marques) sont la propriété exclusive d&apos;OptiNote ou de ses partenaires. Toute reproduction, représentation, modification ou diffusion sans autorisation préalable est strictement interdite.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-text-primary">
              4. Protection des Mineurs & Données Scolaires
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed">
              OptiNote est spécialement conçu pour les élèves de l&apos;enseignement secondaire. Aucune donnée relative aux mineurs n&apos;est vendue, louée ou cédée à des tiers. Les fiches de cours, notes et emplois du temps restent la propriété exclusive et strictement confidentielle de l&apos;élève grâce au cloisonnement RLS (Row Level Security).
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
