import Link from 'next/link'
import { requireTradeSession } from '@/lib/trade-portal/session-check'
import { TRADE_RESOURCES } from '@/lib/trade-portal/resources'
import { ResourceCard } from '@/components/trade-portal/ResourceCard'

export const dynamic = 'force-dynamic'

export default async function TradeResourcesPage() {
  await requireTradeSession()

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <Link href="/trade/landing" className="text-sm text-parchment-400 hover:text-parchment-200">← Trade Hub</Link>
        <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mt-3 mb-6">
          <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">Trade Portal</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">Trade resources</h1>
        <p className="text-parchment-300 text-base leading-relaxed mb-10">
          Downloads for your bar. Print, pin up, hand to your team. More will be added as we build them.
        </p>

        {TRADE_RESOURCES.length === 0 ? (
          <p className="text-parchment-300">No resources available yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {TRADE_RESOURCES.map((r) => (
              <ResourceCard key={r.slug} resource={r} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
