import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fiche de révision',
  description: 'Consulte et modifie le contenu de ta fiche de révision OptiNote.',
}

export default function RevisionDetailLayout({ children }: { children: React.ReactNode }) {
  return children
}
