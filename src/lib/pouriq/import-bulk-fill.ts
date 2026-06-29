import type { MatchRowState } from '@/components/pouriq/IngredientMatchRow'
import { normalise } from '@/lib/pouriq/match'
import type { IngredientType } from '@/lib/pouriq/types'

export function groupKeyFor(input: { extracted_name: string; inferred_type: IngredientType; match: { kind: string; catalogue_id?: string } }): string | null {
  if (input.inferred_type === 'spirit') return null
  const m = input.match
  if (m.kind === 'catalogue') return `cat:${m.catalogue_id}`
  if (m.kind === 'suggestions' || m.kind === 'no-match') return `name:${normalise(input.extracted_name)}`
  return null
}

export interface BulkFillRow {
  // null = auto-matched / ungrouped: never a source or a target of fill.
  groupKey: string | null
  resolved: boolean
  state: MatchRowState
}

// Given all preview ingredient rows and the index of the one just resolved,
// return the indices of OTHER still-unresolved rows in the same group plus the
// resolution to copy (ingredient identity only — never the per-drink pour/unit).
// Null when there is nothing to fill.
export function planBulkFill(rows: BulkFillRow[], sourceIndex: number): {
  targets: number[]
  apply: Pick<MatchRowState, 'existing_library_id' | 'new_library'>
} | null {
  const source = rows[sourceIndex]
  if (!source || !source.resolved || source.groupKey === null) return null
  const targets: number[] = []
  for (let i = 0; i < rows.length; i++) {
    if (i === sourceIndex) continue
    const r = rows[i]
    if (r.groupKey === source.groupKey && !r.resolved) targets.push(i)
  }
  if (targets.length === 0) return null
  return {
    targets,
    apply: {
      existing_library_id: source.state.existing_library_id,
      new_library: source.state.new_library,
    },
  }
}
