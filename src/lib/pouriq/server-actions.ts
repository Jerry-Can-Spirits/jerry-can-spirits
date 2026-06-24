'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from './access'
import {
  insertMenu, updateMenu, deleteMenu, setActiveMenu,
  insertCocktail, replaceIngredients,
  getMenu, listCocktailsForMenu, getOrCreateServesMenu,
} from './menus'
import {
  insertLibraryEntry,
  updateLibraryEntry,
  deleteLibraryEntry,
  getLibraryEntry,
  getLibraryUsageCounts,
  type IngredientLibraryInsert,
} from './ingredient-library'
import { matchFieldManualSlug } from './field-manual-match'
import { upsertVoiceProfile, type VoiceProfileInput } from './voice-profile'

async function requireDb() {
  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') redirect('/trade/login')
  const { env } = await getCloudflareContext()
  return { db: env.DB as D1Database, tradeAccountId: access.tradeAccountId }
}

export async function createMenuAction(formData: FormData): Promise<void> {
  const { db, tradeAccountId } = await requireDb()
  const name = String(formData.get('name') ?? '').trim()
  if (!name) throw new Error('Name is required')
  const target_gp_pct = Number(formData.get('target_gp_pct') ?? 75)
  const venue_type = String(formData.get('venue_type') ?? '').trim() || null
  const city = String(formData.get('city') ?? '').trim() || null
  const positioning = String(formData.get('positioning') ?? '').trim() || null
  const notes = String(formData.get('notes') ?? '').trim() || null
  const prices_include_vat = String(formData.get('prices_include_vat') ?? '1') !== '0'

  const id = await insertMenu(db, {
    trade_account_id: tradeAccountId,
    name, venue_type, city, target_gp_pct, positioning, notes,
    prices_include_vat,
  })
  revalidatePath('/trade/pouriq')
  redirect(`/trade/pouriq/${id}`)
}

export async function setActiveMenuAction(menuId: string): Promise<void> {
  const { db, tradeAccountId } = await requireDb()
  await setActiveMenu(db, tradeAccountId, menuId)
  revalidatePath('/trade/pouriq')
  revalidatePath(`/trade/pouriq/${menuId}`)
}

export async function cloneMenuAction(menuId: string, newName?: string): Promise<{ menuId: string }> {
  const { db, tradeAccountId } = await requireDb()
  const source = await getMenu(db, menuId, tradeAccountId)
  if (!source) throw new Error('Menu not found')

  // Copy menu metadata.
  const newId = await insertMenu(db, {
    trade_account_id: tradeAccountId,
    name: (newName?.trim() || `Copy of ${source.name}`).slice(0, 200),
    venue_type: source.venue_type,
    city: source.city,
    target_gp_pct: source.target_gp_pct,
    positioning: source.positioning,
    notes: source.notes,
    prices_include_vat: source.prices_include_vat === 1,
  })

  // Copy every cocktail with its ingredient links. Volumes and analyses
  // are intentionally NOT copied — they are time-bound to the original
  // menu's actual operation.
  const cocktails = await listCocktailsForMenu(db, menuId)
  for (let idx = 0; idx < cocktails.length; idx++) {
    const c = cocktails[idx]
    const newCocktailId = await insertCocktail(db, {
      menu_id: newId,
      name: c.name,
      sale_price_p: c.sale_price_p,
      promotional_price_p: c.promotional_price_p,
      promotional_label: c.promotional_label,
      promotional_days: c.promotional_days,
      promotional_valid_from: c.promotional_valid_from,
      promotional_valid_until: c.promotional_valid_until,
      position: c.position ?? idx,
      field_manual_slug: c.field_manual_slug,
      notes: c.notes,
      glass: c.glass,
    })
    if (c.ingredients.length > 0) {
      await replaceIngredients(db, newCocktailId, c.ingredients.map((i) => ({
        library_ingredient_id: i.library_ingredient_id,
        pour_ml: i.pour_ml,
        unit_count: i.unit_count,
        recipe_unit: i.recipe_unit,
        recipe_qty: i.recipe_qty,
      })))
    }
  }

  revalidatePath('/trade/pouriq')
  return { menuId: newId }
}

export async function setMenuVatModeAction(menuId: string, includesVat: boolean): Promise<void> {
  const { db, tradeAccountId } = await requireDb()
  await updateMenu(db, menuId, tradeAccountId, {
    prices_include_vat: includesVat ? 1 : 0,
  })
  revalidatePath(`/trade/pouriq/${menuId}`)
}

