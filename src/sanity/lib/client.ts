import 'server-only'
import { createClient } from 'next-sanity'

import { BUILD_POLICY, RUNTIME_POLICY, backoffMs, isBuildPhase } from '@/lib/fetch-retry'

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
  // The client retries a failed read itself: MEASURED 12 Oct 2026 against a
  // socket that drops every connection, a fetch TypeError under react-server
  // is retried, six attempts in all. Its default wait doubles from 100ms, about
  // 3s across all six, and builds still failed on single apicdn connect
  // timeouts. At build the same six attempts are spread over about 14s with
  // jitter, so prerender workers that failed together do not retry together.
  // At runtime a customer is waiting: one quick retry. The requests and their
  // `next: { revalidate, tags }` options are untouched.
  maxRetries: isBuildPhase() ? 5 : RUNTIME_POLICY.attempts - 1,
  retryDelay: (attempt) =>
    backoffMs(attempt, isBuildPhase() ? BUILD_POLICY.baseDelayMs : RUNTIME_POLICY.baseDelayMs),
})
