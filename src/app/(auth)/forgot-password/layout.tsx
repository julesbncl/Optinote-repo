import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mot de passe oublié',
  description:
    'Réinitialise ton mot de passe OptiNote en quelques clics grâce à un lien envoyé par e-mail.',
}

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children
}
