import 'server-only'
import { client as sanityClient } from '@/sanity/lib/client'

interface SanityCocktail {
  name: string
  slug: string
}

let cache: { entries: SanityCocktail[]; expiresAt: number } | null = null
const CACHE_TTL_MS = 15 * 60 * 1000

function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function loadCatalog(): Promise<SanityCocktail[]> {
  if (cache && cache.expiresAt > Date.now()) return cache.entries
  const result = await sanityClient.fetch<SanityCocktail[]>(
    `*[_type == "cocktail" && defined(slug.current)]{ name, "slug": slug.current }`
  )
  cache = { entries: result, expiresAt: Date.now() + CACHE_TTL_MS }
  return result
}

export async function matchFieldManualSlug(cocktailName: string): Promise<string | null> {
  if (!cocktailName.trim()) return null
  const catalog = await loadCatalog()
  const target = normaliseName(cocktailName)
  const exact = catalog.find((c) => normaliseName(c.name) === target)
  return exact?.slug ?? null
}

export function fieldManualUrl(slug: string): string {
  return `https://jerrycanspirits.co.uk/field-manual/cocktails/${slug}`
}
