import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sitemap | Jerry Can Spirits - Navigate Our Site',
  description: 'Complete sitemap of Jerry Can Spirits website. Find all pages including products, field manual, about us, and contact information.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/sitemap-page/',
  },
  robots: {
    index: true,
    follow: true,
  },
}

interface SitemapSection {
  title: string
  description: string
  links: { name: string; href: string; description?: string }[]
}

export default function SitemapPage() {
  const sections: SitemapSection[] = [
    {
      title: 'Main Pages',
      description: 'Core pages and primary navigation',
      links: [
        { name: 'Home', href: '/', description: 'Welcome to Jerry Can Spirits' },
      ],
    },
    {
      title: 'About',
      description: 'Learn about our brand, mission, and values',
      links: [
        { name: 'Our Story', href: '/about/story', description: 'Brand heritage & mission' },
        { name: 'Ethos', href: '/ethos', description: 'Values & craftsmanship' },
        { name: 'Armed Forces Covenant', href: '/armed-forces-covenant', description: 'Our commitment to the armed forces community' },
      ],
    },
    {
      title: 'Field Manual',
      description: 'Guides, recipes, and resources for the discerning drinker',
      links: [
        { name: 'Field Manual Home', href: '/field-manual', description: 'Your guide to great drinks' },
        { name: 'Cocktails', href: '/field-manual/cocktails', description: 'Classic & signature recipes' },
        { name: 'Equipment', href: '/field-manual/equipment', description: 'Bar tools & glassware' },
        { name: 'Ingredients', href: '/field-manual/ingredients', description: 'Quality spirits guide' },
      ],
    },
    {
      title: 'Contact',
      description: 'Get in touch with our team',
      links: [
        { name: 'Contact Home', href: '/contact', description: 'All contact options' },
        { name: 'General Enquiries', href: '/contact/enquiries', description: 'Questions and feedback' },
        { name: 'Media', href: '/contact/media', description: 'Press & partnerships' },
        { name: 'Complaints', href: '/contact/complaints', description: 'Customer service' },
      ],
    },
    {
      title: 'Legal & Policies',
      description: 'Terms, policies, and legal information',
      links: [
        { name: 'Privacy Policy', href: '/privacy-policy', description: 'How we handle your data' },
        { name: 'Terms of Service', href: '/terms-of-service', description: 'Terms and conditions' },
        { name: 'Cookie Policy', href: '/cookie-policy', description: 'Our use of cookies' },
        { name: 'Shipping & Returns', href: '/shipping-returns', description: 'Delivery and returns information' },
        { name: 'Accessibility', href: '/accessibility', description: 'Our commitment to accessibility' },
      ],
    },
  ]

  return (
    <main className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 pb-8 border-b border-gold-500/30">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Site Navigation
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-4">
            Sitemap
          </h1>
          <p className="text-parchment-300 text-lg max-w-2xl mx-auto">
            A complete guide to all pages on the Jerry Can Spirits website
          </p>
        </div>

        {/* Sitemap Sections */}
        <div className="space-y-12">
          {sections.map((section, sectionIndex) => (
            <section
              key={sectionIndex}
              className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-8 border border-gold-500/20"
            >
              <h2 className="text-2xl font-serif font-bold text-white mb-2">
                {section.title}
              </h2>
              <p className="text-parchment-300 mb-6">
                {section.description}
              </p>

              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      href={link.href}
                      className="group flex items-start gap-3 p-3 rounded-lg hover:bg-jerry-green-800/60 transition-colors duration-200"
                    >
                      <svg
                        className="w-5 h-5 text-gold-400 mt-1 flex-shrink-0 group-hover:translate-x-1 transition-transform duration-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                      <div>
                        <div className="text-white font-semibold group-hover:text-gold-300 transition-colors duration-200">
                          {link.name}
                        </div>
                        {link.description && (
                          <div className="text-parchment-400 text-sm mt-1">
                            {link.description}
                          </div>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-12 p-6 bg-jerry-green-800/40 backdrop-blur-sm rounded-xl border border-gold-500/20 text-center">
          <p className="text-parchment-300 text-sm">
            Need help finding something?{' '}
            <Link href="/contact" className="text-gold-300 hover:text-gold-200 underline">
              Contact us
            </Link>{' '}
            and we'll be happy to assist.
          </p>
        </div>
      </div>
    </main>
  )
}
