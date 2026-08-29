import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Découvre comment OptiNote collecte, utilise et protège tes données personnelles.',
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children
}
