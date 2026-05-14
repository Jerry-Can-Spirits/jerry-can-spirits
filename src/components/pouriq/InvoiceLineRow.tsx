'use client'

import { memo } from 'react'
import type { PreviewLine } from '@/app/api/pouriq/invoices/extract/route'
import type { IngredientLibraryRow, IngredientType } from '@/lib/pouriq/types'

export type LineState = {
  applied: boolean
  unit_price_p: number
  match:
    | { kind: 'existing'; library_id: string | null }
    | {
        kind: 'new'
        new_name: string
        new_type: IngredientType
        new_pricing_mode: 'bottle' | 'unit'
        new_bottle_size_ml: number | null
      }
}

interface InvoiceLineRowProps {
  index: number
  line: PreviewLine
  state: LineState
  library: IngredientLibraryRow[]
  libraryById: Map<string, IngredientLibraryRow>
  onChange: (index: number, patch: Partial<LineState>) => void
  onToggleCreateNew: (index: number, toNew: boolean) => void
}

const INGREDIENT_TYPES: IngredientType[] = ['spirit','liqueur','wine','beer','mixer','syrup','juice','garnish','other']

function formatMoney(p: number): string {
  return `£${(p / 100).toFixed(2)}`
}

function currentCostFor(libraryById: Map<string, IngredientLibraryRow>, libraryId: string | null): number | null {
  if (!libraryId) return null
  const entry = libraryById.get(libraryId)
  if (!entry) return null
  return entry.unit_cost_p ?? entry.bottle_cost_p ?? null
}

function InvoiceLineRowComponent({ index, line, state, library, libraryById, onChange, onToggleCreateNew }: InvoiceLineRowProps) {
  const match = state.match
  const libraryId = match.kind === 'existing' ? match.library_id : null
  const currentP = currentCostFor(libraryById, libraryId)
  const delta = currentP !== null ? state.unit_price_p - currentP : null

  return (
    <tr className="border-t border-gold-500/10 align-top">
      <td className="px-3 py-3">
        <input
          type="checkbox"
          checked={state.applied}
          onChange={(e) => onChange(index, { applied: e.target.checked })}
          className="h-4 w-4"
          aria-label={`Apply line ${index + 1}`}
        />
      </td>
      <td className="px-3 py-3 text-parchment-100">
        <div className="font-medium">{line.extracted_name}</div>
        {line.extracted_line_total_p !== null && (
          <div className="text-xs text-parchment-400 mt-1">Line total {formatMoney(line.extracted_line_total_p)}</div>
        )}
      </td>
      <td className="px-3 py-3 text-parchment-300">{line.extracted_quantity ?? '—'}</td>
      <td className="px-3 py-3">
        <input
          type="number"
          step="0.01"
          min={0}
          value={(state.unit_price_p / 100).toFixed(2)}
          onChange={(e) => onChange(index, { unit_price_p: Math.round(parseFloat(e.target.value || '0') * 100) })}
          className="w-24 px-2 py-1 bg-jerry-green-700/50 border border-gold-500/30 rounded text-parchment-50"
          aria-label={`New net price for line ${index + 1}`}
        />
      </td>
      <td className="px-3 py-3">
        {match.kind === 'new' ? (
          <div className="space-y-2 min-w-[260px]">
            <input
              value={match.new_name}
              onChange={(e) => onChange(index, { match: { ...match, new_name: e.target.value } })}
              placeholder="Name"
              className="w-full px-2 py-1 bg-jerry-green-700/50 border border-gold-500/30 rounded text-parchment-50 text-sm"
            />
            <div className="flex gap-2">
              <select
                value={match.new_type}
                onChange={(e) => onChange(index, { match: { ...match, new_type: e.target.value as IngredientType } })}
                className="px-2 py-1 bg-jerry-green-700/50 border border-gold-500/30 rounded text-parchment-50 text-sm"
              >
                {INGREDIENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select
                value={match.new_pricing_mode}
                onChange={(e) => onChange(index, { match: { ...match, new_pricing_mode: e.target.value as 'bottle' | 'unit' } })}
                className="px-2 py-1 bg-jerry-green-700/50 border border-gold-500/30 rounded text-parchment-50 text-sm"
              >
                <option value="bottle">Per bottle</option>
                <option value="unit">Per unit</option>
              </select>
            </div>
            {match.new_pricing_mode === 'bottle' && (
              <input
                type="number"
                min={0}
                step="1"
                placeholder="Bottle size (ml)"
                value={match.new_bottle_size_ml ?? ''}
                onChange={(e) => onChange(index, { match: { ...match, new_bottle_size_ml: e.target.value ? parseInt(e.target.value, 10) : null } })}
                className="w-full px-2 py-1 bg-jerry-green-700/50 border border-gold-500/30 rounded text-parchment-50 text-sm"
              />
            )}
            <button type="button" onClick={() => onToggleCreateNew(index, false)} className="text-xs text-parchment-400 hover:text-parchment-200 underline">
              Cancel new entry
            </button>
          </div>
        ) : (
          <div className="space-y-1 min-w-[220px]">
            <select
              value={match.library_id ?? ''}
              onChange={(e) => onChange(index, { match: { kind: 'existing', library_id: e.target.value || null } })}
              className="w-full px-2 py-1 bg-jerry-green-700/50 border border-gold-500/30 rounded text-parchment-50 text-sm"
            >
              <option value="">— select library entry —</option>
              {line.match.kind === 'suggestions' && line.match.entries.map((e) => (
                <option key={e.id} value={e.id}>{e.name} (suggested)</option>
              ))}
              {library.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
            <button type="button" onClick={() => onToggleCreateNew(index, true)} className="text-xs text-gold-300 hover:text-gold-200 underline">
              Create new library entry
            </button>
          </div>
        )}
      </td>
      <td className="px-3 py-3 text-parchment-200">
        {currentP !== null ? formatMoney(currentP) : '—'}
      </td>
      <td className={`px-3 py-3 ${delta !== null && delta > 0 ? 'text-amber-300' : delta !== null && delta < 0 ? 'text-emerald-300' : 'text-parchment-300'}`}>
        {delta === null ? '—' : `${delta > 0 ? '+' : ''}${formatMoney(delta)}`}
      </td>
    </tr>
  )
}

export const InvoiceLineRow = memo(InvoiceLineRowComponent)
