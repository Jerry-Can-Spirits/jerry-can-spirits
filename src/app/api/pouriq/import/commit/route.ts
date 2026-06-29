// POST /api/pouriq/import/commit
// JSON body: { menuId, drinks: [...] }
// Writes drinks + library entries + ingredient rows atomically.

import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { isAllowedOrigin, isRateLimited } from '@/lib/kv'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { getMenu } from '@/lib/pouriq/menus'
import { matchFieldManualSlug } from '@/lib/pouriq/field-manual-match'
import { ALL_INGREDIENT_TYPES, type IngredientType } from '@/lib/pouriq/types'
import { netPriceP } from '@/lib/pouriq/calculations'

export const runtime = 'nodejs'

const COMMIT_RATE_LIMIT = 30 // per hour per tenant

interface CommitIngredient {
  // Either pick an existing library entry...
  existing_library_id?: string
  // ...or commit a new library entry inline with the drink.
  new_library?: {
    name: string
    ingredient_type: IngredientType
    base_unit: 'ml' | 'g' | 'each'
    pack_size: number
    price_p: number
    price_includes_vat?: boolean
    purchase_qty: number
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

function isPositiveInteger(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n > 0
}

function isNonNegativeInteger(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 0
}

function isPositiveNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n > 0
}

// Validate the body shape and value ranges. Returns an error string or null.
function validateBody(body: CommitBody): string | null {
  if (!body.menuId || typeof body.menuId !== 'string') return 'Invalid menuId'
  if (!Array.isArray(body.drinks) || body.drinks.length === 0) return 'No drinks to commit'

  for (let i = 0; i < body.drinks.length; i++) {
    const d = body.drinks[i]
    if (!d.name || typeof d.name !== 'string' || !d.name.trim()) return `Drink ${i + 1}: name required`
    if (!isPositiveInteger(d.sale_price_p)) return `Drink ${i + 1}: sale_price_p must be a positive integer`
    if (!Array.isArray(d.ingredients) || d.ingredients.length === 0) {
      return `Drink ${i + 1} (${d.name}): must have at least one ingredient`
    }

    for (let j = 0; j < d.ingredients.length; j++) {
      const ing = d.ingredients[j]
      const tag = `Drink ${i + 1} (${d.name}) ingredient ${j + 1}`

      const hasExisting = typeof ing.existing_library_id === 'string' && ing.existing_library_id.length > 0
      const hasNew = !!ing.new_library
      if (hasExisting === hasNew) return `${tag}: must reference exactly one library entry`

      if (hasNew && ing.new_library) {
        const nl = ing.new_library
        if (!nl.name || typeof nl.name !== 'string' || !nl.name.trim()) return `${tag}: new library name required`
        if (!ALL_INGREDIENT_TYPES.includes(nl.ingredient_type)) return `${tag}: invalid ingredient_type`
        if (!['ml', 'g', 'each'].includes(nl.base_unit)) return `${tag}: base_unit must be ml, g, or each`
        if (!isPositiveNumber(nl.pack_size)) return `${tag}: pack_size must be a positive number`
        if (!isNonNegativeInteger(nl.price_p)) return `${tag}: price_p must be a non-negative integer`
        if (!isPositiveInteger(nl.purchase_qty)) return `${tag}: purchase_qty must be a positive integer`
      }

      const hasPour = ing.pour_ml !== null
      const hasCount = ing.unit_count !== null
      if (hasPour === hasCount) return `${tag}: must specify either pour_ml or unit_count, not both`
      if (hasPour && !isPositiveNumber(ing.pour_ml)) return `${tag}: pour_ml must be > 0`
      if (hasCount && !isPositiveNumber(ing.unit_count)) return `${tag}: unit_count must be > 0`
    }
  }
  return null
}

export async function POST(request: Request) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { env } = await getCloudflareContext()
  const kv = env.SITE_OPS as KVNamespace
  const db = env.DB as D1Database

  if (await isRateLimited(kv, 'pouriq-import-commit', access.tradeAccountId, COMMIT_RATE_LIMIT, 3600)) {
    return NextResponse.json({ error: 'Too many imports. Please try again later.' }, { status: 429 })
  }

  let body: CommitBody
  try {
    body = (await request.json()) as CommitBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const validationError = validateBody(body)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const menu = await getMenu(db, body.menuId, access.tradeAccountId)
  if (!menu) {
    return NextResponse.json({ error: 'Menu not found' }, { status: 404 })
  }

  // Dedupe new library entries by normalised name within this request. If two
  // drinks both reference the same new ingredient, we want a single library row.
  const dedupeKey = (name: string) => name.trim().toLowerCase()
  const newLibraryIdByMarker = new Map<string, string>()
  const newLibraryIdByName = new Map<string, string>()

  try {
    for (let drinkIdx = 0; drinkIdx < body.drinks.length; drinkIdx++) {
      const drink = body.drinks[drinkIdx]
      for (let ingIdx = 0; ingIdx < drink.ingredients.length; ingIdx++) {
        const ing = drink.ingredients[ingIdx]
        if (!ing.new_library) continue
        const key = dedupeKey(ing.new_library.name)
        const existing = newLibraryIdByName.get(key)
        if (existing) {
          newLibraryIdByMarker.set(`${drinkIdx}:${ingIdx}`, existing)
          continue
        }
        const includesVat = ing.new_library.price_includes_vat === true
        const netP = netPriceP(ing.new_library.price_p, includesVat)
        const result = await db
          .prepare(`
            INSERT INTO pouriq_ingredients_library
              (trade_account_id, name, ingredient_type, base_unit, pack_size, price_p,
               price_includes_vat, price_entered_p, purchase_qty)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
            RETURNING id
          `)
          .bind(
            access.tradeAccountId,
            ing.new_library.name.trim(),
            ing.new_library.ingredient_type,
            ing.new_library.base_unit,
            ing.new_library.pack_size,
            netP,
            includesVat ? 1 : 0,
            ing.new_library.price_p,
            ing.new_library.purchase_qty,
          )
          .first<{ id: string }>()
        if (!result) throw new Error('Library insert returned no id')
        newLibraryIdByMarker.set(`${drinkIdx}:${ingIdx}`, result.id)
        newLibraryIdByName.set(key, result.id)
      }
    }
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'pouriq-import-commit', phase: 'library' } })
    return NextResponse.json({ error: 'Could not save new library entries' }, { status: 500 })
  }

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
      await db.batch(statements)
    }
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'pouriq-import-commit', phase: 'drinks' } })
    try {
      for (const id of createdDrinkIds) {
        await db.prepare(`DELETE FROM pouriq_cocktails WHERE id = ?1`).bind(id).run()
      }
    } catch { /* swallow */ }
    return NextResponse.json({ error: 'Could not save drinks. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, drinkCount: createdDrinkIds.length })
}
