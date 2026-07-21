// Loading skeleton for the shop collection pages. Mirrors the real grid
// (grid-cols-2 md:3 lg:4, aspect-square cards) so the swap to real content
// doesn't shift the layout.
export default function ShopGridSkeleton() {
  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header placeholder */}
        <div className="text-center mb-12 space-y-4">
          <div className="h-10 w-2/3 mx-auto bg-jerry-green-800/40 rounded-lg animate-pulse" />
          <div className="h-4 w-1/2 mx-auto bg-jerry-green-800/30 rounded animate-pulse" />
        </div>

        {/* Product grid placeholder — same grid classes and card shape as the page */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-jerry-green-800/20 rounded-xl border border-gold-500/20 overflow-hidden flex flex-col"
            >
              <div className="aspect-square bg-jerry-green-800/30 animate-pulse" />
              <div className="p-3 sm:p-4 lg:p-6 pb-0 space-y-2 flex-1">
                <div className="h-4 w-3/4 bg-jerry-green-800/30 rounded animate-pulse" />
                <div className="h-4 w-1/3 bg-jerry-green-800/30 rounded animate-pulse" />
              </div>
              <div className="px-3 sm:px-4 lg:px-6 pb-3 sm:pb-4 lg:pb-6 pt-2">
                <div className="h-10 w-full bg-jerry-green-800/30 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
