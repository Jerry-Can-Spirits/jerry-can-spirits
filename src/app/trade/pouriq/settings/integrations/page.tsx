import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { listConnections } from '@/lib/pouriq/pos/connections'
import { countUnmatched } from '@/lib/pouriq/pos/item-map'
import { getActiveMenu } from '@/lib/pouriq/menus'
import { IntegrationCard } from '@/components/pouriq/IntegrationCard'

export const dynamic = 'force-dynamic'

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'You declined access. Connect again when you are ready.',
  invalid_scope: 'The requested permissions could not be granted. Please contact support.',
  invalid_state: 'The connection request expired. Please try again.',
  missing_params: 'The connection response was incomplete. Please try again.',
  token_exchange_failed: 'We could not complete the connection. Please try again or contact support.',
}

function friendlyOAuthError(code: string | undefined): string | null {
  if (!code) return null
  return OAUTH_ERROR_MESSAGES[code] ?? 'Connection failed. Please try again or contact support.'
}

interface SearchParams {
  searchParams: Promise<{ connected?: string; error?: string }>
}

export default async function IntegrationsPage({ searchParams }: SearchParams) {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const [connections, activeMenu, unmatchedCount] = await Promise.all([
    listConnections(db, access.tradeAccountId),
    getActiveMenu(db, access.tradeAccountId),
    countUnmatched(db, access.tradeAccountId),
  ])
  const byProvider = new Map(connections.map((c) => [c.provider, c]))
  const activeMenuName = activeMenu?.name ?? null

  const sp = await searchParams
  const justConnected = sp.connected
  const oauthError = friendlyOAuthError(sp.error)

  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <Link href="/trade/pouriq" className="text-sm text-parchment-400 hover:text-parchment-200">← Pour IQ™</Link>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mt-3 mb-2">Integrations</h1>
        <p className="text-parchment-400 text-sm mb-10">
          Connect your POS so sales volumes flow into Pour IQ automatically. You can still enter or paste volumes manually any time.
        </p>

        {justConnected && (
          <p className="mb-6 text-sm text-emerald-300">Connected {justConnected}. First sync runs within an hour, or click Sync now.</p>
        )}
        {oauthError && (
          <p role="alert" className="mb-6 text-sm text-red-300">{oauthError}</p>
        )}

        {unmatchedCount > 0 && (
          <Link
            href="/trade/pouriq/unmatched"
            className="flex items-center justify-between gap-3 mb-6 px-4 py-3 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-100 text-sm hover:bg-amber-500/25 transition-colors"
          >
            <span>
              <strong>{unmatchedCount}</strong> till {unmatchedCount === 1 ? 'item is' : 'items are'} not matched to a cocktail, so their sales are not counting yet.
            </span>
            <span className="font-semibold whitespace-nowrap">Review →</span>
          </Link>
        )}

        <div className="space-y-4">
          <IntegrationCard
            provider="square"
            title="Square"
            description="Most common UK POS for independent bars and small chains. Sales flow in via webhooks plus hourly backfill."
            connection={byProvider.get('square') ?? null}
            activeMenuName={activeMenuName}
          />
          <IntegrationCard
            provider="zettle"
            title="Zettle by PayPal"
            description="Free POS used by thousands of UK independents. Sales import hourly once connected."
            connection={byProvider.get('zettle') ?? null}
            activeMenuName={activeMenuName}
          />
          <IntegrationCard
            provider="sumup"
            title="SumUp"
            description="Free card reader and POS popular with UK independents. Sales import hourly once connected."
            connection={byProvider.get('sumup') ?? null}
            activeMenuName={activeMenuName}
          />
          {/* Placeholder cards — disabled until adapters ship */}
          <IntegrationCard
            provider="lightspeed"
            title="Lightspeed Restaurant"
            description="Coming soon. The architecture is in place — adapter ships in a follow-up sprint."
            connection={byProvider.get('lightspeed') ?? null}
            activeMenuName={activeMenuName}
            disabled
          />
          <IntegrationCard
            provider="eposnow"
            title="ePOSnow"
            description="Coming soon. UK pub focus. Adapter follows Lightspeed."
            connection={byProvider.get('eposnow') ?? null}
            activeMenuName={activeMenuName}
            disabled
          />
        </div>
      </div>
    </main>
  )
}
