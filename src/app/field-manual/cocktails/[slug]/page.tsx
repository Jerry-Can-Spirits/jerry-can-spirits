import type { Metadata } from 'next'
import Link from 'next/link'
import { client } from '@/sanity/client'
import { cocktailBySlugQuery } from '@/sanity/queries'
import BackToTop from '@/components/BackToTop'
import StructuredData from '@/components/StructuredData'
import CocktailRecipeDisplay from '@/components/CocktailRecipeDisplay'
import ShareButton from '@/components/ShareButton'
import StarRating from '@/components/StarRating'
import Breadcrumbs from '@/components/Breadcrumbs'
import { notFound } from 'next/navigation'

// Types for cocktail data
interface CocktailIngredient {
  name: string
  amount: string
  description?: string
  ingredientRef?: {
    _id: string
    name: string
    slug: { current: string }
  }
}

interface CocktailVariant {
  name: string
  description: string
  difficulty: 'novice' | 'wayfinder' | 'trailblazer'
  ingredients: CocktailIngredient[]
  instructions: string[]
  note?: string
}

interface RelatedGuide {
  guide: {
    _id: string
    title: string
    slug: { current: string }
  }
  sectionAnchor?: string
  linkText?: string
}

interface SanityCocktail {
  _id: string
  name: string
  slug: { current: string }
  description: string
  difficulty: 'novice' | 'wayfinder' | 'trailblazer'
  ingredients: CocktailIngredient[]
  instructions: string[]
  glassware: {
    _id: string
    name: string
    slug: { current: string }
  }
  garnish: string
  note?: string
  variants?: CocktailVariant[]
  category?: string
  featured?: boolean
  image?: string
  relatedGuides?: RelatedGuide[]
}

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

// Cloudflare Pages edge runtime for dynamic routes
export const runtime = 'edge'

