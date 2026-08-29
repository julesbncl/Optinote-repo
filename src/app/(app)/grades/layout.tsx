import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mes notes',
  description: 'Suis tes notes, calcule ta moyenne pondérée et simule ton évolution scolaire.',
}

export default function GradesLayout({ children }: { children: React.ReactNode }) {
  return children
}
