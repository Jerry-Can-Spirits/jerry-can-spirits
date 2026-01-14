import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { client } from '@/sanity/client'
import { guidesListQuery } from '@/sanity/queries'
import BackToTop from '@/components/BackToTop'

// Types for guide data
interface Guide {
  _id: string
  title: string
  slug: { current: string }
  excerpt: string
  category: string
  featured: boolean
  isPillar: boolean
  publishedAt: string
  heroImage?: string
}

// Cloudflare Pages edge runtime
export const runtime = 'edge'

export const metadata: Metadata = {
  title: 'Spirits Guides & Education | Jerry Can Spirits',
  description: 'Expert guides on cocktail techniques, rum education, and spirits knowledge. Learn from our comprehensive collection of bartending resources.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/guides',
  },
}

const categoryLabels: Record<string, string> = {
  'spirits-education': 'Spirits Education',
  'rum-guides': 'Rum Guides',
  'cocktail-techniques': 'Cocktail Techniques',
  'buying-guides': 'Buying Guides',
  'uk-craft-spirits': 'UK Craft Spirits',
  'industry-insights': 'Industry Insights'
}

export default async function GuidesPage() {
  const guides = await client.fetch<Guide[]>(guidesListQuery)

  // Separate pillar guides and regular guides
  const pillarGuides = guides.filter(g => g.isPillar)
  const featuredGuides = guides.filter(g => g.featured && !g.isPillar)
  const regularGuides = guides.filter(g => !g.featured && !g.isPillar)

  if (guides.length === 0) {
    return (
      <main className="min-h-screen py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-serif font-bold text-white mb-4">Coming Soon</h1>
            <p className="text-parchment-300 mb-8">
              Our spirits guides and educational content are being crafted. Check back soon for expert knowledge on cocktails, rum, and more.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 font-semibold rounded-lg transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen py-20">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Knowledge Base
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white mb-6">
            Spirits Guides
            <br />
            <span className="text-gold-300">& Education</span>
          </h1>

          <p className="text-xl text-parchment-300 max-w-3xl mx-auto leading-relaxed">
            Deepen your understanding of cocktails, spirits, and bartending techniques with our comprehensive guides written by industry experts.
          </p>
        </div>
      </section>

      {/* Pillar Guides */}
      {pillarGuides.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <h2 className="text-3xl font-serif font-bold text-gold-400 mb-6 flex items-center gap-2">
            <span className="text-gold-400">&#128205;</span>
            Comprehensive Guides
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {pillarGuides.map((guide) => (
              <Link
                key={guide._id}
                href={`/guides/${guide.slug.current}`}
                className="group bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl border border-gold-500/30 overflow-hidden hover:border-gold-400/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
              >
                {guide.heroImage && (
                  <div className="relative aspect-[21/9] bg-jerry-green-800/20">
                    <Image
                      src={guide.heroImage}
                      alt={guide.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-jerry-green-900/80 to-transparent" />
                    <div className="absolute top-4 left-4 px-3 py-1 bg-gold-500/90 backdrop-blur-sm rounded-full">
                      <span className="text-jerry-green-900 text-xs font-bold">Complete Guide</span>
                    </div>
                  </div>
                )}
                <div className="p-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-jerry-green-800/60 border border-gold-500/20 text-gold-300 rounded-full text-xs font-semibold">
                      {categoryLabels[guide.category] || guide.category}
                    </span>
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-white group-hover:text-gold-300 transition-colors mb-3">
                    {guide.title}
                  </h3>
                  <p className="text-parchment-300 leading-relaxed mb-4">
                    {guide.excerpt}
                  </p>
                  <div className="flex items-center gap-2 text-gold-300 font-semibold">
                    <span>Read Full Guide</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Guides */}
      {featuredGuides.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          <h2 className="text-3xl font-serif font-bold text-gold-400 mb-6 flex items-center gap-2">
            <span className="text-gold-400">&#9733;</span>
            Featured Guides
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredGuides.map((guide) => (
              <Link
                key={guide._id}
                href={`/guides/${guide.slug.current}`}
                className="group bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl border border-gold-500/30 overflow-hidden hover:border-gold-400/60 transition-all duration-300 hover:scale-105"
              >
                {guide.heroImage && (
                  <div className="relative aspect-[16/9] bg-jerry-green-800/20">
                    <Image
                      src={guide.heroImage}
                      alt={guide.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute top-3 right-3 px-2 py-1 bg-gold-500/90 backdrop-blur-sm rounded-full">
                      <span className="text-jerry-green-900 text-xs font-bold">Featured</span>
                    </div>
                  </div>
                )}
                <div className="p-6">
                  <span className="px-2 py-1 bg-jerry-green-800/60 border border-gold-500/20 text-gold-300 rounded text-xs font-semibold">
                    {categoryLabels[guide.category] || guide.category}
                  </span>
                  <h3 className="text-xl font-serif font-bold text-white group-hover:text-gold-300 transition-colors mt-3 mb-2">
                    {guide.title}
                  </h3>
                  <p className="text-parchment-300 text-sm leading-relaxed line-clamp-3">
                    {guide.excerpt}
                  </p>
                  <div className="flex items-center gap-2 text-gold-300 text-sm font-semibold mt-4">
                    <span>Read More</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* All Guides */}
      {regularGuides.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-serif font-bold text-white mb-6">
            All Guides
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularGuides.map((guide) => (
              <Link
                key={guide._id}
                href={`/guides/${guide.slug.current}`}
                className="group bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl border border-gold-500/20 overflow-hidden hover:border-gold-400/40 transition-all duration-300 hover:scale-105"
              >
                {guide.heroImage && (
                  <div className="relative aspect-[16/9] bg-jerry-green-800/20">
                    <Image
                      src={guide.heroImage}
                      alt={guide.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                )}
                <div className="p-6">
                  <span className="px-2 py-1 bg-jerry-green-800/60 border border-gold-500/20 text-gold-300 rounded text-xs font-semibold">
                    {categoryLabels[guide.category] || guide.category}
                  </span>
                  <h3 className="text-xl font-serif font-bold text-white group-hover:text-gold-300 transition-colors mt-3 mb-2">
                    {guide.title}
                  </h3>
                  <p className="text-parchment-300 text-sm leading-relaxed line-clamp-3">
                    {guide.excerpt}
                  </p>
                  <div className="flex items-center gap-2 text-gold-300 text-sm font-semibold mt-4">
                    <span>Read More</span>
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <BackToTop />
    </main>
  )
}
