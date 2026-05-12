import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import {
  getLibraryEntry,
  getLibraryEntryUsage,
} from '@/lib/pouriq/ingredient-library'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { IngredientForm } from '@/components/pouriq/IngredientForm'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditLibraryEntryPage({ params }: Props) {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const { id } = await params
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database

  const entry = await getLibraryEntry(db, id, access.tradeAccountId)
  if (!entry) notFound()

  const usage = await getLibraryEntryUsage(db, id)

  // Group usage by menu for the "Used in" section
  const byMenu = new Map<string, { menuName: string; cocktails: Array<{ id: string; name: string }> }>()
  for (const u of usage) {
    if (!byMenu.has(u.menu_id)) byMenu.set(u.menu_id, { menuName: u.menu_name, cocktails: [] })
    byMenu.get(u.menu_id)!.cocktails.push({ id: u.cocktail_id, name: u.cocktail_name })
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <Link href="/trade/pouriq/library" className="text-sm text-parchment-400 hover:text-parchment-200">← Library</Link>
        <h1 className="text-3xl font-serif font-bold text-white mt-3 mb-8">{entry.name}</h1>

        <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20 mb-8">
          <IngredientForm entry={entry} usageCount={usage.length} />
        </div>

        {byMenu.size > 0 && (
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
            <h2 className="text-lg font-serif font-bold text-white mb-4">Used in</h2>
            <div className="space-y-4">
              {Array.from(byMenu.entries()).map(([menuId, info]) => (
                <div key={menuId}>
                  <Link href={`/trade/pouriq/${menuId}`} className="text-sm font-medium text-gold-300 hover:text-gold-200 underline">
                    {info.menuName}
                  </Link>
                  <ul className="mt-1 text-sm text-parchment-300 list-inside list-disc">
                    {info.cocktails.map((c) => (
                      <li key={c.id}>
                        <Link href={`/trade/pouriq/${menuId}/edit?cocktail=${c.id}`} className="hover:text-parchment-100 underline">
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
