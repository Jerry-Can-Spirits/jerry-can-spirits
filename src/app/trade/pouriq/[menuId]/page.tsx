import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { getMenu, listCocktailsForMenu } from '@/lib/pouriq/menus'
import { calculateMenuMetrics } from '@/lib/pouriq/calculations'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { KpiCards } from '@/components/pouriq/KpiCards'
import { CocktailTable } from '@/components/pouriq/CocktailTable'
import { IngredientOverlapTable } from '@/components/pouriq/IngredientOverlapTable'
import { RecommendationStream } from '@/components/pouriq/RecommendationStream'
import { DeleteMenuButton } from '@/components/pouriq/DeleteMenuButton'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ menuId: string }>
}

export default async function MenuDetailPage({ params }: Props) {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const { menuId } = await params
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const menu = await getMenu(db, menuId, access.tradeAccountId)
  if (!menu) notFound()

  const cocktails = await listCocktailsForMenu(db, menuId)
  const metrics = calculateMenuMetrics(cocktails)

  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <div className="flex items-baseline gap-4">
          <Link href="/trade/pouriq" className="text-sm text-parchment-400 hover:text-parchment-200">← All menus</Link>
          <Link href="/trade/pouriq/library" className="text-sm text-parchment-400 hover:text-parchment-200">Library</Link>
        </div>
        <div className="flex items-baseline justify-between mt-4 mb-3">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-white">{menu.name}</h1>
          <div className="flex items-center gap-3">
            <Link href={`/trade/pouriq/${menuId}/import`} className="text-sm text-gold-300 hover:text-gold-200 underline">
              Import drinks
            </Link>
            <Link href={`/trade/pouriq/${menuId}/edit`} className="text-sm px-4 py-2 bg-gold-500 text-jerry-green-900 font-bold rounded-lg hover:bg-gold-400 transition-colors">
              Add drink
            </Link>
          </div>
        </div>
        <p className="text-parchment-400 text-sm mb-10">
          {menu.venue_type ?? 'Menu'}{menu.city && ` · ${menu.city}`} · Target GP {menu.target_gp_pct}%
        </p>

        <div className="flex justify-end mb-6">
          <DeleteMenuButton menuId={menuId} menuName={menu.name} />
        </div>

        {cocktails.length === 0 ? (
          <div className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl p-12 text-center">
            <p className="text-parchment-300 mb-2">No drinks yet.</p>
            <p className="text-parchment-400 text-sm mb-6">Add your first to see the numbers.</p>
            <Link href={`/trade/pouriq/${menuId}/edit`} className="inline-flex items-center px-5 py-3 bg-gold-500 text-jerry-green-900 font-bold rounded-lg hover:bg-gold-400 transition-colors text-sm">
              Add a drink
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            <KpiCards menu={menu} metrics={metrics} />
            <section>
              <h2 className="text-xl font-serif font-bold text-white mb-4">Drinks</h2>
              <CocktailTable
                menuId={menuId}
                cocktails={cocktails}
                metrics={metrics.cocktail_metrics}
                targetGpPct={menu.target_gp_pct}
              />
            </section>
            <section>
              <h2 className="text-xl font-serif font-bold text-white mb-4">Ingredient overlap</h2>
              <IngredientOverlapTable overlap={metrics.ingredient_overlap} />
            </section>
            <section>
              <h2 className="text-xl font-serif font-bold text-white mb-4">AI recommendations</h2>
              <RecommendationStream menuId={menuId} />
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
