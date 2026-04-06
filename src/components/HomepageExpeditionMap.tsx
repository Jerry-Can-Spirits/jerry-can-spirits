import Link from 'next/link'
import { getD1, getExpeditionLogEntries } from '@/lib/d1'
import ExpeditionLogMapClient from './ExpeditionLogMapClient'

export default async function HomepageExpeditionMap() {
  let entries: Awaited<ReturnType<typeof getExpeditionLogEntries>> = []
  try {
    const db = await getD1()
    entries = await getExpeditionLogEntries(db)
  } catch {
    return null
  }

  const count = entries.length

  return (
    <section className="py-16 bg-jerry-green-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              The Expedition Log
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">
            Where the First Bottles Landed
          </h2>
          {count > 0 && (
            <p className="text-parchment-300">
              {count} {count === 1 ? 'person has' : 'people have'} joined the expedition.
            </p>
          )}
        </div>

        <ExpeditionLogMapClient entries={entries} className="w-full h-96 rounded-xl" />

        <div className="mt-8 text-center">
          <Link
            href="/expedition-log/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-jerry-green-800/40 border border-gold-500/20 text-gold-300 rounded-lg hover:bg-jerry-green-800/60 hover:border-gold-400/40 transition-all"
          >
            View the full log
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
