import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { client } from '@/sanity/client'
import { guideBySlugQuery, adjacentGuidesQuery } from '@/sanity/queries'
import BackToTop from '@/components/BackToTop'
import StructuredData from '@/components/StructuredData'
import ShareButton from '@/components/ShareButton'
import GuideSections from '@/components/GuideSections'

// Types for guide data
interface Subsection {
  subheading: string
  content: string
}

interface Section {
  heading: string
  content: string
  subsections?: Subsection[]
}

interface FAQ {
  question: string
  answer: string
}

interface TableRow {
  cells: string[]
}

interface ComparisonTable {
  caption: string
  headers: string[]
  rows: TableRow[]
}

interface Distillery {
  name: string
  location: string
  description?: string
  website?: string
  speciality?: string
}

interface RelatedGuide {
  _id: string
  title: string
  slug: { current: string }
  excerpt: string
  category: string
}

interface RelatedCocktail {
  _id: string
  name: string
  slug: { current: string }
}

interface RelatedProduct {
  shopifyHandle: string
  contextNote?: string
}

interface Guide {
  _id: string
  _createdAt: string
  title: string
  slug: { current: string }
  excerpt: string
  metaTitle?: string
  metaDescription?: string
  keywords?: string[]
  category: string
  featured: boolean
  isPillar: boolean
  author: string
  publishedAt?: string
  updatedAt?: string
  introduction: string
  sections: Section[]
  faqs?: FAQ[]
  comparisonTables?: ComparisonTable[]
  featuredDistilleries?: Distillery[]
  relatedGuides?: RelatedGuide[]
  relatedCocktails?: RelatedCocktail[]
  relatedProducts?: RelatedProduct[]
  heroImage?: string
  callToAction?: {
    text: string
    url: string
  }
  estimatedWordCount?: number
}

interface AdjacentGuide {
  _id: string
  title: string
  slug: { current: string }
  category: string
}

interface AdjacentGuides {
  prev: AdjacentGuide | null
  next: AdjacentGuide | null
}

interface PageProps {
  params: Promise<{ slug: string }>
}

// Cloudflare Pages edge runtime
export const runtime = 'edge'

const categoryLabels: Record<string, string> = {
  'spirits-education': 'Spirits Education',
  'rum-guides': 'Rum Guides',
  'cocktail-techniques': 'Cocktail Techniques',
  'buying-guides': 'Buying Guides',
  'uk-craft-spirits': 'UK Craft Spirits',
  'industry-insights': 'Industry Insights',
  'seasonal-occasions': 'Seasonal & Occasions'
}

