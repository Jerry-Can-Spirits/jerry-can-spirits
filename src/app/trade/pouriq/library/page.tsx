import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { listLibraryEntries, getLibraryUsageCounts } from '@/lib/pouriq/ingredient-library'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { IngredientList } from '@/components/pouriq/IngredientList'
import { CostUpdateToastReader } from '@/components/pouriq/CostUpdateToastReader'
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from '@/lib/pouriq/button-styles'

export const dynamic = 'force-dynamic'

export default async function LibraryPage() {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const [entries, usageCounts] = await Promise.all([
    listLibraryEntries(db, access.tradeAccountId),
    getLibraryUsageCounts(db, access.tradeAccountId),
  ])

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <div className="flex items-baseline justify-between mb-8 flex-wrap gap-3">
          <div>
            <Link href="/trade/pouriq" className="text-sm text-parchment-400 hover:text-parchment-200">← All menus</Link>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mt-3">Ingredient library</h1>
            <p className="text-parchment-400 text-sm mt-2">{entries.length} ingredient{entries.length === 1 ? '' : 's'}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/trade/pouriq/invoices" className={SECONDARY_BUTTON}>Recent invoices</Link>
            <Link href="/trade/pouriq/invoices/new" className={SECONDARY_BUTTON}>Scan an invoice</Link>
            <Link href="/trade/pouriq/library/what-if" className={SECONDARY_BUTTON}>Run a what-if</Link>
            <Link href="/trade/pouriq/library/new" className={PRIMARY_BUTTON}>Add ingredient</Link>
          </div>
        </div>

        <IngredientList entries={entries} usageCounts={usageCounts} />
      </div>
      <CostUpdateToastReader />
    </main>
  )
}
