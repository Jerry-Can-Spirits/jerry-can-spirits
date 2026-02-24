import type { Batch, LabelType } from '@/lib/d1'

interface BottleCertificateProps {
  batch: Batch
  bottleNumber: number
  labelType: LabelType
}

const labelConfig: Record<LabelType, { label: string; badgeClass: string; description: string }> = {
  standard: {
    label: 'Standard',
    badgeClass: 'bg-parchment-500/20 text-parchment-200 border-parchment-500/30',
    description: 'Main production run',
  },
  premium: {
    label: 'Premium',
    badgeClass: 'bg-gold-500/20 text-gold-300 border-gold-500/30',
    description: 'Premium gift set edition',
  },
  founder: {
    label: 'Founder',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    description: 'Founders and early supporters edition',
  },
}

export default function BottleCertificate({ batch, bottleNumber, labelType }: BottleCertificateProps) {
  const config = labelConfig[labelType]
  const batchNumber = batch.id.replace('batch-', '')

  return (
    <div className="bg-jerry-green-800/60 backdrop-blur-sm border border-gold-500/30 rounded-xl p-8 text-center">
      {/* Label type badge */}
      <span className={`inline-block px-4 py-1.5 text-sm font-semibold uppercase tracking-wider rounded-full border mb-6 ${config.badgeClass}`}>
        {config.label} Edition
      </span>

      {/* Bottle number */}
      <div className="mb-6">
        <p className="text-parchment-500 text-sm uppercase tracking-widest mb-2">Bottle Number</p>
        <p className="text-gold-300 text-7xl sm:text-8xl font-serif font-bold">
          #{bottleNumber}
        </p>
      </div>

      {/* Divider */}
      <div className="w-24 h-px bg-gold-500/30 mx-auto mb-6" />

      {/* Batch provenance */}
      <div className="space-y-3">
        <p className="text-white text-lg font-serif font-semibold">{batch.name}</p>
        <p className="text-parchment-400 text-sm">{config.description}</p>
        {batch.abv && (
          <p className="text-parchment-400 text-sm">{batch.abv}% ABV &middot; 700ml</p>
        )}
        {batch.cask_type && (
          <p className="text-parchment-500 text-sm">Aged in {batch.cask_type}</p>
        )}
        {batch.bottling_date && (
          <p className="text-parchment-500 text-sm">
            Bottled {new Date(batch.bottling_date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* Certificate footer */}
      <div className="mt-8 pt-6 border-t border-gold-500/10">
        <p className="text-parchment-500 text-xs uppercase tracking-widest">
          Jerry Can Spirits &middot; Batch {batchNumber} &middot; {config.label} #{bottleNumber}
        </p>
      </div>
    </div>
  )
}
