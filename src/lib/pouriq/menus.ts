import type {
  MenuRow,
  CocktailRow,
  CocktailWithIngredients,
  IngredientWithLibrary,
  IngredientType,
} from './types'

export async function listMenusForTradeAccount(
  db: D1Database,
  tradeAccountId: string,
): Promise<MenuRow[]> {
  const result = await db
    .prepare(`SELECT * FROM pouriq_menus WHERE trade_account_id = ?1 AND is_serves_menu = 0 ORDER BY updated_at DESC`)
    .bind(tradeAccountId)
    .all<MenuRow>()
  return result.results ?? []
}

export async function getMenu(
  db: D1Database,
  menuId: string,
  tradeAccountId: string,
): Promise<MenuRow | null> {
  return await db
    .prepare(`SELECT * FROM pouriq_menus WHERE id = ?1 AND trade_account_id = ?2`)
    .bind(menuId, tradeAccountId)
    .first<MenuRow>()
}

export async function getActiveMenu(db: D1Database, tradeAccountId: string): Promise<MenuRow | null> {
  return await db
    .prepare(`SELECT * FROM pouriq_menus WHERE trade_account_id = ?1 AND is_active = 1 LIMIT 1`)
    .bind(tradeAccountId)
    .first<MenuRow>()
}

// Set the tenant's one active menu, clearing any other. Verifies ownership
// first so we never clear the active flag without setting a valid replacement.
export async function setActiveMenu(db: D1Database, tradeAccountId: string, menuId: string): Promise<void> {
  const owns = await db
    .prepare(`SELECT 1 AS one FROM pouriq_menus WHERE id = ?1 AND trade_account_id = ?2`)
    .bind(menuId, tradeAccountId)
    .first<{ one: number }>()
  if (!owns) throw new Error('Menu not found for this account')
  await db.batch([
    db.prepare(`UPDATE pouriq_menus SET is_active = 0, updated_at = datetime('now') WHERE trade_account_id = ?1 AND is_active = 1`).bind(tradeAccountId),
    db.prepare(`UPDATE pouriq_menus SET is_active = 1, updated_at = datetime('now') WHERE id = ?1 AND trade_account_id = ?2`).bind(menuId, tradeAccountId),
  ])
}

export async function insertMenu(
  db: D1Database,
  data: {
    trade_account_id: string
    name: string
    venue_type: string | null
    city: string | null
    target_gp_pct: number
    positioning: string | null
    notes: string | null
    prices_include_vat: boolean
  },
): Promise<string> {
  // The tenant's first menu becomes active automatically — there is always
  // an active menu once one exists. Later menus insert inactive.
  const existing = await db
    .prepare(`SELECT COUNT(*) AS c FROM pouriq_menus WHERE trade_account_id = ?1`)
    .bind(data.trade_account_id)
    .first<{ c: number }>()
  const isActive = (existing?.c ?? 0) === 0 ? 1 : 0

  const result = await db
    .prepare(`
      INSERT INTO pouriq_menus
        (trade_account_id, name, venue_type, city, target_gp_pct, positioning, notes, prices_include_vat, is_active)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
      RETURNING id
    `)
    .bind(
      data.trade_account_id, data.name, data.venue_type, data.city,
      data.target_gp_pct, data.positioning, data.notes,
      data.prices_include_vat ? 1 : 0, isActive,
    )
    .first<{ id: string }>()
  if (!result) throw new Error('Menu insert returned no id')
  return result.id
}

export async function updateMenu(
  db: D1Database,
  menuId: string,
  tradeAccountId: string,
  patch: Partial<{
    name: string
    venue_type: string | null
    city: string | null
    target_gp_pct: number
    positioning: string | null
    notes: string | null
    prices_include_vat: number
  }>,
): Promise<void> {
  const allowedFields = [
    'name','venue_type','city','target_gp_pct','positioning','notes','prices_include_vat',
  ] as const
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
  binds.push(menuId)
  binds.push(tradeAccountId)
  await db
    .prepare(`UPDATE pouriq_menus SET ${sets.join(', ')} WHERE id = ?${idx++} AND trade_account_id = ?${idx}`)
    .bind(...binds)
    .run()
}

