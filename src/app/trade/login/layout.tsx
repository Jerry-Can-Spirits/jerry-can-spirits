import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trade Portal Sign In | Jerry Can Spirits',
  robots: { index: false, follow: false },
}

export default function TradeLoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
