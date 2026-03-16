import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Complaints',
  description: 'Submit a complaint or report an issue with your Jerry Can Spirits order. We take every concern seriously and resolve it quickly.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/contact/complaints/',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function ComplaintsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