export async function deleteMenu(
  db: D1Database,
  menuId: string,
  tradeAccountId: string,
): Promise<void> {
  const row = await db
    .prepare(`SELECT is_active FROM pouriq_menus WHERE id = ?1 AND trade_account_id = ?2`)
    .bind(menuId, tradeAccountId)
    .first<{ is_active: number }>()
  await db
    .prepare(`DELETE FROM pouriq_menus WHERE id = ?1 AND trade_account_id = ?2`)
    .bind(menuId, tradeAccountId)
    .run()
  // If the active menu was deleted, promote the most-recently-updated
  // remaining menu so there is always an active menu when any exist.
  if (row?.is_active === 1) {
    await db
      .prepare(`
        UPDATE pouriq_menus SET is_active = 1, updated_at = datetime('now')
        WHERE id = (SELECT id FROM pouriq_menus WHERE trade_account_id = ?1 ORDER BY updated_at DESC LIMIT 1)
      `)
      .bind(tradeAccountId)
      .run()
  }
}

export async function listCocktailsForMenu(
  db: D1Database,
  menuId: string,
): Promise<CocktailWithIngredients[]> {
  const cocktailsResult = await db
    .prepare(`SELECT * FROM pouriq_cocktails WHERE menu_id = ?1 ORDER BY name COLLATE NOCASE ASC`)
    .bind(menuId)
    .all<CocktailRow>()
  const cocktails = cocktailsResult.results ?? []
  if (cocktails.length === 0) return []

  // Join library entry inline so calculations can read costs without a second pass.
  const ingredientsResult = await db
    .prepare(`
      SELECT
        i.id AS i_id,
        i.cocktail_id,
        i.library_ingredient_id,
        i.pour_ml,
        i.unit_count,
        i.recipe_unit,
        i.recipe_qty,
        l.id AS l_id,
        l.trade_account_id AS l_trade_account_id,
        l.name AS l_name,
        l.ingredient_type AS l_ingredient_type,
        l.base_unit AS l_base_unit,
        l.pack_size AS l_pack_size,
        l.price_p AS l_price_p,
        l.pack_format AS l_pack_format,
        l.subcategory AS l_subcategory,
        l.is_prepared AS l_is_prepared,
        l.purchase_qty AS l_purchase_qty,
        l.yield_pct AS l_yield_pct,
        l.barcode AS l_barcode,
        l.notes AS l_notes,
        l.created_at AS l_created_at,
        l.updated_at AS l_updated_at
      FROM pouriq_ingredients i
      JOIN pouriq_ingredients_library l ON l.id = i.library_ingredient_id
      WHERE i.cocktail_id IN (SELECT id FROM pouriq_cocktails WHERE menu_id = ?1)
    `)
    .bind(menuId)
    .all<{
      i_id: string
      cocktail_id: string
      library_ingredient_id: string
      pour_ml: number | null
      unit_count: number | null
      recipe_unit: string | null
      recipe_qty: number | null
      l_id: string
      l_trade_account_id: string
      l_name: string
      l_ingredient_type: IngredientType
      l_base_unit: 'ml' | 'g' | 'each'
      l_pack_size: number
      l_price_p: number
      l_pack_format: string | null
      l_subcategory: string | null
      l_is_prepared: number
      l_purchase_qty: number
      l_yield_pct: number
      l_barcode: string | null
      l_notes: string | null
      l_created_at: string
      l_updated_at: string
    }>()

  const byCocktail = new Map<string, IngredientWithLibrary[]>()
  for (const row of ingredientsResult.results ?? []) {
    const ing: IngredientWithLibrary = {
      id: row.i_id,
      cocktail_id: row.cocktail_id,
      library_ingredient_id: row.library_ingredient_id,
      pour_ml: row.pour_ml,
      unit_count: row.unit_count,
      recipe_unit: row.recipe_unit,
      recipe_qty: row.recipe_qty,
      library: {
        id: row.l_id,
        trade_account_id: row.l_trade_account_id,
        name: row.l_name,
        ingredient_type: row.l_ingredient_type,
        base_unit: row.l_base_unit,
        pack_size: row.l_pack_size,
        price_p: row.l_price_p,
        pack_format: row.l_pack_format,
        subcategory: row.l_subcategory,
        is_prepared: row.l_is_prepared,
        purchase_qty: row.l_purchase_qty,
        yield_pct: row.l_yield_pct,
        barcode: row.l_barcode,
        notes: row.l_notes,
        created_at: row.l_created_at,
        updated_at: row.l_updated_at,
      },
    }
    if (!byCocktail.has(row.cocktail_id)) byCocktail.set(row.cocktail_id, [])
    byCocktail.get(row.cocktail_id)!.push(ing)
  }
  return cocktails.map((c) => ({ ...c, ingredients: byCocktail.get(c.id) ?? [] }))
}

