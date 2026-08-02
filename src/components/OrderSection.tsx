import Link from 'next/link'
import Image from 'next/image'
import { getProduct } from '@/lib/shopify'
import OrderProgressBar from './OrderProgressBar'

const BOTTLE_HANDLE = 'jerry-can-spirits-expedition-spiced-rum'
const GIFT_SET_HANDLE = 'jerry-can-spirits-premium-gift-pack'
const TRADE_PACK_HANDLE = 'jerry-can-spirits-expedition-pack-spiced-rum-6-bottles'
// Bottles in Batch 001. Internal only: it drives how full the progress bar
// renders and is never displayed, because batch sizes and bottle counts are
// not published. Bottles are drawn from one physical pool but sold as three
// SKUs, so remaining stock is the sum of all three.
const BATCH_BOTTLES = 840
const BOTTLES_PER_GIFT_PACK = 1
const BOTTLES_PER_CASE = 6
const BOTTLE_VOLUME_LITRES = 0.7

async function getOrderData() {
  try {
    const [bottleProduct, giftSetProduct, tradePackProduct] = await Promise.all([
      getProduct(BOTTLE_HANDLE),
      getProduct(GIFT_SET_HANDLE),
      getProduct(TRADE_PACK_HANDLE),
    ])

    // Remaining bottles, summed across every SKU that draws on the batch.
    // Previously this read a `custom.pre_order_sold` metafield in preference
    // to live stock. Those metafields still hold the figures from the
    // pre-order campaign, so the bar was frozen at that moment and no sale
    // since had moved it; gift packs were never counted at all. Live
    // inventory is the only source now.
    let bottlesRemaining: number | null = null
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

      if (variant.quantityAvailable !== undefined) {
        bottlesRemaining =
          variant.quantityAvailable +
          (giftSetProduct?.variants?.[0]?.quantityAvailable ?? 0) * BOTTLES_PER_GIFT_PACK +
          (tradePackProduct?.variants?.[0]?.quantityAvailable ?? 0) * BOTTLES_PER_CASE
      }
    }

    if (giftSetProduct?.variants?.[0]) {
      const variant = giftSetProduct.variants[0]
      giftSetPrice = parseFloat(variant.price.amount).toFixed(0)
      giftSetCompareAtPrice = variant.compareAtPrice
        ? parseFloat(variant.compareAtPrice.amount).toFixed(0)
        : null
    }

    const percentageClaimed =
      bottlesRemaining === null
        ? null
        : Math.round(((BATCH_BOTTLES - bottlesRemaining) / BATCH_BOTTLES) * 100)

    return { percentageClaimed, bottlePrice, bottleCompareAtPrice, giftSetPrice, giftSetCompareAtPrice }
  } catch {
    return {
      percentageClaimed: null,
      bottlePrice: null,
      bottleCompareAtPrice: null,
      giftSetPrice: null,
      giftSetCompareAtPrice: null,
    }
  }
}

export default async function OrderSection() {
  const { percentageClaimed, bottlePrice, bottleCompareAtPrice, giftSetPrice, giftSetCompareAtPrice } =
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

              <div className="absolute top-6 right-6 bg-linear-to-r from-gold-600 to-gold-500 text-jerry-green-900 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide shadow-lg">
                First Batch Edition
              </div>

              <div className="absolute bottom-6 left-6 bg-jerry-green-700/80 backdrop-blur-sm text-gold-300 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide border border-gold-500/30 shadow-lg">
                Limited general release
              </div>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="order-1 lg:order-2">
            <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
              <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
                Order Now
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-6">
              First Batch. Numbered. Limited general release.
            </h2>

            <p className="text-xl text-parchment-300 mb-6 leading-relaxed">
              Batch 001, shipping now. When it&apos;s gone, that run is finished.
            </p>

            {percentageClaimed !== null && (
              <OrderProgressBar percentageClaimed={percentageClaimed} />
            )}

            {/* Benefits List */}
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20 mb-8">
              <h3 className="text-gold-300 font-semibold mb-4">What You Get:</h3>
              <ul className="space-y-3 text-parchment-200">
                <li className="flex items-start gap-3">
                  <span className="text-gold-400 shrink-0">•</span>
                  <span>Individually numbered First Batch Edition bottle</span>
                </li>
                {bottlePrice && (
                  <li className="flex items-start gap-3">
                    <span className="text-gold-400 shrink-0">•</span>
                    <span>£{bottlePrice} per bottle.</span>
                  </li>
                )}
                <li className="flex items-start gap-3">
                  <span className="text-gold-400 shrink-0">•</span>
                  <span>Fulfilment in progress</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold-400 shrink-0">•</span>
                  <span>A place in the Expedition Log, the public record of the first bottles</span>
                </li>
              </ul>
            </div>

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

              <div className="bg-jerry-green-800/30 rounded-lg p-4 border border-gold-500/10">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-gold-300 font-bold text-lg">Limited</div>
                    <div className="text-parchment-400 text-xs uppercase tracking-wide">General Release</div>
                  </div>
                  <div>
                    <div className="text-gold-300 font-bold text-lg">1st</div>
                    <div className="text-parchment-400 text-xs uppercase tracking-wide">Batch Edition</div>
                  </div>
                  <div>
                    <div className="text-gold-300 font-bold text-lg">UK</div>
                    <div className="text-parchment-400 text-xs uppercase tracking-wide">Veteran-Owned</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
