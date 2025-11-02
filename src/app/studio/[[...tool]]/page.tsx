// app/studio/[[...tool]]/page.tsx
/**
 * This route is responsible for the built-in authoring environment using Sanity Studio.
 * All routes under your studio path are handled by this file using Next.js catch-all routes.
 *
 * next-sanity docs: https://github.com/sanity-io/next-sanity
 * Next.js dynamic routes: https://nextjs.org/docs/routing/dynamic-routes#catch-all-routes
 */

import NextDynamic from 'next/dynamic' // 👈 alias to avoid name clash with export const dynamic

export const runtime = 'edge'
export const dynamic = 'force-dynamic' // Next.js route option (string), safe now that import is aliased

// Dynamically import the Studio component and render it client-side only.
// This prevents SSR of Studio internals on the Edge runtime.
const NextStudio = NextDynamic(
  () => import('next-sanity/studio').then(mod => mod.NextStudio),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <div className="text-gray-300 text-lg">Loading Sanity Studio...</div>
        </div>
      </div>
    ),
  }
)

export { metadata, viewport } from 'next-sanity/studio'

export default async function StudioPage() {
  // Dynamically import config only when studio is accessed
  const { default: config } = await import('./studio-config')
  return <NextStudio config={config} />
}
