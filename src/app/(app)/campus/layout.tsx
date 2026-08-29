import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Campus',
  description:
    'Retrouve tes amis, situe ton lycée sur la carte et échange avec la communauté OptiNote.',
}

export default function CampusLayout({ children }: { children: React.ReactNode }) {
  return children
}
