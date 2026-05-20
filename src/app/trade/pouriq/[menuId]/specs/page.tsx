import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { getMenu, listCocktailsForMenu } from '@/lib/pouriq/menus'
import { SpecCard } from '@/components/pouriq/SpecCard'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ menuId: string }>
}

export default async function SpecCardsPage({ params }: Props) {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const { menuId } = await params
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database

  const menu = await getMenu(db, menuId, access.tradeAccountId)
  if (!menu) notFound()

  const cocktails = await listCocktailsForMenu(db, menuId)
  const priceIncludesVat = menu.prices_include_vat === 1

  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <Link
          href={`/trade/pouriq/${menuId}`}
          className="text-sm text-parchment-400 hover:text-parchment-200"
        >
          ← {menu.name}
        </Link>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mt-6 mb-8">
          Spec cards ({cocktails.length})
        </h1>
        <p className="text-parchment-300">
          Loaded {cocktails.length} cocktails. Render coming next task.
        </p>
        <p className="text-parchment-500 text-xs mt-2">
          priceIncludesVat: {String(priceIncludesVat)}
        </p>
      </div>
    </main>
  )
}
