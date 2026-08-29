import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Espace créateur',
  description: 'Suis tes gains et tes statistiques du programme partenaire créateurs OptiNote.',
  robots: { index: false, follow: false },
}

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return children
}