export async function updateMenuAction(menuId: string, formData: FormData): Promise<void> {
  const { db, tradeAccountId } = await requireDb()
  await updateMenu(db, menuId, tradeAccountId, {
    name: String(formData.get('name') ?? '').trim(),
    target_gp_pct: Number(formData.get('target_gp_pct') ?? 75),
    venue_type: String(formData.get('venue_type') ?? '').trim() || null,
    city: String(formData.get('city') ?? '').trim() || null,
    positioning: String(formData.get('positioning') ?? '').trim() || null,
    notes: String(formData.get('notes') ?? '').trim() || null,
  })
  revalidatePath(`/trade/pouriq/${menuId}`)
}

export async function deleteMenuAction(menuId: string): Promise<void> {
  const { db, tradeAccountId } = await requireDb()
  await deleteMenu(db, menuId, tradeAccountId)
  revalidatePath('/trade/pouriq')
  redirect('/trade/pouriq')
}

interface CocktailInput {
  name: string
  sale_price_p: number
  promotional_price_p: number | null
  promotional_label: string | null
  promotional_days: string | null
  promotional_valid_from: string | null
  promotional_valid_until: string | null
  notes: string | null
  glass: string | null
  ingredients: Array<{
    library_ingredient_id: string
    pour_ml: number | null
    unit_count: number | null
    recipe_unit: string | null
    recipe_qty: number | null
  }>
}

export async function saveCocktailAction(
  menuId: string,
  cocktailId: string | null,
  input: CocktailInput,
): Promise<{ cocktailId: string }> {
  const { db, tradeAccountId } = await requireDb()
  const menu = await getMenu(db, menuId, tradeAccountId)
  if (!menu) throw new Error('Menu not found')

  const slug = await matchFieldManualSlug(input.name)

  let id: string
  if (cocktailId === null) {
    id = await insertCocktail(db, {
      menu_id: menuId,
      name: input.name,
      sale_price_p: input.sale_price_p,
      promotional_price_p: input.promotional_price_p,
      promotional_label: input.promotional_label,
      promotional_days: input.promotional_days,
      promotional_valid_from: input.promotional_valid_from,
      promotional_valid_until: input.promotional_valid_until,
      position: 0,
      field_manual_slug: slug,
      notes: input.notes,
      glass: input.glass,
    })
  } else {
    id = cocktailId
    await db
      .prepare(`UPDATE pouriq_cocktails SET name = ?1, sale_price_p = ?2, promotional_price_p = ?3, promotional_label = ?4, promotional_days = ?5, promotional_valid_from = ?6, promotional_valid_until = ?7, field_manual_slug = ?8, notes = ?9, glass = ?10 WHERE id = ?11 AND menu_id = ?12`)
      .bind(
        input.name, input.sale_price_p,
        input.promotional_price_p, input.promotional_label,
        input.promotional_days, input.promotional_valid_from, input.promotional_valid_until,
        slug, input.notes, input.glass, id, menuId,
      )
      .run()
  }
  await replaceIngredients(db, id, input.ingredients)
  revalidatePath(`/trade/pouriq/${menuId}`)
  return { cocktailId: id }
}

export type BulkPromoMode = 'percent' | 'flat' | 'clear'

interface BulkPromoInput {
  mode: BulkPromoMode
  amount?: number  // percent (1-99) or pence (positive integer) depending on mode
  label?: string | null
  // Day-of-week constraint (CSV of 0-6, 0=Sun). null = every day.
  days?: string | null
  valid_from?: string | null  // ISO YYYY-MM-DD
  valid_until?: string | null
}

