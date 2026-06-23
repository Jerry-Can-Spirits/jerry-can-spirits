import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { listServes } from '@/lib/pouriq/menus'
import { listLibraryEntries } from '@/lib/pouriq/ingredient-library'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { ServeManager } from '@/components/pouriq/ServeManager'

export const dynamic = 'force-dynamic'

export default async function ServesPage() {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const [serves, libraryEntries] = await Promise.all([
    listServes(db, access.tradeAccountId),
    listLibraryEntries(db, access.tradeAccountId),
  ])

  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <Link href="/trade/pouriq" className="text-sm text-parchment-400 hover:text-parchment-200">← All menus</Link>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mt-3 mb-2">Serves</h1>
        <p className="text-parchment-400 text-sm mb-10">
          Serves give non-cocktail POS sales like a vodka and coke or a house single a light pour spec, so those sales still deplete stock.
        </p>
        <ServeManager serves={serves} libraryEntries={libraryEntries} />
      </div>
    </main>
  )
}
