'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LabelType } from '@/lib/d1'

interface BottleLookupProps {
  batchNumber: string
}

const labelTypes: { value: LabelType; label: string; range: string }[] = [
  { value: 'standard', label: 'Standard', range: '1–700' },
  { value: 'premium', label: 'Premium', range: '1–100' },
  { value: 'founder', label: 'Founder', range: '1–40' },
]

export default function BottleLookup({ batchNumber }: BottleLookupProps) {
  const router = useRouter()
  const [labelType, setLabelType] = useState<LabelType>('standard')
  const [bottleNumber, setBottleNumber] = useState('')

  const maxBottle = labelType === 'founder' ? 40 : labelType === 'premium' ? 100 : 700

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const num = parseInt(bottleNumber, 10)
    if (!num || num < 1 || num > maxBottle) return
    router.push(`/batch/${batchNumber}/${labelType}-${num}/`)
  }

  return (
    <div className="bg-jerry-green-800/60 backdrop-blur-sm border border-gold-500/20 rounded-xl p-6">
      <h2 className="text-2xl font-serif font-bold text-white mb-2">Check Your Bottle</h2>
      <p className="text-parchment-400 text-sm mb-6">
        Enter your bottle details to view its certificate of authenticity.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Label type selector */}
        <div>
          <label className="block text-parchment-400 text-sm mb-2">Label Type</label>
          <div className="grid grid-cols-3 gap-2">
            {labelTypes.map((lt) => (
              <button
                key={lt.value}
                type="button"
                onClick={() => {
                  setLabelType(lt.value)
                  setBottleNumber('')
                }}
                className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all duration-200 ${
                  labelType === lt.value
                    ? 'bg-gold-500/20 border-gold-500/50 text-gold-300'
                    : 'bg-jerry-green-700/40 border-gold-500/10 text-parchment-400 hover:border-gold-500/30'
                }`}
              >
                <span className="block">{lt.label}</span>
                <span className="block text-xs opacity-60 mt-0.5">{lt.range}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bottle number input */}
        <div>
          <label htmlFor="bottle-number" className="block text-parchment-400 text-sm mb-2">
            Bottle Number
          </label>
          <input
            id="bottle-number"
            type="number"
            min={1}
            max={maxBottle}
            value={bottleNumber}
            onChange={(e) => setBottleNumber(e.target.value)}
            placeholder={`1–${maxBottle}`}
            className="w-full px-4 py-3 bg-jerry-green-700/60 border border-gold-500/20 rounded-lg text-white placeholder-parchment-600 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30 transition-colors"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!bottleNumber || parseInt(bottleNumber, 10) < 1 || parseInt(bottleNumber, 10) > maxBottle}
          className="w-full px-6 py-3 bg-gold-500 hover:bg-gold-400 disabled:bg-gold-500/30 disabled:cursor-not-allowed text-jerry-green-900 disabled:text-jerry-green-900/50 font-semibold rounded-lg transition-all duration-300"
        >
          View Bottle Certificate
        </button>
      </form>
    </div>
  )
}
