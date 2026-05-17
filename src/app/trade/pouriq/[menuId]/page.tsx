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
import { VatModeToggle } from '@/components/pouriq/VatModeToggle'
import { PrintReportButton } from '@/components/pouriq/PrintReportButton'
import { BulkPromoActions } from '@/components/pouriq/BulkPromoActions'
import { BulkGenerateDescriptionsButton } from '@/components/pouriq/BulkGenerateDescriptionsButton'
import { VolumeEditor } from '@/components/pouriq/VolumeEditor'
import { VarianceEditor } from '@/components/pouriq/VarianceEditor'
import { DuplicateMenuButton } from '@/components/pouriq/DuplicateMenuButton'
import { listVolumesForPeriod, currentPeriod } from '@/lib/pouriq/volumes'
import { PRIMARY_BUTTON, SECONDARY_BUTTON, SECONDARY_BUTTON_SM } from '@/lib/pouriq/button-styles'

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
  const period = currentPeriod(menu.volume_cadence)
  const volumes = await listVolumesForPeriod(db, menuId, period.start, period.end)
  const metrics = calculateMenuMetrics(cocktails, menu.prices_include_vat === 1, volumes)
  const missingCount = cocktails.filter((c) => !c.description || c.description.trim() === '').length

  const reportDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <main className="min-h-screen print-region">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <div className="flex items-baseline gap-4 no-print">
          <Link href="/trade/pouriq" className="text-sm text-parchment-400 hover:text-parchment-200">← All menus</Link>
          <Link href="/trade/pouriq/library" className="text-sm text-parchment-400 hover:text-parchment-200">Library</Link>
        </div>
        {/* Print-only report header — never visible on screen */}
        <div className="hidden print:block mb-6 pb-4 border-b border-stone-300">
          <p className="text-xs uppercase tracking-widest">Pour IQ™ menu report</p>
          <p className="text-xs">Generated {reportDate}</p>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-3 mt-4 mb-3">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-white">{menu.name}</h1>
          {cocktails.length > 0 && (
            <div className="flex flex-wrap items-start gap-2 no-print">
              <DuplicateMenuButton menuId={menuId} menuName={menu.name} />
              <Link href={`/trade/pouriq/${menuId}/import`} className={SECONDARY_BUTTON_SM}>
                Import drinks
              </Link>
              <Link href={`/trade/pouriq/${menuId}/edit`} className={PRIMARY_BUTTON}>
                Add drink
              </Link>
              <BulkGenerateDescriptionsButton menuId={menuId} missingCount={missingCount} />
              <Link href={`/trade/pouriq/${menuId}/menu-copy`} className={SECONDARY_BUTTON}>Menu copy</Link>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-start justify-between gap-3 mb-10">
          <p className="text-parchment-400 text-sm">
            {menu.venue_type ?? 'Menu'}{menu.city && ` · ${menu.city}`} · Target GP {menu.target_gp_pct}%
            <span className="hidden print:inline"> · Prices {menu.prices_include_vat === 1 ? 'include VAT' : 'net of VAT'}</span>
          </p>
          <span className="no-print">
            <VatModeToggle menuId={menuId} pricesIncludeVat={menu.prices_include_vat === 1} />
          </span>
        </div>

        {cocktails.length === 0 ? (
          <div className="space-y-4 no-print">
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
              <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
                <h2 className="text-xl font-serif font-bold text-white">Drinks</h2>
                <div className="no-print">
                  <BulkPromoActions menuId={menuId} />
                </div>
              </div>
              <CocktailTable
                menuId={menuId}
                cocktails={cocktails}
                metrics={metrics.cocktail_metrics}
                targetGpPct={menu.target_gp_pct}
              />
            </section>
            <section className="no-print">
              <VolumeEditor
                menuId={menuId}
                cocktails={cocktails}
                metrics={metrics.cocktail_metrics}
                initialCadence={menu.volume_cadence}
              />
            </section>
            <section className="no-print">
              <VarianceEditor
                menuId={menuId}
                initialCadence={menu.volume_cadence}
              />
            </section>
            {/* Print-only sales volume summary. The interactive editor is
                hidden on paper; this block surfaces the period range and
                total contribution so the report stands on its own. The
                per-drink Units/Contribution columns live on the drinks
                table above. */}
            {volumes.length > 0 && (() => {
              const totalUnits = volumes.reduce((s, v) => s + v.units_sold, 0)
              const totalContribution = metrics.cocktail_metrics.reduce(
                (s, m) => s + (m.volume?.contribution_p ?? 0), 0
              )
              const fmtDate = (s: string) =>
                new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
              return (
                <section className="hidden print:block">
                  <h2 className="text-xl font-serif font-bold text-white mb-2">Sales volume</h2>
                  <p className="text-sm">
                    Period: {fmtDate(period.start)} – {fmtDate(period.end)} ({menu.volume_cadence}).
                  </p>
                  <p className="text-sm mt-1">
                    {totalUnits} drink{totalUnits === 1 ? '' : 's'} sold ·{' '}
                    Total contribution £{(totalContribution / 100).toFixed(2)}
                  </p>
                  <p className="text-xs mt-2">Per-drink units and contribution shown in the Drinks table above.</p>
                </section>
              )
            })()}
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

        {cocktails.length > 0 && (
          <div className="flex justify-end mt-12 pt-6 border-t border-gold-500/10 no-print">
            <PrintReportButton />
          </div>
        )}

        <div className="flex justify-end mt-16 pt-8 border-t border-gold-500/10 no-print">
          <DeleteMenuButton menuId={menuId} menuName={menu.name} />
        </div>
      </div>
    </main>
  )
}
