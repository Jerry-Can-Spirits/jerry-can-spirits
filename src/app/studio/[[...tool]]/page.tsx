/**
 * This route is responsible for the built-in authoring environment using Sanity Studio.
 * All routes under your studio path is handled by this file using Next.js' catch-all routes:
 * https://nextjs.org/docs/routing/dynamic-routes#catch-all-routes
 *
 * You can learn more about the next-sanity package here:
 * https://github.com/sanity-io/next-sanity
 */

import dynamicImport from 'next/dynamic'

// Dynamically import Sanity Studio to reduce main bundle size
const NextStudio = dynamicImport(() => import('next-sanity/studio').then(mod => ({ default: mod.NextStudio })), {
  loading: () => <div className="flex items-center justify-center h-screen text-gray-600">Loading Studio...</div>
})

export const dynamic = 'force-dynamic'

export { metadata, viewport } from 'next-sanity/studio'

export function generateStaticParams() {
  return [
    { tool: [] },
    { tool: ['desk'] },
    { tool: ['desk', 'post'] },
    { tool: ['vision'] },
    { tool: ['structure'] },
  ]
}

export default async function StudioPage() {
  // Dynamically import config only when studio is accessed
  const { default: config } = await import('../../../../sanity.config')
  return <NextStudio config={config} />
}
