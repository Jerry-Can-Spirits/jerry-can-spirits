'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PRIMARY_BUTTON, SECONDARY_BUTTON_SM, DESTRUCTIVE_BUTTON } from '@/lib/pouriq/button-styles'
import { ServeForm, type ServeFormIngredient } from '@/components/pouriq/ServeForm'
import { saveServeAction, deleteServeAction } from '@/lib/pouriq/server-actions'
import type { CocktailWithIngredients, IngredientLibraryRow, IngredientWithLibrary } from '@/lib/pouriq/types'

interface Props {
  serves: CocktailWithIngredients[]
  libraryEntries: IngredientLibraryRow[]
}

function formatPour(ing: IngredientWithLibrary): string {
  if (ing.unit_count !== null) {
    return `${ing.unit_count} ${ing.unit_count === 1 ? 'unit' : 'units'}`
  }
  if (ing.pour_ml !== null) return `${ing.pour_ml} ml`
  return ''
}

function toFormIngredients(serve: CocktailWithIngredients): ServeFormIngredient[] {
  return serve.ingredients.map((ing) => ({
    library_ingredient_id: ing.library_ingredient_id,
    pour_ml: ing.pour_ml,
    unit_count: ing.unit_count,
    recipe_unit: ing.recipe_unit,
    recipe_qty: ing.recipe_qty,
  }))
}

export function ServeManager({ serves, libraryEntries }: Props) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function save(serveId: string | null, name: string, glass: string | null, ingredients: ServeFormIngredient[]) {
    setError(null)
    startTransition(async () => {
      try {
        await saveServeAction(serveId, { name, glass, ingredients })
        setCreating(false)
        setEditingId(null)
        router.refresh()
      } catch (e) {
        setError((e as Error).message || 'Could not save the serve.')
      }
    })
  }

  function remove(serveId: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setError(null)
    startTransition(async () => {
      try {
        await deleteServeAction(serveId)
        router.refresh()
      } catch (e) {
        setError((e as Error).message || 'Could not delete the serve.')
      }
    })
  }

  return (
    <div className="space-y-4">
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}

      {!creating && (
        <button type="button" onClick={() => { setEditingId(null); setCreating(true) }} disabled={pending} className={PRIMARY_BUTTON}>
          Add serve
        </button>
      )}

      {creating && (
        <ServeForm
          defaultName=""
          libraryEntries={libraryEntries}
          pending={pending}
          submitLabel="Create serve"
          onError={setError}
          onSubmit={(name, glass, ingredients) => save(null, name, glass, ingredients)}
        />
      )}

      {serves.length === 0 && !creating ? (
        <div className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl p-12 text-center">
          <p className="text-parchment-200 font-medium mb-1">No serves yet.</p>
          <p className="text-parchment-400 text-sm">Add a serve so non-cocktail POS sales deplete stock.</p>
        </div>
      ) : (
        serves.map((serve) => (
          <div key={serve.id} className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
              <h2 className="text-lg font-serif font-bold text-white">{serve.name}</h2>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => { setCreating(false); setEditingId((id) => id === serve.id ? null : serve.id) }} disabled={pending} className={SECONDARY_BUTTON_SM}>
                  {editingId === serve.id ? 'Cancel edit' : 'Edit'}
                </button>
                <button type="button" onClick={() => remove(serve.id, serve.name)} disabled={pending} className={DESTRUCTIVE_BUTTON}>
                  Delete
                </button>
              </div>
            </div>

            {serve.glass != null && serve.glass.trim() !== '' && (
              <p className="text-sm text-parchment-300 mb-2">
                <span className="font-semibold">Glass:</span> {serve.glass}
              </p>
            )}

            {serve.ingredients.length === 0 ? (
              <p className="text-parchment-400 text-sm">No ingredients set.</p>
            ) : (
              <ul className="space-y-1">
                {serve.ingredients.map((ing) => (
                  <li key={ing.id} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="text-parchment-100">{ing.library.name}</span>
                    <span className="text-parchment-400 shrink-0">{formatPour(ing)}</span>
                  </li>
                ))}
              </ul>
            )}

            {editingId === serve.id && (
              <ServeForm
                defaultName={serve.name}
                defaultGlass={serve.glass}
                defaultIngredients={toFormIngredients(serve)}
                libraryEntries={libraryEntries}
                pending={pending}
                submitLabel="Save serve"
                onError={setError}
                onSubmit={(name, glass, ingredients) => save(serve.id, name, glass, ingredients)}
              />
            )}
          </div>
        ))
      )}
    </div>
  )
}