export async function bulkApplyPromoAction(menuId: string, input: BulkPromoInput): Promise<{ updated: number }> {
  const { db, tradeAccountId } = await requireDb()
  const menu = await getMenu(db, menuId, tradeAccountId)
  if (!menu) throw new Error('Menu not found')

  if (input.mode === 'clear') {
    const result = await db
      .prepare(`UPDATE pouriq_cocktails SET promotional_price_p = NULL, promotional_label = NULL, promotional_days = NULL, promotional_valid_from = NULL, promotional_valid_until = NULL WHERE menu_id = ?1`)
      .bind(menuId)
      .run()
    revalidatePath(`/trade/pouriq/${menuId}`)
    return { updated: result.meta?.changes ?? 0 }
  }

  const amount = input.amount ?? 0
  if (input.mode === 'percent') {
    if (!Number.isFinite(amount) || amount < 1 || amount > 99) {
      throw new Error('Percentage off must be between 1 and 99')
    }
  } else {
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error('Flat amount off must be a positive integer (pence)')
    }
  }
  const label = input.label?.trim() || null
  const days = input.days?.trim() || null
  const validFrom = input.valid_from?.trim() || null
  const validUntil = input.valid_until?.trim() || null

  // Apply per-drink so we can compute promo price from each drink's own sale price.
  const drinks = await db
    .prepare(`SELECT id, sale_price_p FROM pouriq_cocktails WHERE menu_id = ?1`)
    .bind(menuId)
    .all<{ id: string; sale_price_p: number }>()
  const rows = drinks.results ?? []

  const statements: D1PreparedStatement[] = []
  let updated = 0
  for (const r of rows) {
    let promo_p: number
    if (input.mode === 'percent') {
      promo_p = Math.round(r.sale_price_p * (1 - amount / 100))
    } else {
      promo_p = r.sale_price_p - amount
    }
    // Skip if the computed promo is non-positive or would equal/exceed the
    // normal price (no-op or invalid).
    if (promo_p <= 0 || promo_p >= r.sale_price_p) continue
    statements.push(
      db
        .prepare(`UPDATE pouriq_cocktails SET promotional_price_p = ?1, promotional_label = ?2, promotional_days = ?3, promotional_valid_from = ?4, promotional_valid_until = ?5 WHERE id = ?6 AND menu_id = ?7`)
        .bind(promo_p, label, days, validFrom, validUntil, r.id, menuId),
    )
    updated++
  }
  if (statements.length > 0) await db.batch(statements)
  revalidatePath(`/trade/pouriq/${menuId}`)
  return { updated }
}

export async function deleteCocktailAction(menuId: string, cocktailId: string): Promise<void> {
  const { db, tradeAccountId } = await requireDb()
  // Verify the menu belongs to this tenant before deleting any cocktails from it.
  const menu = await getMenu(db, menuId, tradeAccountId)
  if (!menu) throw new Error('Menu not found')
  // Restrict delete to cocktails that actually belong to this menu.
  await db
    .prepare(`DELETE FROM pouriq_cocktails WHERE id = ?1 AND menu_id = ?2`)
    .bind(cocktailId, menuId)
    .run()
  revalidatePath(`/trade/pouriq/${menuId}`)
}

// LibraryEntryInput is the public-facing shape for saveLibraryEntryAction.
// It mirrors IngredientLibraryInsert without the server-only trade_account_id.
export type LibraryEntryInput = Omit<IngredientLibraryInsert, 'trade_account_id'>

const VALID_BASE_UNITS = new Set(['ml', 'g', 'each'])

export async function saveLibraryEntryAction(
  entryId: string | null,
  input: LibraryEntryInput,
): Promise<{ entryId: string }> {
  const { db, tradeAccountId } = await requireDb()
  if (input.base_unit !== undefined && !VALID_BASE_UNITS.has(input.base_unit)) throw new Error('Invalid base_unit')
  if (input.price_p !== undefined && (!Number.isFinite(input.price_p) || input.price_p < 0)) throw new Error('price_p must be a non-negative number')
  if (input.pack_size !== undefined && (!Number.isFinite(input.pack_size) || input.pack_size <= 0)) throw new Error('pack_size must be a positive number')
  if (input.purchase_qty !== undefined && (!Number.isInteger(input.purchase_qty) || input.purchase_qty < 1)) throw new Error('purchase_qty must be a positive whole number')

  let savedId: string
  if (entryId === null) {
    savedId = await insertLibraryEntry(db, { ...input, trade_account_id: tradeAccountId })
  } else {
    // Verify ownership before update
    const existing = await getLibraryEntry(db, entryId, tradeAccountId)
    if (!existing) throw new Error('Ingredient not found')
    await updateLibraryEntry(db, entryId, tradeAccountId, input)
    savedId = entryId
  }

  // Best-effort contribution to the cross-tenant barcode catalogue. Only
  // attributes are shared — no cost, no tenant data. Failures here must
  // not block the user's save.
  if (input.barcode && input.barcode.trim()) {
    try {
      const { contributeToCatalogue } = await import('./barcode-catalogue')
      await contributeToCatalogue(db, {
        barcode: input.barcode.trim(),
        name: input.name.trim(),
        ingredient_type: input.ingredient_type,
        pack_size_ml: input.base_unit === 'ml' ? input.pack_size : null,
        trade_account_id: tradeAccountId,
      })
    } catch { /* swallow — non-critical */ }
  }

  revalidatePath('/trade/pouriq/library')
  if (entryId !== null) revalidatePath(`/trade/pouriq/library/${entryId}/edit`)
  return { entryId: savedId }
}

