import Image from 'next/image'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getRating } from '@/lib/ratings-cache'
import { TRUSTPILOT_LOGO as TRUSTPILOT_LOGOS } from '@/lib/trustpilot-assets'
import { RatingRow } from '@/components/RatingRow'
import ScrollRow from '@/components/ScrollRow'
import SectionHeading from '@/components/SectionHeading'

// The official green-star lockup for dark grounds, from the shared assets
// module so every surface renders the same mark.
const TRUSTPILOT_LOGO = TRUSTPILOT_LOGOS.onDark

interface PullQuote {
  text: string
  attribution: string
  // The score the reviewer actually left. Until 24 Sep 2026 every quote here
  // rendered a fixed five-star row; when Dan's Trustpilot export arrived, two
  // of the four turned out to be four-star reviews. A star row is a claim
  // about what someone gave us, so it is carried per quote and never assumed.
  stars: 4 | 5
}

// Verbatim from Trustpilot, chosen one per theme the reviews actually praise:
// quality, the bottle, service, and repeat purchase (behaviour, not opinion).
// Attribution is honest to the source: reviews from purchase invitations carry
// Trustpilot's own "verified" status; organic reviews do not, so they are
// captioned as customer reviews rather than borrowing the label.
const QUOTES: PullQuote[] = [
  {
    // Was "A cut above. Don't discuss top end rum without mentioning
    // Expedition Spiced." — a sentence the reviewer never wrote, stitched
    // from two halves of one of theirs, with "a cut above" moved off the
    // bottle and label it described and onto the rum. These are their own
    // opening words instead (excerpts may be trimmed, never reworded).
    text: 'Absolutely special flavour. Nothing on the market tastes like this.',
    attribution: 'Customer review · Trustpilot',
    stars: 5,
  },
  {
    text: 'A wonderfully designed bottle, with quality rum.',
    attribution: 'Verified customer · Trustpilot',
    stars: 4,
  },
  {
    text: 'Great product and excellent communication when I had a question about delivery.',
    attribution: 'Verified customer · Trustpilot',
    stars: 4,
  },
  {
    text: 'Really smooth with a great taste. Bought another two bottles immediately.',
    attribution: 'Verified customer · Trustpilot',
    stars: 5,
  },
]

const TRUSTPILOT_URL = 'https://uk.trustpilot.com/review/jerrycanspirits.co.uk'

export default async function PullQuoteStrip() {
  // Live review count cached hourly in KV by the ratings cron; renders
  // without the number until the first fetch lands.
  const { env } = await getCloudflareContext({ async: true })
  const trustpilot = await getRating(env.SITE_OPS as KVNamespace, 'trustpilot')

  return (
    <section
      aria-labelledby="reviews-heading"
      className="border-t border-b border-gold-500/20 band-dark py-14 sm:py-16"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Reviews" id="reviews-heading">
          What people say.
        </SectionHeading>
        <ScrollRow
          ariaLabel="Customer reviews"
          cols="md:grid-cols-2 md:gap-x-12 md:gap-y-10"
          items={QUOTES.map((quote, index) => (
            <figure key={index} className="relative h-full">
              <span
                aria-hidden="true"
                className="block text-5xl text-gold-400/80 leading-none font-serif mb-2"
              >
                &ldquo;
              </span>
              <blockquote className="text-lg sm:text-xl text-parchment-50 font-serif leading-snug mb-4">
                {quote.text}
              </blockquote>
              <figcaption className="text-xs uppercase tracking-widest text-gold-300 font-semibold">
                <span className="mr-2 tracking-widest">
                  <span aria-hidden="true" className="text-gold-400">{'★'.repeat(quote.stars)}</span>
                  <span aria-hidden="true" className="text-gold-500/25">{'★'.repeat(5 - quote.stars)}</span>
                  <span className="sr-only">{quote.stars} out of 5 stars. </span>
                </span>
                {quote.attribution}
              </figcaption>
            </figure>
          ))}
        />
        <div className="mt-10 text-center">
          {/* The TrustScore itself, official star art, for every visitor.
              The score and count live here, so the link below carries
              neither: one fact, stated once. */}
          {trustpilot && (
            <RatingRow rating={trustpilot.rating} count={trustpilot.count} platform="trustpilot" />
          )}
          <Link
            href={TRUSTPILOT_URL}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="inline-flex items-center gap-3 text-sm uppercase tracking-widest text-gold-300/80 hover:text-gold-300 transition-colors"
          >
            Read them all on
            <Image
              src={TRUSTPILOT_LOGO}
              alt="Trustpilot"
              width={180}
              height={44}
              className="h-10 w-auto"
            />
          </Link>
        </div>
      </div>
    </section>
  )
}
