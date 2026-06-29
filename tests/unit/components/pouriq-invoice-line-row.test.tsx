// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, test, expect, vi } from 'vitest'
import { InvoiceLineRow } from '@/components/pouriq/InvoiceLineRow'

afterEach(cleanup)

const baseLine = {
  extracted_name: 'Kahlúa',
  extracted_quantity: null,
  extracted_unit_price_p: 1440,
  extracted_line_total_p: null,
  match: { kind: 'no-match' as const },
}

const baseState = {
  applied: false,
  unit_price_p: 1440,
  match: { kind: 'existing' as const, library_id: null },
}

test('invoice row can pick an existing library entry (no duplicate)', () => {
  const onChange = vi.fn()
  render(
    <table><tbody>
      <InvoiceLineRow
        index={0}
        line={baseLine}
        state={baseState}
        libraryEntries={[{ id: '5', name: 'Kahlua', ingredient_type: 'liqueur' } as any]}
        libraryById={new Map()}
        pricesIncludeVat={false}
        onChange={onChange}
        onToggleCreateNew={() => {}}
      />
    </tbody></table>
  )
  fireEvent.focus(screen.getByRole('textbox', { name: /search library/i }))
  fireEvent.change(screen.getByRole('textbox', { name: /search library/i }), { target: { value: 'kah' } })
  fireEvent.click(screen.getByText(/Kahlua/))
  expect(onChange).toHaveBeenCalledWith(
    0,
    expect.objectContaining({ match: expect.objectContaining({ library_id: '5' }) })
  )
})
