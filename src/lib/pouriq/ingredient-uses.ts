import type { IngredientUseRow } from './types'

export async function listIngredientUses(
  db: D1Database,
  ingredientId: string,
): Promise<IngredientUseRow[]> {
  const result = await db
    .prepare(`
      SELECT id, ingredient_id, name, recipe_unit, yield_qty, position, created_at
      FROM pouriq_ingredient_uses
      WHERE ingredient_id = ?1
      ORDER BY position ASC, created_at ASC
    `)
    .bind(ingredientId)
    .all<IngredientUseRow>()
  return result.results ?? []
}

export async function replaceIngredientUses(
  db: D1Database,
  ingredientId: string,
  uses: Array<{ name: string; recipe_unit: 'ml' | 'count' | 'g'; yield_qty: number }>,
): Promise<void> {
  const statements: D1PreparedStatement[] = [
    db.prepare(`DELETE FROM pouriq_ingredient_uses WHERE ingredient_id = ?1`).bind(ingredientId),
  ]
  uses.forEach((u, i) => {
    statements.push(
      db
        .prepare(`
          INSERT INTO pouriq_ingredient_uses (ingredient_id, name, recipe_unit, yield_qty, position)
          VALUES (?1, ?2, ?3, ?4, ?5)
        `)
        .bind(ingredientId, u.name, u.recipe_unit, u.yield_qty, i),
    )
  })
  await db.batch(statements)
}
