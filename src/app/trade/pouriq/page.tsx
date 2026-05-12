import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { listMenusForTradeAccount } from '@/lib/pouriq/menus'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { MenuListCard } from '@/components/pouriq/MenuListCard'

export const dynamic = 'force-dynamic'

export default async function PourIqDashboard() {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const menus = await listMenusForTradeAccount(db, access.tradeAccountId)

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <div className="flex items-baseline justify-between mb-10">
          <div>
            <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-4">
              <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">Pour IQ</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white">Your menus</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/trade/pouriq/library" className="text-sm text-parchment-300 hover:text-parchment-100 underline">Library</Link>
            <Link
              href="/trade/pouriq/new"
              className="inline-flex items-center px-5 py-3 bg-gold-500 text-jerry-green-900 font-bold rounded-lg hover:bg-gold-400 transition-colors text-sm"
            >
              New menu
            </Link>
          </div>
        </div>

        {menus.length === 0 ? (
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-12 border border-gold-500/20 text-center">
            <p className="text-parchment-300 mb-2">No menus yet.</p>
            <p className="text-parchment-400 text-sm">Create your first to begin analysis.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {menus.map((m) => <MenuListCard key={m.id} menu={m} />)}
          </div>
        )}
      </div>
    </main>
  )
}
