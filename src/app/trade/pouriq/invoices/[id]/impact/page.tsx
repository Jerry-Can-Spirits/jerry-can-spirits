import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { getInvoice } from '@/lib/pouriq/invoices'
import { listCostChangesForInvoice } from '@/lib/pouriq/cost-changes'
import { loadMultiCostImpact } from '@/lib/pouriq/multi-cost-impact'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { RipplePreview } from '@/components/pouriq/RipplePreview'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function InvoiceImpactPage({ params }: Props) {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const { id } = await params
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database

  const invoice = await getInvoice(db, id, access.tradeAccountId)
  if (!invoice) notFound()

  const costChanges = await listCostChangesForInvoice(db, id)
  const payload = await loadMultiCostImpact(
    db,
    access.tradeAccountId,
    costChanges.map((c) => ({
      library_ingredient_id: c.library_ingredient_id,
      pricing_mode: c.pricing_mode,
      old_cost_p: c.old_cost_p,
      new_cost_p: c.new_cost_p,
    })),
  )

  const headline =
    invoice.supplier_name && invoice.invoice_date
      ? `Invoice from ${invoice.supplier_name} on ${invoice.invoice_date}`
      : invoice.supplier_name
      ? `Invoice from ${invoice.supplier_name}`
      : 'Invoice impact'

  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <Link href={`/trade/pouriq/invoices/${invoice.id}`} className="text-sm text-parchment-400 hover:text-parchment-200">← Invoice detail</Link>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mt-3 mb-2">{headline}</h1>
        <p className="text-parchment-400 text-sm mb-10">
          {invoice.applied_line_count} cost{invoice.applied_line_count === 1 ? '' : 's'} updated.{' '}
          {payload.affected_drink_count} drink{payload.affected_drink_count === 1 ? '' : 's'} affected.
          {payload.newly_below_target_count > 0 && (
            <>
              {' '}
              <span className="text-red-300">{payload.newly_below_target_count} now below target.</span>
            </>
          )}
        </p>

        <RipplePreview
          projected={payload.projected}
          rollups={payload.rollups}
          emptyMessage="None of the changed ingredients are used in any drinks yet. Add them to a cocktail to see GP impact."
        />

        <div className="mt-10 flex justify-end">
          <Link href="/trade/pouriq/library" className="px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-jerry-green-900 font-semibold rounded-lg">
            Done
          </Link>
        </div>
      </div>
    </main>
  )
}
