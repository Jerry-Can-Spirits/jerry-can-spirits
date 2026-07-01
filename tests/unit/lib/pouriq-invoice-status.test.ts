import { it, expect } from 'vitest'
import { invoiceStatus } from '@/lib/pouriq/invoice-status'
it('applied when all lines applied', () => {
  expect(invoiceStatus({ applied_line_count: 5, line_count: 5 })).toBe('applied')
})
it('attention when some lines unapplied', () => {
  expect(invoiceStatus({ applied_line_count: 3, line_count: 5 })).toBe('attention')
})
