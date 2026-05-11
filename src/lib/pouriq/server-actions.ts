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
import { matchFieldManualSlug } from './field-manual-match'
import type { IngredientType } from './types'

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
    name: string
    ingredient_type: IngredientType
    pour_ml: number | null
    bottle_size_ml: number | null
    bottle_cost_p: number | null
    unit_cost_p: number | null
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