export async function getCocktail(
  db: D1Database,
  cocktailId: string,
  tradeAccountId: string,
): Promise<CocktailWithIngredients | null> {
  // Defensive tenant scope: cocktails don't carry trade_account_id directly,
  // so we JOIN through the parent menu and filter on that. Prevents callers
  // from accidentally returning another tenant's cocktail by id.
  const cocktail = await db
    .prepare(`
      SELECT c.* FROM pouriq_cocktails c
      JOIN pouriq_menus m ON m.id = c.menu_id
      WHERE c.id = ?1 AND m.trade_account_id = ?2
    `)
    .bind(cocktailId, tradeAccountId)
    .first<CocktailRow>()
  if (!cocktail) return null

  const ingredientsResult = await db
    .prepare(`
      SELECT
        i.id AS i_id, i.cocktail_id, i.library_ingredient_id, i.pour_ml, i.unit_count, i.recipe_unit, i.recipe_qty,
        l.id AS l_id, l.trade_account_id AS l_trade_account_id, l.name AS l_name,
        l.ingredient_type AS l_ingredient_type,
        l.base_unit AS l_base_unit, l.pack_size AS l_pack_size, l.price_p AS l_price_p,
        l.pack_format AS l_pack_format, l.subcategory AS l_subcategory,
        l.is_prepared AS l_is_prepared,
        l.purchase_qty AS l_purchase_qty,
        l.yield_pct AS l_yield_pct,
        l.barcode AS l_barcode,
        l.notes AS l_notes, l.created_at AS l_created_at, l.updated_at AS l_updated_at
      FROM pouriq_ingredients i
      JOIN pouriq_ingredients_library l ON l.id = i.library_ingredient_id
      WHERE i.cocktail_id = ?1
    `)
    .bind(cocktailId)
    .all<{
      i_id: string
      cocktail_id: string
      library_ingredient_id: string
      pour_ml: number | null
      unit_count: number | null
      recipe_unit: string | null
      recipe_qty: number | null
      l_id: string
      l_trade_account_id: string
      l_name: string
      l_ingredient_type: IngredientType
      l_base_unit: 'ml' | 'g' | 'each'
      l_pack_size: number
      l_price_p: number
      l_pack_format: string | null
      l_subcategory: string | null
      l_is_prepared: number
      l_purchase_qty: number
      l_yield_pct: number
      l_barcode: string | null
      l_notes: string | null
      l_created_at: string
      l_updated_at: string
    }>()

  const ingredients: IngredientWithLibrary[] = (ingredientsResult.results ?? []).map((row) => ({
    id: row.i_id,
    cocktail_id: row.cocktail_id,
    library_ingredient_id: row.library_ingredient_id,
    pour_ml: row.pour_ml,
    unit_count: row.unit_count,
    recipe_unit: row.recipe_unit,
    recipe_qty: row.recipe_qty,
    library: {
      id: row.l_id,
      trade_account_id: row.l_trade_account_id,
      name: row.l_name,
      ingredient_type: row.l_ingredient_type,
      base_unit: row.l_base_unit,
      pack_size: row.l_pack_size,
      price_p: row.l_price_p,
      pack_format: row.l_pack_format,
      subcategory: row.l_subcategory,
      is_prepared: row.l_is_prepared,
      purchase_qty: row.l_purchase_qty,
      yield_pct: row.l_yield_pct,
      barcode: row.l_barcode,
      notes: row.l_notes,
      created_at: row.l_created_at,
      updated_at: row.l_updated_at,
    },
  }))

  return { ...cocktail, ingredients }
}

