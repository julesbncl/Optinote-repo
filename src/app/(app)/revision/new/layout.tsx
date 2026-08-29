import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nouvelle fiche de révision',
  description: 'Crée une nouvelle fiche de révision générée par IA à partir de tes cours.',
}

export default function NewRevisionLayout({ children }: { children: React.ReactNode }) {
  return children
}
