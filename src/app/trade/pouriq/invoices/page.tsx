import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { listInvoicesForTenant } from '@/lib/pouriq/invoices'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { PRIMARY_BUTTON } from '@/lib/pouriq/button-styles'

export const dynamic = 'force-dynamic'

function formatMoney(p: number | null): string {
  if (p === null) return '—'
  return `£${(p / 100).toFixed(2)}`
}

export default async function InvoicesListPage() {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const invoices = await listInvoicesForTenant(db, access.tradeAccountId)

  return (
    <main className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <Link href="/trade/pouriq/library" className="text-sm text-parchment-400 hover:text-parchment-200">← Library</Link>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mt-3">Recent invoices</h1>
            <p className="text-parchment-400 text-sm mt-2">{invoices.length} invoice{invoices.length === 1 ? '' : 's'} scanned</p>
          </div>
          <Link href="/trade/pouriq/invoices/new" className={PRIMARY_BUTTON}>Scan an invoice</Link>
        </div>

        {invoices.length === 0 ? (
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-10 border border-gold-500/20 text-center text-parchment-300">
            No invoices yet. Drop your first one to populate the library.
          </div>
        ) : (
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl overflow-hidden border border-gold-500/20">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="bg-jerry-green-900/40">
                  <tr className="text-left text-parchment-400 text-xs uppercase tracking-widest">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3">Invoice #</th>
                    <th className="px-4 py-3">Net total</th>
                    <th className="px-4 py-3">Lines applied</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-t border-gold-500/10 hover:bg-jerry-green-700/20">
                      <td className="px-4 py-3">
                        <Link href={`/trade/pouriq/invoices/${inv.id}`} className="text-gold-300 hover:text-gold-200 underline">
                          {inv.invoice_date ?? inv.created_at.slice(0, 10)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-parchment-100">{inv.supplier_name ?? '—'}</td>
                      <td className="px-4 py-3 text-parchment-300">{inv.invoice_number ?? '—'}</td>
                      <td className="px-4 py-3 text-parchment-200">{formatMoney(inv.net_total_p)}</td>
                      <td className="px-4 py-3 text-parchment-300">{inv.applied_line_count} / {inv.line_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
