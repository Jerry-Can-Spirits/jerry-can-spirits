'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ImportSourceTabs } from '@/components/pouriq/ImportSourceTabs'
import { ImportPreview } from '@/components/pouriq/ImportPreview'
import type { PreviewPayload } from '@/app/api/pouriq/import/extract/route'
import type { IngredientLibraryRow } from '@/lib/pouriq/types'

interface Props {
  params: Promise<{ menuId: string }>
}

export default function ImportPage({ params }: Props) {
  const router = useRouter()
  const [menuId, setMenuId] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewPayload | null>(null)
  const [library, setLibrary] = useState<IngredientLibraryRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { params.then(({ menuId }) => setMenuId(menuId)) }, [params])

  // Fetch library once when entering preview step (so user sees latest data).
  useEffect(() => {
    if (!preview || !menuId) return
    let cancelled = false
    fetch(`/api/pouriq/library?menuId=${encodeURIComponent(menuId)}`)
      .then((r) => r.ok ? r.json() as Promise<{ entries: IngredientLibraryRow[] }> : Promise.reject(new Error('library fetch failed')))
      .then((data) => { if (!cancelled) setLibrary(data.entries) })
      .catch(() => { if (!cancelled) setError('Could not load your library — please reload the page') })
    return () => { cancelled = true }
  }, [preview, menuId])

  if (!menuId) return null

  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-24">
        <Link href={`/trade/pouriq/${menuId}`} className="text-sm text-parchment-400 hover:text-parchment-200">← Back to menu</Link>
        <h1 className="text-3xl font-serif font-bold text-white mt-4 mb-2">Import drinks</h1>
        <p className="text-parchment-400 text-sm mb-10">
          Paste your menu text or upload a PDF. We&rsquo;ll extract the drinks and match ingredients to your library — you confirm before anything is saved.
        </p>

        <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
          {!preview ? (
            <ImportSourceTabs menuId={menuId} onPreview={setPreview} />
          ) : library ? (
            <ImportPreview menuId={menuId} drinks={preview.drinks} libraryEntries={library} />
          ) : (
            <p className="text-parchment-300 text-sm">Loading your library…</p>
          )}
          {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
        </div>

        {preview && (
          <button type="button" onClick={() => { setPreview(null); setLibrary(null) }} className="mt-4 text-sm text-parchment-400 hover:text-parchment-200 underline">
            Start over (change source)
          </button>
        )}
      </div>
    </main>
  )
}
