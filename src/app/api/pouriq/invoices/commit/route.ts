// POST /api/pouriq/invoices/commit
// JSON body: ticket + header + lines (with applied/library refs)
// Atomic: invoice + lines + cost_changes + library updates, then R2 move.

import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { isAllowedOrigin, isRateLimited } from '@/lib/kv'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import {
  insertInvoiceHeader,
  insertInvoiceLine,
  finaliseInvoiceTotals,
} from '@/lib/pouriq/invoices'
import { insertCostChange, type CostPricingMode } from '@/lib/pouriq/cost-changes'
import { getLibraryEntry, insertLibraryEntry } from '@/lib/pouriq/ingredient-library'
import type { IngredientType } from '@/lib/pouriq/types'

export const runtime = 'nodejs'

const COMMIT_RATE_LIMIT = 30

const INGREDIENT_TYPES: ReadonlyArray<IngredientType> = [
  'spirit', 'liqueur', 'wine', 'beer', 'mixer', 'syrup', 'juice', 'garnish', 'other',
]

interface CommitLineNewLibrary {
  name: string
  ingredient_type: IngredientType
  bottle_size_ml: number | null
  bottle_cost_p: number | null
  unit_cost_p: number | null
}

interface CommitLine {
  extracted_name: string
  extracted_quantity: number | null
  extracted_unit_price_p: number
  extracted_line_total_p: number | null
  applied: boolean
  library_id?: string
  new_library?: CommitLineNewLibrary
  new_cost_p?: number
}

interface CommitBody {
  ticket: string
  supplier_name: string | null
  invoice_number: string | null
  invoice_date: string | null
  lines: CommitLine[]
}

function isPositiveInteger(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n > 0
}

function isNonNegativeInteger(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 0
}

