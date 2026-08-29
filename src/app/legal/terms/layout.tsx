import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions générales d’utilisation',
  description: 'Consulte les conditions générales d’utilisation (CGU) du service OptiNote.',
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
