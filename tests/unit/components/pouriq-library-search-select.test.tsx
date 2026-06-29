// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterEach, describe, test, expect, vi } from 'vitest'

afterEach(cleanup)
import { LibrarySearchSelect } from '@/components/pouriq/LibrarySearchSelect'

const entries = [
  { id: '1', name: "Gordon's London Dry", ingredient_type: 'spirit' },
  { id: '2', name: 'Lemon Juice', ingredient_type: 'juice' },
] as any

describe('LibrarySearchSelect', () => {
  test('filters library and fires onPick', () => {
    const onPick = vi.fn()
    render(<LibrarySearchSelect libraryEntries={entries} onPick={onPick} onRequestCreate={() => {}} />)
    fireEvent.focus(screen.getByRole('textbox'))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'gor' } })
    fireEvent.click(screen.getByText(/Gordon's London Dry/))
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }))
  })

  test('shows create-new option', () => {
    render(<LibrarySearchSelect libraryEntries={entries} onPick={() => {}} onRequestCreate={() => {}} />)
    fireEvent.focus(screen.getByRole('textbox'))
    expect(screen.getByText(/Create new/)).toBeInTheDocument()
  })
})
