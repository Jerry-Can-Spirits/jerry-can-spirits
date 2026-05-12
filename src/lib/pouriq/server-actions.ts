'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from './access'
import {
  insertMenu, updateMenu, deleteMenu,
  insertCocktail, replaceIngredients,
  getMenu,
} from './menus'
import {
  insertLibraryEntry,
  updateLibraryEntry,
  deleteLibraryEntry,
  getLibraryEntry,
  getLibraryUsageCounts,
} from './ingredient-library'
import { matchFieldManualSlug } from './field-manual-match'

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

  const id = await insertMenu(db, {
    trade_account_id: tradeAccountId,
    name, venue_type, city, target_gp_pct, positioning, notes,
  })
  revalidatePath('/trade/pouriq')
  redirect(`/trade/pouriq/${id}`)
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
  notes: string | null
  ingredients: Array<{
    library_ingredient_id: string
    pour_ml: number | null
    unit_count: number | null
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
      position: 0,
      field_manual_slug: slug,
      notes: input.notes,
    })
  } else {
    id = cocktailId
    await db
      .prepare(`UPDATE pouriq_cocktails SET name = ?1, sale_price_p = ?2, field_manual_slug = ?3, notes = ?4 WHERE id = ?5 AND menu_id = ?6`)
      .bind(input.name, input.sale_price_p, slug, input.notes, id, menuId)
      .run()
  }
  await replaceIngredients(db, id, input.ingredients)
  revalidatePath(`/trade/pouriq/${menuId}`)
  return { cocktailId: id }
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

interface LibraryEntryInput {
  name: string
  ingredient_type: import('./types').IngredientType
  bottle_size_ml: number | null
  bottle_cost_p: number | null
  unit_cost_p: number | null
  notes: string | null
}

export async function saveLibraryEntryAction(
  entryId: string | null,
  input: LibraryEntryInput,
): Promise<{ entryId: string }> {
  const { db, tradeAccountId } = await requireDb()
  if (entryId === null) {
    const id = await insertLibraryEntry(db, { ...input, trade_account_id: tradeAccountId })
    revalidatePath('/trade/pouriq/library')
    return { entryId: id }
  }
  // Verify ownership before update
  const existing = await getLibraryEntry(db, entryId, tradeAccountId)
  if (!existing) throw new Error('Ingredient not found')
  await updateLibraryEntry(db, entryId, tradeAccountId, input)
  revalidatePath('/trade/pouriq/library')
  revalidatePath(`/trade/pouriq/library/${entryId}/edit`)
  return { entryId }
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
