// Loading skeleton for the product page. Mirrors the two-column image/details
// layout so the swap to real content doesn't shift the page.
export default function Loading() {
  return (
    <main className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb placeholder */}
        <div className="h-4 w-48 bg-jerry-green-800/30 rounded animate-pulse mb-8" />

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image */}
          <div className="aspect-square bg-jerry-green-800/30 rounded-xl animate-pulse" />

          {/* Details */}
          <div className="space-y-6">
            <div className="h-10 w-3/4 bg-jerry-green-800/30 rounded-lg animate-pulse" />
            <div className="h-8 w-1/3 bg-jerry-green-800/30 rounded animate-pulse" />
            {/* Buy controls */}
            <div className="space-y-3 pt-6">
              <div className="h-11 w-full bg-jerry-green-800/30 rounded-lg animate-pulse" />
              <div className="h-11 w-full bg-jerry-green-800/20 rounded-lg animate-pulse" />
            </div>
            {/* Description lines */}
            <div className="space-y-2 pt-4">
              <div className="h-4 w-full bg-jerry-green-800/20 rounded animate-pulse" />
              <div className="h-4 w-11/12 bg-jerry-green-800/20 rounded animate-pulse" />
              <div className="h-4 w-4/5 bg-jerry-green-800/20 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