function validateBody(body: CommitBody): string | null {
  if (!body.ticket || typeof body.ticket !== 'string') return 'Missing ticket'
  if (!Array.isArray(body.lines) || body.lines.length === 0) return 'No lines provided'
  for (let i = 0; i < body.lines.length; i++) {
    const line = body.lines[i]
    if (typeof line.extracted_name !== 'string' || !line.extracted_name.trim()) {
      return `Line ${i + 1}: extracted_name required`
    }
    if (!isNonNegativeInteger(line.extracted_unit_price_p)) {
      return `Line ${i + 1}: extracted_unit_price_p must be a non-negative integer`
    }
    if (line.applied) {
      const hasExisting = typeof line.library_id === 'string' && line.library_id.length > 0
      const hasNew = !!line.new_library
      if (hasExisting === hasNew) {
        return `Line ${i + 1}: applied line must reference exactly one library entry (existing OR new)`
      }
      if (!isNonNegativeInteger(line.new_cost_p)) {
        return `Line ${i + 1}: applied line must include new_cost_p as a non-negative integer`
      }
      if (hasNew && line.new_library) {
        const nl = line.new_library
        if (!nl.name || typeof nl.name !== 'string' || !nl.name.trim()) return `Line ${i + 1}: new library name required`
        if (!INGREDIENT_TYPES.includes(nl.ingredient_type)) return `Line ${i + 1}: invalid ingredient_type`
        const hasBottle = nl.bottle_size_ml !== null && nl.bottle_cost_p !== null
        const hasUnit = nl.unit_cost_p !== null
        if (hasBottle === hasUnit) return `Line ${i + 1}: new library must be either bottle-priced or unit-priced`
        if (hasBottle && !isPositiveInteger(nl.bottle_size_ml)) return `Line ${i + 1}: bottle_size_ml must be a positive integer`
        if (hasBottle && !isNonNegativeInteger(nl.bottle_cost_p)) return `Line ${i + 1}: bottle_cost_p must be a non-negative integer`
        if (hasUnit && !isNonNegativeInteger(nl.unit_cost_p)) return `Line ${i + 1}: unit_cost_p must be a non-negative integer`
      }
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
  const r2 = env.TRADE_DOCS as R2Bucket

  if (await isRateLimited(kv, 'pouriq-invoice-commit', access.tradeAccountId, COMMIT_RATE_LIMIT, 3600)) {
    return NextResponse.json({ error: 'Too many commits. Please try again later.' }, { status: 429 })
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

  // 1. Insert the invoice header.
  let invoiceId: string
  try {
    invoiceId = await insertInvoiceHeader(db, {
      trade_account_id: access.tradeAccountId,
      supplier_name: body.supplier_name?.trim() || null,
      invoice_number: body.invoice_number?.trim() || null,
      invoice_date: body.invoice_date?.trim() || null,
      line_count: body.lines.length,
    })
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'pouriq-invoice-commit', phase: 'header' } })
    return NextResponse.json({ error: 'Could not save invoice header' }, { status: 500 })
  }

  // 2. For each line: insert new library if needed, update existing library
  //    cost if it changed, insert cost_changes audit, insert invoice_line row.
  let appliedCount = 0
  let netTotalP: number | null = null
  let netSawAny = false

  try {
    for (const line of body.lines) {
      let matchedLibraryId: string | null = null
      if (line.applied) {
        let libraryId: string
        let oldCostP: number | null = null
        let pricingMode: CostPricingMode

        if (line.new_library) {
          libraryId = await insertLibraryEntry(db, {
            trade_account_id: access.tradeAccountId,
            name: line.new_library.name.trim(),
            ingredient_type: line.new_library.ingredient_type,
            bottle_size_ml: line.new_library.bottle_size_ml,
            bottle_cost_p: line.new_library.bottle_cost_p,
            unit_cost_p: line.new_library.unit_cost_p,
            barcode: null,
            notes: null,
          })
          pricingMode = line.new_library.unit_cost_p !== null ? 'unit' : 'bottle'
          oldCostP = null
        } else {
          libraryId = line.library_id!
          const existing = await getLibraryEntry(db, libraryId, access.tradeAccountId)
          if (!existing) {
            throw new Error(`Library entry ${libraryId} not found for tenant`)
          }
          pricingMode = existing.unit_cost_p !== null ? 'unit' : 'bottle'
          oldCostP = pricingMode === 'unit' ? existing.unit_cost_p : existing.bottle_cost_p
          // Update the cost field directly (bypassing updateLibraryEntry so
          // we control the source='invoice' attribution on cost_changes).
          const newCostP = line.new_cost_p!
          if (newCostP !== oldCostP) {
            if (pricingMode === 'unit') {
              await db
                .prepare(`UPDATE pouriq_ingredients_library SET unit_cost_p = ?1, updated_at = datetime('now') WHERE id = ?2 AND trade_account_id = ?3`)
                .bind(newCostP, libraryId, access.tradeAccountId)
                .run()
            } else {
              await db
                .prepare(`UPDATE pouriq_ingredients_library SET bottle_cost_p = ?1, updated_at = datetime('now') WHERE id = ?2 AND trade_account_id = ?3`)
                .bind(newCostP, libraryId, access.tradeAccountId)
                .run()
            }
          }
        }
        matchedLibraryId = libraryId

        // Insert the invoice line first to get its id, then the cost_change.
        const invoiceLineId = await insertInvoiceLine(db, {
          invoice_id: invoiceId,
          extracted_name: line.extracted_name,
          extracted_quantity: line.extracted_quantity,
          extracted_unit_price_p: line.extracted_unit_price_p,
          extracted_line_total_p: line.extracted_line_total_p,
          matched_library_id: matchedLibraryId,
          applied: true,
        })

        // Log the cost change. For a brand-new library entry, old_cost_p is
        // null; we always log, even if the user happened to set the same
        // cost as some existing entry (the audit row records the action).
        const newCostP = line.new_cost_p!
        await insertCostChange(db, {
          library_ingredient_id: libraryId,
          pricing_mode: pricingMode,
          old_cost_p: oldCostP,
          new_cost_p: newCostP,
          source: 'invoice',
          invoice_id: invoiceId,
          invoice_line_id: invoiceLineId,
        })
        appliedCount++
        if (line.extracted_line_total_p !== null) {
          netTotalP = (netTotalP ?? 0) + line.extracted_line_total_p
          netSawAny = true
        }
      } else {
        // Not applied — just record the line for the audit/ledger.
        await insertInvoiceLine(db, {
          invoice_id: invoiceId,
          extracted_name: line.extracted_name,
          extracted_quantity: line.extracted_quantity,
          extracted_unit_price_p: line.extracted_unit_price_p,
          extracted_line_total_p: line.extracted_line_total_p,
          matched_library_id: null,
          applied: false,
        })
      }
    }
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'pouriq-invoice-commit', phase: 'lines' } })
    // Best-effort rollback of the invoice header.
    try { await db.prepare(`DELETE FROM pouriq_invoices WHERE id = ?1`).bind(invoiceId).run() } catch { /* swallow */ }
    return NextResponse.json({ error: 'Could not save invoice lines. Please try again.' }, { status: 500 })
  }

  // 3. Move the R2 PDF from _pending/ to its permanent tenant-namespaced key.
  let r2Key: string | null = null
  try {
    const pendingKey = `pouriq-invoices/_pending/${body.ticket}.pdf`
    const obj = await r2.get(pendingKey)
    if (obj) {
      const buffer = await obj.arrayBuffer()
      const permKey = `pouriq-invoices/${access.tradeAccountId}/${invoiceId}.pdf`
      await r2.put(permKey, buffer, {
        httpMetadata: { contentType: 'application/pdf' },
        customMetadata: { tradeAccountId: access.tradeAccountId, invoiceId, ts: new Date().toISOString() },
      })
      await r2.delete(pendingKey)
      r2Key = permKey
    }
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'pouriq-invoice-commit', phase: 'r2-move' }, extra: { invoiceId } })
    // Don't fail the commit. r2_key stays null; Download PDF will be hidden.
  }

  // 4. Finalise totals on the invoice row.
  try {
    await finaliseInvoiceTotals(db, invoiceId, appliedCount, netSawAny ? netTotalP : null, r2Key)
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'pouriq-invoice-commit', phase: 'finalise' }, extra: { invoiceId } })
    return NextResponse.json({ error: 'Could not finalise invoice. Please contact support.' }, { status: 500 })
  }

  return NextResponse.json({ invoice_id: invoiceId })
}
