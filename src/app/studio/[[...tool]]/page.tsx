// src/app/studio/[[...tool]]/page.tsx
/**
 * Sanity Studio route (catch-all).
 * Uses a client wrapper so there is no next/dynamic with ssr:false in a Server Component.
 */
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export { metadata, viewport } from 'next-sanity/studio'

import { StudioClient } from './StudioClient'

export default async function StudioPage() {
  // Load Studio config only when the Studio route is hit
  const { default: config } = await import('./studio-config')
  return <StudioClient config={config} />
}
