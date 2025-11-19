// Live content API for Sanity
// Note: defineLive was removed in next-sanity 11.x
// For live previews in next-sanity 11.x+, use @sanity/preview-kit
// See: https://github.com/sanity-io/next-sanity#live-content-api

import { client } from './client'

// Placeholder exports for future live content implementation
// When implementing live previews, migrate to @sanity/preview-kit
export const sanityFetch = async (query: string, params = {}) => {
  return client.fetch(query, params)
}

// Placeholder component - not currently used
export const SanityLive = () => null
