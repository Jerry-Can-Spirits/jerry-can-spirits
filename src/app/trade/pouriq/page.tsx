import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { loadDashboard, loadSetupProgress } from '@/lib/pouriq/dashboard'
import { SECONDARY_BUTTON_SM } from '@/lib/pouriq/button-styles'

export const dynamic = 'force-dynamic'

function money(p: number): string {
  return `£${(p / 100).toFixed(2)}`
}

export default async function TodayDashboard() {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const [{ attention, sales, profitability }, setup] = await Promise.all([
    loadDashboard(db, access.tradeAccountId),
    loadSetupProgress(db, access.tradeAccountId),
  ])

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-8">Today</h1>

        {!setup.allComplete && (
          <section className="mb-8 rounded-xl border border-gold-500/30 bg-jerry-green-800/40 p-5">
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <h2 className="text-sm font-semibold text-gold-200">Pour IQ setup</h2>
              <span className="text-xs text-parchment-400">{setup.completeCount} of {setup.total} complete</span>
            </div>
            <ul className="space-y-1.5 text-sm">
              {setup.steps.map((step) => (
                <li key={step.key}>
                  {step.done ? (
                    <span className="text-parchment-400"><span aria-hidden className="text-emerald-300">✓</span> {step.label}</span>
                  ) : (
                    <Link href={step.href} className="text-gold-300 hover:text-gold-200"><span aria-hidden>○ </span>{step.label}<span aria-hidden> →</span></Link>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mb-8">
          <h2 className="text-xs uppercase tracking-widest text-parchment-400 mb-3">Attention required</h2>
          {attention.length === 0 ? (
            <p className="text-sm text-parchment-400 rounded-xl border border-gold-500/15 bg-jerry-green-800/30 p-4">
              Nothing needs attention right now.
            </p>
          ) : (
            <ul className="rounded-xl border border-gold-500/20 overflow-hidden divide-y divide-gold-500/10">
              {attention.map((row) => (
                <li key={row.key}>
                  <Link href={row.href} className="flex items-center gap-3 px-4 py-3 hover:bg-jerry-green-700/30 transition-colors">
                    <span aria-hidden className={row.severity === 'high' ? 'text-red-400' : 'text-amber-300'}>●</span>
                    <span className="flex-1 text-sm text-parchment-100">{row.label}</span>
                    <span className={`text-[11px] rounded-full px-2 py-0.5 border whitespace-nowrap ${row.severity === 'high' ? 'text-red-300 border-red-500/40' : 'text-amber-300 border-amber-400/40'}`}>
                      {row.severity === 'high' ? 'High' : 'Medium'}
                    </span>
                    <span aria-hidden className="text-gold-300">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mb-8 grid sm:grid-cols-2 gap-4">
          {sales && profitability ? (
            <>
              <div className="rounded-xl border border-gold-500/20 bg-jerry-green-800/30 p-4">
                <h2 className="text-xs uppercase tracking-widest text-parchment-400 mb-2">Sales this period</h2>
                <p className="text-2xl font-bold text-white">{money(sales.revenue_p)}</p>
                <p className="text-xs text-parchment-400 mt-1">
                  {sales.serves} {sales.serves === 1 ? 'serve' : 'serves'}
                  {sales.top.length > 0 && ` · top: ${sales.top.map((t) => t.name).join(', ')}`}
                </p>
              </div>
              <div className="rounded-xl border border-gold-500/20 bg-jerry-green-800/30 p-4">
                <h2 className="text-xs uppercase tracking-widest text-parchment-400 mb-2">Menu profitability</h2>
                <p className="text-2xl font-bold text-emerald-300">
                  {profitability.headline_gp_pct.toFixed(0)}% <span className="text-xs font-normal text-parchment-400">GP ({profitability.headline_basis})</span>
                </p>
                <p className="text-xs text-parchment-400 mt-1">
                  {profitability.below_target === 0 && profitability.incomplete === 0
                    ? 'All drinks costed and on target'
                    : [
                        profitability.below_target > 0 ? `${profitability.below_target} below target` : null,
                        profitability.incomplete > 0 ? `${profitability.incomplete} missing cost` : null,
                      ].filter(Boolean).join(' · ')}
                </p>
              </div>
            </>
          ) : (
            <div className="sm:col-span-2 rounded-xl border border-gold-500/15 bg-jerry-green-800/30 p-4 text-sm text-parchment-300">
              Set an active menu and connect your till to see sales and profitability.{' '}
              <Link href="/trade/pouriq/menus" className="text-gold-300 hover:text-gold-200 underline">Your menus →</Link>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xs uppercase tracking-widest text-parchment-400 mb-3">Quick actions</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/trade/pouriq/stock" className={SECONDARY_BUTTON_SM}>Start stock count</Link>
            <Link href="/trade/pouriq/invoices/new" className={SECONDARY_BUTTON_SM}>Scan invoice</Link>
            <Link href="/trade/pouriq/new" className="text-sm text-gold-300 hover:text-gold-200 underline">Import menu</Link>
            <Link href="/trade/pouriq/variance" className="text-sm text-gold-300 hover:text-gold-200 underline">Check variance</Link>
            <Link href="/trade/pouriq/library" className="text-sm text-gold-300 hover:text-gold-200 underline">Search ingredients</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
