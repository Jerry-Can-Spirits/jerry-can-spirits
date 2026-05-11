import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trade Portal | Jerry Can Spirits',
  robots: { index: false, follow: false },
}

export default function TradeLandingLayout({ children }: { children: React.ReactNode }) {
  return children
}
