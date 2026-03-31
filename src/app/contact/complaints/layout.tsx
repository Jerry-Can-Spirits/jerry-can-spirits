import type { Metadata } from 'next'
import { baseOpenGraph } from '@/lib/og'

export const metadata: Metadata = {
  title: 'Complaints & Issue Resolution',
  description: 'Submit a complaint or report an issue with your Jerry Can Spirits order. We take every concern seriously and resolve it quickly.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/contact/complaints/',
  },
  openGraph: {
    ...baseOpenGraph,
    title: 'Complaints & Issue Resolution | Jerry Can Spirits®',
    description: 'Submit a complaint or report an issue with your Jerry Can Spirits order. We take every concern seriously and resolve it quickly.',
    url: 'https://jerrycanspirits.co.uk/contact/complaints/',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function ComplaintsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
