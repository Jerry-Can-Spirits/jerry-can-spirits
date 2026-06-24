import type { IngredientLibraryRow, IngredientType } from './types'
import { insertCostChange, type CostPricingMode } from './cost-changes'

export interface IngredientLibraryInsert {
  trade_account_id: string
  name: string
  ingredient_type: IngredientType
  // New purchase-model fields. When base_unit is not provided the server action
  // derives it from the legacy bottle_size_ml / bottle_cost_p / unit_cost_p fields
  // for backward compatibility while the invoice inline-create migrates (Task 8).
  base_unit?: 'ml' | 'g' | 'each'
  pack_size?: number
  price_p?: number
  purchase_qty?: number   // defaults to 1
  yield_pct?: number
  pack_format?: string | null
  subcategory?: string | null
  barcode: string | null
  notes: string | null
  // Legacy fields — still accepted from the invoice commit route until that path
  // is migrated to the new model (Task 8). Do not use in new code.
  bottle_size_ml?: number | null
  bottle_cost_p?: number | null
  unit_cost_p?: number | null
}

// Columns present in the new schema (migration 0043).
const LIBRARY_SELECT = `
  id, trade_account_id, name, ingredient_type,
  base_unit, pack_size, price_p, pack_format, subcategory,
  purchase_qty, yield_pct, barcode, notes, created_at, updated_at
`

function mapLibraryRow(r: {
  id: string
  trade_account_id: string
  name: string
  ingredient_type: IngredientType
  base_unit: 'ml' | 'g' | 'each'
  pack_size: number
  price_p: number
  pack_format: string | null
  subcategory: string | null
  purchase_qty: number
  yield_pct: number
  barcode: string | null
  notes: string | null
  created_at: string
  updated_at: string
}): IngredientLibraryRow {
  return {
    ...r,
    // legacy fields retired in a later task; not read
    bottle_size_ml: null,
    bottle_cost_p: null,
    unit_cost_p: null,
  }
}

export interface IngredientLibraryUsage {
  id: string
  menu_id: string
  menu_name: string
  cocktail_id: string
  cocktail_name: string
}

export async function listLibraryEntries(
  db: D1Database,
  tradeAccountId: string,
): Promise<IngredientLibraryRow[]> {
  const result = await db
    .prepare(`
      SELECT ${LIBRARY_SELECT}
      FROM pouriq_ingredients_library
      WHERE trade_account_id = ?1
      ORDER BY LOWER(name) ASC
    `)
    .bind(tradeAccountId)
    .all<Parameters<typeof mapLibraryRow>[0]>()
  return (result.results ?? []).map(mapLibraryRow)
}

export async function getLibraryEntry(
  db: D1Database,
  id: string,
  tradeAccountId: string,
): Promise<IngredientLibraryRow | null> {
  const row = await db
    .prepare(`SELECT ${LIBRARY_SELECT} FROM pouriq_ingredients_library WHERE id = ?1 AND trade_account_id = ?2`)
    .bind(id, tradeAccountId)
    .first<Parameters<typeof mapLibraryRow>[0]>()
  return row ? mapLibraryRow(row) : null
}

function resolveNewModelFields(data: Partial<Omit<IngredientLibraryInsert, 'trade_account_id'>>): {
  base_unit: 'ml' | 'g' | 'each'
  pack_size: number
  price_p: number
  yield_pct: number
  pack_format: string | null
  subcategory: string | null
} {
  // Use new-model fields when explicitly provided; fall back to legacy bridge.
  const base_unit: 'ml' | 'g' | 'each' = data.base_unit ?? (data.bottle_size_ml !== null && data.bottle_size_ml !== undefined ? 'ml' : 'each')
  const pack_size = data.pack_size ?? (data.bottle_size_ml ?? 1)
  const price_p = data.price_p ?? (data.bottle_cost_p ?? data.unit_cost_p ?? 0)
  const yield_pct = data.yield_pct ?? 100
  return {
    base_unit,
    pack_size: pack_size > 0 ? pack_size : 1,
    price_p,
    yield_pct,
    pack_format: data.pack_format ?? null,
    subcategory: data.subcategory ?? null,
  }
}

export async function insertLibraryEntry(
  db: D1Database,
  data: IngredientLibraryInsert,
): Promise<string> {
  const resolved = resolveNewModelFields(data)
  const result = await db
    .prepare(`
      INSERT INTO pouriq_ingredients_library
        (trade_account_id, name, ingredient_type, base_unit, pack_size, price_p, purchase_qty, yield_pct, pack_format, subcategory, barcode, notes)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
      RETURNING id
    `)
    .bind(
      data.trade_account_id, data.name, data.ingredient_type,
      resolved.base_unit, resolved.pack_size, resolved.price_p,
      data.purchase_qty ?? 1, resolved.yield_pct,
      resolved.pack_format, resolved.subcategory,
      data.barcode, data.notes,
    )
    .first<{ id: string }>()
  if (!result) throw new Error('Library insert returned no id')
  return result.id
}

