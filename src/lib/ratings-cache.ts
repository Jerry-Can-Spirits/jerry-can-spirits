export type RatingSource = 'google' | 'trustpilot'

export interface PlatformRating {
  rating: number
  count: number
  fetchedAt: string
  source: RatingSource
}

const KEY_PREFIX = 'rating:'

function keyFor(source: RatingSource): string {
  return `${KEY_PREFIX}${source}`
}

export async function getRating(
  kv: KVNamespace,
  source: RatingSource,
): Promise<PlatformRating | null> {
  return kv.get<PlatformRating>(keyFor(source), 'json')
}

export async function writeRating(
  kv: KVNamespace,
  source: RatingSource,
  data: Omit<PlatformRating, 'fetchedAt' | 'source'>,
): Promise<void> {
  const value: PlatformRating = {
    ...data,
    source,
    fetchedAt: new Date().toISOString(),
  }
  await kv.put(keyFor(source), JSON.stringify(value))
}
