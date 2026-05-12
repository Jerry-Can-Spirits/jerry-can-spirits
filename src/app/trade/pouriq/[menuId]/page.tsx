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

interface StartTile {
  title: string
  description: string
  href: string
  cta: string
}

function StartTile({ title, description, href, cta }: StartTile) {
  return (
    <Link
      href={href}
      className="block bg-jerry-green-700/40 hover:bg-jerry-green-700/60 border border-gold-500/30 hover:border-gold-400/60 rounded-xl p-6 transition-colors"
    >
      <h3 className="text-lg font-serif font-bold text-white mb-2">{title}</h3>
      <p className="text-parchment-300 text-sm leading-relaxed mb-4">{description}</p>
      <span className="inline-flex items-center text-gold-300 text-sm font-medium">
        {cta}
        <span aria-hidden="true" className="ml-2">→</span>
      </span>
    </Link>
  )
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
        <div className="flex flex-wrap items-baseline justify-between gap-3 mt-4 mb-3">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-white">{menu.name}</h1>
          {cocktails.length > 0 && (
            <div className="flex items-center gap-2">
              <Link href={`/trade/pouriq/${menuId}/import`} className="text-sm px-4 py-2 border border-gold-500/40 text-gold-200 hover:bg-gold-500/10 hover:border-gold-400 rounded-lg transition-colors">
                Import drinks
              </Link>
              <Link href={`/trade/pouriq/${menuId}/edit`} className="text-sm px-4 py-2 bg-gold-500 text-jerry-green-900 font-bold rounded-lg hover:bg-gold-400 transition-colors">
                Add drink
              </Link>
            </div>
          )}
        </div>
        <p className="text-parchment-400 text-sm mb-10">
          {menu.venue_type ?? 'Menu'}{menu.city && ` · ${menu.city}`} · Target GP {menu.target_gp_pct}%
        </p>

        {cocktails.length === 0 ? (
          <div className="space-y-4">
            <div className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl p-6">
              <h2 className="text-xl font-serif font-bold text-white mb-1">Get drinks onto this menu</h2>
              <p className="text-parchment-300 text-sm mb-6">Pick the option that matches how your menu currently lives.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <StartTile
                  title="Import from PDF"
                  description="Upload your existing drinks menu PDF. We extract every drink and inferred recipe — you review before saving."
                  href={`/trade/pouriq/${menuId}/import?source=pdf`}
                  cta="Upload PDF"
                />
                <StartTile
                  title="Import from spreadsheet"
                  description="Excel or CSV. Best if your cocktails and costs already live in a sheet."
                  href={`/trade/pouriq/${menuId}/import?source=spreadsheet`}
                  cta="Upload spreadsheet"
                />
                <StartTile
                  title="Add drinks manually"
                  description="Type each drink in one at a time. Best for short menus or small adjustments."
                  href={`/trade/pouriq/${menuId}/edit`}
                  cta="Add a drink"
                />
              </div>
            </div>
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

        <div className="flex justify-end mt-16 pt-8 border-t border-gold-500/10">
          <DeleteMenuButton menuId={menuId} menuName={menu.name} />
        </div>
      </div>
    </main>
  )
}
