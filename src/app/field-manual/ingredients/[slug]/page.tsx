import type { Metadata } from 'next'
import type { PortableTextBlock } from 'next-sanity'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { client } from '@/sanity/lib/client'
import { ingredientBySlugQuery, ingredientsSitemapQuery } from '@/sanity/queries'
import { urlFor } from '@/sanity/lib/image'
import BackToTop from '@/components/BackToTop'
import Breadcrumbs from '@/components/Breadcrumbs'
import FieldManualPortableText from '@/components/FieldManualPortableText'
import StructuredData from '@/components/StructuredData'
import RelatedCocktailsList from '@/components/RelatedCocktailsList'
import RelatedGuidesList, { type GuideLink } from '@/components/RelatedGuidesList'
import ReferenceContents from '@/components/ReferenceContents'
import SectionNav, { type SectionNavItem } from '@/components/SectionNav'
import { extractHeadings } from '@/lib/sanity-text'
import { OG_IMAGE_COCKTAIL } from '@/lib/og'
import { ORG_REF } from '@/lib/jsonLd'
import FAQAccordion from '@/components/FAQAccordion'
import ScrollRow from '@/components/ScrollRow'
import SectionHeading from '@/components/SectionHeading'

interface SubType {
  _id: string
  name: string
  slug: { current: string }
}

// Types for ingredient data
interface Ingredient {
  _id: string
  _createdAt: string
  name: string
  slug: { current: string }
  category: 'spirits' | 'liqueurs' | 'creme-liqueurs' | 'anise-herbal' | 'aromatics' | 'wine' | 'fortified' | 'bitters' | 'mixers' | 'fresh' | 'garnishes'
  description: string
  metaTitle?: string
  metaDescription?: string
  usage: string
  topTips: string[]
  recommendedBrands?: {
    budget?: string
    premium?: string
  }
  storage?: string
  image?: { asset: { url: string }; alt?: string }
  featured: boolean
  // Enhanced fields
  flavorProfile?: {
    primary: string[]
    tasting: string
    strength?: string
  }
  abv?: string
  origin?: string
  productionMethod?: string
  substitutions?: string[]
  seasonality?: string
  rrp?: number
  shelfLife?: string
  videoUrl?: string
  history?: string
  professionalTip?: string
  faqs?: Array<{ question: string; answer: string }>
  relatedCocktails?: Array<{
    _id: string
    name: string
    slug: { current: string }
  }>
  relatedIngredients?: Array<{
    _id: string
    name: string
    slug: { current: string }
  }>
  subTypes?: SubType[]
  relatedGuides?: GuideLink[]
  longDescription?: PortableTextBlock[]
  author?: string
}

const categoryConfig: Record<string, string> = {
  spirits: 'Spirits',
  liqueurs: 'Liqueurs',
  'creme-liqueurs': 'Crème Liqueurs',
  'anise-herbal': 'Anise & Herbal Liqueurs',
  aromatics: 'Aromatics & Essences',
  wine: 'Wine & Champagne',
  fortified: 'Fortified Wine',
  bitters: 'Bitters',
  mixers: 'Mixers',
  fresh: 'Fresh Ingredients',
  garnishes: 'Garnishes'
}

// Extract YouTube video ID from URL
function getYouTubeVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return (match && match[2].length === 11) ? match[2] : null
}

async function getIngredient(slug: string): Promise<Ingredient | null> {
  return await client.fetch(ingredientBySlugQuery, { slug })
}

export async function generateStaticParams() {
  const ingredients = await client.fetch<{ slug: { current: string } }[]>(ingredientsSitemapQuery)
  return ingredients.map(({ slug }) => ({ slug: slug.current }))
}

export const dynamicParams = true

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const ingredient = await getIngredient(slug)

  if (!ingredient) {
    return {
      title: 'Ingredient Not Found',
    }
  }

  return {
    title: ingredient.metaTitle || `${ingredient.name} Guide`,
    description: ingredient.metaDescription || ingredient.description?.slice(0, 160),
    alternates: {
      canonical: `https://jerrycanspirits.co.uk/field-manual/ingredients/${slug}/`,
    },
    openGraph: {
      title: `${ingredient.name} Guide | Jerry Can Spirits®`,
      description: ingredient.description,
      url: `https://jerrycanspirits.co.uk/field-manual/ingredients/${slug}/`,
      images: ingredient.image ? [{ url: urlFor(ingredient.image).url() }] : OG_IMAGE_COCKTAIL,
      type: 'article',
    },
  }
}

