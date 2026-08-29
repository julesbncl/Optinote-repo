import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vérifie ta boîte mail',
  description: 'Confirme ton adresse e-mail pour activer ton compte OptiNote.',
}

export default function WaitingForEmailLayout({ children }: { children: React.ReactNode }) {
  return children
}
