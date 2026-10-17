// The Expedition Log embed for the QR landing page. The QR platform strips
// scripts from its Custom HTML module, so this is served from our own origin
// and framed in. Kept chrome-free and dark to sit seamlessly inside the module.
// The map itself needs Mapbox and cookie consent, so the frame carries the
// count and sends the reader to the log.

import type { Metadata } from 'next'
import { CURRENT_BATCH_ID, getD1 } from '@/lib/d1'
import { bottleMapHeadline } from '@/lib/bottle-map'
import { getBottleMap } from '@/lib/bottle-map-d1'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'The Expedition Log',
  robots: { index: false, follow: false },
}

export default async function QrExpeditionLogPage() {
  let headline: string | null = null
  try {
    const db = await getD1()
    headline = bottleMapHeadline(CURRENT_BATCH_ID.replace('batch-', 'Batch '), await getBottleMap(db))
  } catch {
    // The link still works without the count.
  }

  return (
    <main className="min-h-screen bg-[#1a2e1a] px-4 py-5">
      <div className="max-w-md mx-auto text-center">
        {headline && (
          <p className="text-gold-400 text-xs font-bold mb-2 tracking-wide">{headline}</p>
        )}
        <p className="text-parchment-300 text-xs leading-relaxed mb-4">
          Where every bottle went, by postcode district. No names, no streets.
        </p>
        <a
          href="https://jerrycanspirits.co.uk/expedition-log/"
          target="_blank"
          rel="noopener"
          className="inline-block px-5 py-2.5 bg-gold-500 text-jerry-green-900 text-xs font-semibold rounded-lg"
        >
          See the map
        </a>
      </div>
    </main>
  )
}
