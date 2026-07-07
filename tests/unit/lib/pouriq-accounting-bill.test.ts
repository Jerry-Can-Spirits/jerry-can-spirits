import { describe, expect, it } from 'vitest'
import { buildBill, needsTokenRefresh, poundsFromPence } from '@/lib/pouriq/accounting/bill-builder'

const header = {
  supplier_name: 'Matthew Clark',
  invoice_number: 'INV-4471',
  invoice_date: '2026-07-01',
  created_at: '2026-07-02 09:15:00',
  prices_include_vat: 0,
}

const appliedLine = {
  extracted_name: 'Expedition Spiced Rum 70cl',
  extracted_quantity: 6,
  extracted_unit_price_p: 2250,
  extracted_line_total_p: 13500,
  applied: 1,
}

describe('buildBill', () => {
  it('builds a bill from applied lines only', () => {
    const bill = buildBill(header, [appliedLine, { ...appliedLine, extracted_name: 'Skipped', applied: 0 }])
    expect(bill).not.toBeNull()
    expect(bill!.supplierName).toBe('Matthew Clark')
    expect(bill!.reference).toBe('INV-4471')
    expect(bill!.dateISO).toBe('2026-07-01')
    expect(bill!.amountsIncludeTax).toBe(false)
    expect(bill!.lines).toHaveLength(1)
    expect(bill!.lines[0]).toEqual({
      description: 'Expedition Spiced Rum 70cl',
      quantity: 6,
      unitAmountP: 2250,
      lineTotalP: 13500,
    })
  })

  it('returns null when no lines were applied', () => {
    expect(buildBill(header, [{ ...appliedLine, applied: 0 }])).toBeNull()
  })

  it('defaults missing quantity to 1 and keeps null line totals', () => {
    const bill = buildBill(header, [{ ...appliedLine, extracted_quantity: null, extracted_line_total_p: null }])
    expect(bill!.lines[0].quantity).toBe(1)
    expect(bill!.lines[0].lineTotalP).toBeNull()
  })

  it('falls back to the commit date when the invoice date is missing', () => {
    const bill = buildBill({ ...header, invoice_date: null }, [appliedLine])
    expect(bill!.dateISO).toBe('2026-07-02')
  })

  it('substitutes a placeholder supplier when the name is missing', () => {
    const bill = buildBill({ ...header, supplier_name: null }, [appliedLine])
    expect(bill!.supplierName).toBe('Unknown supplier')
  })

  it('flags inclusive amounts when the invoice was committed inc VAT', () => {
    const bill = buildBill({ ...header, prices_include_vat: 1 }, [appliedLine])
    expect(bill!.amountsIncludeTax).toBe(true)
  })

  it('treats a NULL vat basis (pre-migration invoices) as exclusive', () => {
    const bill = buildBill({ ...header, prices_include_vat: null }, [appliedLine])
    expect(bill!.amountsIncludeTax).toBe(false)
  })
})

describe('needsTokenRefresh', () => {
  const now = Date.parse('2026-07-07T12:00:00Z')
  it('refreshes when expiry is null', () => {
    expect(needsTokenRefresh(null, now)).toBe(true)
  })
  it('refreshes when expiry is unparseable', () => {
    expect(needsTokenRefresh('not-a-date', now)).toBe(true)
  })
  it('refreshes when already expired', () => {
    expect(needsTokenRefresh('2026-07-07T11:00:00Z', now)).toBe(true)
  })
  it('refreshes inside the 2 minute skew window', () => {
    expect(needsTokenRefresh('2026-07-07T12:01:00Z', now)).toBe(true)
  })
  it('does not refresh a healthy token', () => {
    expect(needsTokenRefresh('2026-07-07T13:00:00Z', now)).toBe(false)
  })
})

describe('poundsFromPence', () => {
  it('converts pence to pounds', () => {
    expect(poundsFromPence(2250)).toBe(22.5)
    expect(poundsFromPence(1)).toBe(0.01)
    expect(poundsFromPence(0)).toBe(0)
  })
})
