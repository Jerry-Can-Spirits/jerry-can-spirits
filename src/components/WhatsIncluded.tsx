interface IncludedItem {
  item: string
  description?: string
  quantity?: number
}

interface WhatsIncludedProps {
  items: IncludedItem[]
}

export default function WhatsIncluded({ items }: WhatsIncludedProps) {
  if (!items || items.length === 0) return null

  return (
    <section className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gold-500/20 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-serif font-bold text-white">
            What's in the Box
          </h2>
          <p className="text-parchment-400 text-sm">
            Everything included with your order
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-4 p-4 bg-jerry-green-800/30 rounded-lg border border-gold-500/10"
          >
            {/* Quantity badge */}
            <div className="flex-shrink-0 w-10 h-10 bg-gold-500/20 rounded-lg flex items-center justify-center">
              <span className="text-gold-300 font-bold">
                {item.quantity && item.quantity > 1 ? `${item.quantity}x` : '1x'}
              </span>
            </div>

            {/* Item details */}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">
                {item.item}
              </h3>
              {item.description && (
                <p className="text-parchment-300 text-sm mt-1">
                  {item.description}
                </p>
              )}
            </div>

            {/* Checkmark */}
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-gold-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Total items count */}
      <div className="mt-6 pt-4 border-t border-gold-500/10 text-center">
        <p className="text-parchment-400 text-sm">
          <span className="text-gold-300 font-semibold">
            {items.reduce((total, item) => total + (item.quantity || 1), 0)} items
          </span>
          {' '}included in this package
        </p>
      </div>
    </section>
  )
}
