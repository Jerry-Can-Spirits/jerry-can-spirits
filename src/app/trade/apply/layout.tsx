import type { Metadata } from 'next'
import { baseOpenGraph } from '@/lib/og'

export const metadata: Metadata = {
  title: 'Apply for a Trade Account | Jerry Can Spirits',
  description:
    'Apply to stock Expedition Spiced Rum. For pubs, bars, restaurants, hotels, retailers, and wholesalers. We reply within three working days.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/trade/apply/',
  },
  openGraph: {
    ...baseOpenGraph,
    title: 'Apply for a Trade Account | Jerry Can Spirits®',
    description:
      'Apply to stock Expedition Spiced Rum. Trade account application for pubs, bars, restaurants, hotels, retailers, and wholesalers.',
    url: 'https://jerrycanspirits.co.uk/trade/apply/',
  },
}

export default function TradeApplyLayout({ children }: { children: React.ReactNode }) {
  return children
}
