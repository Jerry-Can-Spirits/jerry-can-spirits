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
  // Validate the KV shape before trusting it: a malformed or legacy value must
  // degrade to null (the reviews page hides the row) rather than throw on
  // .toFixed()/.toString() downstream.
  const raw = await kv.get<Partial<PlatformRating>>(keyFor(source), 'json')
  if (!raw || typeof raw.rating !== 'number' || typeof raw.count !== 'number') return null
  return raw as PlatformRating
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
