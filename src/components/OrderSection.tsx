import Link from 'next/link'
import Image from 'next/image'
import { getProduct } from '@/lib/shopify'
import { CURRENT_BATCH_ID } from '@/lib/d1'

// 'batch-001' -> '001'. The same constant the Expedition Log runs on, so
// when the next batch ships, bumping CURRENT_BATCH_ID updates this copy in
// the same commit instead of leaving "Batch 001" asserted here forever.
const BATCH_NUMBER = CURRENT_BATCH_ID.replace('batch-', '')

const BOTTLE_HANDLE = 'jerry-can-spirits-expedition-spiced-rum'
const GIFT_SET_HANDLE = 'jerry-can-spirits-premium-gift-pack'
const BOTTLE_VOLUME_LITRES = 0.7

// The batch progress bar that used to render here is gone, and with it the
// three-SKU stock arithmetic that fed it. It could not fill honestly: batch
// sizes are not published, stock moves through channels the storefront cannot
// see, and a bar that misreports scarcity is worse than none (it read as
// broken on the live page, which is how it left).
async function getOrderData() {
  try {
    const [bottleProduct, giftSetProduct] = await Promise.all([
      getProduct(BOTTLE_HANDLE),
      getProduct(GIFT_SET_HANDLE),
    ])

    // No hardcoded prices in copy: prices render from Shopify live data only.
    // When the fetch fails, the price lines are simply not rendered.
    let bottlePrice: string | null = null
    let bottleCompareAtPrice: string | null = null
    let giftSetPrice: string | null = null
    let giftSetCompareAtPrice: string | null = null

    if (bottleProduct?.variants?.[0]) {
      const variant = bottleProduct.variants[0]
      bottlePrice = parseFloat(variant.price.amount).toFixed(0)
      bottleCompareAtPrice = variant.compareAtPrice
        ? parseFloat(variant.compareAtPrice.amount).toFixed(0)
        : null
    }

    if (giftSetProduct?.variants?.[0]) {
      const variant = giftSetProduct.variants[0]
      giftSetPrice = parseFloat(variant.price.amount).toFixed(0)
      giftSetCompareAtPrice = variant.compareAtPrice
        ? parseFloat(variant.compareAtPrice.amount).toFixed(0)
        : null
    }

    return { bottlePrice, bottleCompareAtPrice, giftSetPrice, giftSetCompareAtPrice }
  } catch {
    return {
      bottlePrice: null,
      bottleCompareAtPrice: null,
      giftSetPrice: null,
      giftSetCompareAtPrice: null,
    }
  }
}

export default async function OrderSection() {
  const { bottlePrice, bottleCompareAtPrice, giftSetPrice, giftSetCompareAtPrice } =
    await getOrderData()

  const bottleUnitPrice = bottlePrice ? (parseFloat(bottlePrice) / BOTTLE_VOLUME_LITRES).toFixed(2) : null

  return (
    <section className="py-16 bg-jerry-green-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Product Image */}
          <div className="order-2 lg:order-1">
            <div className="relative bg-linear-to-br from-jerry-green-800 to-jerry-green-900 rounded-2xl overflow-hidden shadow-2xl border border-gold-500/20">
              <div className="aspect-4/5 flex items-center justify-center p-8">
                <Image
                  src="/images/hero/hero-spiced.webp"
                  alt="Jerry Can Spirits Expedition Spiced Rum - First Batch Edition"
                  width={400}
                  height={500}
                  className="w-full h-full object-contain"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>

            </div>
          </div>

          {/* Right Column - Content.
              Reworked with the restructure: the "Order Now" badge, the
              floating pills on the image, the benefits card and the stats
              grid all restated facts the heading, the buttons and the trust
              line already carry — five ornaments saying "limited" and
              "veteran" around one buy ask. What remains is the claim, two
              facts the buttons cannot carry, the buttons, and one trust
              line. The batch number derives from CURRENT_BATCH_ID rather
              than being asserted here forever. */}
          <div className="order-1 lg:order-2">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6">
              First Batch. Numbered. Limited general release.
            </h2>

            <p className="text-xl text-parchment-300 mb-6 leading-relaxed">
              Batch {BATCH_NUMBER}, shipping now. When it&apos;s gone, that run is finished.
            </p>

            <ul className="space-y-2 text-parchment-200 mb-8">
              <li className="flex items-start gap-3">
                <span className="text-gold-400 shrink-0">•</span>
                <span>
                  An individually numbered First Batch Edition bottle.{' '}
                  {/* The claim links to its evidence: the batch tracker holds
                      the production record and per-bottle lookup for all 840. */}
                  <Link
                    href={`/batch/${BATCH_NUMBER}/`}
                    className="text-gold-300 hover:text-gold-200 underline underline-offset-2"
                  >
                    See the batch record
                  </Link>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gold-400 shrink-0">•</span>
                <span>A place in the Expedition Log, the public record of the first bottles</span>
              </li>
            </ul>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-4">
              <Link
                href={`/shop/product/${BOTTLE_HANDLE}/`}
                className="group bg-linear-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-jerry-green-900 px-6 py-4 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-between"
              >
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-wider opacity-75">Standard Bottle</span>
                  <span className="text-lg">Expedition Spiced Rum</span>
                </div>
                {bottlePrice && (
                  <div className="text-right">
                    <div>
                      <span className="text-xl font-bold">£{bottlePrice}</span>
                      {bottleCompareAtPrice && (
                        <span className="text-sm line-through opacity-60 ml-2">£{bottleCompareAtPrice}</span>
                      )}
                    </div>
                    {bottleUnitPrice && (
                      <span className="text-xs opacity-75">(£{bottleUnitPrice}/litre)</span>
                    )}
                  </div>
                )}
              </Link>

              <Link
                href={`/shop/product/${GIFT_SET_HANDLE}/`}
                className="group bg-linear-to-r from-jerry-green-700 to-jerry-green-800 hover:from-jerry-green-600 hover:to-jerry-green-700 text-white px-6 py-4 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-between border border-gold-500/30"
              >
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-wider text-gold-300">Gift Pack</span>
                  <span className="text-lg">Bottle + Barware Set</span>
                </div>
                {giftSetPrice && (
                  <div className="text-right">
                    <span className="text-xl font-bold text-gold-300">£{giftSetPrice}</span>
                    {giftSetCompareAtPrice && (
                      <span className="text-sm line-through opacity-60 text-parchment-400 ml-2">£{giftSetCompareAtPrice}</span>
                    )}
                  </div>
                )}
              </Link>
            </div>

            {/* Trust & Social Proof */}
            <div className="mt-6 pt-6 border-t border-gold-500/20 space-y-4">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-parchment-300 text-sm">
                <span>Secure Checkout</span>
                <span className="text-gold-500/40">•</span>
                <span>UK Veteran-Owned</span>
                <span className="text-gold-500/40">•</span>
                <span>Small-Batch Craft</span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
