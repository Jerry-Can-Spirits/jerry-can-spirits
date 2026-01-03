import type { Metadata } from 'next'
import Link from 'next/link'
import { client } from '@/sanity/client'
import { cocktailBySlugQuery, cocktailsQuery } from '@/sanity/queries'
import BackToTop from '@/components/BackToTop'
import StructuredData from '@/components/StructuredData'
import CocktailRecipeDisplay from '@/components/CocktailRecipeDisplay'
import ShareButton from '@/components/ShareButton'
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
}

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

// Generate static params for all cocktails
export async function generateStaticParams() {
  const cocktails = await client.fetch<SanityCocktail[]>(cocktailsQuery)

  return cocktails.map((cocktail) => ({
    slug: cocktail.slug.current,
  }))
}

// Enable ISR - revalidate every 60 seconds
export const revalidate = 60

// Generate metadata for each cocktail
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const cocktail = await client.fetch<SanityCocktail>(cocktailBySlugQuery, { slug })

  if (!cocktail) {
    return {
      title: 'Cocktail Not Found | Jerry Can Spirits',
    }
  }

  return {
    title: `${cocktail.name} Recipe | Veteran-Owned British Rum Cocktails | Jerry Can Spirits`,
    description: `${cocktail.description} Learn how to make this ${cocktail.difficulty} level rum cocktail with our step-by-step recipe. ${cocktail.variants ? `Includes ${cocktail.variants.length} variations.` : ''}`,
    alternates: {
      canonical: `https://jerrycanspirits.co.uk/cocktails/${cocktail.slug.current}`,
    },
    openGraph: {
      title: `${cocktail.name} Recipe | Jerry Can Spirits`,
      description: cocktail.description,
      images: cocktail.image ? [cocktail.image] : [],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${cocktail.name} Recipe | Jerry Can Spirits`,
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
      "text": instruction
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
          <nav className="text-sm text-parchment-400" aria-label="Breadcrumb">
            <Link href="/field-manual" className="hover:text-gold-300 transition-colors">Field Manual</Link>
            <span className="mx-2">→</span>
            <Link href="/field-manual/cocktails" className="hover:text-gold-300 transition-colors">Cocktails</Link>
            <span className="mx-2">→</span>
            <span className="text-gold-300">{cocktail.name}</span>
          </nav>
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
              url={`https://jerrycanspirits.co.uk/cocktails/${cocktail.slug.current}`}
            />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Recipe Display Component (Client-side for interactivity) */}
          <CocktailRecipeDisplay cocktail={cocktail} />

          {/* Share & Explore CTA */}
          <div className="mt-8 bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 text-center">
            <h3 className="text-2xl font-serif font-bold text-white mb-4">
              Enjoyed This Recipe?
            </h3>
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
