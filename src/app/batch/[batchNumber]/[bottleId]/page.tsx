import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Breadcrumbs from '@/components/Breadcrumbs'
import BottleCertificate from '@/components/BottleCertificate'
import ShareButton from '@/components/ShareButton'
import { getD1, getBottleByLabel, type LabelType } from '@/lib/d1'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ batchNumber: string; bottleId: string }>
}

function TastingNotesDisplay({ notes }: { notes: string }) {
  const sections = notes.match(/(Nose|Palate|Finish):\s*([^]*?)(?=(?:Nose|Palate|Finish):|$)/g)

  if (!sections || sections.length === 0) {
    return <p className="text-parchment-300 leading-relaxed">{notes}</p>
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const match = section.match(/^(Nose|Palate|Finish):\s*(.+)/)
        if (!match) return null
        return (
          <div key={match[1]}>
            <h3 className="text-gold-300 font-semibold mb-1">{match[1]}</h3>
            <p className="text-parchment-300 leading-relaxed">{match[2].trim()}</p>
          </div>
        )
      })}
    </div>
  )
}

// Batch-1 label types. Validation is the bottles table itself (getBottleByLabel,
// strict — Audit 7 #6): the hardcoded per-label ceilings were removed because the
// DB row is the source of truth for what was produced. Display names fall back to
// a capitalised label so an unexpected label_type renders rather than crashes.
// Batch 2+ drops the label-type split for flat bottle numbering; that URL scheme
// is designed with the batch (see the Batch-002 model notes) and is not this
// route's concern yet.
const validLabelTypes = new Set<LabelType>(['standard', 'premium', 'founder'])
const labelDisplayNames: Partial<Record<string, string>> = {
  standard: 'Standard',
  premium: 'Premium',
  founder: 'Founder',
}

function displayNameFor(labelType: string): string {
  return labelDisplayNames[labelType] ?? labelType.charAt(0).toUpperCase() + labelType.slice(1)
}

function parseBottleId(bottleId: string): { labelType: LabelType; bottleNumber: number } | null {
  const match = bottleId.match(/^(standard|premium|founder)-(\d+)$/)
  if (!match) return null

  const labelType = match[1] as LabelType
  const bottleNumber = parseInt(match[2], 10)

  if (!validLabelTypes.has(labelType)) return null
  if (bottleNumber < 1) return null

  return { labelType, bottleNumber }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { batchNumber, bottleId } = await params
  const parsed = parseBottleId(bottleId)
  if (!parsed) return { title: 'Bottle Not Found' }

  const { labelType, bottleNumber } = parsed
  const db = await getD1()
  const bottle = await getBottleByLabel(db, `batch-${batchNumber}`, labelType, bottleNumber)

  if (!bottle) return { title: 'Bottle Not Found' }
  const batch = bottle.batch

  const displayLabel = displayNameFor(labelType)
  return {
    title: `${displayLabel} #${bottleNumber} — ${batch.name}`,
    // "Production record", not "certificate of authenticity": a lookup by
    // number proves the bottle was produced, not who holds it. The honest
    // claim until the per-bottle QR scheme (batch 002) gives each bottle an
    // unguessable route of its own.
    description: `The production record for ${displayLabel} bottle #${bottleNumber} from ${batch.name}. Jerry Can Spirits, veteran-owned British spirits.`,
    robots: { index: false, follow: true },
  }
}

export default async function BottleDetailPage({ params }: PageProps) {
  const { batchNumber, bottleId } = await params
  const parsed = parseBottleId(bottleId)
  if (!parsed) notFound()

  const { labelType, bottleNumber } = parsed
  const batchId = `batch-${batchNumber}`

  const db = await getD1()
  // Render only bottles that were actually produced: validate the exact bottle
  // row, not just the batch plus a hardcoded ceiling. Mirrors the expedition-log
  // registration API, which already rejects unproduced bottles via the same helper.
  const bottle = await getBottleByLabel(db, batchId, labelType, bottleNumber)
  if (!bottle) notFound()
  const batch = bottle.batch

  const displayLabel = displayNameFor(labelType)
  const pageUrl = `https://jerrycanspirits.co.uk/batch/${batchNumber}/${bottleId}/`

  return (
    <main className="min-h-screen py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <div className="mb-8">
          <Breadcrumbs
            items={[
              { label: 'Check Your Bottle', href: '/batch/' },
              { label: `Batch ${batchNumber}`, href: `/batch/${batchNumber}/` },
              { label: `${displayLabel} #${bottleNumber}` },
            ]}
          />
        </div>

        {/* Certificate */}
        <BottleCertificate
          batch={batch}
          bottleNumber={bottleNumber}
          labelType={labelType}
        />

        {/* Tasting Notes */}
        {batch.tasting_notes && (
          <div className="mt-8 bg-jerry-green-800/60 backdrop-blur-sm border border-gold-500/20 rounded-xl p-6">
            <h2 className="text-xl font-serif font-bold text-white mb-3">Tasting Notes</h2>
            <TastingNotesDisplay notes={batch.tasting_notes} />
          </div>
        )}

        {/* Provenance note */}
        <div className="mt-6 bg-jerry-green-800/40 border border-gold-500/10 rounded-xl p-6 text-center">
          <p className="text-parchment-400 text-sm">
            This bottle is from {batch.name}. Every bottle carries the same exceptional liquid, macerated in
            small batches by our British partner distillery.
          </p>
        </div>

        {/* Actions. The Expedition Log link is the page's real purpose until
            the per-bottle QR scheme lands: looking a number up proves the
            bottle exists; registering it in the log is the genuine, opt-in
            act of provenance an owner can perform today. Without it this page
            was a dead end. */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/expedition-log/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 font-semibold rounded-lg transition-colors"
          >
            Add it to the Expedition Log
          </Link>

          <ShareButton
            title={`${displayLabel} #${bottleNumber} — ${batch.name}`}
            text={`Check out my bottle of Jerry Can Spirits — ${displayLabel} #${bottleNumber} from ${batch.name}`}
            url={pageUrl}
            buttonText="Share My Bottle"
          />

          <Link
            href={`/batch/${batchNumber}/`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-jerry-green-700/60 hover:bg-jerry-green-700 text-parchment-300 hover:text-white border border-gold-500/20 hover:border-gold-500/30 font-medium rounded-lg transition-all duration-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Batch
          </Link>
        </div>
      </div>
    </main>
  )
}
