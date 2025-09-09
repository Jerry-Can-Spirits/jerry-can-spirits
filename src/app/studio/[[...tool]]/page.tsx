/**
 * This route is responsible for the built-in authoring environment using Sanity Studio.
 * All routes under your studio path is handled by this file using Next.js' catch-all routes:
 * https://nextjs.org/docs/routing/dynamic-routes#catch-all-routes
 *
 * You can learn more about the next-sanity package here:
 * https://github.com/sanity-io/next-sanity
 */

import dynamicImport from 'next/dynamic'

// Dynamically import the Studio component - this keeps it isolated
const NextStudio = dynamicImport(
  () => import('next-sanity/studio').then(mod => mod.NextStudio),
  { 
    loading: () => (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-300 text-lg">Loading Sanity Studio...</div>
        </div>
      </div>
    )
  }
)

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
  const { default: config } = await import('./studio-config')
  return <NextStudio config={config} />
}
