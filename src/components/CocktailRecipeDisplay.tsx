'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

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

interface Props {
  cocktail: SanityCocktail
}

export default function CocktailRecipeDisplay({ cocktail }: Props) {
  const [activeVariant, setActiveVariant] = useState<number>(-1) // -1 for original, 0+ for variants

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'novice': return 'text-green-400'
      case 'wayfinder': return 'text-yellow-400'
      case 'trailblazer': return 'text-red-400'
      default: return 'text-gold-400'
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

  const currentRecipe = activeVariant >= 0 && cocktail?.variants
    ? cocktail.variants[activeVariant]
    : cocktail

  return (
    <div className="space-y-8">
      {/* Cocktail Header */}
      <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100/5 to-amber-200/10 opacity-50"></div>
        <div className="relative z-10">
          {cocktail?.image && (
            <div className="mb-6">
              <Image
                src={cocktail.image}
                alt={`${cocktail.name} cocktail recipe - Jerry Can Spirits`}
                width={800}
                height={400}
                className="rounded-lg w-full object-cover"
                sizes="(max-width: 768px) 100vw, 800px"
                priority
              />
            </div>
          )}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-serif font-bold text-white mb-2">
                {activeVariant >= 0 ? currentRecipe.name : cocktail?.name}
              </h1>
              {activeVariant >= 0 && (
                <p className="text-gold-300 text-sm font-semibold mb-2">
                  Based on {cocktail?.name}
                </p>
              )}
              {cocktail.featured && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold-500/20 border border-gold-500/40 rounded-full mb-4">
                  <span className="text-gold-400">★</span>
                  <span className="text-gold-300 text-sm font-semibold">Signature Cocktail</span>
                </div>
              )}
              <p className="text-parchment-300 text-lg leading-relaxed">
                {currentRecipe.description}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full border text-sm font-semibold whitespace-nowrap ml-4 ${getDifficultyColor(cocktail?.difficulty || '')}`}>
              {getDifficultyLabel(cocktail?.difficulty || '')}
            </span>
          </div>

          {/* Variant Selector */}
          {cocktail?.variants && cocktail.variants.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-serif font-bold text-gold-300 mb-3">Variations</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveVariant(-1)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    activeVariant === -1
                      ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40'
                      : 'bg-jerry-green-800/40 text-parchment-300 border border-gold-500/20 hover:bg-jerry-green-800/60'
                  }`}
                >
                  Classic
                </button>
                {cocktail.variants.map((variant, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveVariant(index)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                      activeVariant === index
                        ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40'
                        : 'bg-jerry-green-800/40 text-parchment-300 border border-gold-500/20 hover:bg-jerry-green-800/60'
                    }`}
                  >
                    {variant.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recipe Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-parchment-300">
                <strong className="text-gold-300">Glassware:</strong>{' '}
                {cocktail?.glassware ? (
                  <Link
                    href={`/field-manual/equipment/${cocktail.glassware.slug.current}`}
                    className="text-blue-400 hover:text-blue-300 underline transition-colors"
                  >
                    {cocktail.glassware.name}
                  </Link>
                ) : (
                  'Not specified'
                )}
              </p>
              <p className="text-parchment-300"><strong className="text-gold-300">Garnish:</strong> {cocktail?.garnish}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ingredients */}
      <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100/5 to-amber-200/10 opacity-50"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-serif font-bold text-white mb-6">Ingredients</h2>

          <div className="space-y-4">
            {currentRecipe.ingredients?.map((ingredient, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-jerry-green-800/30 rounded-lg border border-gold-500/20">
                <div className="w-2 h-2 bg-gold-400 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-grow">
                  <div className="flex items-center justify-between mb-1">
                    {ingredient.ingredientRef ? (
                      <Link
                        href={`/field-manual/ingredients/${ingredient.ingredientRef.slug.current}`}
                        className="font-semibold text-blue-400 hover:text-blue-300 underline decoration-dotted underline-offset-2 transition-colors"
                        title={`Learn more about ${ingredient.name}`}
                      >
                        {ingredient.name}
                      </Link>
                    ) : (
                      <span className="font-semibold text-white">{ingredient.name}</span>
                    )}
                    <span className="text-gold-300 font-semibold">{ingredient.amount}</span>
                  </div>
                  {ingredient.description && (
                    <p className="text-parchment-300 text-sm">{ingredient.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-100/5 to-amber-200/10 opacity-50"></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-serif font-bold text-white mb-6">Instructions</h2>

          <div className="space-y-4">
            {currentRecipe.instructions?.map((instruction, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-gold-400/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-gold-400 font-bold text-sm">{index + 1}</span>
                </div>
                <p className="text-parchment-300 leading-relaxed pt-1">{instruction}</p>
              </div>
            ))}
          </div>

          {(currentRecipe.note || (activeVariant >= 0 && cocktail?.variants?.[activeVariant]?.note)) && (
            <div className="mt-8 p-6 bg-jerry-green-800/40 rounded-lg border border-gold-500/20">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-gold-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-gold-300 font-semibold mb-2">Expert Tip</h4>
                  <p className="text-parchment-300 leading-relaxed">
                    {activeVariant >= 0 && cocktail?.variants?.[activeVariant]?.note
                      ? cocktail.variants[activeVariant].note
                      : currentRecipe.note}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