export async function findLibraryEntryByBarcode(
  db: D1Database,
  tradeAccountId: string,
  barcode: string,
): Promise<IngredientLibraryRow | null> {
  const row = await db
    .prepare(`SELECT ${LIBRARY_SELECT} FROM pouriq_ingredients_library WHERE trade_account_id = ?1 AND barcode = ?2`)
    .bind(tradeAccountId, barcode)
    .first<Parameters<typeof mapLibraryRow>[0]>()
  return row ? mapLibraryRow(row) : null
}

export async function updateLibraryEntry(
  db: D1Database,
  id: string,
  tradeAccountId: string,
  patch: Partial<Omit<IngredientLibraryInsert, 'trade_account_id'>>,
): Promise<void> {
  // Read current state for cost-change detection before mutating.
  const before = await getLibraryEntry(db, id, tradeAccountId)
  if (!before) return

  // Resolve new-model fields from patch (bridges legacy fields when needed).
  const resolved = resolveNewModelFields({ ...patch })

  const newModelPatch: Record<string, unknown> = {}
  if ('name' in patch) newModelPatch['name'] = patch.name
  if ('ingredient_type' in patch) newModelPatch['ingredient_type'] = patch.ingredient_type
  if ('purchase_qty' in patch) newModelPatch['purchase_qty'] = patch.purchase_qty
  if ('barcode' in patch) newModelPatch['barcode'] = patch.barcode
  if ('notes' in patch) newModelPatch['notes'] = patch.notes

  // Write new-model columns when any of the cost/size/format fields are patched.
  const hasCostOrSize = 'base_unit' in patch || 'pack_size' in patch || 'price_p' in patch
    || 'bottle_size_ml' in patch || 'bottle_cost_p' in patch || 'unit_cost_p' in patch
  if (hasCostOrSize) {
    newModelPatch['base_unit'] = resolved.base_unit
    newModelPatch['pack_size'] = resolved.pack_size
    newModelPatch['price_p'] = resolved.price_p
  }
  if ('yield_pct' in patch) newModelPatch['yield_pct'] = resolved.yield_pct
  if ('pack_format' in patch) newModelPatch['pack_format'] = resolved.pack_format
  if ('subcategory' in patch) newModelPatch['subcategory'] = resolved.subcategory

  const sets: string[] = []
  const binds: unknown[] = []
  let idx = 1
  for (const [key, val] of Object.entries(newModelPatch)) {
    sets.push(`${key} = ?${idx++}`)
    binds.push(val ?? null)
  }
  if (sets.length === 0) return
  sets.push(`updated_at = datetime('now')`)
  binds.push(id)
  binds.push(tradeAccountId)
  await db
    .prepare(`UPDATE pouriq_ingredients_library SET ${sets.join(', ')} WHERE id = ?${idx++} AND trade_account_id = ?${idx}`)
    .bind(...binds)
    .run()

  // Detect a cost change and log it.
  const newPriceP = hasCostOrSize ? resolved.price_p : before.price_p
  const oldPriceP = before.price_p
  if (newPriceP !== oldPriceP) {
    const newBaseUnit = hasCostOrSize ? resolved.base_unit : before.base_unit
    const mode: CostPricingMode = newBaseUnit === 'each' ? 'unit' : 'bottle'
    await insertCostChange(db, {
      library_ingredient_id: id,
      pricing_mode: mode,
      old_cost_p: oldPriceP,
      new_cost_p: newPriceP,
      source: 'manual',
    })
  }
}

export async function deleteLibraryEntry(
  db: D1Database,
  id: string,
  tradeAccountId: string,
): Promise<void> {
  await db
    .prepare(`DELETE FROM pouriq_ingredients_library WHERE id = ?1 AND trade_account_id = ?2`)
    .bind(id, tradeAccountId)
    .run()
}

export async function getLibraryEntryUsage(
  db: D1Database,
  libraryIngredientId: string,
): Promise<IngredientLibraryUsage[]> {
  const result = await db
    .prepare(`
      SELECT
        i.id AS id,
        c.id AS cocktail_id,
        c.name AS cocktail_name,
        m.id AS menu_id,
        m.name AS menu_name
      FROM pouriq_ingredients i
      JOIN pouriq_cocktails c ON c.id = i.cocktail_id
      JOIN pouriq_menus m ON m.id = c.menu_id
      WHERE i.library_ingredient_id = ?1
      ORDER BY m.name, c.name
    `)
    .bind(libraryIngredientId)
    .all<IngredientLibraryUsage>()
  return result.results ?? []
}

export async function getLibraryUsageCounts(
  db: D1Database,
  tradeAccountId: string,
): Promise<Map<string, number>> {
  const result = await db
    .prepare(`
      SELECT i.library_ingredient_id AS lib_id, COUNT(*) AS n
      FROM pouriq_ingredients i
      JOIN pouriq_cocktails c ON c.id = i.cocktail_id
      JOIN pouriq_menus m ON m.id = c.menu_id
      WHERE m.trade_account_id = ?1
      GROUP BY i.library_ingredient_id
    `)
    .bind(tradeAccountId)
    .all<{ lib_id: string; n: number }>()
  const map = new Map<string, number>()
  for (const row of result.results ?? []) {
    map.set(row.lib_id, row.n)
  }
  return map
}
