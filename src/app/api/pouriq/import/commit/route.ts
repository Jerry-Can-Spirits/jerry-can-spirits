// POST /api/pouriq/import/commit
// JSON body: { menuId, drinks: [...] }
// Writes drinks + library entries + ingredient rows atomically.

import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { isAllowedOrigin } from '@/lib/kv'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { getMenu } from '@/lib/pouriq/menus'
import { matchFieldManualSlug } from '@/lib/pouriq/field-manual-match'
import type { IngredientType } from '@/lib/pouriq/types'

export const runtime = 'nodejs'

interface CommitIngredient {
  // Either pick an existing library entry...
  existing_library_id?: string
  // ...or commit a new library entry inline with the drink.
  new_library?: {
    name: string
    ingredient_type: IngredientType
    bottle_size_ml: number | null
    bottle_cost_p: number | null
    unit_cost_p: number | null
  }
  pour_ml: number | null
  unit_count: number | null
}

interface CommitDrink {
  name: string
  sale_price_p: number
  ingredients: CommitIngredient[]
}

interface CommitBody {
  menuId: string
  drinks: CommitDrink[]
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: CommitBody
  try {
    body = (await request.json()) as CommitBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database

  const menu = await getMenu(db, body.menuId, access.tradeAccountId)
  if (!menu) {
    return NextResponse.json({ error: 'Menu not found' }, { status: 404 })
  }
  if (!Array.isArray(body.drinks) || body.drinks.length === 0) {
    return NextResponse.json({ error: 'No drinks to commit' }, { status: 400 })
  }

  // 1. Create all new library entries first (separate from the batch — we
  //    need their IDs for the ingredient inserts). Each is a quick insert.
  const newLibraryIdByMarker = new Map<string, string>()
  try {
    for (let drinkIdx = 0; drinkIdx < body.drinks.length; drinkIdx++) {
      const drink = body.drinks[drinkIdx]
      for (let ingIdx = 0; ingIdx < drink.ingredients.length; ingIdx++) {
        const ing = drink.ingredients[ingIdx]
        if (!ing.new_library) continue
        const result = await db
          .prepare(`
            INSERT INTO pouriq_ingredients_library
              (trade_account_id, name, ingredient_type, bottle_size_ml, bottle_cost_p, unit_cost_p)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6)
            RETURNING id
          `)
          .bind(
            access.tradeAccountId,
            ing.new_library.name.trim(),
            ing.new_library.ingredient_type,
            ing.new_library.bottle_size_ml,
            ing.new_library.bottle_cost_p,
            ing.new_library.unit_cost_p,
          )
          .first<{ id: string }>()
        if (!result) throw new Error('Library insert returned no id')
        newLibraryIdByMarker.set(`${drinkIdx}:${ingIdx}`, result.id)
      }
    }
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'pouriq-import-commit', phase: 'library' } })
    return NextResponse.json({ error: 'Could not save new library entries' }, { status: 500 })
  }

  // 2. Now create each drink + its ingredients. Each drink is a single
  //    batch (drink insert + ingredient inserts) for atomicity per drink.
  const createdDrinkIds: string[] = []
  try {
    for (let drinkIdx = 0; drinkIdx < body.drinks.length; drinkIdx++) {
      const drink = body.drinks[drinkIdx]
      const slug = await matchFieldManualSlug(drink.name)
      const cocktailResult = await db
        .prepare(`
          INSERT INTO pouriq_cocktails
            (menu_id, name, sale_price_p, position, field_manual_slug)
          VALUES (?1, ?2, ?3, ?4, ?5)
          RETURNING id
        `)
        .bind(body.menuId, drink.name.trim(), drink.sale_price_p, drinkIdx, slug)
        .first<{ id: string }>()
      if (!cocktailResult) throw new Error('Cocktail insert returned no id')
      const cocktailId = cocktailResult.id
      createdDrinkIds.push(cocktailId)

      const statements: D1PreparedStatement[] = []
      for (let ingIdx = 0; ingIdx < drink.ingredients.length; ingIdx++) {
        const ing = drink.ingredients[ingIdx]
        const libraryId = ing.existing_library_id
          ?? newLibraryIdByMarker.get(`${drinkIdx}:${ingIdx}`)
        if (!libraryId) {
          throw new Error(`Ingredient ${drinkIdx}:${ingIdx} has no library reference`)
        }
        statements.push(
          db
            .prepare(`
              INSERT INTO pouriq_ingredients
                (cocktail_id, library_ingredient_id, pour_ml, unit_count)
              VALUES (?1, ?2, ?3, ?4)
            `)
            .bind(cocktailId, libraryId, ing.pour_ml, ing.unit_count),
        )
      }
      if (statements.length > 0) {
        await db.batch(statements)
      }
    }
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'pouriq-import-commit', phase: 'drinks' } })
    // Best-effort cleanup: remove drinks we successfully inserted; CASCADE
    // removes their ingredient rows.
    try {
      for (const id of createdDrinkIds) {
        await db.prepare(`DELETE FROM pouriq_cocktails WHERE id = ?1`).bind(id).run()
      }
    } catch { /* swallow */ }
    return NextResponse.json({ error: 'Could not save drinks. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, drinkCount: createdDrinkIds.length })
}
