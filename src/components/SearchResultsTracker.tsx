'use client'

import { useEffect } from 'react'
import { trackSearch } from '@/lib/track-search'

/**
 * Sends the GA4 search event for the /search results page. A client component
 * because the page itself is server-rendered, and it renders nothing: it
 * exists only so the measurement does not depend on Enhanced Measurement
 * having been switched on when the data stream was created.
 */
export default function SearchResultsTracker({ query, resultCount }: { query: string; resultCount: number }) {
  useEffect(() => {
    trackSearch(query, resultCount, 'page')
  }, [query, resultCount])

  return null
}
