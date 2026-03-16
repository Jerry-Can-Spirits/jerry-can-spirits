import type { Metadata } from 'next'
import { OG_IMAGE } from '@/lib/og'

export const metadata: Metadata = {
  title: 'Media Centre',
  description: 'Press assets, product photography, brand guidelines, and media contact for Jerry Can Spirits. Everything a journalist or stockist needs in one place.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/contact/media/',
  },
  openGraph: {
    title: 'Media Centre | Jerry Can Spirits®',
    description: 'Press assets, product photography, brand guidelines, and media contact for Jerry Can Spirits. Everything a journalist or stockist needs in one place.',
    url: 'https://jerrycanspirits.co.uk/contact/media/',
    siteName: 'Jerry Can Spirits®',
    locale: 'en_GB',
    type: 'website',
    images: OG_IMAGE,
  },
}

export default function MediaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
