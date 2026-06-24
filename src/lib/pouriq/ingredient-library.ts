import type { IngredientLibraryRow, IngredientType } from './types'
import { insertCostChange, type CostPricingMode } from './cost-changes'

export interface IngredientLibraryInsert {
  trade_account_id: string
  name: string
  ingredient_type: IngredientType
  bottle_size_ml: number | null
  bottle_cost_p: number | null
  unit_cost_p: number | null
  purchase_qty?: number   // items the price covers; defaults to 1
  barcode: string | null
  notes: string | null
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

export async function insertLibraryEntry(
  db: D1Database,
  data: IngredientLibraryInsert,
): Promise<string> {
  // Derive new-model fields from legacy input until callers are migrated.
  const base_unit: 'ml' | 'g' | 'each' = data.bottle_size_ml !== null ? 'ml' : 'each'
  const pack_size = data.bottle_size_ml ?? 1
  const price_p = data.bottle_cost_p ?? data.unit_cost_p ?? 0
  const result = await db
    .prepare(`
      INSERT INTO pouriq_ingredients_library
        (trade_account_id, name, ingredient_type, base_unit, pack_size, price_p, purchase_qty, barcode, notes)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
      RETURNING id
    `)
    .bind(
      data.trade_account_id, data.name, data.ingredient_type,
      base_unit, pack_size, price_p,
      data.purchase_qty ?? 1,
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
  // Derive new-model fields from legacy patch fields; only include a column
  // if the caller explicitly patched it. Legacy field names map to new columns.
  const newModelPatch: Record<string, unknown> = {}
  if ('name' in patch) newModelPatch['name'] = patch.name
  if ('ingredient_type' in patch) newModelPatch['ingredient_type'] = patch.ingredient_type
  if ('purchase_qty' in patch) newModelPatch['purchase_qty'] = patch.purchase_qty
  if ('barcode' in patch) newModelPatch['barcode'] = patch.barcode
  if ('notes' in patch) newModelPatch['notes'] = patch.notes
  if ('bottle_size_ml' in patch) newModelPatch['pack_size'] = patch.bottle_size_ml ?? 1
  if ('bottle_cost_p' in patch || 'unit_cost_p' in patch) {
    newModelPatch['price_p'] = patch.bottle_cost_p ?? patch.unit_cost_p ?? 0
  }
  if ('bottle_size_ml' in patch) {
    newModelPatch['base_unit'] = patch.bottle_size_ml !== null ? 'ml' : 'each'
  }

  // Read current state for cost-change detection before mutating.
  const before = await getLibraryEntry(db, id, tradeAccountId)
  if (!before) return

  const sets: string[] = []
  const binds: unknown[] = []
  let idx = 1
  for (const [key, val] of Object.entries(newModelPatch)) {
    sets.push(`${key} = ?${idx++}`)
    binds.push(val)
  }
  if (sets.length === 0) return
  sets.push(`updated_at = datetime('now')`)
  binds.push(id)
  binds.push(tradeAccountId)
  await db
    .prepare(`UPDATE pouriq_ingredients_library SET ${sets.join(', ')} WHERE id = ?${idx++} AND trade_account_id = ?${idx}`)
    .bind(...binds)
    .run()

  // Detect a cost change and log it against the new price_p field.
  const newPriceP = ('price_p' in newModelPatch) ? (newModelPatch['price_p'] as number) : before.price_p
  const oldPriceP = before.price_p
  if (newPriceP !== oldPriceP) {
    // Derive pricing mode from base_unit: 'each' → unit-priced, else bottle-priced.
    const newBaseUnit = ('base_unit' in newModelPatch) ? (newModelPatch['base_unit'] as string) : before.base_unit
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
