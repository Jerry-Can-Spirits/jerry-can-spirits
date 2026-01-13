import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { client } from '@/sanity/client'
import { guidesListQuery } from '@/sanity/queries'
import { urlFor } from '@/sanity/lib/image'
import { BreadcrumbSchema } from '@/components/StructuredData'

export const metadata: Metadata = {
  title: "Spirits Guides & Education | Jerry Can Spirits - UK Craft Spirits Authority",
  description: "Comprehensive guides to spiced rum, craft spirits, and UK distilleries. Learn about rum production, tasting notes, brand comparisons, and cocktail techniques from veteran-owned Jerry Can Spirits.",
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/guides',
  },
  openGraph: {
    title: "Spirits Guides & Education | Jerry Can Spirits",
    description: "Expert guides on spiced rum, craft spirits, and UK distilleries",
  },
}

interface Guide {
  _id: string
  title: string
  slug: { current: string }
  excerpt: string
  category: string
  featured: boolean
  isPillar: boolean
  publishedAt?: string
  heroImage?: { asset: { url: string } }
}

async function getGuides(): Promise<Guide[]> {
  return await client.fetch(guidesListQuery)
}

export default async function GuidesHub() {
  const guides = await getGuides()

  // Separate featured, pillar, and regular guides
  const featuredGuides = guides.filter(g => g.featured || g.isPillar)
  const regularGuides = guides.filter(g => !g.featured && !g.isPillar)

  // Categories for filtering
  const categories = [
    { value: 'spirits-education', label: 'Spirits Education', icon: '🥃' },
    { value: 'rum-guides', label: 'Rum Guides', icon: '🍹' },
    { value: 'cocktail-techniques', label: 'Cocktail Techniques', icon: '🍸' },
    { value: 'buying-guides', label: 'Buying Guides', icon: '🛒' },
    { value: 'uk-craft-spirits', label: 'UK Craft Spirits', icon: '🇬🇧' },
    { value: 'industry-insights', label: 'Industry Insights', icon: '💡' }
  ]

  return (
    <>
      <BreadcrumbSchema items={[
        { name: 'Home', url: 'https://jerrycanspirits.co.uk' },
        { name: 'Guides', url: 'https://jerrycanspirits.co.uk/guides' }
      ]} />

      <main className="min-h-screen py-20">
        {/* Hero Section */}
        <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="mb-8">
              <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
                <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
                  Spirits Education
                </span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white mb-6">
                The Craft Spirits
                <br />
                <span className="text-gold-300">Knowledge Base</span>
              </h1>

              <p className="text-xl text-parchment-300 max-w-3xl mx-auto leading-relaxed">
                Explore comprehensive guides on spiced rum, craft spirits, and UK distilleries.
                From production methods to tasting techniques, discover the knowledge that turns
                casual drinkers into informed enthusiasts.
              </p>
            </div>

            {/* Quick Links to Categories */}
            <div className="flex flex-wrap gap-3 justify-center mt-8">
              {categories.map((cat) => (
                <div
                  key={cat.value}
                  className="px-4 py-2 bg-jerry-green-800/40 backdrop-blur-sm rounded-full border border-gold-500/20 text-parchment-200 text-sm hover:border-gold-400/40 transition-colors"
                >
                  <span className="mr-2">{cat.icon}</span>
                  {cat.label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured & Pillar Content */}
        {featuredGuides.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="mb-12">
              <h2 className="text-3xl font-serif font-bold text-white mb-4">
                Featured Guides
              </h2>
              <p className="text-parchment-300 max-w-2xl">
                Comprehensive resources covering the fundamentals of craft spirits and rum expertise.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredGuides.map((guide) => (
                <Link
                  key={guide._id}
                  href={`/guides/${guide.slug.current}`}
                  className="group"
                >
                  <article className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl overflow-hidden border border-gold-500/20 hover:border-gold-400/40 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl h-full flex flex-col">
                    {/* Pillar Badge */}
                    {guide.isPillar && (
                      <div className="absolute top-4 right-4 z-10 bg-gold-500 text-jerry-green-900 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
                        📍 Pillar Content
                      </div>
                    )}

                    {/* Image */}
                    {guide.heroImage && (
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={urlFor(guide.heroImage).url()}
                          alt={guide.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-jerry-green-900/80 to-transparent" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
                          {guide.category.replace('-', ' ')}
                        </span>
                        {guide.publishedAt && (
                          <span className="text-xs text-parchment-400">
                            {new Date(guide.publishedAt).toLocaleDateString('en-GB', {
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-serif font-bold text-white mb-3 group-hover:text-gold-300 transition-colors">
                        {guide.title}
                      </h3>

                      <p className="text-parchment-300 text-sm leading-relaxed mb-4 flex-1">
                        {guide.excerpt}
                      </p>

                      <div className="flex items-center text-gold-400 text-sm font-semibold">
                        Read Guide
                        <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* All Guides */}
        {regularGuides.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="mb-12">
              <h2 className="text-3xl font-serif font-bold text-white mb-4">
                All Guides
              </h2>
              <p className="text-parchment-300 max-w-2xl">
                Explore our complete library of craft spirits education and UK distillery spotlights.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularGuides.map((guide) => (
                <Link
                  key={guide._id}
                  href={`/guides/${guide.slug.current}`}
                  className="group"
                >
                  <article className="bg-jerry-green-800/20 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 hover:border-gold-400/40 transition-all duration-300 h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
                        {guide.category.replace('-', ' ')}
                      </span>
                      {guide.publishedAt && (
                        <span className="text-xs text-parchment-400">
                          {new Date(guide.publishedAt).toLocaleDateString('en-GB', {
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-serif font-bold text-white mb-2 group-hover:text-gold-300 transition-colors">
                      {guide.title}
                    </h3>

                    <p className="text-parchment-300 text-sm leading-relaxed mb-4 flex-1 line-clamp-3">
                      {guide.excerpt}
                    </p>

                    <div className="flex items-center text-gold-400 text-sm font-semibold">
                      Read More
                      <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {guides.length === 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-12 border border-gold-500/20">
              <div className="w-24 h-24 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-2xl font-serif font-bold text-white mb-4">
                Guides Coming Soon
              </h3>
              <p className="text-parchment-300 max-w-2xl mx-auto mb-8">
                We're crafting comprehensive guides on spiced rum, UK craft distilleries, and cocktail techniques.
                Check back soon for expert knowledge and industry insights.
              </p>
              <Link
                href="/field-manual"
                className="inline-block px-6 py-3 bg-gold-500 text-jerry-green-900 font-semibold rounded-lg hover:bg-gold-400 transition-colors"
              >
                Explore Field Manual
              </Link>
            </div>
          </section>
        )}

        {/* Call to Action */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-gradient-to-br from-gold-500/10 to-gold-600/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/30 text-center">
            <h2 className="text-2xl font-serif font-bold text-white mb-4">
              Explore Jerry Can Spirits
            </h2>
            <p className="text-parchment-300 mb-6 max-w-2xl mx-auto">
              Put your knowledge into practice with our expedition-ready spiced rum.
              Crafted by veterans, engineered for reliability, designed for adventure.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/shop/drinks"
                className="inline-block px-6 py-3 bg-gold-500 text-jerry-green-900 font-semibold rounded-lg hover:bg-gold-400 transition-colors"
              >
                Shop Premium Rum
              </Link>
              <Link
                href="/field-manual"
                className="inline-block px-6 py-3 bg-jerry-green-800/40 text-gold-400 border border-gold-500/40 font-semibold rounded-lg hover:bg-jerry-green-800/60 transition-colors"
              >
                View Cocktail Recipes
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
