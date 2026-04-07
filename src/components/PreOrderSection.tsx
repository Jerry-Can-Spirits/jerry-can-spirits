import Link from 'next/link'
import Image from 'next/image'
import { getProduct } from '@/lib/shopify'
import PreOrderProgressBar from './PreOrderProgressBar'

const BOTTLE_HANDLE = 'jerry-can-spirits-expedition-spiced-rum'
const GIFT_SET_HANDLE = 'jerry-can-spirits-premium-gift-pack'
const TRADE_PACK_HANDLE = 'jerry-can-spirits-expedition-pack-spiced-rum-6-bottles'
const TOTAL_BOTTLES = 700
const BOTTLE_VOLUME_LITRES = 0.7

async function getPreOrderData() {
  try {
    const [bottleProduct, giftSetProduct, tradePackProduct] = await Promise.all([
      getProduct(BOTTLE_HANDLE),
      getProduct(GIFT_SET_HANDLE),
      getProduct(TRADE_PACK_HANDLE),
    ])

    let singleBottlesSold = 0
    let tradePacksSold = 0
    let bottlePrice = '35'
    let bottleCompareAtPrice: string | null = '45'
    let giftSetPrice = '85'
    let giftSetCompareAtPrice: string | null = null

    if (bottleProduct?.variants?.[0]) {
      const variant = bottleProduct.variants[0]
      bottlePrice = parseFloat(variant.price.amount).toFixed(0)
      bottleCompareAtPrice = variant.compareAtPrice
        ? parseFloat(variant.compareAtPrice.amount).toFixed(0)
        : null

      const preorderSoldMeta = bottleProduct.metafields?.find(
        (m: { namespace: string; key: string; value: string } | null) =>
          m?.namespace === 'custom' && m?.key === 'pre_order_sold'
      )
      if (preorderSoldMeta?.value) {
        singleBottlesSold = parseInt(preorderSoldMeta.value, 10)
      } else if (variant.quantityAvailable !== undefined) {
        singleBottlesSold = Math.max(0, TOTAL_BOTTLES - variant.quantityAvailable)
      }
    }

    if (tradePackProduct?.metafields) {
      const tradePackSoldMeta = tradePackProduct.metafields.find(
        (m: { namespace: string; key: string; value: string } | null) =>
          m?.namespace === 'custom' && m?.key === 'pre_order_sold'
      )
      if (tradePackSoldMeta?.value) {
        tradePacksSold = parseInt(tradePackSoldMeta.value, 10)
      }
    }

    if (giftSetProduct?.variants?.[0]) {
      const variant = giftSetProduct.variants[0]
      giftSetPrice = parseFloat(variant.price.amount).toFixed(0)
      giftSetCompareAtPrice = variant.compareAtPrice
        ? parseFloat(variant.compareAtPrice.amount).toFixed(0)
        : null
    }

    const totalSold = singleBottlesSold + tradePacksSold * 6

    return { totalSold, bottlePrice, bottleCompareAtPrice, giftSetPrice, giftSetCompareAtPrice }
  } catch {
    return {
      totalSold: null,
      bottlePrice: '35',
      bottleCompareAtPrice: '45',
      giftSetPrice: '85',
      giftSetCompareAtPrice: null,
    }
  }
}

export default async function PreOrderSection() {
  const { totalSold, bottlePrice, bottleCompareAtPrice, giftSetPrice, giftSetCompareAtPrice } =
    await getPreOrderData()

  const bottleUnitPrice = (parseFloat(bottlePrice) / BOTTLE_VOLUME_LITRES).toFixed(2)

  return (
    <section className="py-16 bg-jerry-green-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Product Image */}
          <div className="order-2 lg:order-1">
            <div className="relative bg-gradient-to-br from-jerry-green-800 to-jerry-green-900 rounded-2xl overflow-hidden shadow-2xl border border-gold-500/20">
              <div className="aspect-[4/5] flex items-center justify-center p-8">
                <Image
                  src="/images/hero/hero-spiced.webp"
                  alt="Jerry Can Spirits Expedition Spiced Rum - First Batch Edition"
                  width={400}
                  height={500}
                  className="w-full h-full object-contain"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>

              <div className="absolute top-6 right-6 bg-gradient-to-r from-gold-600 to-gold-500 text-jerry-green-900 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide shadow-lg">
                First Batch Edition
              </div>

              <div className="absolute bottom-6 left-6 bg-jerry-green-700/80 backdrop-blur-sm text-gold-300 px-4 py-2 rounded-full text-sm font-semibold uppercase tracking-wide border border-gold-500/30 shadow-lg">
                Limited to 700
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
              First Batch. Numbered Bottles. Limited to 700.
            </h2>

            <p className="text-xl text-parchment-300 mb-6 leading-relaxed">
              700 bottles. Each one numbered. Founding Supporter pricing runs until Sunday 12 April. £40 from Monday.
            </p>

            {totalSold !== null && (
              <PreOrderProgressBar sold={totalSold} total={TOTAL_BOTTLES} />
            )}

            {/* Benefits List */}
            <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20 mb-8">
              <h3 className="text-gold-300 font-semibold mb-4">What You Get:</h3>
              <ul className="space-y-3 text-parchment-200">
                <li className="flex items-start gap-3">
                  <span className="text-gold-400 flex-shrink-0">•</span>
                  <span>Individually numbered First Batch Edition bottle</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold-400 flex-shrink-0">•</span>
                  <span>Founding Supporter price: £{bottlePrice}. Moves to £40 on Monday 13 April.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold-400 flex-shrink-0">•</span>
                  <span>Shipping this week</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold-400 flex-shrink-0">•</span>
                  <span>Exclusive access to limited releases &amp; events</span>
                </li>
              </ul>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-4">
              <Link
                href={`/shop/product/${BOTTLE_HANDLE}`}
                className="group bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-jerry-green-900 px-6 py-4 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-between"
              >
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-wider opacity-75">Standard Bottle</span>
                  <span className="text-lg">Expedition Spiced Rum</span>
                </div>
                <div className="text-right">
                  <div>
                    <span className="text-xl font-bold">£{bottlePrice}</span>
                    {bottleCompareAtPrice && (
                      <span className="text-sm line-through opacity-60 ml-2">£{bottleCompareAtPrice}</span>
                    )}
                  </div>
                  <span className="text-xs opacity-75">(£{bottleUnitPrice}/litre)</span>
                </div>
              </Link>

              <Link
                href={`/shop/product/${GIFT_SET_HANDLE}`}
                className="group bg-gradient-to-r from-jerry-green-700 to-jerry-green-800 hover:from-jerry-green-600 hover:to-jerry-green-700 text-white px-6 py-4 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-between border border-gold-500/30"
              >
                <div className="flex flex-col">
                  <span className="text-xs uppercase tracking-wider text-gold-300">Gift Pack</span>
                  <span className="text-lg">Bottle + Barware Set</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-gold-300">£{giftSetPrice}</span>
                  {giftSetCompareAtPrice && (
                    <span className="text-sm line-through opacity-60 text-parchment-400 ml-2">£{giftSetCompareAtPrice}</span>
                  )}
                </div>
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
                    <div className="text-gold-300 font-bold text-lg">700</div>
                    <div className="text-parchment-400 text-xs uppercase tracking-wide">Bottles Only</div>
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
