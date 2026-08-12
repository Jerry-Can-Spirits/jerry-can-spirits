import 'server-only'
import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId } from '../env'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  // Reads published content and nothing else, which is exactly what the CDN
  // serves, so it should never have been on the uncached endpoint.
  //
  // MEASURED 13 August 2026: 198,100 of the project's 250,000 monthly API
  // requests were spent against a CDN allowance of 1,000,000 that stood at 8.
  // Every prerender of the 900 static pages, every revalidation and every page
  // view was drawing on the smaller quota. There is no preview route, no draft
  // mode and no mutation anywhere on this client — the previous comment about
  // the Edge Runtime does not hold for a published read.
  //
  // The cost is that a publish can take a few seconds to appear rather than
  // being instant, which a site that prerenders and revalidates cannot see.
  useCdn: true,
  perspective: 'published',
  stega: false,
})
