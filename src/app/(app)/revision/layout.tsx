import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Fiches de révision',
  description: 'Consulte, organise et génère tes fiches de révision par matière avec OptiNote.',
}

export default function RevisionLayout({ children }: { children: React.ReactNode }) {
  return children
}
