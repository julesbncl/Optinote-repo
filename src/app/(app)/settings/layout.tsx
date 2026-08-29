import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Paramètres',
  description: 'Gère ton profil, ton abonnement et les préférences de ton compte OptiNote.',
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children
}
