import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Liste d’attente bêta',
  description: 'Inscris-toi à la liste d’attente pour accéder en avant-première à OptiNote.',
}

export default function BetaLayout({ children }: { children: React.ReactNode }) {
  return children
}
