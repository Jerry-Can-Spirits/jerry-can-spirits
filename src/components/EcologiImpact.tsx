import Link from 'next/link'

interface EcologiStats {
  trees: number
  // Tonnes. Our Ecologi plan funds carbon removal, not offsets; carbonOffset
  // reads 0 on our profile.
  carbonRemoval: number
}

async function getImpact(): Promise<EcologiStats | null> {
  try {
    const res = await fetch('https://public.ecologi.com/users/jerry-can-spirits/impact', {
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    return res.json() as Promise<EcologiStats>
  } catch {
    return null
  }
}

export default async function EcologiImpact() {
  const impact = await getImpact()

  return (
    <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://api.ecologi.com/badges/trees/69cf809ea3c16250680afe34?white=true&treeOnly=true"
            alt="Trees planted with Ecologi"
            height={80}
            className="h-20 w-auto"
          />
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
          Climate Action
        </h2>
      </div>

      <div className="space-y-4 text-parchment-300 mb-6">
        <p>
          Every Jerry Can Spirits order funds one tree and 1kg of carbon removal through Ecologi. It happens automatically.
        </p>
        <p>
          At checkout, you can add £1 to fund a tree on a UK reforestation project. Every contribution shows on our public Ecologi profile.
        </p>
      </div>

      {impact && (impact.trees > 0 || impact.carbonRemoval > 0) && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-jerry-green-800/60 rounded-lg p-4 text-center">
            <p className="text-3xl font-serif font-bold text-gold-300">
              {impact.trees.toLocaleString('en-GB')}
            </p>
            <p className="text-sm text-parchment-400 mt-1">trees funded</p>
          </div>
          <div className="bg-jerry-green-800/60 rounded-lg p-4 text-center">
            <p className="text-3xl font-serif font-bold text-gold-300">
              {Math.round(impact.carbonRemoval * 1000).toLocaleString('en-GB')}kg
            </p>
            <p className="text-sm text-parchment-400 mt-1">carbon removal funded</p>
          </div>
        </div>
      )}

      <Link
        href="https://ecologi.com/jerry-can-spirits"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm text-gold-300 hover:text-gold-400 transition-colors"
      >
        View our Ecologi profile
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </Link>
    </div>
  )
}
