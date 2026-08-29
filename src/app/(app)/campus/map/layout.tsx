import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Carte des lycées',
  description: 'Explore la carte des lycées OptiNote et retrouve les élèves de ton établissement.',
}

export default function CampusMapLayout({ children }: { children: React.ReactNode }) {
  return children
}
