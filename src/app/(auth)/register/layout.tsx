import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Créer un compte',
  description:
    'Crée gratuitement ton compte OptiNote et commence à organiser ta vie scolaire dès aujourd’hui.',
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
