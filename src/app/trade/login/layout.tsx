import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trade Portal Sign In | Jerry Can Spirits',
  description: 'Sign in to the Jerry Can Spirits trade portal. Pour IQ, stockist tools, and trade resources for licensed venues and bartenders.',
  robots: { index: false, follow: false },
}

export default function TradeLoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
