import type {
  MenuRow,
  CocktailRow,
  IngredientRow,
  CocktailWithIngredients,
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
  },
): Promise<string> {
  const result = await db
    .prepare(`
      INSERT INTO pouriq_menus
        (trade_account_id, name, venue_type, city, target_gp_pct, positioning, notes)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
      RETURNING id
    `)
    .bind(
      data.trade_account_id, data.name, data.venue_type, data.city,
      data.target_gp_pct, data.positioning, data.notes,
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
  }>,
): Promise<void> {
  const allowedFields = [
    'name','venue_type','city','target_gp_pct','positioning','notes',
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

  const ingredientsResult = await db
    .prepare(`SELECT * FROM pouriq_ingredients WHERE cocktail_id IN (SELECT id FROM pouriq_cocktails WHERE menu_id = ?1)`)
    .bind(menuId)
    .all<IngredientRow>()
  const ingredients = ingredientsResult.results ?? []

  const byCocktail = new Map<string, IngredientRow[]>()
  for (const ing of ingredients) {
    if (!byCocktail.has(ing.cocktail_id)) byCocktail.set(ing.cocktail_id, [])
    byCocktail.get(ing.cocktail_id)!.push(ing)
  }
  return cocktails.map((c) => ({ ...c, ingredients: byCocktail.get(c.id) ?? [] }))
}

export async function getCocktail(
  db: D1Database,
  cocktailId: string,
): Promise<CocktailWithIngredients | null> {
  const cocktail = await db
    .prepare(`SELECT * FROM pouriq_cocktails WHERE id = ?1`)
    .bind(cocktailId)
    .first<CocktailRow>()
  if (!cocktail) return null
  const ingredients = await db
    .prepare(`SELECT * FROM pouriq_ingredients WHERE cocktail_id = ?1`)
    .bind(cocktailId)
    .all<IngredientRow>()
  return { ...cocktail, ingredients: ingredients.results ?? [] }
}

export async function insertCocktail(
  db: D1Database,
  data: {
    menu_id: string
    name: string
    sale_price_p: number
    position: number
    field_manual_slug: string | null
    notes: string | null
  },
): Promise<string> {
  const result = await db
    .prepare(`
      INSERT INTO pouriq_cocktails
        (menu_id, name, sale_price_p, position, field_manual_slug, notes)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6)
      RETURNING id
    `)
    .bind(
      data.menu_id, data.name, data.sale_price_p, data.position,
      data.field_manual_slug, data.notes,
    )
    .first<{ id: string }>()
  if (!result) throw new Error('Cocktail insert returned no id')
  return result.id
}

export async function deleteCocktail(db: D1Database, cocktailId: string): Promise<void> {
  await db.prepare(`DELETE FROM pouriq_cocktails WHERE id = ?1`).bind(cocktailId).run()
}

export async function replaceIngredients(
  db: D1Database,
  cocktailId: string,
  ingredients: Array<{
    name: string
    ingredient_type: IngredientType
    pour_ml: number | null
    bottle_size_ml: number | null
    bottle_cost_p: number | null
    unit_cost_p: number | null
  }>,
): Promise<void> {
  await db.prepare(`DELETE FROM pouriq_ingredients WHERE cocktail_id = ?1`).bind(cocktailId).run()
  for (const ing of ingredients) {
    await db
      .prepare(`
        INSERT INTO pouriq_ingredients
          (cocktail_id, name, ingredient_type, pour_ml, bottle_size_ml, bottle_cost_p, unit_cost_p)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
      `)
      .bind(
        cocktailId, ing.name, ing.ingredient_type, ing.pour_ml,
        ing.bottle_size_ml, ing.bottle_cost_p, ing.unit_cost_p,
      )
      .run()
  }
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