// Convert heading to URL-friendly slug for anchor links
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const guide = await client.fetch<Guide>(guideBySlugQuery, { slug })

  if (!guide) {
    return {
      title: 'Guide Not Found',
    }
  }

  return {
    title: guide.metaTitle || guide.title,
    description: guide.metaDescription || guide.excerpt,
    keywords: guide.keywords?.join(', '),
    alternates: {
      canonical: `https://jerrycanspirits.co.uk/guides/${guide.slug.current}/`,
    },
    openGraph: {
      title: `${guide.metaTitle || guide.title} | Jerry Can Spirits®`,
      description: guide.metaDescription || guide.excerpt,
      images: guide.heroImage ? [guide.heroImage] : [],
      type: 'article',
    },
  }
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params
  const guide = await client.fetch<Guide>(guideBySlugQuery, { slug })

  if (!guide) {
    notFound()
  }

  // Fetch adjacent guides for prev/next navigation
  const adjacentGuides = await client.fetch<AdjacentGuides>(adjacentGuidesQuery, {
    currentDate: guide.publishedAt || guide._createdAt,
    currentCreatedAt: guide._createdAt
  })

  // Article structured data
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.excerpt,
    image: guide.heroImage,
    author: {
      '@type': 'Organization',
      name: guide.author || 'Jerry Can Spirits',
      url: 'https://jerrycanspirits.co.uk'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Jerry Can Spirits',
      logo: {
        '@type': 'ImageObject',
        url: 'https://jerrycanspirits.co.uk/images/Logo.webp'
      }
    },
    datePublished: guide.publishedAt || new Date().toISOString(),
    dateModified: guide.updatedAt || guide.publishedAt || new Date().toISOString(),
    mainEntityOfPage: `https://jerrycanspirits.co.uk/guides/${guide.slug.current}`
  }

  // FAQ structured data
  const faqSchema = guide.faqs && guide.faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: guide.faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  } : null

  return (
    <>
      <StructuredData data={articleSchema} id="article-schema" />
      {faqSchema && <StructuredData data={faqSchema} id="faq-schema" />}

      <main className="min-h-screen py-20">
        {/* Breadcrumb */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <nav className="text-sm text-parchment-400" aria-label="Breadcrumb">
            <Link href="/guides" className="hover:text-gold-300 transition-colors">Guides</Link>
            <span className="mx-2">→</span>
            <span className="text-gold-300">{guide.title}</span>
          </nav>
        </div>

        {/* Hero Section */}
        <header className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
          {guide.heroImage && (
            <div className="relative aspect-[16/9] sm:aspect-[2/1] lg:aspect-[21/9] rounded-xl overflow-hidden mb-8">
              <Image
                src={guide.heroImage}
                alt={guide.title}
                fill
                className="object-cover object-center"
                sizes="(max-width: 640px) 100vw, (max-width: 896px) 100vw, 896px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-jerry-green-900/80 via-jerry-green-900/20 to-transparent" />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-jerry-green-800/60 border border-gold-500/30 text-gold-300 rounded-full text-sm font-semibold">
              {categoryLabels[guide.category] || guide.category}
            </span>
            {guide.isPillar && (
              <span className="px-3 py-1 bg-gold-500/20 border border-gold-500/40 text-gold-300 rounded-full text-sm font-semibold">
                Complete Guide
              </span>
            )}
            {guide.estimatedWordCount && (
              <span className="text-parchment-400 text-sm">
                {Math.ceil(guide.estimatedWordCount / 200)} min read
              </span>
            )}
          </div>

          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-6">
            {guide.title}
          </h1>

          <p className="text-xl text-parchment-300 leading-relaxed">
            {guide.introduction}
          </p>

          {guide.author && (
            <div className="mt-6 pt-6 border-t border-gold-500/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gold-500/20 rounded-full flex items-center justify-center">
                  <span className="text-gold-400 font-bold text-sm">{guide.author.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-white font-semibold">{guide.author}</p>
                  {guide.publishedAt && (
                    <p className="text-parchment-400 text-sm">
                      {new Date(guide.publishedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                      {guide.updatedAt && guide.updatedAt !== guide.publishedAt && (
                        <span> · Updated {new Date(guide.updatedAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
              <ShareButton
                title={`${guide.title} | Jerry Can Spirits`}
                text={`Check out this guide: ${guide.title}`}
                url={`https://jerrycanspirits.co.uk/guides/${guide.slug.current}`}
                buttonText="Share Guide"
              />
            </div>
          )}
        </header>

        {/* Table of Contents */}
        {guide.sections && guide.sections.length > 3 && (
          <nav className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
            <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
              <h2 className="text-lg font-serif font-bold text-gold-300 mb-4">In This Guide</h2>
              <ol className="space-y-2">
                {guide.sections.map((section, index) => (
                  <li key={index}>
                    <a
                      href={`#${slugify(section.heading)}`}
                      className="text-parchment-300 hover:text-gold-300 transition-colors flex items-center gap-2"
                    >
                      <span className="text-gold-500/60">{index + 1}.</span>
                      {section.heading}
                    </a>
                  </li>
                ))}
                {guide.faqs && guide.faqs.length > 0 && (
                  <li>
                    <a
                      href="#faqs"
                      className="text-parchment-300 hover:text-gold-300 transition-colors flex items-center gap-2"
                    >
                      <span className="text-gold-500/60">FAQ</span>
                      Frequently Asked Questions
                    </a>
                  </li>
                )}
              </ol>
            </div>
          </nav>
        )}

        {/* Main Content Sections */}
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {guide.sections && (
            <GuideSections
              sections={guide.sections}
              initialVisibleCount={5}
            />
          )}

          {/* Comparison Tables */}
          {guide.comparisonTables && guide.comparisonTables.length > 0 && (
            <div className="mt-16 space-y-12">
              {guide.comparisonTables.map((table, index) => (
                <div key={index} className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20 overflow-hidden">
                  <h3 className="text-2xl font-serif font-bold text-gold-300 mb-6">
                    {table.caption}
                  </h3>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-4">
                    {table.rows.map((row, rowIndex) => (
                      <div
                        key={rowIndex}
                        className="bg-jerry-green-800/30 rounded-lg p-4 border border-gold-500/10"
                      >
                        <h4 className="text-white font-semibold text-lg mb-3">
                          {row.cells[0]}
                        </h4>
                        <div className="space-y-2">
                          {table.headers.slice(1).map((header, headerIndex) => (
                            <div key={headerIndex} className="flex justify-between items-center text-sm">
                              <span className="text-gold-400">{header}</span>
                              <span className="text-parchment-300">{row.cells[headerIndex + 1]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gold-500/30">
                          {table.headers.map((header, headerIndex) => (
                            <th
                              key={headerIndex}
                              className="px-4 py-3 text-left text-gold-300 font-semibold text-sm uppercase tracking-wider"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows.map((row, rowIndex) => (
                          <tr
                            key={rowIndex}
                            className="border-b border-gold-500/10 hover:bg-jerry-green-800/20 transition-colors"
                          >
                            {row.cells.map((cell, cellIndex) => (
                              <td
                                key={cellIndex}
                                className={`px-4 py-3 text-parchment-300 ${cellIndex === 0 ? 'font-semibold text-white' : ''}`}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Featured Distilleries */}
          {guide.featuredDistilleries && guide.featuredDistilleries.length > 0 && (
            <div className="mt-16">
              <h2 className="text-3xl font-serif font-bold text-white mb-8">Featured UK Distilleries</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {guide.featuredDistilleries.map((distillery, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20"
                  >
                    <h3 className="text-xl font-serif font-bold text-gold-300 mb-2">
                      {distillery.name}
                    </h3>
                    <p className="text-parchment-400 text-sm mb-3">{distillery.location}</p>
                    {distillery.speciality && (
                      <span className="inline-block px-2 py-1 bg-jerry-green-800/60 border border-gold-500/20 text-gold-300 rounded text-xs font-semibold mb-3">
                        {distillery.speciality}
                      </span>
                    )}
                    {distillery.description && (
                      <p className="text-parchment-300 text-sm leading-relaxed mb-4">
                        {distillery.description}
                      </p>
                    )}
                    {distillery.website && (
                      <a
                        href={distillery.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gold-300 hover:text-gold-400 text-sm font-semibold inline-flex items-center gap-1"
                      >
                        Visit Website
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FAQs */}
          {guide.faqs && guide.faqs.length > 0 && (
            <div id="faqs" className="mt-16 scroll-mt-24">
              <h2 className="text-3xl font-serif font-bold text-white mb-8">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {guide.faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20"
                  >
                    <h3 className="text-lg font-serif font-bold text-gold-300 mb-3">
                      {faq.question}
                    </h3>
                    <p className="text-parchment-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Content */}
          {((guide.relatedCocktails && guide.relatedCocktails.length > 0) ||
            (guide.relatedGuides && guide.relatedGuides.length > 0) ||
            (guide.relatedProducts && guide.relatedProducts.length > 0)) && (
            <div className="mt-16 space-y-12">
              {/* Related Cocktails */}
              {guide.relatedCocktails && guide.relatedCocktails.length > 0 && (
                <div>
                  <h2 className="text-2xl font-serif font-bold text-gold-300 mb-6">Try These Cocktails</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {guide.relatedCocktails.map((cocktail) => (
                      <Link
                        key={cocktail._id}
                        href={`/field-manual/cocktails/${cocktail.slug.current}`}
                        className="flex items-center gap-3 p-4 bg-jerry-green-800/30 rounded-lg border border-gold-500/20 hover:bg-jerry-green-800/50 hover:border-gold-400/40 transition-all group"
                      >
                        <svg className="w-5 h-5 text-gold-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-parchment-300 group-hover:text-gold-300 transition-colors font-semibold">
                          {cocktail.name}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Products */}
              {guide.relatedProducts && guide.relatedProducts.length > 0 && (
                <div>
                  <h2 className="text-2xl font-serif font-bold text-gold-300 mb-6">Recommended Products</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {guide.relatedProducts.map((product, index) => (
                      <Link
                        key={index}
                        href={`/shop/product/${product.shopifyHandle}`}
                        className="flex items-center gap-4 p-4 bg-jerry-green-800/30 rounded-lg border border-gold-500/20 hover:bg-jerry-green-800/50 hover:border-gold-400/40 transition-all group"
                      >
                        <div className="w-10 h-10 bg-gold-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-white group-hover:text-gold-300 transition-colors font-semibold block">
                            {product.shopifyHandle.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          {product.contextNote && (
                            <span className="text-parchment-400 text-sm">{product.contextNote}</span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Guides */}
              {guide.relatedGuides && guide.relatedGuides.length > 0 && (
                <div>
                  <h2 className="text-2xl font-serif font-bold text-gold-300 mb-6">Continue Reading</h2>
                  <div className="grid sm:grid-cols-2 gap-6">
                    {guide.relatedGuides.map((relatedGuide) => (
                      <Link
                        key={relatedGuide._id}
                        href={`/guides/${relatedGuide.slug.current}`}
                        className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20 hover:border-gold-400/40 transition-all group"
                      >
                        <span className="px-2 py-1 bg-jerry-green-800/60 border border-gold-500/20 text-gold-300 rounded text-xs font-semibold">
                          {categoryLabels[relatedGuide.category] || relatedGuide.category}
                        </span>
                        <h3 className="text-lg font-serif font-bold text-white group-hover:text-gold-300 transition-colors mt-3 mb-2">
                          {relatedGuide.title}
                        </h3>
                        <p className="text-parchment-300 text-sm line-clamp-2">
                          {relatedGuide.excerpt}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Call to Action */}
          {guide.callToAction && guide.callToAction.text && (
            <div className="mt-16 bg-gradient-to-br from-gold-500/10 to-gold-600/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/30 text-center">
              <h3 className="text-2xl font-serif font-bold text-white mb-4">
                Ready to Get Started?
              </h3>
              <Link
                href={guide.callToAction.url || '/shop'}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
              >
                {guide.callToAction.text}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          )}

          {/* Previous/Next Navigation */}
          {(adjacentGuides.prev || adjacentGuides.next) && (
            <div className="mt-12 pt-8 border-t border-gold-500/20">
              <div className="grid sm:grid-cols-2 gap-4">
                {adjacentGuides.prev ? (
                  <Link
                    href={`/guides/${adjacentGuides.prev.slug.current}`}
                    className="group bg-jerry-green-800/30 rounded-lg p-4 border border-gold-500/20 hover:bg-jerry-green-800/50 hover:border-gold-400/40 transition-all"
                  >
                    <div className="flex items-center gap-2 text-parchment-400 text-sm mb-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous Guide
                    </div>
                    <p className="text-white group-hover:text-gold-300 transition-colors font-semibold line-clamp-2">
                      {adjacentGuides.prev.title}
                    </p>
                  </Link>
                ) : (
                  <div />
                )}
                {adjacentGuides.next ? (
                  <Link
                    href={`/guides/${adjacentGuides.next.slug.current}`}
                    className="group bg-jerry-green-800/30 rounded-lg p-4 border border-gold-500/20 hover:bg-jerry-green-800/50 hover:border-gold-400/40 transition-all text-right"
                  >
                    <div className="flex items-center justify-end gap-2 text-parchment-400 text-sm mb-2">
                      Next Guide
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <p className="text-white group-hover:text-gold-300 transition-colors font-semibold line-clamp-2">
                      {adjacentGuides.next.title}
                    </p>
                  </Link>
                ) : (
                  <div />
                )}
              </div>
            </div>
          )}

          {/* Back to Guides */}
          <div className="mt-6 text-center">
            <Link
              href="/guides"
              className="inline-flex items-center gap-2 px-6 py-3 text-gold-300 hover:text-gold-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              View All Guides
            </Link>
          </div>
        </article>

        <BackToTop />
      </main>
    </>
  )
}
