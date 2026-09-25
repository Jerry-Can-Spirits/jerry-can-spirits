import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { client } from '@/sanity/lib/client'
import { fieldManualCountsQuery } from '@/sanity/queries'
import Breadcrumbs from '@/components/Breadcrumbs'
import ScrollReveal from '@/components/ScrollReveal'
import SectionHeading from '@/components/SectionHeading'
import ScrollRow from '@/components/ScrollRow'
import FAQAccordion from '@/components/FAQAccordion'
import { baseOpenGraph, OG_IMAGE } from '@/lib/og'
import { safeJsonLd } from '@/lib/jsonLd'

// Round down to nearest 10
function roundDownToTen(n: number): number {
  return Math.floor(n / 10) * 10
}

// One list feeds both the accordion and the FAQPage schema, so the answers a
// reader sees and the answers a crawler reads cannot drift. An answer is a
// run of plain text, links and emphasised words; the schema flattens the runs
// to text. A link may carry the wording the schema uses where its anchor text
// alone would not name the destination.
type AnswerRun = string | { text: string; href?: string; strong?: true; schemaText?: string }

const faqs: { question: string; answer: AnswerRun[] }[] = [
  {
    question: 'Is the Field Manual free?',
    answer: [
      'Yes, completely free. All recipes, equipment guides, and ingredient information are available without signing up or paying anything. We built it to help people make better drinks - selling rum is our business, not selling content.',
    ],
  },
  {
    question: 'Do I need to buy Jerry Can rum to use the recipes?',
    answer: [
      "No. While we'd love you to try ",
      { text: 'our rum', href: '/shop/spirits/' },
      ', every recipe works with any quality spirit in that category. We include notes on what to look for in substitutes when relevant. The Field Manual is useful whether you buy from us or not.',
    ],
  },
  {
    question: 'What equipment do I need to start making cocktails?',
    answer: [
      "At minimum: a jigger (or measuring cup), something to stir with, and glasses. A shaker helps but isn't essential for many drinks. Our ",
      { text: 'equipment section', href: '/field-manual/equipment/' },
      ' has a starter kit guide that covers what to buy first and what can wait.',
    ],
  },
  {
    question: 'How are cocktail difficulty ratings determined?',
    answer: [
      'Based on technique required and ingredient accessibility. ',
      { text: 'Novice', strong: true },
      ' means minimal technique and common ingredients - anyone can make these. ',
      { text: 'Wayfinder', strong: true },
      ' involves shaking, straining, or a specialty ingredient or two. ',
      { text: 'Trailblazer', strong: true },
      ' includes advanced techniques or multiple specialty ingredients.',
    ],
  },
  {
    question: 'Can I suggest a cocktail or ingredient to add?',
    answer: [
      "Yes - we're always expanding the Field Manual. ",
      { text: 'Get in touch', href: '/contact/', schemaText: 'Get in touch through our contact page' },
      ' with suggestions. We prioritise recipes that work well at home with accessible ingredients.',
    ],
  },
]

const answerText = (runs: AnswerRun[]) =>
  runs.map((run) => (typeof run === 'string' ? run : run.schemaText ?? run.text)).join('')

const answerNode = (runs: AnswerRun[]) =>
  runs.map((run, i) => {
    if (typeof run === 'string') return run
    if (run.href) {
      return (
        <Link key={i} href={run.href} className="text-gold-400 hover:text-gold-300 underline">
          {run.text}
        </Link>
      )
    }
    return (
      <strong key={i} className="text-gold-400">
        {run.text}
      </strong>
    )
  })

