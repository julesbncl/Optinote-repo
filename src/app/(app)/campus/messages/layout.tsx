import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Messages privés',
  description: 'Échange en messages privés avec tes amis sur OptiNote Campus.',
}

export default function CampusMessagesLayout({ children }: { children: React.ReactNode }) {
  return children
}
