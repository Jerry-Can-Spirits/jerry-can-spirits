// The Expedition Log embed for the QR landing page. The QR platform strips
// scripts from its Custom HTML module, so the interactive log (live feed +
// bottle registration with Turnstile) is served from our own origin and
// framed in. Kept chrome-free and dark to sit seamlessly inside the module.

import type { Metadata } from 'next'
import { getD1 } from '@/lib/d1'
import ExpeditionLogForm from '@/components/ExpeditionLogForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'The Expedition Log',
  robots: { index: false, follow: false },
}

const BATCH_RE = /^[A-Za-z0-9\-]{1,10}$/

interface FeedEntry {
  name: string
  location: string | null
}

interface Props {
  searchParams: Promise<{ batch?: string }>
}

export default async function QrExpeditionLogPage({ searchParams }: Props) {
  const sp = await searchParams
  const batch = sp.batch && BATCH_RE.test(sp.batch) ? sp.batch : '001'
  const batchId = `batch-${batch}`

  let count = 0
  let entries: FeedEntry[] = []
  try {
    const db = await getD1()
    const [entriesRes, countRes] = await Promise.all([
      db
        .prepare(
          `SELECT name, location FROM expedition_log WHERE batch_id = ?1 AND removed_at IS NULL ORDER BY created_at DESC LIMIT 5`,
        )
        .bind(batchId)
        .all<FeedEntry>(),
      db
        .prepare(`SELECT COUNT(*) AS n FROM expedition_log WHERE batch_id = ?1 AND removed_at IS NULL`)
        .bind(batchId)
        .first<{ n: number }>(),
    ])
    entries = entriesRes.results ?? []
    count = countRes?.n ?? 0
  } catch {
    // The form still works without the feed.
  }

  return (
    <main className="min-h-screen bg-[#1a2e1a] px-4 py-5">
      <div className="max-w-md mx-auto">
        {count > 0 && (
          <div className="mb-4">
            <p className="text-gold-400 text-xs font-bold text-center mb-2 tracking-wide">
              {count} {count === 1 ? 'bottle' : 'bottles'} from Batch {batch} on the log
            </p>
            <div className="border-t border-gold-500/10">
              {entries.map((e, i) => (
                <div key={i} className="flex justify-between gap-2 py-1.5 border-b border-gold-500/10 text-[11px]">
                  <span className="text-parchment-200 font-semibold truncate">{e.name}</span>
                  <span className="text-parchment-500 truncate">{e.location ?? ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-parchment-300 text-xs leading-relaxed mb-4">
          Register your bottle and add your name to the record. A public log of the
          people who were here first. Entirely optional.
        </p>

        <ExpeditionLogForm batchId={batchId} />

        <p className="text-parchment-500 text-[10px] text-center mt-4 leading-relaxed">
          Your name and location (if provided) will appear publicly at{' '}
          <a
            href="https://jerrycanspirits.co.uk/expedition-log/"
            target="_blank"
            rel="noopener"
            className="text-gold-400 underline"
          >
            jerrycanspirits.co.uk/expedition-log
          </a>
        </p>
      </div>
    </main>
  )
}
