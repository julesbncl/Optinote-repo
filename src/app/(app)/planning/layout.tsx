import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Planning',
  description:
    'Génère et organise ton planning de révisions grâce à l’intelligence artificielle OptiNote.',
}

export default function PlanningLayout({ children }: { children: React.ReactNode }) {
  return children
}
