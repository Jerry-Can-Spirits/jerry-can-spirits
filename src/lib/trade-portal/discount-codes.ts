// One Shopify discount code per venue, minted from the rule on its account.
//
// Why per venue rather than one shared TRADE10 (Dan, 1 Oct 2026): a leaked
// code names its leaker, one venue can be switched off without touching the
// rest, and an order carrying the code is that venue's order with nothing
// else to check. The code is the venue's name, SAXTYS-TRADE, so it reads on
// an order and looks wrong anywhere it should not be.
//
// Shopify B2B would do this natively and needs Shopify Plus, which is not a
// serious option for this store.

import { adminGraphql } from '@/lib/shopify-admin'
import { EXPEDITION_CASE_HANDLE, getTradeProducts, type TradeProduct } from '@/lib/trade-products'
import { toPence } from './product-data'

export type DiscountSpec =
  | { kind: 'percent'; percent: number }
  | { kind: 'amountOff'; pencePerItem: number; handles: string[] }

/** The deal as an admin states it: a percentage, or a case price inc VAT. */
export interface DiscountRequest {
  percent?: number
  case_price_inc_vat?: number
}

/**
 * Turn a stated deal into a spec. A case price needs the case's list price to
 * become an amount off, so this reads the catalogue and hands it back for the
 * caller to scope the code with.
 */
export async function specFromRequest(
  discount: DiscountRequest,
): Promise<{ spec: DiscountSpec; caseListP: number; products: TradeProduct[] } | { error: string }> {
  const products = await getTradeProducts()
  const caseAmount = products.find((p) => p.handle === EXPEDITION_CASE_HANDLE)?.variants[0]?.price
  const caseListP = caseAmount ? toPence(caseAmount) : 0
  if (discount.percent !== undefined) {
    const pct = Number(discount.percent)
    if (!Number.isInteger(pct) || pct < 1 || pct > 50) return { error: 'discount.percent must be a whole number from 1 to 50' }
    return { spec: { kind: 'percent', percent: pct }, caseListP, products }
  }
  if (discount.case_price_inc_vat !== undefined) {
    const priceP = Math.round(Number(discount.case_price_inc_vat) * 100)
    if (!caseListP) return { error: 'Could not read the case list price from Shopify; try again shortly' }
    if (!Number.isFinite(priceP) || priceP <= 0 || priceP >= caseListP) {
      return { error: `discount.case_price_inc_vat must be below the list price of £${(caseListP / 100).toFixed(2)}` }
    }
    return { spec: { kind: 'amountOff', pencePerItem: caseListP - priceP, handles: [EXPEDITION_CASE_HANDLE] }, caseListP, products }
  }
  return { error: 'discount needs percent or case_price_inc_vat' }
}

/** "The Bank Bar & Grill" -> "BANKBARGRILL". Letters and digits, no leading "The", capped. */
export function venueCodeStem(venueName: string): string {
  const stem = venueName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/^\s*the\s+/i, '')
    .replace(/[^a-z0-9]/gi, '')
    .toUpperCase()
    .slice(0, 16)
  return stem || 'VENUE'
}

/**
 * The venue's code: SAXTYS-TRADE. The deal is deliberately not in the name
 * (Dan, 1 Oct 2026): the venue sees the code at checkout and on every order
 * email, and "your trade code" reads better than a number, while a leaked
 * code still names its venue. The rule stays on the account, so the same
 * code can carry a changed deal.
 */
export function venueCodeFor(venueName: string): string {
  return `${venueCodeStem(venueName)}-TRADE`
}

/** The variants a code is scoped to, mirroring what the portal will show. */
export function variantIdsFor(spec: DiscountSpec, products: TradeProduct[]): string[] {
  const covered =
    spec.kind === 'percent'
      ? products.filter((p) => !p.excludeFromDiscount)
      : products.filter((p) => spec.handles.includes(p.handle))
  return covered.flatMap((p) => p.variants.map((v) => v.id))
}

/** The three account columns a spec is stored as (migration 0079). */
export function specToColumns(spec: DiscountSpec): { kind: string; value: number; handles: string | null } {
  return spec.kind === 'percent'
    ? { kind: 'percent', value: spec.percent, handles: null }
    : { kind: 'amountOff', value: spec.pencePerItem, handles: JSON.stringify(spec.handles) }
}

interface BasicCreate {
  discountCodeBasicCreate: {
    codeDiscountNode: { id: string } | null
    userErrors: { field: string[] | null; message: string }[]
  }
}

/**
 * Create the code in Shopify. No minimum, no end date, no combining with
 * other discounts, any customer: the venue's PIN is the gate, not the code.
 * If the code is already taken, a numeric suffix is tried a few times, since
 * two venues can share a name.
 */
export async function mintTradeDiscountCode(
  adminToken: string,
  wanted: string,
  spec: DiscountSpec,
  variantIds: string[],
): Promise<{ code: string; id: string }> {
  if (variantIds.length === 0) throw new Error('No products to scope the discount code to')
  const value =
    spec.kind === 'percent'
      ? { percentage: spec.percent / 100 }
      : { discountAmount: { amount: (spec.pencePerItem / 100).toFixed(2), appliesOnEachItem: true } }

  const mutation = `
    mutation MintTradeCode($input: DiscountCodeBasicInput!) {
      discountCodeBasicCreate(basicCodeDiscount: $input) {
        codeDiscountNode { id }
        userErrors { field message }
      }
    }
  `
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = attempt === 0 ? wanted : `${wanted}-${attempt + 1}`
    const data = await adminGraphql<BasicCreate>(adminToken, mutation, {
      input: {
        title: `Trade: ${code}`,
        code,
        startsAt: new Date().toISOString(),
        endsAt: null,
        usageLimit: null,
        appliesOncePerCustomer: false,
        context: { all: 'ALL' },
        combinesWith: { orderDiscounts: false, productDiscounts: false, shippingDiscounts: false },
        customerGets: { value, items: { products: { productVariantsToAdd: variantIds } } },
      },
    })
    const result = data.discountCodeBasicCreate
    const taken = result.userErrors.some((e) => /already|taken|unique|in use/i.test(e.message))
    if (taken) continue
    if (result.userErrors.length) {
      throw new Error(`Shopify refused the code ${code}: ${result.userErrors.map((e) => e.message).join(', ')}`)
    }
    if (!result.codeDiscountNode) throw new Error(`Shopify returned no discount node for ${code}`)
    return { code, id: result.codeDiscountNode.id }
  }
  throw new Error(`Could not find a free code starting ${wanted}`)
}

interface ByCode {
  codeDiscountNodeByCode: { id: string } | null
}
interface Deactivate {
  discountCodeDeactivate: { userErrors: { message: string }[] }
}

/** Switch a code off in Shopify. Returns false if no such code exists. */
export async function deactivateTradeDiscountCode(adminToken: string, code: string): Promise<boolean> {
  const found = await adminGraphql<ByCode>(
    adminToken,
    `query FindCode($code: String!) { codeDiscountNodeByCode(code: $code) { id } }`,
    { code },
  )
  const id = found.codeDiscountNodeByCode?.id
  if (!id) return false
  const data = await adminGraphql<Deactivate>(
    adminToken,
    `mutation Off($id: ID!) { discountCodeDeactivate(id: $id) { userErrors { message } } }`,
    { id },
  )
  const errs = data.discountCodeDeactivate.userErrors
  if (errs.length) throw new Error(`Could not deactivate ${code}: ${errs.map((e) => e.message).join(', ')}`)
  return true
}
