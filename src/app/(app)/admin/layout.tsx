import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Administration',
  description: 'Espace d’administration OptiNote pour la modération des signalements et retours utilisateurs.',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
