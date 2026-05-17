import { notFound } from 'next/navigation'
import { requireTradeSession } from '@/lib/trade-portal/session-check'
import { BartenderGuide } from '@/components/trade-portal/BartenderGuide'
import {
  BARTENDER_GUIDES,
  VENUE_SLUGS,
  VENUE_TITLES,
  type VenueSlug,
} from '@/lib/trade-portal/bartender-guides'

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ venue: string }>
}

function isVenueSlug(s: string): s is VenueSlug {
  return (VENUE_SLUGS as string[]).includes(s)
}

export default async function BartenderGuidePage({ params }: Params) {
  await requireTradeSession()
  const { venue } = await params
  if (!isVenueSlug(venue)) notFound()
  const guide = BARTENDER_GUIDES[venue]
  return <BartenderGuide guide={guide} venueTitle={VENUE_TITLES[venue]} />
}