// Convert heading to URL-friendly slug for anchor links
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Generate metadata for each cocktail
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const cocktail = await client.fetch<SanityCocktail>(cocktailBySlugQuery, { slug })

  if (!cocktail) {
    return {
      title: 'Cocktail Not Found',
    }
  }

  return {
    title: `${cocktail.name} Recipe`,
    description: `${cocktail.description} Learn how to make this ${cocktail.difficulty} level rum cocktail with our step-by-step recipe. ${cocktail.variants ? `Includes ${cocktail.variants.length} variations.` : ''}`,
    alternates: {
      canonical: `https://jerrycanspirits.co.uk/field-manual/cocktails/${cocktail.slug.current}/`,
    },
    openGraph: {
      title: `${cocktail.name} Recipe | Jerry Can Spirits®`,
      description: cocktail.description,
      images: cocktail.image ? [cocktail.image] : [],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${cocktail.name} Recipe | Jerry Can Spirits®`,
      description: cocktail.description,
      images: cocktail.image ? [cocktail.image] : [],
    },
  }
}

export default async function CocktailPage({ params }: PageProps) {
  const { slug } = await params
  const cocktail = await client.fetch<SanityCocktail>(cocktailBySlugQuery, { slug })

  if (!cocktail) {
    notFound()
  }

  // Recipe Schema for SEO (Google Rich Snippets)
  const recipeSchema = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    "name": cocktail.name,
    "description": cocktail.description,
    "image": cocktail.image || "https://jerrycanspirits.co.uk/images/Logo.webp",
    "recipeCategory": cocktail.category || "Cocktail",
    "recipeCuisine": "British",
    "keywords": `${cocktail.name}, rum cocktail, ${cocktail.category}, ${cocktail.difficulty} cocktail, British rum, veteran-owned spirits`,
    "recipeIngredient": cocktail.ingredients?.map(i => `${i.amount} ${i.name}`) || [],
    "recipeInstructions": cocktail.instructions?.map((instruction, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": `Step ${index + 1}`,
      "text": instruction,
      "url": `https://jerrycanspirits.co.uk/field-manual/cocktails/${slug}/#step-${index + 1}`
    })) || [],
    "author": {
      "@type": "Organization",
      "name": "Jerry Can Spirits",
      "url": "https://jerrycanspirits.co.uk"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Jerry Can Spirits",
      "logo": {
        "@type": "ImageObject",
        "url": "https://jerrycanspirits.co.uk/images/Logo.webp"
      }
    },
    "datePublished": new Date().toISOString(),
    "prepTime": "PT5M",
    "totalTime": "PT5M",
    "recipeYield": "1 cocktail",
    "suitableForDiet": "https://schema.org/AlcoholicBeverage",
    "aggregateRating": cocktail.featured ? {
      "@type": "AggregateRating",
      "ratingValue": "5",
      "ratingCount": "1"
    } : undefined
  }

  return (
    <>
      <StructuredData data={recipeSchema} />
      <main className="min-h-screen py-20">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <Breadcrumbs
            items={[
              { label: 'Field Manual', href: '/field-manual' },
              { label: 'Cocktails', href: '/field-manual/cocktails' },
              { label: cocktail.name },
            ]}
          />
        </div>

        {/* Back to Collection Button + Share */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Link
              href="/field-manual/cocktails"
              className="inline-flex items-center gap-2 px-6 py-3 bg-jerry-green-800/40 border border-gold-500/20 text-gold-300 rounded-lg hover:bg-jerry-green-800/60 hover:border-gold-400/40 transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Browse All Cocktails
            </Link>

            <ShareButton
              title={`${cocktail.name} Recipe | Jerry Can Spirits`}
              text={`Check out this ${cocktail.name} recipe from Jerry Can Spirits!`}
              url={`https://jerrycanspirits.co.uk/field-manual/cocktails/${cocktail.slug.current}`}
            />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          {/* Recipe Display Component (Client-side for interactivity) */}
          <CocktailRecipeDisplay cocktail={cocktail} />

          {/* Related Technique Guides */}
          {cocktail.relatedGuides && cocktail.relatedGuides.length > 0 && (
            <div className="mt-6 sm:mt-8 bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gold-500/20">
              <h3 className="text-xl font-serif font-bold text-gold-300 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Master the Techniques
              </h3>
              <div className="space-y-3">
                {cocktail.relatedGuides.map((item, index) => {
                  const guideUrl = item.sectionAnchor
                    ? `/guides/${item.guide.slug.current}/#${slugify(item.sectionAnchor)}`
                    : `/guides/${item.guide.slug.current}/`
                  const displayText = item.linkText || (item.sectionAnchor ? `Learn: ${item.sectionAnchor}` : item.guide.title)

                  return (
                    <Link
                      key={index}
                      href={guideUrl}
                      className="flex items-center gap-3 p-3 bg-jerry-green-800/30 rounded-lg border border-gold-500/20 hover:bg-jerry-green-800/50 hover:border-gold-400/40 transition-all group"
                    >
                      <svg className="w-5 h-5 text-gold-400 group-hover:scale-110 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <span className="text-parchment-300 group-hover:text-gold-300 transition-colors font-semibold">
                          {displayText}
                        </span>
                        {item.sectionAnchor && (
                          <span className="text-parchment-500 text-sm ml-2">
                            in {item.guide.title}
                          </span>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Get the Rum CTA */}
          <div className="mt-6 sm:mt-8 bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-gold-500/20">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-serif font-bold text-white mb-1">Need the Rum?</h3>
                <p className="text-parchment-300 text-sm">Pick up a bottle of Expedition Spiced Rum to make this cocktail.</p>
              </div>
              <Link
                href="/shop/product/jerry-can-spirits-expedition-spiced-rum"
                className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 whitespace-nowrap"
              >
                <span>Shop Now</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Rating & Share CTA */}
          <div className="mt-6 sm:mt-8 bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 md:p-8 border border-gold-500/20 text-center">
            <h3 className="text-2xl font-serif font-bold text-white mb-4">
              Enjoyed This Recipe?
            </h3>

            {/* Star Rating */}
            <div className="mb-6 flex justify-center">
              <StarRating slug={cocktail.slug.current} />
            </div>

            <p className="text-parchment-300 mb-6">
              Explore our full collection of cocktails and discover your next favorite
            </p>
            <Link
              href="/field-manual/cocktails"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              <span>Browse All Cocktails</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Back to Top Button */}
        <BackToTop />
      </main>
    </>
  )
}
