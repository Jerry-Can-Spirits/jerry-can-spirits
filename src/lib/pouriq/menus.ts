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
    .prepare(`SELECT * FROM pouriq_menus WHERE trade_account_id = ?1 ORDER BY updated_at DESC`)
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
  const result = await db
    .prepare(`
      INSERT INTO pouriq_menus
        (trade_account_id, name, venue_type, city, target_gp_pct, positioning, notes, prices_include_vat)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
      RETURNING id
    `)
    .bind(
      data.trade_account_id, data.name, data.venue_type, data.city,
      data.target_gp_pct, data.positioning, data.notes,
      data.prices_include_vat ? 1 : 0,
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
  await db
    .prepare(`DELETE FROM pouriq_menus WHERE id = ?1 AND trade_account_id = ?2`)
    .bind(menuId, tradeAccountId)
    .run()
}

export async function listCocktailsForMenu(
  db: D1Database,
  menuId: string,
): Promise<CocktailWithIngredients[]> {
  const cocktailsResult = await db
    .prepare(`SELECT * FROM pouriq_cocktails WHERE menu_id = ?1 ORDER BY position ASC, name ASC`)
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
        l.id AS l_id,
        l.trade_account_id AS l_trade_account_id,
        l.name AS l_name,
        l.ingredient_type AS l_ingredient_type,
        l.bottle_size_ml AS l_bottle_size_ml,
        l.bottle_cost_p AS l_bottle_cost_p,
        l.unit_cost_p AS l_unit_cost_p,
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
      l_id: string
      l_trade_account_id: string
      l_name: string
      l_ingredient_type: IngredientType
      l_bottle_size_ml: number | null
      l_bottle_cost_p: number | null
      l_unit_cost_p: number | null
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
      library: {
        id: row.l_id,
        trade_account_id: row.l_trade_account_id,
        name: row.l_name,
        ingredient_type: row.l_ingredient_type,
        bottle_size_ml: row.l_bottle_size_ml,
        bottle_cost_p: row.l_bottle_cost_p,
        unit_cost_p: row.l_unit_cost_p,
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
        i.id AS i_id, i.cocktail_id, i.library_ingredient_id, i.pour_ml, i.unit_count,
        l.id AS l_id, l.trade_account_id AS l_trade_account_id, l.name AS l_name,
        l.ingredient_type AS l_ingredient_type, l.bottle_size_ml AS l_bottle_size_ml,
        l.bottle_cost_p AS l_bottle_cost_p, l.unit_cost_p AS l_unit_cost_p,
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
      l_id: string
      l_trade_account_id: string
      l_name: string
      l_ingredient_type: IngredientType
      l_bottle_size_ml: number | null
      l_bottle_cost_p: number | null
      l_unit_cost_p: number | null
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
    library: {
      id: row.l_id,
      trade_account_id: row.l_trade_account_id,
      name: row.l_name,
      ingredient_type: row.l_ingredient_type,
      bottle_size_ml: row.l_bottle_size_ml,
      bottle_cost_p: row.l_bottle_cost_p,
      unit_cost_p: row.l_unit_cost_p,
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
  },
): Promise<string> {
  const result = await db
    .prepare(`
      INSERT INTO pouriq_cocktails
        (menu_id, name, sale_price_p,
         promotional_price_p, promotional_label,
         promotional_days, promotional_valid_from, promotional_valid_until,
         position, field_manual_slug, notes)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
      RETURNING id
    `)
    .bind(
      data.menu_id, data.name, data.sale_price_p,
      data.promotional_price_p, data.promotional_label,
      data.promotional_days, data.promotional_valid_from, data.promotional_valid_until,
      data.position, data.field_manual_slug, data.notes,
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
            (cocktail_id, library_ingredient_id, pour_ml, unit_count)
          VALUES (?1, ?2, ?3, ?4)
        `)
        .bind(cocktailId, ing.library_ingredient_id, ing.pour_ml, ing.unit_count),
    )
  }
  await db.batch(statements)
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
