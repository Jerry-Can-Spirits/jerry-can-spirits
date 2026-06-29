// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, test, expect, vi } from 'vitest'
import { IngredientMatchRow } from '@/components/pouriq/IngredientMatchRow'
import type { IngredientType } from '@/lib/pouriq/types'

afterEach(cleanup)

const baseProps = {
  extractedName: "Gordon's Gin",
  rawMeasurement: '50ml',
  inferredType: 'spirit' as IngredientType,
  matchKind: 'no-match' as const,
  suggestionEntries: [],
  libraryEntries: [],
  serveUnits: {},
  state: { pour_ml: 50, unit_count: null, recipe_unit: null, recipe_qty: null },
  onChange: () => {},
}

test('no-match row can pick an existing library entry', () => {
  const onChange = vi.fn()
  render(<IngredientMatchRow {...baseProps} matchKind="no-match"
    libraryEntries={[{ id: '9', name: "Gordon's London Dry", ingredient_type: 'spirit' } as any]}
    state={{ pour_ml: 50, unit_count: null, recipe_unit: null, recipe_qty: null }}
    onChange={onChange} />)
  fireEvent.focus(screen.getByRole('textbox'))
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'gor' } })
  fireEvent.click(screen.getByText(/Gordon's London Dry/))
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ existing_library_id: '9' }))
})
