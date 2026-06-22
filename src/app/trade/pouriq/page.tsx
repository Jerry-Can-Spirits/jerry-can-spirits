import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { listMenusForTradeAccount } from '@/lib/pouriq/menus'
import { getAttentionRows } from '@/lib/pouriq/attention'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { MenuListCard } from '@/components/pouriq/MenuListCard'
import { AttentionPanel } from '@/components/pouriq/AttentionPanel'
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from '@/lib/pouriq/button-styles'

export const dynamic = 'force-dynamic'

export default async function PourIqDashboard() {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const [menus, attentionRows] = await Promise.all([
    listMenusForTradeAccount(db, access.tradeAccountId),
    getAttentionRows(db, access.tradeAccountId),
  ])

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <Link href="/trade/landing" className="text-sm text-parchment-400 hover:text-parchment-200">← Trade Hub</Link>
        <div className="flex items-baseline justify-between mt-3 mb-10">
          <div>
            <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-4">
              <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">Pour IQ™</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white">Your menus</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/trade/pouriq/compare" className={SECONDARY_BUTTON}>Compare menus</Link>
            <Link href="/trade/pouriq/library" className={SECONDARY_BUTTON}>Library</Link>
            <Link href="/trade/pouriq/settings/integrations" className={SECONDARY_BUTTON}>Integrations</Link>
            <Link href="/trade/pouriq/settings/voice-profile" className={SECONDARY_BUTTON}>Voice Profile</Link>
            <Link href="/trade/pouriq/new" className={PRIMARY_BUTTON}>New menu</Link>
          </div>
        </div>

        <AttentionPanel rows={attentionRows} />

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
