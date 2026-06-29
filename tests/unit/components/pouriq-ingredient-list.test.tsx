// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, test, expect, vi } from 'vitest'
import { IngredientList } from '@/components/pouriq/IngredientList'
import type { IngredientLibraryRow } from '@/lib/pouriq/types'

afterEach(cleanup)

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))
vi.mock('@/lib/pouriq/server-actions', () => ({ bulkDeleteLibraryEntriesAction: vi.fn() }))

function entry(id: string, name: string): IngredientLibraryRow {
  return {
    id, name,
    ingredient_type: 'spirit',
    base_unit: 'ml',
    pack_size: 700,
    price_p: 1500,
    price_includes_vat: 0,
    price_entered_p: 1500,
    pack_format: null,
    subcategory: null,
    is_prepared: 0,
    purchase_qty: 1,
    yield_pct: 100,
    barcode: null,
    notes: null,
    trade_account_id: 't',
    created_at: '',
    updated_at: '',
  }
}

const entries = [
  entry('u1', 'Gin'),
  entry('u2', 'Vodka'),
  entry('in1', 'Rum'),
]

test('select-all-unused selects only the unused ingredients', () => {
  const usageCounts = new Map<string, number>([
    ['u1', 0],
    ['u2', 0],
    ['in1', 2],
  ])

  render(<IngredientList entries={entries} usageCounts={usageCounts} stockById={{}} />)

  const checkbox = screen.getByLabelText(/select all unused/i)
  expect(checkbox).toBeInTheDocument()
  expect(checkbox).not.toBeChecked()

  fireEvent.click(checkbox)

  // The bulk bar span shows "2 selected" (exact)
  expect(screen.getByText('2 selected')).toBeInTheDocument()
})

test('ticking select-all-unused never selects in-use ingredients', () => {
  const usageCounts = new Map<string, number>([
    ['u1', 0],
    ['u2', 0],
    ['in1', 2],
  ])

  render(<IngredientList entries={entries} usageCounts={usageCounts} stockById={{}} />)

  fireEvent.click(screen.getByLabelText(/select all unused/i))

  // bulk bar shows 2 selected, meaning the in-use one was not selected
  expect(screen.getByText('2 selected')).toBeInTheDocument()
  // in-use row has no individual checkbox (only unused rows get one)
  expect(screen.queryByLabelText(/Select Rum/)).toBeNull()
})

test('clicking select-all-unused a second time deselects', () => {
  const usageCounts = new Map<string, number>([['u1', 0], ['u2', 0], ['in1', 2]])

  render(<IngredientList entries={entries} usageCounts={usageCounts} stockById={{}} />)

  const checkbox = screen.getByLabelText(/select all unused/i)
  fireEvent.click(checkbox) // select all
  expect(screen.getByText('2 selected')).toBeInTheDocument()

  fireEvent.click(checkbox) // deselect all
  expect(screen.queryByText('2 selected')).not.toBeInTheDocument()
})