export async function deleteLibraryEntryAction(entryId: string): Promise<void> {
  const { db, tradeAccountId } = await requireDb()
  // Block delete if in use — match the UI guard
  const usage = await getLibraryUsageCounts(db, tradeAccountId)
  if ((usage.get(entryId) ?? 0) > 0) {
    throw new Error('Cannot delete: ingredient is used in one or more drinks')
  }
  // Verify ownership before delete
  const existing = await getLibraryEntry(db, entryId, tradeAccountId)
  if (!existing) throw new Error('Ingredient not found')
  await deleteLibraryEntry(db, entryId, tradeAccountId)
  revalidatePath('/trade/pouriq/library')
}

export async function bulkDeleteLibraryEntriesAction(entryIds: string[]): Promise<{ deleted: number }> {
  const { db, tradeAccountId } = await requireDb()
  if (entryIds.length === 0) return { deleted: 0 }
  const usage = await getLibraryUsageCounts(db, tradeAccountId)
  let deleted = 0
  for (const id of entryIds) {
    // Skip anything in use (same rule as single delete) — defensive even though
    // the UI only offers unused ingredients.
    if ((usage.get(id) ?? 0) > 0) continue
    await deleteLibraryEntry(db, id, tradeAccountId)
    deleted++
  }
  revalidatePath('/trade/pouriq/library')
  return { deleted }
}

export async function saveServeAction(
  serveId: string | null,
  input: { name: string; glass: string | null; ingredients: Array<{ library_ingredient_id: string; pour_ml: number | null; unit_count: number | null; recipe_unit: string | null; recipe_qty: number | null }> },
): Promise<{ serveId: string }> {
  const { db, tradeAccountId } = await requireDb()
  if (!input.name.trim()) throw new Error('Serve name is required')
  const menuId = await getOrCreateServesMenu(db, tradeAccountId)
  let id = serveId
  if (id === null) {
    const row = await db
      .prepare(`
        INSERT INTO pouriq_cocktails (menu_id, name, sale_price_p, position, field_manual_slug, notes, glass, is_serve)
        VALUES (?1, ?2, 0, 0, NULL, NULL, ?3, 1) RETURNING id
      `)
      .bind(menuId, input.name.trim(), input.glass)
      .first<{ id: string }>()
    if (!row) throw new Error('Serve insert returned no id')
    id = row.id
  } else {
    const owns = await db
      .prepare(`SELECT 1 FROM pouriq_cocktails WHERE id = ?1 AND menu_id = ?2 AND is_serve = 1`)
      .bind(id, menuId)
      .first()
    if (!owns) throw new Error('Serve not found')
    await db
      .prepare(`UPDATE pouriq_cocktails SET name = ?1, glass = ?2 WHERE id = ?3`)
      .bind(input.name.trim(), input.glass, id)
      .run()
  }
  await replaceIngredients(db, id, input.ingredients)
  revalidatePath('/trade/pouriq/serves')
  return { serveId: id }
}

export async function deleteServeAction(serveId: string): Promise<void> {
  const { db, tradeAccountId } = await requireDb()
  const menuId = await getOrCreateServesMenu(db, tradeAccountId)
  const owns = await db
    .prepare(`SELECT 1 FROM pouriq_cocktails WHERE id = ?1 AND menu_id = ?2 AND is_serve = 1`)
    .bind(serveId, menuId)
    .first()
  if (!owns) throw new Error('Serve not found')
  await db.prepare(`DELETE FROM pouriq_cocktails WHERE id = ?1`).bind(serveId).run()
  revalidatePath('/trade/pouriq/serves')
}

export async function receiveStockAction(libraryIngredientId: string, qtyBottles: number, receivedAtISO?: string): Promise<void> {
  const { db, tradeAccountId } = await requireDb()
  if (!Number.isFinite(qtyBottles) || qtyBottles <= 0) throw new Error('Enter a positive quantity')
  const owns = await db.prepare(`SELECT 1 FROM pouriq_ingredients_library WHERE id = ?1 AND trade_account_id = ?2`).bind(libraryIngredientId, tradeAccountId).first()
  if (!owns) throw new Error('Ingredient not found')
  await db.prepare(`
    INSERT INTO pouriq_stock_receipts (trade_account_id, library_ingredient_id, received_at, qty, source, invoice_line_id)
    VALUES (?1, ?2, ?3, ?4, 'manual', NULL)
  `).bind(tradeAccountId, libraryIngredientId, receivedAtISO ?? new Date().toISOString(), qtyBottles).run()
  revalidatePath('/trade/pouriq/stock')
}

