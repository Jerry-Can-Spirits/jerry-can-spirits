import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumbs from '@/components/Breadcrumbs'
import SectionHeading from '@/components/SectionHeading'
import FAQAccordion, { type FAQAccordionItem } from '@/components/FAQAccordion'
import { baseOpenGraph, OG_IMAGE } from '@/lib/og'
import { safeJsonLd } from '@/lib/jsonLd'
import { formatPrice } from '@/lib/format-price'
import { CORPORATE_TIERS } from '@/lib/pricing'

// Corporate and regimental orders (competitor matrix gap 3, Dan 8 Oct 2026).
// Twelve bottles or more at a per-bottle price, one delivery address, paid by
// invoice: Dan answers the enquiry with a Shopify draft order at the tier
// price. Prices live in lib/pricing.ts, never in the copy. Engraving is
// deliberately absent until the engraver process is simpler.

const URL = 'https://jerrycanspirits.co.uk/corporate-gifts/'
const TITLE = 'Corporate and Regimental Gifts'
const DESCRIPTION =
  'Expedition Spiced Rum for a team, a mess or a dining-out. Twelve bottles or more at a better price per bottle, on one delivery and one invoice.'
const SIX_PACK_URL = '/shop/product/jerry-can-spirits-expedition-pack-spiced-rum-6-bottles/'
const ENQUIRY_URL = '/contact/enquiries/?subject=corporate'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    ...baseOpenGraph,
    title: `${TITLE} | Jerry Can Spirits®`,
    description: DESCRIPTION,
    url: URL,
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: `${TITLE} | Jerry Can Spirits®`,
    description: DESCRIPTION,
    images: OG_IMAGE,
  },
}

function tierLabel(minBottles: number, maxBottles: number | null): string {
  return maxBottles === null ? `${minBottles} or more` : `${minBottles} to ${maxBottles} bottles`
}

const FAQS: { question: string; text: string; answer: FAQAccordionItem['answer'] }[] = [
  {
    question: 'Is there a minimum order?',
    text: 'Twelve bottles. For fewer, the six-bottle pack is on the shop.',
    answer: (
      <>
        Twelve bottles. For fewer, the{' '}
        <Link href={SIX_PACK_URL} className="text-gold-300 hover:text-gold-400 underline">
          six-bottle pack
        </Link>{' '}
        is on the shop.
      </>
    ),
  },
  {
    question: 'Can bottles go to different addresses?',
    text: 'Not yet. Corporate orders go to one address, for you to hand out.',
    answer: 'Not yet. Corporate orders go to one address, for you to hand out.',
  },
  {
    question: 'How quickly can you deliver?',
    text: 'We confirm the date with your invoice.',
    answer: 'We confirm the date with your invoice.',
  },
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.text },
  })),
}

const cardClass =
  'bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20'

export default function CorporateGiftsPage() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(faqSchema) }} />

      <section className="band-dark pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs items={[{ label: 'Gifts', href: '/shop/rum-gifts/' }, { label: TITLE }]} className="mb-8" />
          <SectionHeading
            as="h1"
            eyebrow="Gifting"
            intro="Bottles for a team, a mess or a dining-out. Twelve or more, at a better price per bottle, on one delivery and one invoice."
          >
            {TITLE}
          </SectionHeading>
        </div>
      </section>

      <section className="band-light py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="How it works">One order, one invoice, one delivery.</SectionHeading>
          <ol className="grid gap-4 sm:grid-cols-3">
            {[
              'Tell us how many bottles, where they are going, and when you need them.',
              'We send an invoice. Pay by bank transfer or card.',
              'Everything arrives together, at one address. Every delivery is age-verified at the door.',
            ].map((step, i) => (
              <li key={step} className={cardClass}>
                <span className="block text-3xl font-serif font-bold text-gold-400 mb-2">{i + 1}</span>
                <span className="text-parchment-200 leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="band-dark py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="The price">A better price from twelve bottles.</SectionHeading>
          <div className={`${cardClass} max-w-xl mx-auto text-center`}>
            <ul className="space-y-3 mb-6">
              {CORPORATE_TIERS.map((t) => (
                <li key={t.minBottles} className="text-lg text-white">
                  {tierLabel(t.minBottles, t.maxBottles)}:{' '}
                  <span className="font-serif font-bold text-gold-400">{formatPrice(t.priceGbp)}</span> a bottle.
                </li>
              ))}
            </ul>
            <p className="text-parchment-300 text-sm mb-8">
              Delivery is free. Prices include VAT. Add a presentation box to any bottle.
            </p>
            <Link
              href={ENQUIRY_URL}
              className="inline-flex items-center justify-center min-h-11 px-8 py-3 bg-gold-500 text-jerry-green-900 font-bold rounded-lg hover:bg-gold-400 transition-colors"
            >
              Ask for a quote
            </Link>
          </div>
        </div>
      </section>

      <section className="band-light py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="For units and messes">For the mess as much as the office.</SectionHeading>
          <p className="max-w-2xl mx-auto text-center text-parchment-200 leading-relaxed">
            Dining-in nights, leaving gifts, the prize table at the unit charity night. Jerry Can Spirits was
            founded by two Royal Corps of Signals veterans, and 5% of profits goes to forces charities, whatever
            the size of the order.
          </p>
        </div>
      </section>

      <section className="band-dark py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Questions">Before you ask.</SectionHeading>
          <FAQAccordion items={FAQS.map(({ question, answer }) => ({ question, answer }))} />
        </div>
      </section>
    </main>
  )
}
