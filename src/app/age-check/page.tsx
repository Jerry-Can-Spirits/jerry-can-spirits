import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { AGE_COOKIE, isAgeVerified, productHandleFromReturnPath, safeReturnPath } from '@/lib/age-gate'
import { getProduct } from '@/lib/shopify'
import { OG_IMAGE } from '@/lib/og'
import AgeCheckGate from './AgeCheckGate'

// The gate is a redirect target, not a destination — keep it out of the index.
const ROBOTS = { index: false, follow: false }

// Cached so a burst of first visits to one product costs one Storefront call
// an hour, not one per visit. The product page itself revalidates hourly too.
const cachedProduct = unstable_cache((handle: string) => getProduct(handle), ['age-check-product'], {
  revalidate: 3600,
})

// A link shared from a product page is unfurled by whichever service the
// recipient is using. The known ones bypass the gate (BOT_USER_AGENTS); the
// rest land here, and until this metadata existed they rendered the site
// default card, so the share looked like a generic homepage link. Carry the
// destination product's own title, description and image instead. Everything
// else falls through to the site defaults inherited from the root layout.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ return?: string }>
}): Promise<Metadata> {
  const returnPath = safeReturnPath((await searchParams).return)
  const handle = productHandleFromReturnPath(returnPath)
  if (!handle) return { robots: ROBOTS }

  let product: Awaited<ReturnType<typeof getProduct>> = null
  try {
    product = await cachedProduct(handle)
  } catch {
    product = null
  }
  if (!product) return { robots: ROBOTS }

  const displayTitle = product.title.replace(/^Jerry Can Spirits[®]?\s*[-–—]?\s*/i, '')
  const title = `${product.seo?.title || displayTitle} | Jerry Can Spirits®`
  const description = product.seo?.description || product.description.slice(0, 155)
  const url = `https://jerrycanspirits.co.uk/shop/product/${handle}/`
  const images = product.images.length > 0 ? [{ url: product.images[0].url, alt: product.title }] : OG_IMAGE

  return {
    robots: ROBOTS,
    title,
    description,
    openGraph: { title, description, url, images, siteName: 'Jerry Can Spirits®' },
    twitter: { card: 'summary_large_image', title, description, images: images.map((i) => i.url) },
  }
}

export default async function AgeCheckPage({
  searchParams,
}: {
  searchParams: Promise<{ return?: string }>
}) {
  const returnPath = safeReturnPath((await searchParams).return)

  // Same-site fast path: the cookie is on the request, so verification already
  // happened — go straight through with no gate render. (Middleware would
  // normally not send a verified request here at all; this covers direct hits.)
  if (isAgeVerified((await cookies()).get(AGE_COOKIE)?.value)) {
    redirect(returnPath)
  }

  return <AgeCheckGate returnPath={returnPath} />
}
