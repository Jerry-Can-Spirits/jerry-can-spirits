interface StepProgressProps {
  step: number
  total: number
}

const LABELS = ['Business', 'Premises', 'Contact', 'Order intent']

export function StepProgress({ step, total }: StepProgressProps) {
  const pct = Math.round((step / total) * 100)
  return (
    <div className="mb-8">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-sm text-parchment-300 uppercase tracking-widest">
          Step {step} of {total} — {LABELS[step - 1]}
        </p>
        <p className="text-xs text-parchment-400">{pct}%</p>
      </div>
      <div
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label="Application progress"
        className="h-1.5 w-full bg-jerry-green-700/50 rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-gradient-to-r from-gold-500 to-gold-400 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