export async function insertCocktail(
  db: D1Database,
  data: {
    menu_id: string
    name: string
    sale_price_p: number
    promotional_price_p: number | null
    promotional_label: string | null
    promotional_days: string | null
    promotional_valid_from: string | null
    promotional_valid_until: string | null
    position: number
    field_manual_slug: string | null
    notes: string | null
    glass: string | null
  },
): Promise<string> {
  const result = await db
    .prepare(`
      INSERT INTO pouriq_cocktails
        (menu_id, name, sale_price_p,
         promotional_price_p, promotional_label,
         promotional_days, promotional_valid_from, promotional_valid_until,
         position, field_manual_slug, notes, glass)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
      RETURNING id
    `)
    .bind(
      data.menu_id, data.name, data.sale_price_p,
      data.promotional_price_p, data.promotional_label,
      data.promotional_days, data.promotional_valid_from, data.promotional_valid_until,
      data.position, data.field_manual_slug, data.notes, data.glass,
    )
    .first<{ id: string }>()
  if (!result) throw new Error('Cocktail insert returned no id')
  return result.id
}

export async function replaceIngredients(
  db: D1Database,
  cocktailId: string,
  ingredients: Array<{
    library_ingredient_id: string
    pour_ml: number | null
    unit_count: number | null
    recipe_unit: string | null
    recipe_qty: number | null
  }>,
): Promise<void> {
  const statements: D1PreparedStatement[] = [
    db.prepare(`DELETE FROM pouriq_ingredients WHERE cocktail_id = ?1`).bind(cocktailId),
  ]
  for (const ing of ingredients) {
    statements.push(
      db
        .prepare(`
          INSERT INTO pouriq_ingredients
            (cocktail_id, library_ingredient_id, pour_ml, unit_count, recipe_unit, recipe_qty)
          VALUES (?1, ?2, ?3, ?4, ?5, ?6)
        `)
        .bind(cocktailId, ing.library_ingredient_id, ing.pour_ml, ing.unit_count, ing.recipe_unit, ing.recipe_qty),
    )
  }
  await db.batch(statements)
}

// The hidden per-tenant menu that holds serves. Created lazily. Never active,
// never shown in menu lists; exists only to satisfy the cocktails.menu_id FK.
export async function getOrCreateServesMenu(db: D1Database, tradeAccountId: string): Promise<string> {
  const existing = await db
    .prepare(`SELECT id FROM pouriq_menus WHERE trade_account_id = ?1 AND is_serves_menu = 1 LIMIT 1`)
    .bind(tradeAccountId).first<{ id: string }>()
  if (existing) return existing.id
  const created = await db
    .prepare(`INSERT INTO pouriq_menus (trade_account_id, name, venue_type, city, target_gp_pct, positioning, notes, prices_include_vat, is_active, is_serves_menu) VALUES (?1, 'Bar serves', NULL, NULL, 0, NULL, NULL, 1, 0, 1) RETURNING id`)
    .bind(tradeAccountId).first<{ id: string }>()
  if (!created) throw new Error('Could not create serves menu')
  return created.id
}

export async function listServes(db: D1Database, tradeAccountId: string) {
  const menuId = await getOrCreateServesMenu(db, tradeAccountId)
  return listCocktailsForMenu(db, menuId)
}

export async function insertAnalysis(
  db: D1Database,
  data: {
    menu_id: string
    model: string
    prompt_tokens: number | null
    output_tokens: number | null
    recommendations_json: string
    metrics_json: string
  },
): Promise<string> {
  const result = await db
    .prepare(`
      INSERT INTO pouriq_analyses
        (menu_id, model, prompt_tokens, output_tokens, recommendations_json, metrics_json)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6)
      RETURNING id
    `)
    .bind(
      data.menu_id, data.model, data.prompt_tokens, data.output_tokens,
      data.recommendations_json, data.metrics_json,
    )
    .first<{ id: string }>()
  if (!result) throw new Error('Analysis insert returned no id')
  return result.id
}
