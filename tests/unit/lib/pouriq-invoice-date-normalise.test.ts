import { describe, it, expect } from 'vitest'
import { receiptTimestamp } from '@/lib/pouriq/invoices'

const NOW = '2026-07-07T12:00:00.000Z'

describe('receiptTimestamp', () => {
  it('expands a bare date to start-of-day', () => {
    expect(receiptTimestamp('2026-07-07', NOW)).toBe('2026-07-07 00:00:00')
  })

  it('expands a bare date regardless of surrounding whitespace', () => {
    expect(receiptTimestamp('  2026-07-07  ', NOW)).toBe('2026-07-07 00:00:00')
  })

  it('passes a full ISO string through unchanged', () => {
    expect(receiptTimestamp('2026-07-07T08:00:00.000Z', NOW)).toBe('2026-07-07T08:00:00.000Z')
  })

  it('passes a SQLite datetime string through unchanged', () => {
    expect(receiptTimestamp('2026-07-07 08:00:00', NOW)).toBe('2026-07-07 08:00:00')
  })

  it('falls back to nowIso when invoiceDate is null', () => {
    expect(receiptTimestamp(null, NOW)).toBe(NOW)
  })

  it('falls back to nowIso when invoiceDate is an empty string', () => {
    expect(receiptTimestamp('', NOW)).toBe(NOW)
  })

  it('falls back to nowIso when invoiceDate is whitespace only', () => {
    expect(receiptTimestamp('   ', NOW)).toBe(NOW)
  })
})
