import Image from 'next/image'
import Link from 'next/link'

interface EcologiStats {
  trees: number
  carbonOffset: number
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
        <div className="relative w-32 h-10 flex-shrink-0">
          <Image
            src="https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/6f20d43b-bf53-4d31-a389-96e4bfd2c100/public"
            alt="Ecologi"
            fill
            className="object-contain object-left"
          />
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">
          Climate Action
        </h2>
      </div>

      <div className="space-y-4 text-parchment-300 mb-6">
        <p>
          Every Jerry Can Spirits order automatically plants a tree and removes 1kg of CO₂ through our Ecologi partnership. No opt-in required.
        </p>
        <p>
          At checkout, customers can go further by adding £1 to fund a UK reforestation project specifically. Every contribution is tracked and publicly visible on our Ecologi profile.
        </p>
      </div>

      {impact && (impact.trees > 0 || impact.carbonOffset > 0) && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-jerry-green-800/60 rounded-lg p-4 text-center">
            <p className="text-3xl font-serif font-bold text-gold-300">
              {impact.trees.toLocaleString('en-GB')}
            </p>
            <p className="text-sm text-parchment-400 mt-1">trees planted</p>
          </div>
          <div className="bg-jerry-green-800/60 rounded-lg p-4 text-center">
            <p className="text-3xl font-serif font-bold text-gold-300">
              {impact.carbonOffset.toFixed(2)}t
            </p>
            <p className="text-sm text-parchment-400 mt-1">CO₂ offset</p>
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
