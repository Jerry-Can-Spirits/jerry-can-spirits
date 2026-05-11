import { redirect, notFound } from 'next/navigation'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import Link from 'next/link'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { getMenu, getCocktail } from '@/lib/pouriq/menus'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { CocktailForm } from '@/components/pouriq/CocktailForm'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ menuId: string }>
  searchParams: Promise<{ cocktail?: string }>
}

export default async function EditMenuPage({ params, searchParams }: Props) {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/pouriq/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const { menuId } = await params
  const { cocktail: cocktailId } = await searchParams

  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const menu = await getMenu(db, menuId, access.tradeAccountId)
  if (!menu) notFound()

  const cocktail = cocktailId ? await getCocktail(db, cocktailId) : null
  if (cocktailId && (!cocktail || cocktail.menu_id !== menuId)) notFound()

  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <Link href={`/trade/pouriq/${menuId}`} className="text-sm text-parchment-400 hover:text-parchment-200">← Back to {menu.name}</Link>
        <h1 className="text-3xl font-serif font-bold text-white mt-4 mb-8">
          {cocktail ? `Edit ${cocktail.name}` : 'Add a cocktail'}
        </h1>
        <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
          <CocktailForm menuId={menuId} cocktail={cocktail} />
        </div>
      </div>
    </main>
  )
}
