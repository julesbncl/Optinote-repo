import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tableau de bord',
  description:
    'Retrouve en un coup d’œil ton planning du jour, tes dernières notes et tes fiches de révision récentes.',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
