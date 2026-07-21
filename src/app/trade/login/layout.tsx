import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trade Portal Sign In | Jerry Can Spirits',
  description: 'Sign in to the Jerry Can Spirits trade portal: trade pricing and bar resources for licensed venues.',
  robots: { index: false, follow: false },
}

export default function TradeLoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
