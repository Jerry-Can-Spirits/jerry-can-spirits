import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { client } from '@/sanity/client'
import { equipmentBySlugQuery, equipmentQuery } from '@/sanity/queries'
import { urlFor } from '@/sanity/lib/image'
import BackToTop from '@/components/BackToTop'

// Types for equipment data
interface Equipment {
  _id: string
  name: string
  slug: { current: string }
  category: 'shaking' | 'straining' | 'measuring' | 'glassware' | 'tools' | 'garnish'
  description: string
  usage: string
  essential: boolean
  specifications?: {
    material?: string
    capacity?: string
    details?: string
  }
  tips: string[]
  image?: { asset: { url: string } }
  featured: boolean
  // Enhanced fields
  priceRange?: {
    budget: number
    premium: number
  }
  whatToLookFor?: string[]
  commonMistakes?: string[]
  careInstructions?: string[] | string  // Support both old (string) and new (array) format
  lifespan?: string[] | string  // Support both old (string) and new (array) format
  budgetAlternative?: string
  premiumOption?: string
  history?: string
  professionalTip?: string
  videoUrl?: string
  relatedCocktails?: Array<{
    _id: string
    name: string
    slug: { current: string }
  }>
}

const categoryConfig = {
  shaking: 'Shaking & Mixing',
  straining: 'Straining',
  measuring: 'Measuring',
  glassware: 'Glassware',
  tools: 'Bar Tools',
  garnish: 'Garnish Tools'
}

// Extract YouTube video ID from URL
function getYouTubeVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return (match && match[2].length === 11) ? match[2] : null
}

async function getEquipment(slug: string): Promise<Equipment | null> {
  return await client.fetch(equipmentBySlugQuery, { slug })
}

async function getAllEquipment(): Promise<Equipment[]> {
  return await client.fetch(equipmentQuery)
}

// Cloudflare Pages requires explicit static config for SSG routes
export const dynamicParams = false
export const revalidate = false // Fully static, no ISR

