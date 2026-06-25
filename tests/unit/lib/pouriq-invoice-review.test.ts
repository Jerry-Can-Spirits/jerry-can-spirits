import { describe, it, expect } from 'vitest'
import { classifyInvoiceLine, summariseInvoiceLines, type InvoiceLineInput } from '@/lib/pouriq/invoice-review'

describe('classifyInvoiceLine', () => {
  it('routes by match kind and price change', () => {
    expect(classifyInvoiceLine({ matchKind: 'auto', priceChanged: true, resolved: true })).toBe('price-change')
    expect(classifyInvoiceLine({ matchKind: 'auto', priceChanged: false, resolved: true })).toBe('auto-ok')
    expect(classifyInvoiceLine({ matchKind: 'catalogue', priceChanged: false, resolved: false })).toBe('needs-attention')
    expect(classifyInvoiceLine({ matchKind: 'suggestions', priceChanged: false, resolved: false })).toBe('needs-attention')
    expect(classifyInvoiceLine({ matchKind: 'no-match', priceChanged: false, resolved: false })).toBe('needs-attention')
  })
})

describe('summariseInvoiceLines', () => {
  it('counts categories and unresolved lines', () => {
    const items: InvoiceLineInput[] = [
      { matchKind: 'auto', priceChanged: false, resolved: true },
      { matchKind: 'auto', priceChanged: true, resolved: true },
      { matchKind: 'catalogue', priceChanged: false, resolved: false },
      { matchKind: 'suggestions', priceChanged: false, resolved: false },
      { matchKind: 'no-match', priceChanged: false, resolved: false },
      { matchKind: 'no-match', priceChanged: false, resolved: true },
    ]
    expect(summariseInvoiceLines(items)).toEqual({ autoMatched: 2, needChoice: 2, newProducts: 2, unresolved: 3 })
  })
})