export async function recordStockCountAction(libraryIngredientId: string, countQty: number): Promise<void> {
  const { db, tradeAccountId } = await requireDb()
  if (!Number.isFinite(countQty) || countQty < 0) throw new Error('Enter a non-negative count')
  const owns = await db.prepare(`SELECT 1 FROM pouriq_ingredients_library WHERE id = ?1 AND trade_account_id = ?2`).bind(libraryIngredientId, tradeAccountId).first()
  if (!owns) throw new Error('Ingredient not found')
  await db.prepare(`
    INSERT INTO pouriq_stock_count_events (trade_account_id, library_ingredient_id, counted_at, count_qty, reason)
    VALUES (?1, ?2, datetime('now'), ?3, NULL)
  `).bind(tradeAccountId, libraryIngredientId, countQty).run()
  revalidatePath('/trade/pouriq/stock')
}

export async function saveServeUnitAction(libraryIngredientId: string, name: string, basePerUnit: number): Promise<void> {
  const { db, tradeAccountId } = await requireDb()
  const trimmed = name.trim()
  if (!trimmed) throw new Error('Serve unit needs a name')
  if (!Number.isFinite(basePerUnit) || basePerUnit <= 0) throw new Error('Conversion must be a positive number')
  const owns = await db
    .prepare(`SELECT 1 FROM pouriq_ingredients_library WHERE id = ?1 AND trade_account_id = ?2`)
    .bind(libraryIngredientId, tradeAccountId)
    .first()
  if (!owns) throw new Error('Ingredient not found')
  await db
    .prepare(`
      INSERT INTO pouriq_ingredient_serve_units (library_ingredient_id, name, base_per_unit)
      VALUES (?1, ?2, ?3)
      ON CONFLICT(library_ingredient_id, name) DO UPDATE SET base_per_unit = excluded.base_per_unit
    `)
    .bind(libraryIngredientId, trimmed, basePerUnit)
    .run()
  revalidatePath(`/trade/pouriq/library/${libraryIngredientId}/edit`)
  revalidatePath('/trade/pouriq/library')
}

export async function deleteServeUnitAction(serveUnitId: string): Promise<void> {
  const { db, tradeAccountId } = await requireDb()
  // Ownership verified via join to the library ingredient.
  const owns = await db
    .prepare(`
      SELECT 1 FROM pouriq_ingredient_serve_units su
      JOIN pouriq_ingredients_library lib ON lib.id = su.library_ingredient_id
      WHERE su.id = ?1 AND lib.trade_account_id = ?2
    `)
    .bind(serveUnitId, tradeAccountId)
    .first()
  if (!owns) throw new Error('Serve unit not found')
  await db
    .prepare(`DELETE FROM pouriq_ingredient_serve_units WHERE id = ?1`)
    .bind(serveUnitId)
    .run()
  revalidatePath('/trade/pouriq/library')
}

export async function setVoiceProfileAction(input: VoiceProfileInput): Promise<void> {
  const { db, tradeAccountId } = await requireDb()
  // Light validation. The form already constrains the enum dropdowns, but we
  // re-check here since server actions can be called with arbitrary input.
  if (!['refined', 'casual', 'cheeky', 'classic', 'minimal', 'other'].includes(input.tone)) {
    throw new Error('Invalid tone')
  }
  if (input.tone === 'other' && !(input.tone_other && input.tone_other.trim())) {
    throw new Error('Tell us how to describe your tone (free-text required when "Other" is chosen)')
  }
  if (!['we', 'i', 'you', 'third'].includes(input.person)) {
    throw new Error('Invalid person')
  }
  if (!['short', 'medium', 'long'].includes(input.length)) {
    throw new Error('Invalid length')
  }
  if (!Array.isArray(input.rules) || !Array.isArray(input.samples)) {
    throw new Error('Rules and samples must be arrays')
  }
  // At least one sample is required.
  const cleanedSamples = input.samples.map((s) => s.trim()).filter((s) => s.length > 0).slice(0, 3)
  if (cleanedSamples.length === 0) {
    throw new Error('Please paste at least one sample description')
  }
  const cleanedRules = input.rules.map((s) => s.trim()).filter((s) => s.length > 0).slice(0, 30)
  await upsertVoiceProfile(db, tradeAccountId, {
    tone: input.tone,
    tone_other: input.tone === 'other' ? (input.tone_other?.trim() ?? null) : null,
    person: input.person,
    length: input.length,
    rules: cleanedRules,
    samples: cleanedSamples,
    notes: input.notes.trim(),
  })
  revalidatePath('/trade/pouriq/settings/voice-profile')
}