export default async function IngredientDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const ingredient = await getIngredient(slug)

  if (!ingredient) {
    notFound()
  }

  const videoId = ingredient.videoUrl ? getYouTubeVideoId(ingredient.videoUrl) : null

  // The sections in the order they appear on the page: the editorial headings
  // on the light band, then Usage, then the questions. Only headings that
  // exist on this page are listed.
  const contents = [
    ...extractHeadings(ingredient.longDescription),
    { text: 'Usage', slug: 'usage' },
    ...(ingredient.faqs && ingredient.faqs.length > 0
      ? [{ text: 'Common Questions', slug: 'common-questions' }]
      : []),
  ]

  // The reverse of the typed parent reference, resolved by the same query that
  // fetched the ingredient. Empty for anything that is not a parent.
  const subTypes = ingredient.subTypes ?? []

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${ingredient.name} — Field Manual`,
    description: ingredient.description,
    image: ingredient.image ? urlFor(ingredient.image).url() : undefined,
    datePublished: ingredient._createdAt,
    author: ORG_REF,
    publisher: ORG_REF,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://jerrycanspirits.co.uk/field-manual/ingredients/${slug}/` },
  }

  // FAQPage schema — generated from the same faqs array as the visible FAQ
  // section below, so the two can never drift apart.
  const faqSchema = ingredient.faqs?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: ingredient.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      }
    : null

  // Five bands, cut by weight rather than by kind, as on the cocktail page:
  // the hero, what the ingredient is, how to use it, where to go next, and
  // what to make with it. The first cut put the hero and a two-column stack
  // of nine panels in one dark band, so most of the page was still one dark
  // stretch with a thin light band at the tail. Each band now opens with a
  // heading so it reads as a section, and each optional band is painted only
  // when it has something in it. Usage is a required field, so the band it
  // opens always renders and the two light bands can never touch.
  const hasAbout = Boolean(
    (ingredient.longDescription && ingredient.longDescription.length > 0) ||
      (ingredient.flavorProfile && (ingredient.flavorProfile.primary || ingredient.flavorProfile.tasting)) ||
      ingredient.rrp,
  )
  const hasMore = Boolean(
    (ingredient.faqs && ingredient.faqs.length > 0) ||
      videoId ||
      (ingredient.relatedGuides && ingredient.relatedGuides.length > 0) ||
      subTypes.length > 0,
  )

  // The secondary reference, folded. It stays on the page and in the DOM, but
  // behind a question you tap, so the band it sits in reads as the practical
  // answer rather than a wall of panels.
  const referenceItems = [
    // Substitutions
    ingredient.substitutions && ingredient.substitutions.length > 0 && {
      question: 'Possible Substitutions',
      answer: (
        <ul className="space-y-3">
          {ingredient.substitutions.map((sub, index) => (
            <li key={index} className="flex items-start gap-3">
              <svg className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span className="text-parchment-300 leading-relaxed">{sub}</span>
            </li>
          ))}
        </ul>
      ),
    },

    // Recommended Brands.
    // Plenty of ingredients have no budget/premium split to make: Angostura
    // and Campari have one producer, and the answer for lime juice is a ripe
    // lime rather than a brand. Filling both tiers there meant printing the
    // same pick twice. A lone entry is therefore shown as "Recommended"
    // rather than mislabelled as the cheap option.
    ingredient.recommendedBrands && (ingredient.recommendedBrands.budget || ingredient.recommendedBrands.premium) && (() => {
      const { budget, premium } = ingredient.recommendedBrands
      const sole = budget && premium ? null : budget || premium
      return {
        question: sole ? 'Recommended Brand' : 'Recommended Brands',
        answer: (
          <div className="space-y-4">
            {sole ? (
              <div className="p-3 bg-jerry-green-800/30 rounded-lg border border-gold-500/20">
                <p className="text-gold-400 font-semibold mb-1 text-xs">Recommended</p>
                <p className="text-parchment-300 text-sm">{sole}</p>
              </div>
            ) : (
              <>
                <div className="p-3 bg-jerry-green-800/30 rounded-lg border border-gold-500/20">
                  <p className="text-green-400 font-semibold mb-1 text-xs">Budget Choice</p>
                  <p className="text-parchment-300 text-sm">{budget}</p>
                </div>
                <div className="p-3 bg-jerry-green-800/30 rounded-lg border border-gold-500/20">
                  <p className="text-gold-400 font-semibold mb-1 text-xs">Premium Choice</p>
                  <p className="text-parchment-300 text-sm">{premium}</p>
                </div>
              </>
            )}
          </div>
        ),
      }
    })(),

    // Storage & Handling
    (ingredient.storage || ingredient.shelfLife) && {
      question: 'Storage & Handling',
      answer: (
        <div className="space-y-3">
          {ingredient.storage && (
            <p className="text-parchment-300 leading-relaxed text-sm whitespace-pre-line">{ingredient.storage}</p>
          )}
          {ingredient.shelfLife && (
            <div className="p-3 bg-jerry-green-800/30 rounded-lg border border-gold-500/20">
              <p className="text-gold-400 font-semibold text-xs mb-1">Shelf Life</p>
              <p className="text-parchment-300 text-xs">{ingredient.shelfLife}</p>
            </div>
          )}
        </div>
      ),
    },

    // Production Method
    ingredient.productionMethod && {
      question: 'Production Method',
      answer: <p className="text-parchment-300 leading-relaxed whitespace-pre-line">{ingredient.productionMethod}</p>,
    },

    // History/Context
    ingredient.history && {
      question: 'History & Context',
      answer: <p className="text-parchment-300 leading-relaxed whitespace-pre-line">{ingredient.history}</p>,
    },
  ].filter((item): item is Extract<typeof item, { question: string }> => Boolean(item))

  return (
    <main>
      <StructuredData data={articleSchema} />
      {faqSchema && <StructuredData data={faqSchema} id="ingredient-faq-schema" />}
      <section className="band-dark pt-20 pb-12">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <Breadcrumbs
          items={[
            { label: 'Field Manual', href: '/field-manual' },
            { label: 'Ingredients', href: '/field-manual/ingredients' },
            { label: ingredient.name },
          ]}
        />
      </div>

      {/* Hero Section - 2 Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header - full width, above the grid */}
        <div className="mb-8">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-4">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              {categoryConfig[ingredient.category]}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-6">
            {ingredient.name}
          </h1>

          <p className="text-xl text-parchment-300 leading-relaxed whitespace-pre-line">
            {ingredient.description}
          </p>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-12 items-start">

          {/* Left Column - Image */}
          <div className="order-2 lg:order-1 space-y-6">
              {/* Image and badge panel. Over half the ingredient documents have
                  no image, and the template used to fill the gap with a framed
                  "Image coming soon" placeholder sitting directly beneath the
                  opening paragraph — the copy an answer engine lifts. A text
                  page reads fine without an image, so when there is nothing to
                  put in the panel the panel itself is not rendered: guarding
                  only the image would leave an empty bordered box in its place.
                  The featured badge shares the panel, so it keeps the panel
                  alive on its own. */}
              {(ingredient.image || ingredient.featured) && (
                <div className="bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                  {ingredient.image && (
                    <div className="relative aspect-square bg-transparent rounded-lg overflow-hidden">
                      <Image
                        src={urlFor(ingredient.image).url()}
                        alt={ingredient.image?.alt || ingredient.name}
                        fill
                        className="object-contain mix-blend-multiply p-4"
                        sizes="(max-width: 1024px) 100vw, 45vw"
                        priority
                      />
                    </div>
                  )}

                  {ingredient.featured && (
                    <div className={`${ingredient.image ? 'mt-4 ' : ''}p-3 bg-gold-500/10 border border-gold-500/30 rounded-lg`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">★</span>
                        <div>
                          <h3 className="text-gold-300 font-semibold text-sm">Essential Ingredient</h3>
                          <p className="text-parchment-300 text-xs">A staple for any well-stocked bar</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
          </div>

          {/* Right Column - Contents and Quick Facts */}
          <div className="order-1 lg:order-2 space-y-6">
              <ReferenceContents items={contents} />

              {/* Quick Facts */}
              {(ingredient.abv || ingredient.origin || ingredient.flavorProfile?.strength) && (
                <div className="bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                  <h3 className="text-lg font-serif font-bold text-gold-300 mb-4">Quick Facts</h3>
                  <div className="space-y-3">
                    {ingredient.abv && (
                      <div className="flex justify-between items-baseline gap-6">
                        <span className="text-parchment-300 shrink-0">ABV</span>
                        <span className="text-gold-400 font-semibold text-right">{ingredient.abv}</span>
                      </div>
                    )}
                    {ingredient.origin && (
                      <div className="flex justify-between items-baseline gap-6">
                        <span className="text-parchment-300 shrink-0">Origin</span>
                        <span className="text-gold-400 font-semibold text-right">{ingredient.origin}</span>
                      </div>
                    )}
                    {ingredient.flavorProfile?.strength && (
                      <div className="flex justify-between items-baseline gap-6">
                        <span className="text-parchment-300 shrink-0">Flavour Strength</span>
                        <span className="text-gold-400 font-semibold text-right capitalize">{ingredient.flavorProfile.strength.replace('-', ' ')}</span>
                      </div>
                    )}
                    {ingredient.seasonality && (
                      <div className="flex justify-between items-baseline gap-6">
                        <span className="text-parchment-300 shrink-0">Season</span>
                        <span className="text-gold-400 font-semibold text-right">{ingredient.seasonality}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
      </section>

      {/* Pinned under the header through every band below, on a phone too,
          which the contents rail in the first band never was. */}
      <SectionNav
        items={[
          hasAbout && { id: 'about', label: 'About' },
          { id: 'using', label: 'Using it' },
          hasMore && { id: 'explore', label: 'More to explore' },
          { id: 'made-with', label: 'Made with' },
        ].filter((i): i is SectionNavItem => Boolean(i))}
      />

      {hasAbout && (
      <section id="about" className="band-light py-12 scroll-mt-36">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="The ingredient">About {ingredient.name}</SectionHeading>

          <div className="space-y-8">
            {/* Flavour Profile */}
            {ingredient.flavorProfile && (ingredient.flavorProfile.primary || ingredient.flavorProfile.tasting) && (
              <div className="bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h2 className="text-xl font-serif font-bold text-gold-300 mb-4">Flavour Profile</h2>
                <div className="space-y-4">
                  {ingredient.flavorProfile.primary && ingredient.flavorProfile.primary.length > 0 && (
                    <div>
                      <h3 className="text-gold-400 font-semibold mb-3 text-sm">Primary Flavours</h3>
                      <div className="flex flex-wrap gap-2">
                        {ingredient.flavorProfile.primary.map((flavor, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gold-500/20 border border-gold-500/40 text-gold-300 rounded-full text-sm font-semibold"
                          >
                            {flavor}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {ingredient.flavorProfile.tasting && (
                    <div>
                      <h3 className="text-gold-400 font-semibold mb-2 text-sm">Tasting Notes</h3>
                      <p className="text-parchment-300 leading-relaxed text-sm">{ingredient.flavorProfile.tasting}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* RRP — named branded products with a single price */}
            {ingredient.rrp && (
              <div className="bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h2 className="text-xl font-serif font-bold text-gold-300 mb-4">Price</h2>
                <span className="inline-flex items-center px-3 py-1.5 bg-gold-500/20 border border-gold-500/30 rounded-sm text-gold-400 text-sm font-semibold">
                  RRP £{ingredient.rrp}
                </span>
              </div>
            )}

            {/* Long Description - Rich editorial content from Sanity */}
            {ingredient.longDescription && ingredient.longDescription.length > 0 && (
              <div className="bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <FieldManualPortableText value={ingredient.longDescription} />
              </div>
            )}
          </div>
        </div>
      </section>
      )}

      <section id="using" className="band-dark py-12 scroll-mt-36">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Using it">Using {ingredient.name}</SectionHeading>

          <div className="space-y-8">
            {/* Usage — the practical answer comes first */}
            <div className="bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
              <h2 id="usage" className="text-2xl font-serif font-bold text-gold-300 mb-4 scroll-mt-24">Usage</h2>
              <p className="text-parchment-300 leading-relaxed whitespace-pre-line">{ingredient.usage}</p>
            </div>

            {/* Professional Tip Callout */}
            {ingredient.professionalTip && (
              <div className="bg-linear-to-br from-gold-500/10 to-gold-600/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/30">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gold-500/20 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-gold-300 font-serif font-bold text-lg mb-2">Pro Tip</h3>
                    <p className="text-parchment-300 leading-relaxed whitespace-pre-line">{ingredient.professionalTip}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Top Tips */}
            {ingredient.topTips && ingredient.topTips.length > 0 && (
              <div className="bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-gold-300 mb-4">Top Tips</h2>
                <ul className="space-y-4">
                  {ingredient.topTips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-gold-400/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <div className="w-2 h-2 bg-gold-400 rounded-full"></div>
                      </div>
                      <span className="text-parchment-300 leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Substitutions, brands, storage, production and history, folded */}
            {referenceItems.length > 0 && <FAQAccordion items={referenceItems} />}
          </div>
        </div>
      </section>

      {hasMore && (
      <section id="explore" className="band-light py-12 scroll-mt-36">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Go further">More to explore</SectionHeading>

          <div className="space-y-8">
            {/* FAQs — single source for the visible Q&As and the FAQPage schema */}
            {ingredient.faqs && ingredient.faqs.length > 0 && (
              <div className="bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h2 id="common-questions" className="text-2xl font-serif font-bold text-gold-300 mb-4 scroll-mt-24">Common Questions</h2>
                <FAQAccordion items={ingredient.faqs} />
              </div>
            )}

            {/* Video Tutorial */}
            {videoId && (
              <div className="bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-gold-300 mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  Video Guide
                </h2>
                <div className="relative aspect-video rounded-lg overflow-hidden bg-jerry-green-800/20">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={`${ingredient.name} Guide`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              </div>
            )}

            {/* Related Technique Guides */}
            {ingredient.relatedGuides && ingredient.relatedGuides.length > 0 && (
              <div className="bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-gold-300 mb-4">From the Guides</h2>
                <RelatedGuidesList guides={ingredient.relatedGuides} />
              </div>
            )}

            {/* Styles of this ingredient. Only the six parent pages have
                sub-types, and every other ingredient renders nothing at all
                here — no heading, no panel, no reserved space. */}
            {subTypes.length > 0 && (
              <div className="bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-gold-300 mb-4">
                  Styles of {ingredient.name.toLowerCase()}
                </h2>
                <ScrollRow
                  ariaLabel={`Styles of ${ingredient.name.toLowerCase()}`}
                  cols="md:grid-cols-2"
                  items={subTypes.map((subType) => (
                    <Link
                      key={subType._id}
                      href={`/field-manual/ingredients/${subType.slug.current}/`}
                      className="h-full flex items-center gap-3 p-3 bg-jerry-green-800/30 rounded-lg border border-gold-500/20 hover:bg-jerry-green-800/50 hover:border-gold-400/40 transition-all group"
                    >
                      <svg className="w-5 h-5 text-gold-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <span className="text-parchment-300 group-hover:text-gold-300 transition-colors">{subType.name}</span>
                    </Link>
                  ))}
                />
              </div>
            )}
          </div>
        </div>
      </section>
      )}

      <section id="made-with" className="band-dark py-12 scroll-mt-36">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Make something">Made with {ingredient.name}</SectionHeading>

          <div className="space-y-8">
            {/* Related Cocktails */}
            {ingredient.relatedCocktails && ingredient.relatedCocktails.length > 0 && (
              <div className="bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-gold-300 mb-4">Featured In These Cocktails</h2>
                <RelatedCocktailsList cocktails={ingredient.relatedCocktails} />
              </div>
            )}

            {/* Related Ingredients */}
            {ingredient.relatedIngredients && ingredient.relatedIngredients.some(r => r?.slug?.current) && (
              <div className="bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-gold-300 mb-4">Often Used With</h2>
                <ScrollRow
                  ariaLabel="Often used with"
                  cols="md:grid-cols-2"
                  items={ingredient.relatedIngredients.filter(r => r?.slug?.current).map((related) => (
                    <Link
                      key={related._id}
                      href={`/field-manual/ingredients/${related.slug.current}/`}
                      className="h-full flex items-center gap-3 p-3 bg-jerry-green-800/30 rounded-lg border border-gold-500/20 hover:bg-jerry-green-800/50 hover:border-gold-400/40 transition-all group"
                    >
                      <svg className="w-5 h-5 text-gold-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <span className="text-parchment-300 group-hover:text-gold-300 transition-colors">{related.name}</span>
                    </Link>
                  ))}
                />
              </div>
            )}

            {/* Author byline */}
            {ingredient.author && (
              <p className="text-parchment-500 text-sm text-right">
                Guide by {ingredient.author}
              </p>
            )}

            {/* Back to Ingredients */}
            <div className="pt-6">
              <Link
                href="/field-manual/ingredients/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500/20 border border-gold-500/40 text-gold-300 rounded-lg hover:bg-gold-500/30 transition-colors font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Ingredients Guide
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Back to Top Button */}
      <BackToTop />
    </main>
  )
}
