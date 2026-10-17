import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getProduct } from '@/lib/shopify'
import { BOTTLE_HANDLE, GIFT_BOXED_HANDLE, remainingBottles } from '@/lib/batch-stock'
import { GUARANTEE_COPY, OFFER_HEADLINE, OFFER_LINE, PROOF_LINES } from '@/lib/october-offer'
import { normaliseReviews, type SanityReviewDoc } from '@/lib/product-reviews'
import { getTrustpilotScore } from '@/lib/trustpilot-score'
import { formatPrice } from '@/lib/format-price'
import { client } from '@/sanity/lib/client'
import { productReviewsQuery } from '@/sanity/queries'
import BatchCount from '@/components/BatchCount'
import MedalBar from '@/components/MedalBar'
import OfferAddToCart from '@/components/OfferAddToCart'
import { OfferCountdown, OfferLine } from '@/components/OctoberOffer'
import ProductPageTracking from '@/components/ProductPageTracking'
import ProductReviews from '@/components/ProductReviews'
import { RatingRow } from '@/components/RatingRow'
import { displayProductTitle } from '@/lib/product-title'

// The ad landing page for the October offer (brief of 17 Oct 2026, angle C1):
// the hook, the proof, the offer and one button, in the ad's own words. Not
// for search, so noindex; gated like every product page, because it sells
// alcohol. Hourly like the product pages, and the Shopify products/update
// webhook refreshes it when the bottle's stock moves.
export const revalidate = 3600

export const metadata: Metadata = {
  title: OFFER_HEADLINE,
  description: OFFER_LINE,
  robots: { index: false, follow: true },
}

export default async function OfferPage() {
  const [giftBoxed, bottle, reviewDocs, trustpilot] = await Promise.all([
    getProduct(GIFT_BOXED_HANDLE),
    getProduct(BOTTLE_HANDLE).catch(() => null),
    client.fetch<SanityReviewDoc[]>(productReviewsQuery, { handle: BOTTLE_HANDLE }).catch(() => [] as SanityReviewDoc[]),
    getTrustpilotScore(),
  ])

  if (!giftBoxed) notFound()

  const variant = giftBoxed.variants?.find((v) => v.availableForSale) ?? giftBoxed.variants?.[0]
  if (!variant) notFound()

  const title = displayProductTitle(giftBoxed.title)
  const image = giftBoxed.images[0]
  const reviews = normaliseReviews(reviewDocs).slice(0, 3)

  return (
    <div>
      <ProductPageTracking
        productId={giftBoxed.id}
        productName={giftBoxed.title}
        handle={giftBoxed.handle}
        price={variant.price.amount}
        currency={variant.price.currencyCode}
        category="Spirits"
        imageUrl={image?.url}
      />

      <section className="band-dark pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 lg:items-start">
            {image && (
              <div className="relative aspect-square bg-jerry-green-800/20 rounded-xl overflow-hidden border border-gold-500/20">
                <Image
                  src={image.url}
                  alt={image.altText || title}
                  fill
                  priority
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            )}

            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white">{OFFER_HEADLINE}</h1>

              <OfferLine />

              {/* The live price, so the figure a customer sees here is the one
                  Shopify charges. The usual price is struck through while the
                  variant carries a compare-at price. */}
              <p className="text-3xl font-serif font-bold text-gold-400">
                {formatPrice(variant.price.amount, variant.price.currencyCode)}
                {variant.compareAtPrice && parseFloat(variant.compareAtPrice.amount) > parseFloat(variant.price.amount) && (
                  <span className="ml-3 text-lg font-normal text-parchment-400 line-through">
                    {formatPrice(variant.compareAtPrice.amount, variant.compareAtPrice.currencyCode)}
                  </span>
                )}
              </p>

              <BatchCount count={remainingBottles(bottle)} />

              <ul className="space-y-3 text-parchment-200 leading-relaxed">
                {PROOF_LINES.map((line) => (
                  <li key={line} className="flex gap-3">
                    <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              {/* The TrustScore, from the same helper as every other surface,
                  so the landing page and the product page cannot disagree. */}
              <RatingRow rating={trustpilot.rating} count={trustpilot.count} platform="trustpilot" />

              <div className="space-y-3 pt-2">
                <OfferAddToCart
                  variantId={variant.id}
                  productId={giftBoxed.id}
                  productTitle={title}
                  price={variant.price.amount}
                  currencyCode={variant.price.currencyCode}
                  available={variant.availableForSale}
                />
                <OfferCountdown />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The medals in full, as the homepage states them under its hero. */}
      <MedalBar />

      {reviews.length > 0 && (
        <section className="band-light py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <ProductReviews reviews={reviews} />
          </div>
        </section>
      )}

      {GUARANTEE_COPY && (
        <section className="band-dark py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-parchment-200 leading-relaxed">{GUARANTEE_COPY}</p>
          </div>
        </section>
      )}

      <section className={`${reviews.length > 0 && !GUARANTEE_COPY ? 'band-dark' : 'band-light'} py-8`}>
        <p className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-parchment-400">
          18+ only. Please enjoy responsibly.{' '}
          <a
            href="https://www.drinkaware.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 text-gold-300 hover:text-gold-200"
          >
            drinkaware.co.uk
          </a>
        </p>
      </section>
    </div>
  )
}
