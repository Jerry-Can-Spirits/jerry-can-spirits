import type { Metadata } from 'next'
import Link from 'next/link'
import ScrollRow from '@/components/ScrollRow'
import SectionHeading from '@/components/SectionHeading'

export const metadata: Metadata = {
  title: '404 - Page Not Found',
  description: 'The page you are looking for could not be found. Browse our spirits collection, cocktail recipes, and guides.',
  robots: {
    index: false,
    follow: true,
  },
}

const suggestedPages = [
  {
    name: 'Shop Our Rum',
    href: '/shop/spirits/',
    description: 'Browse the Expedition Spiced Rum collection',
  },
  {
    name: 'Field Manual',
    href: '/field-manual/',
    description: 'Cocktail recipes, ingredients, and equipment guides',
  },
  {
    name: 'Guides',
    href: '/guides/',
    description: 'Rum education, cocktail techniques, and more',
  },
  {
    name: 'Our Story',
    href: '/about/story/',
    description: 'How two veterans built a craft spirits business',
  },
  {
    name: 'Contact Us',
    href: '/contact/',
    description: 'Get in touch with the team',
  },
  {
    name: 'FAQ',
    href: '/faq/',
    description: 'Common questions answered',
  },
]

export default function NotFound() {
  return (
    <main>
      {/* Hero */}
      <section className="band-dark pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <SectionHeading
            as="h1"
            eyebrow="404 - Page Not Found"
            intro={
              <>
                The page you&apos;re looking for has been moved, removed, or never existed.
                Let&apos;s get you back on track.
              </>
            }
          >
            Lost on the
            <br />
            <span className="text-gold-300">Expedition?</span>
          </SectionHeading>

          <Link
            href="/"
            className="inline-flex items-center justify-center bg-gold-500 hover:bg-gold-400 text-jerry-green-900 px-8 py-4 rounded-lg font-semibold transition-all duration-300"
          >
            Back to Base Camp
          </Link>
        </div>
      </section>

      {/* Suggested Pages */}
      <section className="band-light py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading>Where to next?</SectionHeading>

          <ScrollRow
            ariaLabel="Where to next?"
            cols="md:grid-cols-2 lg:grid-cols-3"
            items={suggestedPages.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="block h-full bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20 hover:border-gold-500/40 transition-all duration-300 group"
              >
                <h3 className="text-lg font-semibold text-white group-hover:text-gold-300 transition-colors mb-2">
                  {page.name}
                </h3>
                <p className="text-sm text-parchment-300">
                  {page.description}
                </p>
              </Link>
            ))}
          />
        </div>
      </section>

      {/* Search Prompt */}
      <section className="band-dark py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
            <p className="text-parchment-300 mb-2">
              Looking for something specific?
            </p>
            <p className="text-parchment-400 text-sm">
              Use the search icon in the navigation bar or press <kbd className="px-2 py-1 bg-jerry-green-700 rounded-sm text-parchment-200 text-xs font-mono">Ctrl+K</kbd> to search the site.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
