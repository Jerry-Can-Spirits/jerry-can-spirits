import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { getMenu, listCocktailsForMenu } from '@/lib/pouriq/menus'
import { MenuBuilder } from '@/components/pouriq/MenuBuilder'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ menuId: string }>
}

export default async function MenuBuilderPage({ params }: Props) {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const { menuId } = await params
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database

  const menu = await getMenu(db, menuId, access.tradeAccountId)
  if (!menu) notFound()

  const cocktails = await listCocktailsForMenu(db, menuId)
  const drinks = cocktails.map((c) => ({
    name: c.name,
    description: c.description,
    sale_price_p: c.sale_price_p,
  }))

  return (
    <main className="min-h-screen print-region">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <Link href={`/trade/pouriq/${menuId}`} className="text-sm text-slate-500 hover:text-slate-700 no-print">← Back to menu</Link>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mt-3 mb-2 no-print">Menu builder</h1>
        <p className="text-slate-500 text-sm mb-8 no-print">
          A branded, customer-facing version of this menu. Adjust it, then save it as a PDF to print or send.
        </p>
        <MenuBuilder menuName={menu.name} drinks={drinks} />
      </div>
    </main>
  )
}
