import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Réinitialiser le mot de passe',
  description: 'Choisis un nouveau mot de passe pour sécuriser ton compte OptiNote.',
}

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
