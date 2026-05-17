import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { getMenu } from '@/lib/pouriq/menus'
import { MenuCopyExport } from '@/components/pouriq/MenuCopyExport'

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ menuId: string }>
}

interface DrinkRow {
  name: string
  description: string | null
  sale_price_p: number | null
}

export default async function MenuCopyPage({ params }: Params) {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const { menuId } = await params
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database

  const menu = await getMenu(db, menuId, access.tradeAccountId)
  if (!menu) redirect('/trade/pouriq')

  const drinks = (
    await db
      .prepare(`SELECT name, description, sale_price_p FROM pouriq_cocktails WHERE menu_id = ?1 ORDER BY position ASC, name ASC`)
      .bind(menuId)
      .all<DrinkRow>()
  ).results ?? []

  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <Link href={`/trade/pouriq/${menuId}`} className="text-sm text-parchment-400 hover:text-parchment-200">← {menu.name}</Link>
        <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mt-3 mb-6">
          <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">Pour IQ™</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">Menu copy</h1>
        <p className="text-parchment-300 text-base leading-relaxed mb-8">
          Every drink on this menu with its saved description. Copy to clipboard or download to hand to your designer.
        </p>
        {drinks.length === 0 ? (
          <p className="text-parchment-300">No drinks on this menu yet.</p>
        ) : (
          <MenuCopyExport menuName={menu.name} drinks={drinks} />
        )}
      </div>
    </main>
  )
}
