import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Connexion',
  description:
    'Connecte-toi à ton compte OptiNote pour retrouver ton planning, tes fiches de révision et tes notes.',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
