'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createIngredientServeAction } from '@/lib/pouriq/server-actions'
import { servePresetsFor, defaultServeName, type ServePreset } from '@/lib/pouriq/serve-presets'
import { serveGp } from '@/lib/pouriq/calculations'
import type { IngredientType } from '@/lib/pouriq/types'
import type { IngredientServeRow } from '@/lib/pouriq/menus'
import { INPUT, LABEL, CHIP, CHIP_ACTIVE, CHIP_IDLE } from '@/lib/pouriq/ui'
import { PRIMARY_BUTTON } from '@/lib/pouriq/button-styles'

const GP_THRESHOLD = 65

interface Props {
  libraryId: string
  ingredientName: string
  ingredientType: IngredientType
  costPerMlNetP: number
  serves: IngredientServeRow[]
}

function gpColour(gp: number | null): string {
  if (gp === null) return 'text-slate-400'
  return gp >= GP_THRESHOLD ? 'text-emerald-600' : 'text-rose-600'
}

export function IngredientServes({ libraryId, ingredientName, ingredientType, costPerMlNetP, serves }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const presets = servePresetsFor(ingredientType)

  const [selectedPreset, setSelectedPreset] = useState<ServePreset | null>(null)
  const [name, setName] = useState('')
  const [ml, setMl] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState<string | null>(null)

  const liveMl = parseFloat(ml || '0')
  const livePricePence = Math.round(parseFloat(price || '0') * 100)
  const liveGp =
    liveMl > 0 && livePricePence > 0
      ? serveGp({ costPerMlNetP, pourMl: liveMl, salePriceP: livePricePence, pricesIncludeVat: false })
      : null

  function applyPreset(preset: ServePreset) {
    setSelectedPreset(preset)
    setName(defaultServeName(ingredientName, preset.name))
    setMl(String(preset.ml))
    setError(null)
  }

  function clearToCustom() {
    setSelectedPreset(null)
    setName('')
    setMl('')
    setPrice('')
    setError(null)
  }

  function handleAdd() {
    const trimmed = name.trim()
    if (!trimmed) { setError('Serve name is required.'); return }
    const pourMl = parseFloat(ml || '0')
    if (pourMl <= 0) { setError('Size must be greater than 0ml.'); return }
    const pricePence = Math.round(parseFloat(price || '0') * 100)
    setError(null)
    startTransition(async () => {
      try {
        await createIngredientServeAction(libraryId, trimmed, pourMl, pricePence)
        setName('')
        setMl('')
        setPrice('')
        setSelectedPreset(null)
        router.refresh()
      } catch (e) {
        setError((e as Error).message || 'Failed to add serve.')
      }
    })
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200">
      <h2 className="text-lg font-bold text-slate-900 mb-4">Serves</h2>

      {serves.length === 0 ? (
        <p className="text-sm text-slate-500 mb-6">No serves set up yet.</p>
      ) : (
        <div className="mb-6 divide-y divide-slate-100">
          {serves.map((serve) => {
            const gp = serveGp({ costPerMlNetP, pourMl: serve.pour_ml, salePriceP: serve.sale_price_p, pricesIncludeVat: false })
            return (
              <div key={serve.id} className="py-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="text-sm font-medium text-slate-900">{serve.name}</span>
                <span className="text-sm text-slate-500">{serve.pour_ml}ml</span>
                <span className="text-sm text-slate-700">
                  {serve.sale_price_p > 0 ? `£${(serve.sale_price_p / 100).toFixed(2)}` : 'No price set'}
                </span>
                {gp !== null && (
                  <span className={`text-sm font-medium ${gpColour(gp)}`}>{gp.toFixed(1)}% GP</span>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-4">
        <p className="text-sm font-medium text-slate-700">Add a serve</p>

        {presets.length > 0 && (
          <div>
            <label className={LABEL}>Quick-add</label>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className={`${CHIP} ${selectedPreset?.name === p.name ? CHIP_ACTIVE : CHIP_IDLE}`}
                >
                  {p.name} ({p.ml}ml)
                </button>
              ))}
              {selectedPreset !== null && (
                <button type="button" onClick={clearToCustom} className={`${CHIP} ${CHIP_IDLE}`}>
                  Custom
                </button>
              )}
            </div>
          </div>
        )}

        <div>
          <label className={LABEL}>Serve name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={INPUT}
            placeholder={`e.g. ${defaultServeName(ingredientName, 'Single')}`}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className={LABEL}>Size (ml)</label>
            <input
              type="number"
              min="0"
              step="1"
              value={ml}
              onChange={(e) => setMl(e.target.value)}
              className={INPUT}
              placeholder="e.g. 25"
            />
          </div>
          <div className="flex-1">
            <label className={LABEL}>Sale price (£)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={INPUT}
              placeholder="e.g. 3.50"
            />
          </div>
        </div>

        {liveGp !== null && (
          <p className={`text-sm font-medium ${gpColour(liveGp)}`}>
            Live GP: {liveGp.toFixed(1)}%
          </p>
        )}

        {error !== null && <p className="text-sm text-rose-600">{error}</p>}

        <div className="flex justify-end">
          <button type="button" onClick={handleAdd} disabled={isPending} className={PRIMARY_BUTTON}>
            {isPending ? 'Saving...' : 'Add serve'}
          </button>
        </div>
      </div>
    </div>
  )
}
