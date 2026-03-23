import type { Metadata } from 'next'
import TradeEnquiryForm from '@/components/TradeEnquiryForm'
import StructuredData from '@/components/StructuredData'

export const metadata: Metadata = {
  title: 'Stock Expedition Spiced Rum | Trade Enquiries | Jerry Can Spirits',
  description: 'Trade pricing, serve economics and partnership information for bars, restaurants and hotels. Enquire to stock Expedition Spiced Rum.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/trade/',
  },
}

const tradeSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Trade Enquiries — Jerry Can Spirits',
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

export default function TradePage() {
  return (
    <main className="min-h-screen">
      <StructuredData data={tradeSchema} id="trade-page-schema" />

      {/* ── Section 1: Hero ── */}
      <section className="py-24 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-8">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Trade
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-6 leading-tight">
            For Venues That Hold Themselves to a Higher Standard
          </h1>
          <p className="text-xl text-parchment-300 max-w-2xl leading-relaxed">
            Expedition Spiced is a British craft rum built on real ingredients and no shortcuts. This page is for bars, restaurants, and hotels who want to know what stocking it looks like in practice.
          </p>
        </div>
      </section>

      {/* ── Section 2: Why It Works Behind the Bar ── */}
      <section className="py-16 border-t border-gold-500/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-serif font-bold text-white mb-12">
            Why it works behind the bar
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            <div>
              <h3 className="text-gold-400 text-sm font-semibold uppercase tracking-widest mb-3">
                A story worth telling
              </h3>
              <p className="text-parchment-300 text-sm leading-relaxed">
                Veteran-founded. British. No artificial flavourings, no shortcuts, no hidden investors. Customers ask questions about what they are drinking. This is a conversation your staff can have.
              </p>
            </div>
            <div>
              <h3 className="text-gold-400 text-sm font-semibold uppercase tracking-widest mb-3">
                Built for mixing and sipping
              </h3>
              <p className="text-parchment-300 text-sm leading-relaxed">
                Vanilla, cinnamon, allspice, orange peel, ginger, cassia, agave, bourbon oak. Complex enough to stand alone. Structured enough to anchor a cocktail menu. Forty percent ABV.
              </p>
            </div>
            <div>
              <h3 className="text-gold-400 text-sm font-semibold uppercase tracking-widest mb-3">
                5% to military charities
              </h3>
              <p className="text-parchment-300 text-sm leading-relaxed">
                Every bottle sold contributes to veterans&apos; causes. Something your customers can feel good about ordering, and something worth putting on a menu card.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: What You're Working With ── */}
      <section className="py-16 border-t border-gold-500/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-serif font-bold text-white mb-4">
            What you are working with
          </h2>
          <p className="text-parchment-400 text-sm mb-10">
            Here is the honest maths. Not a sales case. Just the numbers.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Bottle size', value: '700ml', note: '40% ABV' },
              { label: 'Serves per bottle', value: '~28', note: 'at 25ml standard measure' },
              { label: 'Serves per case', value: '~168', note: '6 bottles per case' },
              { label: 'Revenue potential', value: '£1,344–£2,016', note: 'at £8–£12 per serve' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-jerry-green-800/20 border border-gold-500/20 rounded-xl p-6"
              >
                <p className="text-parchment-500 text-xs uppercase tracking-widest mb-2">{stat.label}</p>
                <p className="text-white text-2xl font-serif font-bold mb-1">{stat.value}</p>
                <p className="text-parchment-500 text-xs">{stat.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 4: Pricing ── */}
      <section className="py-16 border-t border-gold-500/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-serif font-bold text-white mb-4">
            Pricing
          </h2>
          <p className="text-parchment-400 text-sm mb-10">
            We price to reward relationships, not just transactions. All prices are per case of 6 bottles.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Trade pricing tiers</caption>
              <thead>
                <tr className="border-b border-gold-500/20">
                  <th className="text-left text-parchment-500 text-xs uppercase tracking-widest py-3 pr-6">Tier</th>
                  <th className="text-left text-parchment-500 text-xs uppercase tracking-widest py-3 pr-6">Per bottle (ex VAT)</th>
                  <th className="text-left text-parchment-500 text-xs uppercase tracking-widest py-3 pr-6">Per case (ex VAT)</th>
                  <th className="text-left text-parchment-500 text-xs uppercase tracking-widest py-3 pr-6">Inc VAT</th>
                  <th className="text-left text-parchment-500 text-xs uppercase tracking-widest py-3">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-500/10">
                {[
                  { tier: 'Intro', perBottle: '~£25', perCase: '£150', incVat: '£180', when: 'First order' },
                  { tier: 'Standard', perBottle: '~£29', perCase: '£175', incVat: '£210', when: 'Ongoing orders' },
                  { tier: 'Partner', perBottle: '~£25–£27', perCase: '£150–£160', incVat: '£180–£192', when: 'High-volume, earned' },
                ].map((row) => (
                  <tr key={row.tier}>
                    <td className="py-4 pr-6 font-semibold text-white">{row.tier}</td>
                    <td className="py-4 pr-6 text-parchment-300">{row.perBottle}</td>
                    <td className="py-4 pr-6 text-parchment-300">{row.perCase}</td>
                    <td className="py-4 pr-6 text-parchment-400">{row.incVat}</td>
                    <td className="py-4 text-parchment-500 text-xs">{row.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-parchment-500 text-xs mt-6">
            Partner pricing is not applied automatically. It reflects a track record of sell-through and active placement. Delivery terms confirmed on enquiry.
          </p>
        </div>
      </section>

      {/* ── Section 5: What Works Well for Both Sides ── */}
      <section className="py-16 border-t border-gold-500/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-serif font-bold text-white mb-6">
              What works well for both sides
            </h2>
            <p className="text-parchment-300 text-sm leading-relaxed mb-4">
              We do not send bottles out to sit on a back shelf. When it works, it works because both sides are invested in it.
            </p>
            <p className="text-parchment-300 text-sm leading-relaxed mb-4">
              What we have found helps: listing Expedition Spiced by name on your menu, building one serve around it, and letting us know honestly how it lands. We are not looking for a checklist. We are looking for venues that back what they stock.
            </p>
            <p className="text-parchment-300 text-sm leading-relaxed">
              We are happy to help with serve suggestions, menu wording, or a visit from the founders if you are local. The people who built this are reachable. That is not something you get from a distributor.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 6: Enquiry Form ── */}
      <section className="py-16 border-t border-gold-500/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-serif font-bold text-white mb-3">
              Start the conversation
            </h2>
            <p className="text-parchment-400 text-sm mb-10">
              Fill in the form and we will come back to you within two working days. No pressure, no sales call. Just a straightforward conversation about whether this is a good fit.
            </p>
            <TradeEnquiryForm />
          </div>
        </div>
      </section>

    </main>
  )
}
