import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { listConnections } from '@/lib/pouriq/pos/connections'
import { IntegrationCard } from '@/components/pouriq/IntegrationCard'

export const dynamic = 'force-dynamic'

interface SearchParams {
  searchParams: Promise<{ connected?: string; error?: string }>
}

export default async function IntegrationsPage({ searchParams }: SearchParams) {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const connections = await listConnections(db, access.tradeAccountId)
  const byProvider = new Map(connections.map((c) => [c.provider, c]))

  const sp = await searchParams
  const justConnected = sp.connected
  const oauthError = sp.error

  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <Link href="/trade/pouriq" className="text-sm text-parchment-400 hover:text-parchment-200">← Pour IQ</Link>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mt-3 mb-2">Integrations</h1>
        <p className="text-parchment-400 text-sm mb-10">
          Connect your POS so sales volumes flow into Pour IQ automatically. You can still enter or paste volumes manually any time.
        </p>

        {justConnected && (
          <p className="mb-6 text-sm text-emerald-300">Connected {justConnected}. First sync runs within an hour, or click Sync now.</p>
        )}
        {oauthError && (
          <p role="alert" className="mb-6 text-sm text-red-300">Connection failed ({oauthError}). Try again or contact support.</p>
        )}

        <div className="space-y-4">
          <IntegrationCard
            provider="square"
            title="Square"
            description="Most common UK POS for independent bars and small chains. Sales flow in via webhooks plus hourly backfill."
            connection={byProvider.get('square') ?? null}
          />
          {/* Placeholder cards — disabled until adapters ship */}
          <IntegrationCard
            provider="lightspeed"
            title="Lightspeed Restaurant"
            description="Coming soon. The architecture is in place — adapter ships in a follow-up sprint."
            connection={byProvider.get('lightspeed') ?? null}
            disabled
          />
          <IntegrationCard
            provider="eposnow"
            title="ePOSnow"
            description="Coming soon. UK pub focus. Adapter follows Lightspeed."
            connection={byProvider.get('eposnow') ?? null}
            disabled
          />
        </div>
      </div>
    </main>
  )
}
