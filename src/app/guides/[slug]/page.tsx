import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { client } from '@/sanity/client'
import { guideBySlugQuery, guidesSitemapQuery } from '@/sanity/queries'
import { urlFor } from '@/sanity/lib/image'
import { ArticleSchema, BreadcrumbSchema } from '@/components/StructuredData'
import StructuredData from '@/components/StructuredData'
import BackToTop from '@/components/BackToTop'

// Types
interface Guide {
  _id: string
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
  sections: Array<{
    heading: string
    content: string
    subsections?: Array<{
      subheading: string
      content: string
    }>
  }>
  faqs?: Array<{
    question: string
    answer: string
  }>
  comparisonTables?: Array<{
    caption: string
    headers: string[]
    rows: Array<{
      cells: string[]
    }>
  }>
  featuredDistilleries?: Array<{
    name: string
    location: string
    description: string
    website?: string
    speciality?: string
  }>
  relatedGuides?: Array<{
    _id: string
    title: string
    slug: { current: string }
    excerpt: string
    category: string
  }>
  relatedCocktails?: Array<{
    _id: string
    name: string
    slug: { current: string }
  }>
  relatedProducts?: Array<{
    shopifyHandle: string
    contextNote: string
  }>
  heroImage?: { asset: { url: string } }
  callToAction?: {
    text: string
    url: string
  }
  estimatedWordCount?: number
}

//Cloudflare Pages requires explicit static config for SSG routes
export const dynamicParams = false
export const revalidate = false // Fully static, no ISR

async function getGuide(slug: string): Promise<Guide | null> {
  return await client.fetch(guideBySlugQuery, { slug })
}

async function getAllGuides(): Promise<Array<{ slug: { current: string } }>> {
  return await client.fetch(guidesSitemapQuery)
}

