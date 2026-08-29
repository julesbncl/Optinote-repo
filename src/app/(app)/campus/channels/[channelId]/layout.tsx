import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Discussion de salon',
  description: 'Discute en temps réel avec les élèves de ton salon sur OptiNote Campus.',
}

export default function ChannelChatLayout({ children }: { children: React.ReactNode }) {
  return children
}
