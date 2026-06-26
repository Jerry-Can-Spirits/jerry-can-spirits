import type { IngredientType } from './types'

export interface InvoiceRow {
  id: string
  trade_account_id: string
  supplier_name: string | null
  invoice_number: string | null
  invoice_date: string | null
  net_total_p: number | null
  line_count: number
  applied_line_count: number
  r2_key: string | null
  created_at: string
}

export interface InvoiceLineRow {
  id: string
  invoice_id: string
  extracted_name: string
  extracted_quantity: number | null
  extracted_unit_price_p: number
  extracted_line_total_p: number | null
  matched_library_id: string | null
  applied: number
  created_at: string
}

export interface InsertInvoiceHeader {
  trade_account_id: string
  supplier_name: string | null
  invoice_number: string | null
  invoice_date: string | null
  line_count: number
}

export interface InsertInvoiceLine {
  invoice_id: string
  extracted_name: string
  extracted_quantity: number | null
  extracted_unit_price_p: number
  extracted_line_total_p: number | null
  matched_library_id: string | null
  applied: boolean
}

export interface NewLibraryFromInvoice {
  name: string
  ingredient_type: IngredientType
  base_unit: 'ml' | 'g' | 'each'
  pack_size: number
  price_p: number
}

export async function insertInvoiceHeader(
  db: D1Database,
  data: InsertInvoiceHeader,
): Promise<string> {
  const result = await db
    .prepare(`
      INSERT INTO pouriq_invoices
        (trade_account_id, supplier_name, invoice_number, invoice_date, line_count, applied_line_count)
      VALUES (?1, ?2, ?3, ?4, ?5, 0)
      RETURNING id
    `)
    .bind(
      data.trade_account_id,
      data.supplier_name,
      data.invoice_number,
      data.invoice_date,
      data.line_count,
    )
    .first<{ id: string }>()
  if (!result) throw new Error('Invoice header insert returned no id')
  return result.id
}

export async function insertInvoiceLine(
  db: D1Database,
  data: InsertInvoiceLine,
): Promise<string> {
  const result = await db
    .prepare(`
      INSERT INTO pouriq_invoice_lines
        (invoice_id, extracted_name, extracted_quantity, extracted_unit_price_p, extracted_line_total_p, matched_library_id, applied)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
      RETURNING id
    `)
    .bind(
      data.invoice_id,
      data.extracted_name,
      data.extracted_quantity,
      data.extracted_unit_price_p,
      data.extracted_line_total_p,
      data.matched_library_id,
      data.applied ? 1 : 0,
    )
    .first<{ id: string }>()
  if (!result) throw new Error('Invoice line insert returned no id')
  return result.id
}

export async function finaliseInvoiceTotals(
  db: D1Database,
  invoiceId: string,
  appliedLineCount: number,
  netTotalP: number | null,
  r2Key: string | null,
): Promise<void> {
  await db
    .prepare(`
      UPDATE pouriq_invoices
      SET applied_line_count = ?1, net_total_p = ?2, r2_key = ?3
      WHERE id = ?4
    `)
    .bind(appliedLineCount, netTotalP, r2Key, invoiceId)
    .run()
}

export async function getInvoice(
  db: D1Database,
  id: string,
  tradeAccountId: string,
): Promise<InvoiceRow | null> {
  return await db
    .prepare(`SELECT * FROM pouriq_invoices WHERE id = ?1 AND trade_account_id = ?2`)
    .bind(id, tradeAccountId)
    .first<InvoiceRow>()
}

export async function listInvoiceLines(
  db: D1Database,
  invoiceId: string,
): Promise<InvoiceLineRow[]> {
  const result = await db
    .prepare(`SELECT * FROM pouriq_invoice_lines WHERE invoice_id = ?1 ORDER BY created_at ASC`)
    .bind(invoiceId)
    .all<InvoiceLineRow>()
  return result.results ?? []
}

export async function listInvoicesForTenant(
  db: D1Database,
  tradeAccountId: string,
  limit: number = 100,
): Promise<InvoiceRow[]> {
  const result = await db
    .prepare(`
      SELECT * FROM pouriq_invoices
      WHERE trade_account_id = ?1
      ORDER BY created_at DESC
      LIMIT ?2
    `)
    .bind(tradeAccountId, limit)
    .all<InvoiceRow>()
  return result.results ?? []
}

// Delete an invoice and everything booked off it. Deletes are explicit and
// ordered rather than relying on FK cascade, so it is correct regardless of FK
// enforcement: stock receipts first (they link to a line by a plain column with
// no FK and would otherwise orphan and keep counting toward perpetual stock),
// then the invoice lines, then the invoice. Already-applied prices stay (the
// pouriq_cost_changes price-history rows are not touched). Returns the stored R2
// key (for the caller to delete the PDF) or null when not found/owned.
export async function deleteInvoice(
  db: D1Database,
  id: string,
  tradeAccountId: string,
): Promise<{ r2_key: string | null } | null> {
  const invoice = await db
    .prepare(`SELECT r2_key FROM pouriq_invoices WHERE id = ?1 AND trade_account_id = ?2`)
    .bind(id, tradeAccountId)
    .first<{ r2_key: string | null }>()
  if (!invoice) return null
  await db.batch([
    db
      .prepare(`DELETE FROM pouriq_stock_receipts WHERE invoice_line_id IN (SELECT id FROM pouriq_invoice_lines WHERE invoice_id = ?1)`)
      .bind(id),
    db.prepare(`DELETE FROM pouriq_invoice_lines WHERE invoice_id = ?1`).bind(id),
    db
      .prepare(`DELETE FROM pouriq_invoices WHERE id = ?1 AND trade_account_id = ?2`)
      .bind(id, tradeAccountId),
  ])
  return { r2_key: invoice.r2_key }
}