export const metadata: Metadata = {
  title: "Field Manual - Cocktail Recipes & Bar Guides",
  description: "Free cocktail recipes for rum, gin, whisky and more. Bar equipment guides and ingredient breakdowns. No jargon, just great drinks.",
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/field-manual/',
  },
  openGraph: {
    ...baseOpenGraph,
    title: "Field Manual | Jerry Can Spirits®",
    description: "Free cocktail recipes for rum, gin, whisky and more. Bar equipment guides and ingredient breakdowns. No jargon, just great drinks.",
    url: 'https://jerrycanspirits.co.uk/field-manual/',
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: "Field Manual | Jerry Can Spirits®",
    description: "Free cocktail recipes for rum, gin, whisky and more. Bar equipment guides and ingredient breakdowns. No jargon, just great drinks.",
    images: OG_IMAGE,
  },
}

export default async function FieldManualHome() {
  // Fetch live counts from Sanity
  const counts = await client.fetch<{ cocktails: number; ingredients: number; equipment: number }>(fieldManualCountsQuery, {}, { next: { revalidate: 3600 } })

  return (
    <main>
      {/* Hero Section. Breadcrumbs, title, image and the stats strip share
          the page's first dark band; the strip overlaps the image's foot. */}
      <section className="band-dark pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumbs
            items={[
              { label: 'Field Manual' },
            ]}
            className="mb-8"
          />

          <SectionHeading
            as="h1"
            eyebrow="Field Manual"
            intro="Everything you need to make proper cocktails at home. Recipes that actually work, equipment recommendations that won't bankrupt you, and ingredient guides written in plain English. We built this because most cocktail resources are either gatekeeping nonsense or trying to sell you something. This one's free - we just want you to make great drinks."
          >
            The Cocktail Guide
            <br />
            <span className="text-gold-300">From First Pour to Proper Drink</span>
          </SectionHeading>

          {/* Hero Image */}
          <div className="relative w-full max-w-4xl mx-auto h-48 sm:h-64 md:h-80 lg:h-96 rounded-lg overflow-hidden border border-gold-500/20 shadow-2xl">
            <Image
              src="/images/hero/Cocktail_Hero.webp"
              alt="Jerry Can Spirits Field Manual - Cocktail Guide"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 896px"
              priority
            />
            <div className="absolute inset-0 bg-linear-to-t from-jerry-green-900/60 to-transparent" />
          </div>
        </div>

      {/* Stats Banner */}
      <ScrollReveal>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="bg-linear-to-r from-jerry-green-800/80 via-jerry-green-700/80 to-jerry-green-800/80 backdrop-blur-sm rounded-xl border border-gold-500/30 py-6 px-8">
          <div className="grid grid-cols-3 divide-x divide-gold-500/30">
            <div className="text-center px-4">
              <div className="text-3xl sm:text-4xl font-serif font-bold text-gold-300">
                {roundDownToTen(counts.cocktails)}+
              </div>
              <div className="text-parchment-300 text-sm sm:text-base mt-1">Cocktail Recipes</div>
            </div>
            <div className="text-center px-4">
              <div className="text-3xl sm:text-4xl font-serif font-bold text-gold-300">
                {roundDownToTen(counts.ingredients)}+
              </div>
              <div className="text-parchment-300 text-sm sm:text-base mt-1">Ingredients</div>
            </div>
            <div className="text-center px-4">
              <div className="text-3xl sm:text-4xl font-serif font-bold text-gold-300">
                {roundDownToTen(counts.equipment)}+
              </div>
              <div className="text-parchment-300 text-sm sm:text-base mt-1">Equipment Guides</div>
            </div>
          </div>
        </div>
      </div>
      </ScrollReveal>
      </section>

      {/* Philosophy Section and the companion book: the first light band. */}
      <section className="band-light py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center">
          <SectionHeading>
            Great Drinks, <span className="text-gold-300">Without the Gatekeeping</span>
          </SectionHeading>
          <div className="space-y-4 text-parchment-300 leading-relaxed">
            <p>
              You don't need a cocktail certification or a shelf full of obscure spirits to make exceptional drinks at home.
              The Field Manual cuts through the jargon and gatekeeping that can make mixology feel out of reach.
            </p>
            <p>
              Every recipe is written in plain English with clear measurements. We focus on what genuinely matters
              and filter out the noise. Whether you're mixing your first Cuba Libre or experimenting with house-made
              syrups, this guide meets you exactly where you are.
            </p>
            <p className="text-gold-300 font-medium">
              Good technique, quality ingredients, and a willingness to experiment. That's all it takes.
            </p>
          </div>
        </div>
      </div>

      {/* First Pour Companion Book */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/first-pour/"
          className="group block bg-linear-to-r from-jerry-green-800/60 to-jerry-green-800/40 border border-gold-500/30 rounded-xl p-6 sm:p-8 hover:border-gold-400/50 transition-colors"
        >
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="shrink-0">
              <div className="inline-block px-3 py-1 bg-gold-500/20 rounded-full">
                <span className="text-gold-300 text-xs font-semibold uppercase tracking-widest">
                  Free companion book
                </span>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-serif text-xl text-white mb-1 group-hover:text-gold-300 transition-colors">
                First Pour
              </h3>
              <p className="text-parchment-300 text-sm">
                The short companion to our spiced rum. How it is built, how to drink it, the first cocktails to try.
              </p>
            </div>
            <div className="shrink-0 text-gold-300 group-hover:translate-x-1 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
        </Link>
      </div>
      </section>

      {/* Navigation Cards: back to dark. */}
      <section className="band-dark py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollRow
          ariaLabel="Field Manual sections"
          cols="md:grid-cols-2"
          items={[
          
          /* Cocktails Section */
          <ScrollReveal key="cocktails" delay={0} className="h-full">
          <Link href="/field-manual/cocktails/" className="group block h-full">
            <div className="bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 hover:border-gold-400/40 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl relative overflow-hidden h-full flex flex-col">
              {/* Parchment texture */}
              <div className="absolute inset-0 bg-linear-to-br from-amber-100/5 to-amber-200/10 opacity-50"></div>
              
              <div className="relative z-10">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gold-400/30 transition-colors">
                    <svg className="w-10 h-10 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-white mb-2">Cocktails</h3>
                  <div className="text-gold-300 text-sm font-semibold uppercase tracking-wider mb-4">
                    Recipes That Work
                  </div>
                </div>

                <p className="text-parchment-300 text-center mb-6 leading-relaxed">
                  Classic cocktails, modern twists, and everything in between. Each recipe tested, measured properly, and written so you can actually make it at home.
                </p>

                <div className="space-y-2 text-sm text-center">
                  <div className="text-parchment-300">
                    • Clear measurements & methods
                  </div>
                  <div className="text-parchment-300">
                    • Difficulty ratings
                  </div>
                  <div className="text-parchment-300">
                    • Variations for what you have
                  </div>
                </div>
              </div>
            </div>
          </Link>
          </ScrollReveal>,

          /* Ingredients Section */
          <ScrollReveal key="ingredients" delay={1} className="h-full">
          <Link href="/field-manual/ingredients/" className="group block h-full">
            <div className="bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 hover:border-gold-400/40 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl relative overflow-hidden h-full flex flex-col">
              {/* Parchment texture */}
              <div className="absolute inset-0 bg-linear-to-br from-amber-100/5 to-amber-200/10 opacity-50"></div>
              
              <div className="relative z-10">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gold-400/30 transition-colors">
                    <svg className="w-10 h-10 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-white mb-2">Ingredients</h3>
                  <div className="text-gold-300 text-sm font-semibold uppercase tracking-wider mb-4">
                    What Goes In
                  </div>
                </div>

                <p className="text-parchment-300 text-center mb-6 leading-relaxed">
                  Spirits, mixers, bitters, syrups, and garnishes explained. What they are, when to use them, and what to buy at different price points.
                </p>

                <div className="space-y-2 text-sm text-center">
                  <div className="text-parchment-300">
                    • Budget & premium options
                  </div>
                  <div className="text-parchment-300">
                    • Substitutions that work
                  </div>
                  <div className="text-parchment-300">
                    • Storage & shelf life
                  </div>
                </div>
              </div>
            </div>
          </Link>
          </ScrollReveal>,

          /* Equipment Section */
          <ScrollReveal key="equipment" delay={2} className="h-full">
          <Link href="/field-manual/equipment/" className="group block h-full">
            <div className="bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 hover:border-gold-400/40 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl relative overflow-hidden h-full flex flex-col">
              {/* Parchment texture */}
              <div className="absolute inset-0 bg-linear-to-br from-amber-100/5 to-amber-200/10 opacity-50"></div>
              
              <div className="relative z-10">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gold-400/30 transition-colors">
                    <svg className="w-10 h-10 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-white mb-2">Equipment</h3>
                  <div className="text-gold-300 text-sm font-semibold uppercase tracking-wider mb-4">
                    Tools of the Trade
                  </div>
                </div>

                <p className="text-parchment-300 text-center mb-6 leading-relaxed">
                  What you actually need vs what's nice to have. Honest equipment reviews, what to look for, and where you can save money without sacrificing results.
                </p>

                <div className="space-y-2 text-sm text-center">
                  <div className="text-parchment-300">
                    • Essential starter kit
                  </div>
                  <div className="text-parchment-300">
                    • Upgrade recommendations
                  </div>
                  <div className="text-parchment-300">
                    • Glassware guide
                  </div>
                </div>
              </div>
            </div>
          </Link>
          </ScrollReveal>,

          /* What's in my bar Section */
          <ScrollReveal key="whats-in-my-bar" delay={3} className="h-full">
          <Link href="/field-manual/whats-in-my-bar/" className="group block h-full">
            <div className="bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 hover:border-gold-400/40 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl relative overflow-hidden h-full flex flex-col">
              <div className="absolute inset-0 bg-linear-to-br from-amber-100/5 to-amber-200/10 opacity-50"></div>
              <div className="relative z-10">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gold-400/30 transition-colors">
                    <svg className="w-10 h-10 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 3h8l-1 6a4 4 0 01-6 0L8 3zM12 13v8m-4 0h8" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-white mb-2">What&apos;s in my bar</h3>
                  <div className="text-gold-300 text-sm font-semibold uppercase tracking-wider mb-4">
                    Pour What You Have
                  </div>
                </div>
                <p className="text-parchment-300 text-center mb-6 leading-relaxed">
                  Mark the bottles you own and see which cocktails you can make now, and which you are one bottle away from.
                </p>
                <div className="space-y-2 text-sm text-center">
                  <div className="text-parchment-300">• Stock your backbar</div>
                  <div className="text-parchment-300">• Live "you can make" results</div>
                  <div className="text-parchment-300">• Saved between visits</div>
                </div>
              </div>
            </div>
          </Link>
          </ScrollReveal>,
          ]}
        />
      </div>
      </section>

      {/* Call to Action: a light band of its own, so the difficulty table
          and the FAQ that follow return to dark. */}
      <section className="band-light py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-linear-to-br from-amber-100/5 to-amber-200/10 opacity-50"></div>
            <div className="relative z-10">
              <h2 className="text-2xl font-serif font-bold text-white mb-4">
                Start Anywhere
              </h2>
              <p className="text-parchment-300 mb-6 max-w-2xl mx-auto">
                Pick a cocktail that sounds good and work backwards. Need a specific ingredient? We'll tell you what it is. Missing a tool? We'll suggest alternatives. The Field Manual is built to help wherever you're starting from.
              </p>
              <Link href="/field-manual/cocktails/" className="inline-block px-6 py-3 bg-gold-500 text-jerry-green-900 font-semibold rounded-lg hover:bg-gold-400 transition-colors">
                Browse Cocktails
              </Link>
            </div>
          </div>
        </div>
      </div>
      </section>

      {/* Difficulty Comparison Table and the FAQ: the closing dark band. The
          difficulty colours are read against dark ground, so they stay here. */}
      <section className="band-dark py-12">
      <ScrollReveal>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-2 text-center">
            Cocktail Difficulty Levels
          </h2>
          <p className="text-parchment-400 mb-8 text-center">
            Every recipe is rated so you know what you&apos;re getting into
          </p>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gold-500/30">
                  <th className="py-4 px-4 text-gold-300 font-semibold">Level</th>
                  <th className="py-4 px-4 text-gold-300 font-semibold">Technique</th>
                  <th className="py-4 px-4 text-gold-300 font-semibold">Ingredients</th>
                  <th className="py-4 px-4 text-gold-300 font-semibold">Examples</th>
                </tr>
              </thead>
              <tbody className="text-parchment-200">
                <tr className="border-b border-gold-500/10">
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                      Novice
                    </span>
                  </td>
                  <td className="py-4 px-4">Pour, stir, build in glass</td>
                  <td className="py-4 px-4">Common spirits, basic mixers</td>
                  <td className="py-4 px-4">Rum & Coke, Storm and Spice, Mojito</td>
                </tr>
                <tr className="border-b border-gold-500/10">
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                      Wayfinder
                    </span>
                  </td>
                  <td className="py-4 px-4">Shaking, straining, muddling</td>
                  <td className="py-4 px-4">1-2 specialty ingredients</td>
                  <td className="py-4 px-4">Daiquiri, Mai Tai, Piña Colada</td>
                </tr>
                <tr>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                      Trailblazer
                    </span>
                  </td>
                  <td className="py-4 px-4">Layering, flaming, infusions</td>
                  <td className="py-4 px-4">Multiple specialty items</td>
                  <td className="py-4 px-4">Zombie, Painkiller, Hurricane</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            <div className="bg-jerry-green-800/40 rounded-lg p-4 border border-green-500/20">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                  Novice
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="text-gold-400">Technique:</span> <span className="text-parchment-200">Pour, stir, build in glass</span></p>
                <p><span className="text-gold-400">Ingredients:</span> <span className="text-parchment-200">Common spirits, basic mixers</span></p>
                <p><span className="text-gold-400">Examples:</span> <span className="text-parchment-200">Rum & Coke, Storm and Spice, Mojito</span></p>
              </div>
            </div>

            <div className="bg-jerry-green-800/40 rounded-lg p-4 border border-yellow-500/20">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                  Wayfinder
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="text-gold-400">Technique:</span> <span className="text-parchment-200">Shaking, straining, muddling</span></p>
                <p><span className="text-gold-400">Ingredients:</span> <span className="text-parchment-200">1-2 specialty ingredients</span></p>
                <p><span className="text-gold-400">Examples:</span> <span className="text-parchment-200">Daiquiri, Mai Tai, Piña Colada</span></p>
              </div>
            </div>

            <div className="bg-jerry-green-800/40 rounded-lg p-4 border border-red-500/20">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-300 border border-red-500/30">
                  Trailblazer
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="text-gold-400">Technique:</span> <span className="text-parchment-200">Layering, flaming, infusions</span></p>
                <p><span className="text-gold-400">Ingredients:</span> <span className="text-parchment-200">Multiple specialty items</span></p>
                <p><span className="text-gold-400">Examples:</span> <span className="text-parchment-200">Zombie, Painkiller, Hurricane</span></p>
              </div>
            </div>
          </div>

          <p className="text-parchment-400 text-sm text-center mt-6">
            Start with Novice recipes and work your way up as you get comfortable with the basics.
          </p>
        </div>
      </div>
      </ScrollReveal>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        {/* FAQ Schema, from the same list the accordion renders. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": faqs.map((faq) => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": answerText(faq.answer)
                }
              }))
            })
          }}
        />

        <SectionHeading intro="What people usually want to know">
          Questions About the Field Manual
        </SectionHeading>
        <FAQAccordion
          items={faqs.map((faq) => ({ question: faq.question, answer: answerNode(faq.answer) }))}
        />
      </div>
      </section>
    </main>
  )
}