import { notFound } from 'next/navigation'
import * as Sentry from '@sentry/nextjs'
import { requireTradeSession } from '@/lib/trade-portal/session-check'
import { isTradeCocktailSlug } from '@/lib/trade-portal/cocktail-cards'
import { CocktailCard, type CocktailCardData } from '@/components/trade-portal/CocktailCard'
import { client as sanityClient } from '@/sanity/lib/client'
import { cocktailBySlugQuery } from '@/sanity/queries'

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ slug: string }>
}

interface SanityCocktail extends CocktailCardData {
  _id: string
}

async function fetchCocktail(slug: string): Promise<SanityCocktail | null> {
  try {
    return await sanityClient.fetch<SanityCocktail | null>(cocktailBySlugQuery, { slug })
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: 'trade-cocktail-card', phase: 'sanity-fetch' },
      extra: { slug },
    })
    return null
  }
}

export default async function TradeCocktailCardPage({ params }: Params) {
  await requireTradeSession()
  const { slug } = await params
  if (!isTradeCocktailSlug(slug)) notFound()
  const cocktail = await fetchCocktail(slug)
  if (!cocktail) notFound()
  return <CocktailCard cocktail={cocktail} />
}
