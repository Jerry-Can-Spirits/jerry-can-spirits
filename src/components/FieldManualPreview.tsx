import Link from 'next/link'
import Image from 'next/image'
import { client } from '@/sanity/client'
import { cocktailsQuery } from '@/sanity/queries'

interface CocktailPreview {
  _id: string
  name: string
  slug: { current: string }
  description: string
  difficulty: 'novice' | 'wayfinder' | 'trailblazer'
  image?: string
  featured?: boolean
}

async function getFeaturedCocktails() {
  const cocktails = await client.fetch<CocktailPreview[]>(cocktailsQuery)
  // Get 3 featured cocktails, or first 3 if no featured ones
  const featured = cocktails.filter(c => c.featured).slice(0, 3)
  return featured.length >= 3 ? featured : cocktails.slice(0, 3)
}

async function getTotalCocktailCount() {
  const cocktails = await client.fetch<CocktailPreview[]>(cocktailsQuery)
  return cocktails.length
}

export default async function FieldManualPreview() {
  const cocktails = await getFeaturedCocktails()
  const totalCount = await getTotalCocktailCount()

  // Round down to nearest 10 for marketing copy
  const roundedCount = Math.floor(totalCount / 10) * 10

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'novice': return 'text-green-400 border-green-400/40 bg-green-400/10'
      case 'wayfinder': return 'text-yellow-400 border-yellow-400/40 bg-yellow-400/10'
      case 'trailblazer': return 'text-red-400 border-red-400/40 bg-red-400/10'
      default: return 'text-gold-400 border-gold-400/40 bg-gold-400/10'
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'novice': return 'Novice'
      case 'wayfinder': return 'Wayfinder'
      case 'trailblazer': return 'Trailblazer'
      default: return difficulty
    }
  }

  return (
    <section className="py-16 bg-jerry-green-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Field Manual
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
            Master the Classics
          </h2>

          <p className="text-xl text-parchment-300 max-w-3xl mx-auto leading-relaxed mb-8">
            Explore our comprehensive cocktail guide. From timeless classics to bold innovations,
            each recipe is engineered for perfection.
          </p>
        </div>

        {/* Cocktail Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {cocktails.map((cocktail) => (
            <Link
              key={cocktail._id}
              href={`/cocktails/${cocktail.slug.current}`}
              className="group bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl border border-gold-500/20 overflow-hidden hover:border-gold-400/40 transition-all duration-300 hover:scale-105"
            >
              {/* Image */}
              {cocktail.image && (
                <div className="relative aspect-[4/3] bg-jerry-green-800/20">
                  <Image
                    src={cocktail.image}
                    alt={cocktail.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-6 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-xl font-serif font-bold text-white group-hover:text-gold-300 transition-colors">
                    {cocktail.name}
                  </h3>
                  <span className={`px-2 py-1 rounded-full border text-xs font-semibold whitespace-nowrap ${getDifficultyColor(cocktail.difficulty)}`}>
                    {getDifficultyLabel(cocktail.difficulty)}
                  </span>
                </div>

                <p className="text-parchment-300 text-sm leading-relaxed line-clamp-2">
                  {cocktail.description}
                </p>

                <div className="flex items-center gap-2 text-gold-300 text-sm font-semibold pt-2">
                  <span>View Recipe</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA to Full Field Manual */}
        <div className="text-center">
          <Link
            href="/field-manual"
            className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-jerry-green-900 rounded-lg font-semibold uppercase tracking-wide transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            Explore Full Field Manual
            <svg
              className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <p className="text-parchment-400 text-sm mt-4">
            Over {roundedCount} expertly crafted cocktail recipes with detailed guides
          </p>
        </div>
      </div>
    </section>
  )
}
