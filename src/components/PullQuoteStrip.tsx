import Link from 'next/link'

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

export default function PullQuoteStrip() {
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
                <span aria-hidden="true" className="text-gold-400 mr-2 tracking-[0.1em]">
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
            rel="noopener noreferrer"
            className="text-xs uppercase tracking-widest text-gold-300/80 hover:text-gold-300 transition-colors"
          >
            Read all reviews on Trustpilot →
          </Link>
        </div>
      </div>
    </section>
  )
}
