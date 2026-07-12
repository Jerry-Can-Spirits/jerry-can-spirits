import Image from 'next/image'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getRating } from '@/lib/ratings-cache'

interface PullQuote {
  text: string
  attribution: string
}

const QUOTES: PullQuote[] = [
  {
    text: "A cut above. Don't discuss top end rum without mentioning Expedition Spiced.",
    attribution: 'Verified customer · Trustpilot',
  },
  {
    text: "You can really see the work that's gone behind this beautiful drink.",
    attribution: 'Verified customer · Trustpilot',
  },
]

const TRUSTPILOT_URL = 'https://uk.trustpilot.com/review/jerrycanspirits.co.uk'

// The white-on-transparent Trustpilot lockup already used on /reviews/.
const TRUSTPILOT_LOGO =
  'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/004c8ba7-42d4-48c8-c82c-fe715eb9cc00/public'

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
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gold-300/80 hover:text-gold-300 transition-colors"
          >
            Read all{trustpilot ? ` ${trustpilot.count}` : ''} reviews on
            <Image
              src={TRUSTPILOT_LOGO}
              alt="Trustpilot"
              width={90}
              height={22}
              className="h-5 w-auto"
            />
          </Link>
        </div>
      </div>
    </section>
  )
}
