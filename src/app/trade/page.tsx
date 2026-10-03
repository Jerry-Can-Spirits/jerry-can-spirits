import type { Metadata } from 'next'
import TradeEnquiryForm from '@/components/TradeEnquiryForm'
import ScrollRow from '@/components/ScrollRow'
import SectionHeading from '@/components/SectionHeading'
import StructuredData from '@/components/StructuredData'
import { baseOpenGraph } from '@/lib/og'
import { getProduct } from '@/lib/shopify'
import { formatPrice } from '@/lib/format-price'

// Standard trade terms, stated on the page so a bar manager can answer "what
// does a case cost" in the first screen (Audit A finding 3, Audit B finding 8,
// 3 Oct 2026). The price is the shop price less ten per cent, read live, so
// it cannot drift from the bottle; volume pricing is by quote.
const TRADE_DISCOUNT = 0.1
const BOTTLES_PER_CASE = 6
const VAT = 1.2

export const metadata: Metadata = {
  title: 'Stock Expedition Spiced Rum | Trade',
  description: 'Trade pricing, serve economics and partnership information for bars, restaurants and hotels. Enquire to stock Expedition Spiced Rum.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/trade/',
  },
  openGraph: {
    ...baseOpenGraph,
    title: 'Stock Expedition Spiced Rum | Trade Enquiries | Jerry Can Spirits®',
    description: 'Trade pricing, serve economics and partnership information for bars, restaurants and hotels. Enquire to stock Expedition Spiced Rum.',
    url: 'https://jerrycanspirits.co.uk/trade/',
  },
}

const tradeSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Trade enquiries, Jerry Can Spirits',
  description: 'Trade pricing and partnership information for bars, restaurants and hotels stocking Expedition Spiced Rum.',
  url: 'https://jerrycanspirits.co.uk/trade/',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://jerrycanspirits.co.uk/' },
      { '@type': 'ListItem', position: 2, name: 'Trade', item: 'https://jerrycanspirits.co.uk/trade/' },
    ],
  },
}