export async function generateStaticParams() {
  const equipment = await getAllEquipment()
  return equipment.map((item) => ({
    slug: item.slug.current,
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const equipment = await getEquipment(slug)

  if (!equipment) {
    return {
      title: 'Equipment Not Found | Jerry Can Spirits',
    }
  }

  return {
    title: `${equipment.name} Guide | Jerry Can Spirits Bar Equipment`,
    description: equipment.description,
    alternates: {
      canonical: `https://jerrycanspirits.co.uk/field-manual/equipment/${slug}`,
    },
    openGraph: {
      title: `${equipment.name} Guide | Jerry Can Spirits`,
      description: equipment.description,
      images: equipment.image ? [{ url: urlFor(equipment.image).url() }] : [],
    },
  }
}

export default async function EquipmentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const equipment = await getEquipment(slug)

  if (!equipment) {
    notFound()
  }

  const videoId = equipment.videoUrl ? getYouTubeVideoId(equipment.videoUrl) : null

  return (
    <main className="min-h-screen py-20">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <nav className="text-sm text-parchment-400">
          <Link href="/field-manual" className="hover:text-gold-300 transition-colors">Field Manual</Link>
          <span className="mx-2">→</span>
          <Link href="/field-manual/equipment" className="hover:text-gold-300 transition-colors">Equipment</Link>
          <span className="mx-2">→</span>
          <span className="text-gold-300">{equipment.name}</span>
        </nav>
      </div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Image and Sticky Info */}
          <div className="lg:order-1">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Image Section - Mobile Order 1 */}
              <div className="order-1 bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
                {equipment.image ? (
                  <div className="relative aspect-square bg-jerry-green-800/20 rounded-lg overflow-hidden">
                    <Image
                      src={urlFor(equipment.image).url()}
                      alt={equipment.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-jerry-green-800/20 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-12 h-12 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-parchment-300">Image coming soon</p>
                    </div>
                  </div>
                )}

                {equipment.essential && (
                  <div className="mt-6 p-4 bg-gold-500/10 border border-gold-500/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">★</span>
                      <div>
                        <h3 className="text-gold-300 font-semibold">Essential Equipment</h3>
                        <p className="text-parchment-300 text-sm">Recommended for every home bar</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Price Range - Mobile Order 11 */}
              {equipment.priceRange && (
                <div className="order-[11] lg:order-none bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                  <h3 className="text-lg font-serif font-bold text-gold-300 mb-4">Price Guide</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-parchment-300">Budget Option</span>
                      <span className="text-green-400 font-semibold">£{equipment.priceRange.budget}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-parchment-300">Premium Option</span>
                      <span className="text-gold-400 font-semibold">£{equipment.priceRange.premium}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Alternatives - Mobile Order 12 */}
              {(equipment.budgetAlternative || equipment.premiumOption) && (
                <div className="order-[12] lg:order-none bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                  <h3 className="text-lg font-serif font-bold text-gold-300 mb-4">Alternatives</h3>
                  <div className="space-y-4">
                    {equipment.budgetAlternative && (
                      <div>
                        <p className="text-green-400 font-semibold text-sm mb-1">Budget Alternative</p>
                        <p className="text-parchment-300">{equipment.budgetAlternative}</p>
                      </div>
                    )}
                    {equipment.premiumOption && (
                      <div>
                        <p className="text-gold-400 font-semibold text-sm mb-1">Premium Option</p>
                        <p className="text-parchment-300">{equipment.premiumOption}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Care & Maintenance - Mobile Order 10, Desktop here */}
              {(equipment.careInstructions || equipment.lifespan) && (
                <div className="order-[10] lg:order-none bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                  <h2 className="text-2xl font-serif font-bold text-gold-300 mb-4">Care & Maintenance</h2>
                  <div className="space-y-4">
                    {equipment.careInstructions && (
                      <div>
                        <h3 className="text-gold-400 font-semibold mb-4">Care Instructions</h3>
                        {Array.isArray(equipment.careInstructions) ? (
                          <ul className="space-y-4">
                            {equipment.careInstructions.map((instruction, index) => (
                              <li key={index} className="pl-4 border-l-2 border-gold-500/30">
                                <span className="text-parchment-300 leading-relaxed block">{instruction}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-parchment-300 leading-relaxed">{equipment.careInstructions}</p>
                        )}
                      </div>
                    )}
                    {equipment.lifespan && (
                      <div className="p-4 bg-jerry-green-800/30 rounded-lg border border-gold-500/20">
                        <p className="text-gold-400 font-semibold mb-3">Expected Lifespan</p>
                        {Array.isArray(equipment.lifespan) ? (
                          <ul className="space-y-2">
                            {equipment.lifespan.map((span, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-gold-400 mt-1">•</span>
                                <span className="text-parchment-300">{span}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-parchment-300">{equipment.lifespan}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:order-2 space-y-8 flex flex-col">
            {/* Header - Mobile Order 2 */}
            <div className="order-2 lg:order-none">
              <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-4">
                <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
                  {categoryConfig[equipment.category]}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-6">
                {equipment.name}
              </h1>

              <p className="text-xl text-parchment-300 leading-relaxed">
                {equipment.description}
              </p>
            </div>

            {/* Video Tutorial */}
            {videoId && (
              <div className="lg:order-none bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-gold-300 mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  Video Tutorial
                </h2>
                <div className="relative aspect-video rounded-lg overflow-hidden bg-jerry-green-800/20">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={`${equipment.name} Tutorial`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              </div>
            )}

            {/* Professional Tip Callout - Mobile Order 3 */}
            {equipment.professionalTip && (
              <div className="order-3 lg:order-none bg-gradient-to-br from-gold-500/10 to-gold-600/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/30">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gold-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-gold-300 font-serif font-bold text-lg mb-2">Pro Tip</h3>
                    <p className="text-parchment-300 leading-relaxed">{equipment.professionalTip}</p>
                  </div>
                </div>
              </div>
            )}

            {/* History/Context - Mobile Order 4 */}
            {equipment.history && (
              <div className="order-4 lg:order-none bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-gold-300 mb-4">History & Context</h2>
                <p className="text-parchment-300 leading-relaxed">{equipment.history}</p>
              </div>
            )}

            {/* Specifications - Mobile Order 5 */}
            {equipment.specifications && (equipment.specifications.material || equipment.specifications.capacity || equipment.specifications.details) && (
              <div className="order-5 lg:order-none bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-gold-300 mb-4">Specifications</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {equipment.specifications.material && (
                    <div className="p-4 bg-jerry-green-800/30 rounded-lg border border-gold-500/20">
                      <p className="text-gold-400 font-semibold mb-1">Material</p>
                      <p className="text-parchment-300 text-sm">{equipment.specifications.material}</p>
                    </div>
                  )}
                  {equipment.specifications.capacity && (
                    <div className="p-4 bg-jerry-green-800/30 rounded-lg border border-gold-500/20">
                      <p className="text-gold-400 font-semibold mb-1">Capacity</p>
                      <p className="text-parchment-300 text-sm">{equipment.specifications.capacity}</p>
                    </div>
                  )}
                  {equipment.specifications.details && (
                    <div className="p-4 bg-jerry-green-800/30 rounded-lg border border-gold-500/20">
                      <p className="text-gold-400 font-semibold mb-1">Details</p>
                      <p className="text-parchment-300 text-sm">{equipment.specifications.details}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Usage - Mobile Order 6 */}
            <div className="order-6 lg:order-none bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-gold-300 mb-4">Usage</h2>
              <p className="text-parchment-300 leading-relaxed">{equipment.usage}</p>
            </div>

            {/* What to Look For - Mobile Order 7 */}
            {equipment.whatToLookFor && equipment.whatToLookFor.length > 0 && (
              <div className="order-7 lg:order-none bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-gold-300 mb-4">What to Look For</h2>
                <ul className="space-y-4">
                  {equipment.whatToLookFor.map((item, index) => (
                    <li key={index} className="pl-4 border-l-2 border-gold-500/30">
                      <span className="text-parchment-300 leading-relaxed block">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Common Mistakes - Mobile Order 8 */}
            {equipment.commonMistakes && equipment.commonMistakes.length > 0 && (
              <div className="order-8 lg:order-none bg-gradient-to-br from-red-500/10 to-red-600/5 backdrop-blur-sm rounded-xl p-6 border border-red-500/20">
                <h2 className="text-2xl font-serif font-bold text-red-400 mb-4">Common Mistakes to Avoid</h2>
                <ul className="space-y-4">
                  {equipment.commonMistakes.map((mistake, index) => (
                    <li key={index} className="pl-4 border-l-2 border-red-500/40">
                      <span className="text-parchment-300 leading-relaxed block">{mistake}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Professional Tips - Mobile Order 9 */}
            {equipment.tips && equipment.tips.length > 0 && (
              <div className="order-9 lg:order-none bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-gold-300 mb-4">Professional Tips</h2>
                <ul className="space-y-4">
                  {equipment.tips.map((tip, index) => (
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

            {/* Related Cocktails - Mobile Order 13 */}
            {equipment.relatedCocktails && equipment.relatedCocktails.length > 0 && (
              <div className="order-[13] lg:order-none bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
                <h2 className="text-2xl font-serif font-bold text-gold-300 mb-4">Used In These Cocktails</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {equipment.relatedCocktails.map((cocktail) => (
                    <Link
                      key={cocktail._id}
                      href={`/cocktails/${cocktail.slug.current}`}
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

            {/* Back to Equipment - Mobile Order 14 */}
            <div className="order-[14] lg:order-none pt-6">
              <Link
                href="/field-manual/equipment"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500/20 border border-gold-500/40 text-gold-300 rounded-lg hover:bg-gold-500/30 transition-colors font-semibold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Equipment Guide
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
