// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, test, expect, vi } from 'vitest'
import { IngredientPicker } from '@/components/pouriq/IngredientPicker'
import type { IngredientLibraryRow } from '@/lib/pouriq/types'

afterEach(cleanup)

const entry = (id: string, name: string): IngredientLibraryRow => ({
  id, name, ingredient_type: 'spirit', base_unit: 'ml', pack_size: 700,
  price_p: 1500, price_includes_vat: 0, price_entered_p: 1500,
  pack_format: null, subcategory: null, is_prepared: 0, purchase_qty: 1,
  yield_pct: 100, barcode: null, notes: null, trade_account_id: 't',
  created_at: '', updated_at: '',
})

const entries = [entry('1', "Gordon's London Dry"), entry('2', 'Beefeater Gin')]

describe('IngredientPicker', () => {
  test('shows selected name when not focused', () => {
    render(<IngredientPicker libraryEntries={entries} selectedEntryId="1" onChange={() => {}} />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveValue("Gordon's London Dry")
  })

  test('shows library options on focus', () => {
    render(<IngredientPicker libraryEntries={entries} selectedEntryId={null} onChange={() => {}} />)
    fireEvent.focus(screen.getByRole('textbox'))
    expect(screen.getByText(/Gordon's London Dry/)).toBeInTheDocument()
    expect(screen.getByText(/Beefeater Gin/)).toBeInTheDocument()
  })

  test('clicking an option calls onChange', () => {
    const onChange = vi.fn()
    render(<IngredientPicker libraryEntries={entries} selectedEntryId={null} onChange={onChange} />)
    fireEvent.focus(screen.getByRole('textbox'))
    fireEvent.click(screen.getByText(/Beefeater Gin/))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ id: '2' }))
  })
})