export default async function TradePage() {
  const bottle = await getProduct('jerry-can-spirits-expedition-spiced-rum')
  const shopPence = bottle ? Math.round(parseFloat(bottle.priceRange.minVariantPrice.amount) * 100) : null
  const currency = bottle?.priceRange.minVariantPrice.currencyCode ?? 'GBP'
  const tradeBottleP = shopPence !== null ? Math.round(shopPence * (1 - TRADE_DISCOUNT)) : null
  const terms =
    tradeBottleP !== null
      ? {
          bottle: formatPrice(tradeBottleP / 100, currency),
          bottleExVat: formatPrice(Math.round(tradeBottleP / VAT) / 100, currency),
          caseOf: formatPrice((tradeBottleP * BOTTLES_PER_CASE) / 100, currency),
        }
      : null

  return (
    <main>
      <StructuredData data={tradeSchema} id="trade-page-schema" />

      {/* ── Section 1: Hero, with the numbers a bar manager asks for first ── */}
      <section className="band-dark pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            as="h1"
            eyebrow="Trade"
            intro="Expedition Spiced Rum is a British craft rum built on real ingredients and no shortcuts. This page is for bars, restaurants, and hotels who want to know what stocking it looks like in practice."
          >
            For Venues That Hold Themselves to a Higher Standard
          </SectionHeading>

          {terms && (
            <div className="max-w-2xl mx-auto mt-8">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'Trade price', value: terms.bottle, note: `a bottle, VAT included (${terms.bottleExVat} ex VAT)` },
                  { label: 'By the case', value: terms.caseOf, note: `for ${BOTTLES_PER_CASE} bottles, VAT included` },
                  { label: 'Dispatch', value: '3 to 5 days', note: 'working days from payment, carriage at cost' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-jerry-green-800/40 border border-gold-500/30 rounded-xl p-5">
                    <p className="text-parchment-500 text-xs uppercase tracking-widest mb-2">{stat.label}</p>
                    <p className="text-white text-2xl font-serif font-bold mb-1">{stat.value}</p>
                    <p className="text-parchment-400 text-xs">{stat.note}</p>
                  </div>
                ))}
              </div>
              <p className="text-parchment-400 text-sm mt-4 text-center">
                Ten per cent under the shop price, pro forma on a first order. Volume pricing by quote.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Section 2: The conversation, before the case for it. A bar manager
          who already wants to talk should not scroll four screens to the form
          (Audit B, 3 Oct 2026). ── */}
      <section className="band-light py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading intro="Fill in the form and we will come back to you within two working days. No pressure, no sales call. Just a straightforward conversation about whether this is a good fit.">
            Start the conversation
          </SectionHeading>
          <div className="max-w-2xl mx-auto">
            <TradeEnquiryForm />
          </div>
        </div>
      </section>

      {/* ── Section 3: Why It Works Behind the Bar ── */}
      <section className="band-dark py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading>
            Why it works behind the bar
          </SectionHeading>
          <ScrollRow
            ariaLabel="Why it works behind the bar"
            cols="md:grid-cols-3"
            items={[
              <div key="story" className="h-full">
                <h3 className="text-gold-400 text-sm font-semibold uppercase tracking-widest mb-3">
                  A story worth telling
                </h3>
                <p className="text-parchment-300 text-sm leading-relaxed">
                  Veteran-founded. British. No artificial flavourings, no shortcuts, no hidden investors. Customers ask questions about what they are drinking. This is a conversation your staff can have.
                </p>
              </div>,
              <div key="mixing" className="h-full">
                <h3 className="text-gold-400 text-sm font-semibold uppercase tracking-widest mb-3">
                  Built for mixing and sipping
                </h3>
                <p className="text-parchment-300 text-sm leading-relaxed">
                  Vanilla, cinnamon, allspice, orange peel, ginger, cassia, agave, bourbon oak. Complex enough to stand alone. Structured enough to anchor a cocktail menu. 40% ABV. IWSC 2026: Bronze for the rum, Silver for the serve with Franklin and Sons cola. Judged, not claimed.
                </p>
              </div>,
              <div key="charities" className="h-full">
                <h3 className="text-gold-400 text-sm font-semibold uppercase tracking-widest mb-3">
                  5% to military charities
                </h3>
                <p className="text-parchment-300 text-sm leading-relaxed">
                  Every bottle sold contributes to veterans&apos; causes. Something your customers can feel good about ordering, and something worth putting on a menu card.
                </p>
              </div>,
            ]}
          />
        </div>
      </section>

      {/* ── Section 4: What You're Working With ── */}
      <section className="band-light py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading intro="Here is the honest maths. Not a sales case. Just the numbers.">
            What you are working with
          </SectionHeading>
          <ScrollRow
            ariaLabel="The serve numbers"
            cols="md:grid-cols-2 lg:grid-cols-4"
            items={[
              { label: 'Bottle size', value: '700ml', note: '40% ABV' },
              { label: 'Serves per bottle', value: '~28', note: 'at 25ml standard measure' },
              { label: 'Serves per case', value: '~168', note: '6 bottles per case' },
              { label: 'Spirit revenue per case', value: '£840–£1,344', note: 'at £5–£8 per 25ml serve' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="h-full bg-jerry-green-800/20 border border-gold-500/20 rounded-xl p-6"
              >
                <p className="text-parchment-500 text-xs uppercase tracking-widest mb-2">{stat.label}</p>
                <p className="text-white text-2xl font-serif font-bold mb-1">{stat.value}</p>
                <p className="text-parchment-500 text-xs">{stat.note}</p>
              </div>
            ))}
          />
          <p className="text-parchment-500 text-xs mt-8 max-w-2xl mx-auto">
            Spirit revenue only, based on a straight 25ml serve at realistic UK bar pricing. Many venues build Expedition Spiced Rum into cocktails, which typically command higher serve prices. We have not factored in recipe costs for mixers, juice, or garnish, as those are yours to manage.
          </p>
        </div>
      </section>

      {/* ── Section 5: What Works Well for Both Sides ── */}
      <section className="band-dark py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading>
            What works well for both sides
          </SectionHeading>
          <div className="max-w-2xl mx-auto">
            <p className="text-parchment-300 text-sm leading-relaxed mb-4">
              We do not send bottles out to sit on a back shelf. When it works, it works because both sides are invested in it.
            </p>
            <p className="text-parchment-300 text-sm leading-relaxed mb-4">
              What we have found helps: listing Expedition Spiced Rum by name on your menu, building one serve around it, and letting us know honestly how it lands. We are not looking for a checklist. We are looking for venues that back what they stock.
            </p>
            <p className="text-parchment-300 text-sm leading-relaxed">
              We are happy to help with serve suggestions, menu wording, or a visit from the founders if you are local. The people who built this are reachable. That is not something you get from a distributor.
            </p>
          </div>

          {/* ── Pour IQ: one-line mention only (separate company). ── */}
          <p className="text-parchment-400 text-sm leading-relaxed mt-12 max-w-2xl mx-auto">
            Pour IQ, menu and cost engineering for independent venues, is built by our founders:{' '}
            <a
              href="https://pour-iq.co.uk"
              className="text-gold-300 hover:text-gold-400 transition-colors border-b border-gold-500/30 hover:border-gold-400"
            >
              pour-iq.co.uk
            </a>
          </p>
        </div>
      </section>

      {/* ── Trade paths: Apply (new) and Order (existing) ── */}
      <section className="band-light py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-jerry-green-800/40 border border-gold-500/30 rounded-xl p-8">
              <h2 className="text-xl font-serif font-bold text-white mb-2">
                Stock Expedition Spiced Rum
              </h2>
              <p className="text-parchment-400 text-sm mb-6">
                Apply for a trade account. We review and respond within three working days.
              </p>
              <a
                href="/trade/apply/"
                className="inline-flex items-center px-6 py-3 bg-gold-500 text-jerry-green-900 font-bold rounded-lg hover:bg-gold-400 transition-colors text-sm"
              >
                Apply for a trade account
              </a>
            </div>
            <div className="bg-jerry-green-800/20 border border-gold-500/20 rounded-xl p-8">
              <h2 className="text-xl font-serif font-bold text-white mb-2">
                Already a trade customer?
              </h2>
              <p className="text-parchment-400 text-sm mb-6">
                Sign in to access the order portal and any additional services on your account.
              </p>
              <a
                href="/trade/login/"
                className="inline-flex items-center px-6 py-3 bg-gold-500 text-jerry-green-900 font-bold rounded-lg hover:bg-gold-400 transition-colors text-sm"
              >
                Sign in
              </a>
            </div>
          </div>
        </div>
      </section>

    </main>
  )
}
