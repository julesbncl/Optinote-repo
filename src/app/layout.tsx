import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'OptiNote — Optimise ta vie scolaire',
    template: '%s | OptiNote',
  },
  description:
    "L'application tout-en-un pour les lycéens : planning IA, fiches de révision, simulateur de notes et messages pro pour tes professeurs.",
  keywords: [
    'lycée',
    'révision',
    'baccalauréat',
    'notes',
    'planning',
    'IA',
    'fiches de révision',
    'lycéens',
  ],
  authors: [{ name: 'OptiNote' }],
  openGraph: {
    title: 'OptiNote — Optimise ta vie scolaire',
    description:
      "L'application tout-en-un pour les lycéens : planning IA, fiches de révision, simulateur de notes et messages pro.",
    type: 'website',
    locale: 'fr_FR',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="min-h-screen">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#FFFFFF',
              color: '#0F172A',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              fontSize: '14px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            },
            success: {
              iconTheme: {
                primary: '#22C55E',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
      </body>
    </html>
  )
}
