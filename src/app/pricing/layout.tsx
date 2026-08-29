import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tarifs',
  description: 'Découvre les offres OptiNote Pro et choisis le forfait adapté à tes révisions.',
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
