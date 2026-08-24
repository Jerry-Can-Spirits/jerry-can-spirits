import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trade Portal Sign In | Jerry Can Spirits',
  description:
    'Sign in to the Jerry Can Spirits trade portal with your venue PIN. Trade pricing, the order form, cocktail cards and bartender resources for licensed venues.',
  robots: { index: false, follow: false },
}

export default function TradeLoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
