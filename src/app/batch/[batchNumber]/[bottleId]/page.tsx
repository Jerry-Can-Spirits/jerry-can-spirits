import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import Breadcrumbs from '@/components/Breadcrumbs'
import BottleCertificate from '@/components/BottleCertificate'
import ShareButton from '@/components/ShareButton'
import { getD1, getBatch, type LabelType } from '@/lib/d1'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ batchNumber: string; bottleId: string }>
}

const validLabelTypes = new Set<LabelType>(['standard', 'premium', 'founder'])
const labelMaxBottles: Record<LabelType, number> = {
  standard: 700,
  premium: 100,
  founder: 40,
}
const labelDisplayNames: Record<LabelType, string> = {
  standard: 'Standard',
  premium: 'Premium',
  founder: 'Founder',
}

function parseBottleId(bottleId: string): { labelType: LabelType; bottleNumber: number } | null {
  const match = bottleId.match(/^(standard|premium|founder)-(\d+)$/)
  if (!match) return null

  const labelType = match[1] as LabelType
  const bottleNumber = parseInt(match[2], 10)

  if (!validLabelTypes.has(labelType)) return null
  if (bottleNumber < 1 || bottleNumber > labelMaxBottles[labelType]) return null

  return { labelType, bottleNumber }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { batchNumber, bottleId } = await params
  const parsed = parseBottleId(bottleId)
  if (!parsed) return { title: 'Bottle Not Found' }

  const { labelType, bottleNumber } = parsed
  const db = await getD1()
  const batch = await getBatch(db, `batch-${batchNumber}`)

  if (!batch) return { title: 'Bottle Not Found' }

  const displayLabel = labelDisplayNames[labelType]
  return {
    title: `${displayLabel} #${bottleNumber} — ${batch.name}`,
    description: `Certificate of authenticity for ${displayLabel} bottle #${bottleNumber} from ${batch.name}. Jerry Can Spirits — veteran-owned premium British rum.`,
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
  const batch = await getBatch(db, batchId)
  if (!batch) notFound()

  const displayLabel = labelDisplayNames[labelType]
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
            <p className="text-parchment-300 leading-relaxed">{batch.tasting_notes}</p>
          </div>
        )}

        {/* Provenance note */}
        <div className="mt-6 bg-jerry-green-800/40 border border-gold-500/10 rounded-xl p-6 text-center">
          <p className="text-parchment-400 text-sm">
            This bottle is from {batch.name}. Every bottle carries the same exceptional liquid — crafted at
            Spirit of Wales Distillery, Newport, South Wales.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
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