export async function generateStaticParams() {
  const guides = await getAllGuides()
  return guides.map((guide) => ({
    slug: guide.slug.current,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const guide = await getGuide(slug)

  if (!guide) {
    return {
      title: 'Guide Not Found | Jerry Can Spirits',
    }
  }

  return {
    title: guide.metaTitle || `${guide.title} | Jerry Can Spirits Guides`,
    description: guide.metaDescription || guide.excerpt,
    keywords: guide.keywords?.join(', '),
    alternates: {
      canonical: `https://jerrycanspirits.co.uk/guides/${slug}`,
    },
    openGraph: {
      title: guide.metaTitle || guide.title,
      description: guide.metaDescription || guide.excerpt,
      images: guide.heroImage ? [{ url: urlFor(guide.heroImage).url() }] : [],
      type: 'article',
      publishedTime: guide.publishedAt,
      modifiedTime: guide.updatedAt || guide.publishedAt,
    },
  }
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const guide = await getGuide(slug)

  if (!guide) {
    notFound()
  }

  const publishedDate = guide.publishedAt || new Date().toISOString()
  const updatedDate = guide.updatedAt || publishedDate

  return (
    <>
      <ArticleSchema
        title={guide.title}
        description={guide.excerpt}
        url={`https://jerrycanspirits.co.uk/guides/${slug}`}
        publishedAt={publishedDate}
        updatedAt={updatedDate}
        author={guide.author}
        imageUrl={guide.heroImage ? urlFor(guide.heroImage).url() : undefined}
        wordCount={guide.estimatedWordCount}
      />

      <BreadcrumbSchema items={[
        { name: 'Home', url: 'https://jerrycanspirits.co.uk' },
        { name: 'Guides', url: 'https://jerrycanspirits.co.uk/guides' },
        { name: guide.title, url: `https://jerrycanspirits.co.uk/guides/${slug}` }
      ]} />

      {/* FAQ Schema */}
      {guide.faqs && guide.faqs.length > 0 && (
        <StructuredData
          data={{
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
          }}
          id="faq-schema"
        />
      )}

      <main className="min-h-screen py-20">
        {/* Breadcrumb Navigation */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <nav className="text-sm text-parchment-400">
            <Link href="/" className="hover:text-gold-300 transition-colors">Home</Link>
            <span className="mx-2">→</span>
            <Link href="/guides" className="hover:text-gold-300 transition-colors">Guides</Link>
            <span className="mx-2">→</span>
            <span className="text-gold-300">{guide.title}</span>
          </nav>
        </div>

        {/* Hero Section */}
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category & Meta */}
          <div className="flex items-center gap-4 mb-6">
            <span className="px-3 py-1 bg-gold-500/20 border border-gold-500/40 text-gold-400 rounded-full text-sm font-semibold uppercase tracking-wider">
              {guide.category.replace('-', ' ')}
            </span>
            {guide.isPillar && (
              <span className="px-3 py-1 bg-gold-500 text-jerry-green-900 rounded-full text-xs font-semibold uppercase tracking-wide">
                📍 Pillar Content
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">
            {guide.title}
          </h1>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-parchment-400 mb-8 pb-8 border-b border-gold-500/20">
            <div>
              By <span className="text-gold-400 font-semibold">{guide.author}</span>
            </div>
            {guide.publishedAt && (
              <div>
                Published {new Date(guide.publishedAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
            )}
            {guide.estimatedWordCount && (
              <div>{guide.estimatedWordCount.toLocaleString()} words</div>
            )}
          </div>

          {/* Hero Image */}
          {guide.heroImage && (
            <div className="relative h-64 md:h-96 rounded-xl overflow-hidden mb-8 border border-gold-500/20">
              <Image
                src={urlFor(guide.heroImage).url()}
                alt={guide.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 896px"
                priority
              />
            </div>
          )}

          {/* Introduction */}
          <div className="bg-gradient-to-br from-gold-500/10 to-gold-600/5 backdrop-blur-sm rounded-xl p-6 mb-12 border border-gold-500/30">
            <p className="text-lg text-parchment-200 leading-relaxed">
              {guide.introduction}
            </p>
          </div>

          {/* Main Content Sections */}
          <div className="prose prose-invert prose-gold max-w-none mb-12">
            {guide.sections.map((section, index) => (
              <section key={index} className="mb-12">
                <h2 className="text-3xl font-serif font-bold text-white mb-4" id={section.heading.toLowerCase().replace(/\s+/g, '-')}>
                  {section.heading}
                </h2>
                <p className="text-parchment-200 leading-relaxed whitespace-pre-wrap mb-6">
                  {section.content}
                </p>

                {/* Subsections */}
                {section.subsections && section.subsections.map((subsection, subIndex) => (
                  <div key={subIndex} className="ml-4 mb-6">
                    <h3 className="text-2xl font-serif font-bold text-white mb-3" id={subsection.subheading.toLowerCase().replace(/\s+/g, '-')}>
                      {subsection.subheading}
                    </h3>
                    <p className="text-parchment-200 leading-relaxed whitespace-pre-wrap">
                      {subsection.content}
                    </p>
                  </div>
                ))}
              </section>
            ))}
          </div>

          {/* Comparison Tables */}
          {guide.comparisonTables && guide.comparisonTables.length > 0 && (
            <div className="mb-12">
              <h2 className="text-3xl font-serif font-bold text-white mb-6">Comparisons</h2>
              {guide.comparisonTables.map((table, index) => (
                <div key={index} className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20 mb-6 overflow-x-auto">
                  <h3 className="text-xl font-serif font-bold text-gold-300 mb-4">{table.caption}</h3>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gold-500/30">
                        {table.headers.map((header, hIndex) => (
                          <th key={hIndex} className="py-3 px-4 text-gold-400 font-semibold">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.map((row, rIndex) => (
                        <tr key={rIndex} className="border-b border-gold-500/10 hover:bg-jerry-green-800/20 transition-colors">
                          {row.cells.map((cell, cIndex) => (
                            <td key={cIndex} className="py-3 px-4 text-parchment-200">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* Featured UK Craft Distilleries */}
          {guide.featuredDistilleries && guide.featuredDistilleries.length > 0 && (
            <div className="mb-12">
              <h2 className="text-3xl font-serif font-bold text-white mb-6">Featured UK Craft Distilleries</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {guide.featuredDistilleries.map((distillery, index) => (
                  <div key={index} className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                    <h3 className="text-xl font-serif font-bold text-white mb-2">
                      {distillery.name}
                    </h3>
                    <p className="text-gold-400 text-sm mb-3">{distillery.location}</p>
                    {distillery.speciality && (
                      <p className="text-gold-300 text-sm mb-3">
                        <span className="font-semibold">Speciality:</span> {distillery.speciality}
                      </p>
                    )}
                    <p className="text-parchment-200 leading-relaxed mb-4">
                      {distillery.description}
                    </p>
                    {distillery.website && (
                      <a
                        href={distillery.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 text-sm font-semibold transition-colors"
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
            <div className="mb-12">
              <h2 className="text-3xl font-serif font-bold text-white mb-6">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {guide.faqs.map((faq, index) => (
                  <div key={index} className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                    <h3 className="text-xl font-serif font-bold text-gold-300 mb-3">
                      {faq.question}
                    </h3>
                    <p className="text-parchment-200 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Guides */}
          {guide.relatedGuides && guide.relatedGuides.length > 0 && (
            <div className="mb-12">
              <h2 className="text-3xl font-serif font-bold text-white mb-6">Related Guides</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {guide.relatedGuides.map((related) => (
                  <Link
                    key={related._id}
                    href={`/guides/${related.slug.current}`}
                    className="group bg-jerry-green-800/20 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 hover:border-gold-400/40 transition-all"
                  >
                    <span className="text-xs font-semibold text-gold-400 uppercase tracking-wider mb-2 block">
                      {related.category.replace('-', ' ')}
                    </span>
                    <h3 className="text-lg font-serif font-bold text-white mb-2 group-hover:text-gold-300 transition-colors">
                      {related.title}
                    </h3>
                    <p className="text-parchment-300 text-sm line-clamp-2">
                      {related.excerpt}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Related Cocktails */}
          {guide.relatedCocktails && guide.relatedCocktails.length > 0 && (
            <div className="mb-12">
              <h2 className="text-3xl font-serif font-bold text-white mb-6">Try These Cocktails</h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {guide.relatedCocktails.map((cocktail) => (
                  <Link
                    key={cocktail._id}
                    href={`/field-manual/cocktails/${cocktail.slug.current}`}
                    className="group bg-jerry-green-800/20 backdrop-blur-sm rounded-lg p-4 border border-gold-500/20 hover:border-gold-400/40 transition-all flex items-center gap-3"
                  >
                    <svg className="w-8 h-8 text-gold-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                    <span className="text-parchment-200 group-hover:text-gold-300 transition-colors font-semibold">
                      {cocktail.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Call to Action */}
          {guide.callToAction && (
            <div className="bg-gradient-to-br from-gold-500/10 to-gold-600/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/30 text-center mb-12">
              <Link
                href={guide.callToAction.url}
                className="inline-block px-8 py-4 bg-gold-500 text-jerry-green-900 font-semibold rounded-lg hover:bg-gold-400 transition-colors text-lg"
              >
                {guide.callToAction.text}
              </Link>
            </div>
          )}

          {/* Back to Guides */}
          <div className="pt-8 border-t border-gold-500/20">
            <Link
              href="/guides"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500/20 border border-gold-500/40 text-gold-300 rounded-lg hover:bg-gold-500/30 transition-colors font-semibold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to All Guides
            </Link>
          </div>
        </article>

        {/* Back to Top Button */}
        <BackToTop />
      </main>
    </>
  )
}
