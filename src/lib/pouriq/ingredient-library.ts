import type { IngredientLibraryRow, IngredientType } from './types'
import { insertCostChange, type CostPricingMode } from './cost-changes'

export interface IngredientLibraryInsert {
  trade_account_id: string
  name: string
  ingredient_type: IngredientType
  bottle_size_ml: number | null
  bottle_cost_p: number | null
  unit_cost_p: number | null
  barcode: string | null
  notes: string | null
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
      SELECT * FROM pouriq_ingredients_library
      WHERE trade_account_id = ?1
      ORDER BY LOWER(name) ASC
    `)
    .bind(tradeAccountId)
    .all<IngredientLibraryRow>()
  return result.results ?? []
}

export async function getLibraryEntry(
  db: D1Database,
  id: string,
  tradeAccountId: string,
): Promise<IngredientLibraryRow | null> {
  return await db
    .prepare(`SELECT * FROM pouriq_ingredients_library WHERE id = ?1 AND trade_account_id = ?2`)
    .bind(id, tradeAccountId)
    .first<IngredientLibraryRow>()
}

export async function insertLibraryEntry(
  db: D1Database,
  data: IngredientLibraryInsert,
): Promise<string> {
  const result = await db
    .prepare(`
      INSERT INTO pouriq_ingredients_library
        (trade_account_id, name, ingredient_type, bottle_size_ml, bottle_cost_p, unit_cost_p, barcode, notes)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
      RETURNING id
    `)
    .bind(
      data.trade_account_id, data.name, data.ingredient_type,
      data.bottle_size_ml, data.bottle_cost_p, data.unit_cost_p,
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
  return await db
    .prepare(`SELECT * FROM pouriq_ingredients_library WHERE trade_account_id = ?1 AND barcode = ?2`)
    .bind(tradeAccountId, barcode)
    .first<IngredientLibraryRow>()
}

export async function updateLibraryEntry(
  db: D1Database,
  id: string,
  tradeAccountId: string,
  patch: Partial<Omit<IngredientLibraryInsert, 'trade_account_id'>>,
): Promise<void> {
  const allowedFields = [
    'name','ingredient_type','bottle_size_ml','bottle_cost_p','unit_cost_p','barcode','notes',
  ] as const

  // Read current state for cost-change detection before mutating.
  const before = await getLibraryEntry(db, id, tradeAccountId)
  if (!before) return

  const sets: string[] = []
  const binds: unknown[] = []
  let idx = 1
  for (const key of allowedFields) {
    if (key in patch) {
      sets.push(`${key} = ?${idx++}`)
      binds.push((patch as Record<string, unknown>)[key])
    }
  }
  if (sets.length === 0) return
  sets.push(`updated_at = datetime('now')`)
  binds.push(id)
  binds.push(tradeAccountId)
  await db
    .prepare(`UPDATE pouriq_ingredients_library SET ${sets.join(', ')} WHERE id = ?${idx++} AND trade_account_id = ?${idx}`)
    .bind(...binds)
    .run()

  // Detect a cost change and log it. An entry is either bottle-priced
  // (bottle_cost_p set, unit_cost_p null) or unit-priced (the inverse).
  // The pricing mode in the audit row reflects the mode AFTER this update.
  const newBottleCost = ('bottle_cost_p' in patch) ? patch.bottle_cost_p ?? null : before.bottle_cost_p
  const newUnitCost = ('unit_cost_p' in patch) ? patch.unit_cost_p ?? null : before.unit_cost_p

  let mode: CostPricingMode | null = null
  let oldCost: number | null = null
  let newCost: number | null = null
  if (newUnitCost !== null) {
    mode = 'unit'
    oldCost = before.unit_cost_p
    newCost = newUnitCost
  } else if (newBottleCost !== null) {
    mode = 'bottle'
    oldCost = before.bottle_cost_p
    newCost = newBottleCost
  }

  if (mode && newCost !== null && oldCost !== newCost) {
    await insertCostChange(db, {
      library_ingredient_id: id,
      pricing_mode: mode,
      old_cost_p: oldCost,
      new_cost_p: newCost,
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
