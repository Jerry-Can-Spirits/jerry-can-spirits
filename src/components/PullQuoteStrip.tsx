import Image from 'next/image'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getRating } from '@/lib/ratings-cache'
import { TRUSTPILOT_LOGO as TRUSTPILOT_LOGOS } from '@/lib/trustpilot-assets'

// The official green-star lockup for dark grounds, from the shared assets
// module so every surface renders the same mark.
const TRUSTPILOT_LOGO = TRUSTPILOT_LOGOS.onDark

interface PullQuote {
  text: string
  attribution: string
}

// Verbatim from Trustpilot, chosen one per theme the reviews actually praise:
// quality, the bottle, service, and repeat purchase (behaviour, not opinion).
// Attribution is honest to the source: reviews from purchase invitations carry
// Trustpilot's own "verified" status; organic reviews do not, so they are
// captioned as customer reviews rather than borrowing the label.
const QUOTES: PullQuote[] = [
  {
    text: "A cut above. Don't discuss top end rum without mentioning Expedition Spiced.",
    attribution: 'Customer review · Trustpilot',
  },
  {
    text: 'A wonderfully designed bottle, with quality rum.',
    attribution: 'Verified customer · Trustpilot',
  },
  {
    text: 'Great product and excellent communication when I had a question about delivery.',
    attribution: 'Verified customer · Trustpilot',
  },
  {
    text: 'Really smooth with a great taste. Bought another two bottles immediately.',
    attribution: 'Verified customer · Trustpilot',
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
      aria-label="Customer reviews"
      className="border-t border-b border-gold-500/20 bg-jerry-green-900/60 py-14 sm:py-16"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 sm:gap-12">
          {QUOTES.map((quote, index) => (
            <figure key={index} className="relative">
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
                <span aria-hidden="true" className="text-gold-400 mr-2 tracking-widest">
                  ★★★★★
                </span>
                {quote.attribution}
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            href={TRUSTPILOT_URL}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="inline-flex items-center gap-3 text-sm uppercase tracking-widest text-gold-300/80 hover:text-gold-300 transition-colors"
          >
            Read all{trustpilot ? ` ${trustpilot.count}` : ''} reviews on
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
