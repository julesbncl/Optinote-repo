import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Informations légales et éditeur du site OptiNote.',
}

export default function MentionsLegalesLayout({ children }: { children: React.ReactNode }) {
  return children
}
