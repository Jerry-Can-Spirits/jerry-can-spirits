import type { Metadata } from 'next'
import StructuredData from '@/components/StructuredData'
import { ORG_REF } from '@/lib/jsonLd'
import { baseOpenGraph, OG_IMAGE } from '@/lib/og'
import { client } from '@/sanity/lib/client'

export const revalidate = 3600

interface EventDoc {
  _id: string
  title: string
  kind: string
  startDate: string
  endDate?: string
  venueName: string
  town: string
  postcode?: string
  summary: string
  eventUrl?: string
  ticketed?: boolean
  ticketUrl?: string
  priceNote?: string
}

const FIELDS = '_id, title, kind, startDate, endDate, venueName, town, postcode, summary, eventUrl, ticketed, ticketUrl, priceNote'
const EVENTS_QUERY = `{
  "upcoming": *[_type == "event" && coalesce(endDate, startDate) >= now()] | order(startDate asc) { ${FIELDS} },
  "past": *[_type == "event" && coalesce(endDate, startDate) < now()] | order(startDate desc) [0...6] { ${FIELDS} }
}`

const KIND_LABELS: Record<string, string> = {
  market: 'Market',
  fair: 'Fair',
  festival: 'Festival',
  tasting: 'Tasting evening',
  other: 'Event',
}

const DESCRIPTION = 'Where to find Jerry Can Spirits in person: markets, fairs, festivals and tasting evenings.'

async function getEvents() {
  return client
    .fetch<{ upcoming: EventDoc[]; past: EventDoc[] }>(EVENTS_QUERY)
    .catch(() => ({ upcoming: [] as EventDoc[], past: [] as EventDoc[] }))
}

export async function generateMetadata(): Promise<Metadata> {
  const { upcoming } = await getEvents()
  return {
    title: 'Events',
    description: DESCRIPTION,
    alternates: { canonical: 'https://jerrycanspirits.co.uk/events/' },
    // An empty listing is a thin page: keep it out of the index until there is something on it.
    robots: upcoming.length === 0 ? { index: false, follow: true } : undefined,
    openGraph: {
      ...baseOpenGraph,
      title: 'Events | Jerry Can Spirits®',
      description: DESCRIPTION,
      url: 'https://jerrycanspirits.co.uk/events/',
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: 'Events | Jerry Can Spirits®',
      description: DESCRIPTION,
      images: OG_IMAGE,
    },
  }
}

const london = { timeZone: 'Europe/London' } as const

function formatWhen(start: string, end?: string): string {
  const s = new Date(start)
  const day = (d: Date) => d.toLocaleDateString('en-GB', { ...london, weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
  const time = (d: Date) => d.toLocaleTimeString('en-GB', { ...london, hour: '2-digit', minute: '2-digit' })
  if (!end) return `${day(s)}, ${time(s)}`
  const e = new Date(end)
  return day(s) === day(e) ? `${day(s)}, ${time(s)} to ${time(e)}` : `${day(s)} to ${day(e)}`
}

function mapUrl(ev: EventDoc): string {
  const q = [ev.venueName, ev.town, ev.postcode].filter(Boolean).join(', ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

// Event markup only for ticketed events, which are ours to describe. A market
// we have a stall at is the organiser's event, not ours.
function eventSchema(ev: EventDoc) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: ev.title,
    description: ev.summary,
    startDate: ev.startDate,
    ...(ev.endDate ? { endDate: ev.endDate } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: ev.venueName,
      address: {
        '@type': 'PostalAddress',
        addressLocality: ev.town,
        ...(ev.postcode ? { postalCode: ev.postcode } : {}),
        addressCountry: 'GB',
      },
    },
    organizer: ORG_REF,
    ...(ev.ticketUrl ? { offers: { '@type': 'Offer', url: ev.ticketUrl, availability: 'https://schema.org/InStock' } } : {}),
  }
}

function EventCard({ ev, past }: { ev: EventDoc; past?: boolean }) {
  return (
    <article className={`rounded-lg border border-gold-500/20 bg-jerry-green-800/40 p-5 ${past ? 'opacity-70' : ''}`}>
      <p className="text-xs uppercase tracking-wide text-gold-400 mb-1">{KIND_LABELS[ev.kind] ?? 'Event'}</p>
      <h3 className="text-lg font-serif font-bold text-white mb-1">{ev.title}</h3>
      <p className="text-parchment-300 text-sm mb-1">{formatWhen(ev.startDate, ev.endDate)}</p>
      <p className="text-parchment-300 text-sm mb-3">
        {ev.venueName}, {ev.town}
        {!past && (
          <>
            {' '}
            <a href={mapUrl(ev)} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
              Map
            </a>
          </>
        )}
      </p>
      <p className="text-parchment-400 text-sm mb-4">{ev.summary}</p>
      {!past && (
        <div className="flex flex-wrap gap-3 text-sm">
          {ev.ticketed && ev.ticketUrl ? (
            <a
              href={ev.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gold-500 text-jerry-green-900 font-semibold rounded-lg hover:bg-gold-400 transition-colors"
            >
              Tickets{ev.priceNote ? `, ${ev.priceNote}` : ''}
            </a>
          ) : (
            <span className="px-4 py-2 border border-gold-500/30 text-parchment-300 rounded-lg">Open entry</span>
          )}
          {ev.eventUrl && (
            <a href={ev.eventUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-parchment-300 underline hover:text-white">
              Event details
            </a>
          )}
        </div>
      )}
    </article>
  )
}

export default async function EventsPage() {
  const { upcoming, past } = await getEvents()
  const ticketed = upcoming.filter(ev => ev.ticketed && ev.ticketUrl)

  return (
    <main className="min-h-screen py-20">
      {ticketed.map(ev => (
        <StructuredData key={ev._id} id={`event-${ev._id}`} data={eventSchema(ev)} />
      ))}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white mb-4">Events</h1>
        <p className="text-parchment-300 mb-10">
          Where to find us in person. Most are open markets and fairs: walk up, taste, talk to us. Tasting evenings need a ticket.
        </p>

        <section aria-labelledby="upcoming-heading" className="mb-14">
          <h2 id="upcoming-heading" className="text-xl font-serif font-bold text-white mb-4">Coming up</h2>
          {upcoming.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {upcoming.map(ev => <EventCard key={ev._id} ev={ev} />)}
            </div>
          ) : (
            <p className="text-parchment-400">
              Nothing booked yet. New dates go up here as they are confirmed.
            </p>
          )}
        </section>

        {past.length > 0 && (
          <section aria-labelledby="past-heading">
            <h2 id="past-heading" className="text-xl font-serif font-bold text-white mb-4">Recently</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {past.map(ev => <EventCard key={ev._id} ev={ev} past />)}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
