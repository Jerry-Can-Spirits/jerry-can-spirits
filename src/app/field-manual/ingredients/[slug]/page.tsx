import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { client } from '@/sanity/client'
import { ingredientBySlugQuery, ingredientsQuery } from '@/sanity/queries'
import { urlFor } from '@/sanity/lib/image'
import BackToTop from '@/components/BackToTop'

// Types for ingredient data
interface Ingredient {
  _id: string
  name: string
  slug: { current: string }
  category: 'spirits' | 'liqueurs' | 'bitters' | 'mixers' | 'fresh' | 'garnishes'
  description: string
  usage: string
  topTips: string[]
  recommendedBrands?: {
    budget?: string
    budgetLink?: string
    premium?: string
    premiumLink?: string
  }
  storage?: string
  image?: { asset: { url: string } }
  budgetImage?: { asset: { url: string } }
  premiumImage?: { asset: { url: string } }
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
  pairsWellWith?: string[]
  seasonality?: string
  priceRange?: {
    budget: number
    premium: number
  }
  shelfLife?: string
  videoUrl?: string
  history?: string
  professionalTip?: string
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
}

const categoryConfig = {
  spirits: 'Spirits',
  liqueurs: 'Liqueurs',
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

async function getAllIngredients(): Promise<Ingredient[]> {
  return await client.fetch(ingredientsQuery)
}

export async function generateStaticParams() {
  const ingredients = await getAllIngredients()
  return ingredients.map((item) => ({
    slug: item.slug.current,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const ingredient = await getIngredient(slug)

  if (!ingredient) {
    return {
      title: 'Ingredient Not Found | Jerry Can Spirits',
    }
  }

  return {
    title: `${ingredient.name} Guide | Jerry Can Spirits Ingredients`,
    description: ingredient.description,
    alternates: {
      canonical: `https://jerrycanspirits.co.uk/field-manual/ingredients/${slug}`,
    },
    openGraph: {
      title: `${ingredient.name} Guide | Jerry Can Spirits`,
      description: ingredient.description,
      images: ingredient.image ? [{ url: urlFor(ingredient.image).url() }] : [],
    },
  }
}

// Revalidate every 60 seconds to show new content from Sanity
export const revalidate = 60

export default async function IngredientDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const ingredient = await getIngredient(slug)

  if (!ingredient) {
    notFound()
  }

  const videoId = ingredient.videoUrl ? getYouTubeVideoId(ingredient.videoUrl) : null

  return (
    <main className="min-h-screen py-20">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <nav className="text-sm text-parchment-400">
          <Link href="/field-manual" className="hover:text-gold-300 transition-colors">Field Manual</Link>
          <span className="mx-2">→</span>
          <Link href="/field-manual/ingredients" className="hover:text-gold-300 transition-colors">Ingredients</Link>
          <span className="mx-2">→</span>
          <span className="text-gold-300">{ingredient.name}</span>
        </nav>
      </div>

      {/* Hero Section - 2 Column Layout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">

        {/* Header - Mobile Only (Desktop version is inside right column) */}
        <div className="mb-8 lg:hidden">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-4">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              {categoryConfig[ingredient.category]}
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-6">
            {ingredient.name}
          </h1>

          <p className="text-xl text-parchment-300 leading-relaxed">
            {ingredient.description}
          </p>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 items-start">

          {/* LEFT COLUMN - Sticky sidebar with key info */}
          <div className="flex flex-col gap-6 order-1 lg:order-1">
            <div className="contents lg:block lg:sticky lg:top-24 lg:space-y-6">

              {/* Main Image */}
              <div className="order-1 bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                {ingredient.image ? (
                  <div className="relative aspect-square bg-transparent rounded-lg overflow-hidden">
                    <Image
                      src={urlFor(ingredient.image).url()}
                      alt={ingredient.name}
                      fill
                      className="object-contain mix-blend-multiply p-4"
                      sizes="(max-width: 1024px) 100vw, 45vw"
                      priority
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-jerry-green-800/20 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-12 h-12 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-parchment-300">Image coming soon</p>
                    </div>
                  </div>
                )}

                {ingredient.featured && (
                  <div className="mt-4 p-3 bg-gold-500/10 border border-gold-500/30 rounded-lg">
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

              {/* Quick Facts */}
              {(ingredient.abv || ingredient.origin || ingredient.flavorProfile?.strength) && (
                <div className="order-2 bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                  <h3 className="text-lg font-serif font-bold text-gold-300 mb-4">Quick Facts</h3>
                  <div className="space-y-3">
                    {ingredient.abv && (
                      <div className="flex justify-between items-center">
                        <span className="text-parchment-300">ABV</span>
                        <span className="text-gold-400 font-semibold">{ingredient.abv}</span>
                      </div>
                    )}
                    {ingredient.origin && (
                      <div className="flex justify-between items-center">
                        <span className="text-parchment-300">Origin</span>
                        <span className="text-gold-400 font-semibold">{ingredient.origin}</span>
                      </div>
                    )}
                    {ingredient.flavorProfile?.strength && (
                      <div className="flex justify-between items-center">
                        <span className="text-parchment-300">Flavour Strength</span>
                        <span className="text-gold-400 font-semibold capitalize">{ingredient.flavorProfile.strength.replace('-', ' ')}</span>
                      </div>
                    )}
                    {ingredient.seasonality && (
                      <div className="flex justify-between items-center">
                        <span className="text-parchment-300">Season</span>
                        <span className="text-gold-400 font-semibold">{ingredient.seasonality}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Flavour Profile */}
              {ingredient.flavorProfile && (ingredient.flavorProfile.primary || ingredient.flavorProfile.tasting) && (
                <div className="order-4 bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
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

              {/* Recommended Brands */}
              {ingredient.recommendedBrands && (ingredient.recommendedBrands.budget || ingredient.recommendedBrands.premium) && (
                <div className="order-12 bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                  <h2 className="text-xl font-serif font-bold text-gold-300 mb-4">Recommended Brands</h2>
                  <div className="space-y-4">
                    {ingredient.recommendedBrands.budget && (
                      <div className="p-3 bg-jerry-green-800/30 rounded-lg border border-gold-500/20">
                        <div className="flex gap-3 items-start">
                          {/* Text Content - Left */}
                          <div className="flex-1 min-w-0">
                            <p className="text-green-400 font-semibold mb-1 text-xs">Budget Choice</p>
                            <p className="text-parchment-300 mb-3 text-sm">{ingredient.recommendedBrands.budget}</p>
                            {ingredient.recommendedBrands.budgetLink && (
                              <a
                                href={ingredient.recommendedBrands.budgetLink}
                                target="_blank"
                                rel="noopener noreferrer sponsored"
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500/20 border border-green-500/40 text-green-300 rounded-lg hover:bg-green-500/30 transition-all text-xs font-semibold"
                              >
                                Buy Now
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            )}
                          </div>

                          {/* Image - Right Aligned */}
                          {ingredient.budgetImage && (
                            <div className="relative w-20 h-20 flex-shrink-0 bg-transparent rounded-lg overflow-hidden">
                              <Image
                                src={urlFor(ingredient.budgetImage).url()}
                                alt={`${ingredient.recommendedBrands.budget} - Budget Choice`}
                                fill
                                className="object-contain mix-blend-multiply p-1"
                                sizes="80px"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {ingredient.recommendedBrands.premium && (
                      <div className="p-3 bg-jerry-green-800/30 rounded-lg border border-gold-500/20">
                        <div className="flex gap-3 items-start">
                          {/* Text Content - Left */}
                          <div className="flex-1 min-w-0">
                            <p className="text-gold-400 font-semibold mb-1 text-xs">Premium Choice</p>
                            <p className="text-parchment-300 mb-3 text-sm">{ingredient.recommendedBrands.premium}</p>
                            {ingredient.recommendedBrands.premiumLink && (
                              <a
                                href={ingredient.recommendedBrands.premiumLink}
                                target="_blank"
                                rel="noopener noreferrer sponsored"
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gold-500/20 border border-gold-500/40 text-gold-300 rounded-lg hover:bg-gold-500/30 transition-all text-xs font-semibold"
                              >
                                Buy Now
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            )}
                          </div>

                          {/* Image - Right Aligned */}
                          {ingredient.premiumImage && (
                            <div className="relative w-20 h-20 flex-shrink-0 bg-transparent rounded-lg overflow-hidden">
                              <Image
                                src={urlFor(ingredient.premiumImage).url()}
                                alt={`${ingredient.recommendedBrands.premium} - Premium Choice`}
                                fill
                                className="object-contain mix-blend-multiply p-1"
                                sizes="80px"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Affiliate Disclosure */}
                  {(ingredient.recommendedBrands.budgetLink || ingredient.recommendedBrands.premiumLink) && (
                    <div className="mt-4 pt-4 border-t border-gold-500/20">
                      <p className="text-parchment-400 text-xs leading-relaxed">
                        <strong className="text-gold-300">Affiliate Disclosure:</strong> Jerry Can Spirits participates in the Master of Malt affiliate programme. If you purchase through these links, we may earn a small commission at no extra cost to you. This helps support our content and allows us to continue creating free cocktail recipes and guides. We only recommend products we genuinely believe in.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Price Guide */}
              {ingredient.priceRange && (
                <div className="order-13 bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                  <h3 className="text-lg font-serif font-bold text-gold-300 mb-4">Price Guide</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-parchment-300">Budget Option</span>
                      <span className="text-green-400 font-semibold">£{ingredient.priceRange.budget}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-parchment-300">Premium Option</span>
                      <span className="text-gold-400 font-semibold">£{ingredient.priceRange.premium}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Storage & Handling */}
              {(ingredient.storage || ingredient.shelfLife) && (
                <div className="order-14 p-6 bg-jerry-green-800/40 rounded-xl border border-gold-500/20">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-gold-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1 space-y-3">
                      <h3 className="text-gold-300 font-semibold">Storage & Handling</h3>
                      {ingredient.storage && (
                        <p className="text-parchment-300 leading-relaxed text-sm">{ingredient.storage}</p>
                      )}
                      {ingredient.shelfLife && (
                        <div className="p-3 bg-jerry-green-800/30 rounded-lg border border-gold-500/20">
                          <p className="text-gold-400 font-semibold text-xs mb-1">Shelf Life</p>
                          <p className="text-parchment-300 text-xs">{ingredient.shelfLife}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN - Main content */}
          <div className="order-2 lg:order-2 space-y-8">

            {/* Header - Desktop Only (Mobile version is above grid) */}
            <div className="hidden lg:block">
              <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-4">
                <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
                  {categoryConfig[ingredient.category]}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-6">
                {ingredient.name}
              </h1>

              <p className="text-xl text-parchment-300 leading-relaxed">
                {ingredient.description}
              </p>
            </div>

            {/* Professional Tip Callout */}
            {ingredient.professionalTip && (
              <div className="order-3 bg-gradient-to-br from-gold-500/10 to-gold-600/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/30">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gold-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-gold-300 font-serif font-bold text-lg mb-2">Pro Tip</h3>
                    <p className="text-parchment-300 leading-relaxed">{ingredient.professionalTip}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Usage */}
            <div className="order-5 bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-gold-300 mb-4">Usage</h2>
              <p className="text-parchment-300 leading-relaxed">{ingredient.usage}</p>
            </div>

            {/* Top Tips */}
            {ingredient.topTips && ingredient.topTips.length > 0 && (
              <div className="order-6 bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-gold-300 mb-4">Top Tips</h2>
                <ul className="space-y-4">
                  {ingredient.topTips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-gold-400/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 bg-gold-400 rounded-full"></div>
                      </div>
                      <span className="text-parchment-300 leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Video Tutorial */}
            {videoId && (
              <div className="order-9 bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
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

            {/* Pairs Well With */}
            {ingredient.pairsWellWith && ingredient.pairsWellWith.length > 0 && (
              <div className="order-7 bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-gold-300 mb-4">Pairs Well With</h2>
                <div className="flex flex-wrap gap-2">
                  {ingredient.pairsWellWith.map((pairing, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-jerry-green-800/30 border border-gold-500/20 text-parchment-300 rounded-lg text-sm"
                    >
                      {pairing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Substitutions */}
            {ingredient.substitutions && ingredient.substitutions.length > 0 && (
              <div className="order-8 bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-gold-300 mb-4">Possible Substitutions</h2>
                <ul className="space-y-3">
                  {ingredient.substitutions.map((sub, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <span className="text-parchment-300 leading-relaxed">{sub}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Production Method */}
            {ingredient.productionMethod && (
              <div className="order-10 bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-gold-300 mb-4">Production Method</h2>
                <p className="text-parchment-300 leading-relaxed">{ingredient.productionMethod}</p>
              </div>
            )}

            {/* History/Context */}
            {ingredient.history && (
              <div className="order-11 bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-gold-300 mb-4">History & Context</h2>
                <p className="text-parchment-300 leading-relaxed">{ingredient.history}</p>
              </div>
            )}

            {/* Related Cocktails */}
            {ingredient.relatedCocktails && ingredient.relatedCocktails.length > 0 && (
              <div className="order-15 bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-gold-300 mb-4">Featured In These Cocktails</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {ingredient.relatedCocktails.map((cocktail) => (
                    <Link
                      key={cocktail._id}
                      href={`/field-manual/cocktails/${cocktail.slug.current}`}
                      className="flex items-center gap-3 p-3 bg-jerry-green-800/30 rounded-lg border border-gold-500/20 hover:bg-jerry-green-800/50 hover:border-gold-400/40 transition-all group"
                    >
                      <svg className="w-5 h-5 text-gold-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-parchment-300 group-hover:text-gold-300 transition-colors">{cocktail.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related Ingredients */}
            {ingredient.relatedIngredients && ingredient.relatedIngredients.length > 0 && (
              <div className="order-16 bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-gold-300 mb-4">Often Used With</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {ingredient.relatedIngredients.map((related) => (
                    <Link
                      key={related._id}
                      href={`/field-manual/ingredients/${related.slug.current}`}
                      className="flex items-center gap-3 p-3 bg-jerry-green-800/30 rounded-lg border border-gold-500/20 hover:bg-jerry-green-800/50 hover:border-gold-400/40 transition-all group"
                    >
                      <svg className="w-5 h-5 text-gold-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <span className="text-parchment-300 group-hover:text-gold-300 transition-colors">{related.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Back to Ingredients */}
            <div className="pt-6">
              <Link
                href="/field-manual/ingredients"
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
