import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { listLibraryEntries } from '@/lib/pouriq/ingredient-library'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { IngredientForm } from '@/components/pouriq/IngredientForm'

export const dynamic = 'force-dynamic'

export default async function NewLibraryEntryPage() {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const libraryEntries = await listLibraryEntries(db, access.tradeAccountId)

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <Link href="/trade/pouriq/library" className="text-sm text-parchment-400 hover:text-parchment-200">← Library</Link>
        <h1 className="text-3xl font-serif font-bold text-white mt-3 mb-8">Add an ingredient</h1>
        <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
          <IngredientForm entry={null} serveUnits={[]} components={[]} libraryEntries={libraryEntries} />
        </div>
      </div>
    </main>
  )
}
