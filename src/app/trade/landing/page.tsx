import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireTradeSession } from '@/lib/trade-portal/session-check'
import { TradeTile } from '@/components/trade-portal/TradeTile'
import { AnnouncementBanner } from '@/components/trade-portal/AnnouncementBanner'
import { SignOutLink } from '@/components/trade-portal/SignOutLink'
import { TradePortalHeader } from '@/components/trade-portal/TradePortalHeader'

export const dynamic = 'force-dynamic'

async function hasActivePourIqLicence(db: D1Database, tradeAccountId: string): Promise<boolean> {
  const row = await db
    .prepare(`
      SELECT id FROM pouriq_subscriptions
      WHERE trade_account_id = ?1
        AND datetime(valid_from) <= datetime('now')
        AND datetime(valid_until) >= datetime('now')
      LIMIT 1
    `)
    .bind(tradeAccountId)
    .first<{ id: string }>()
  return row !== null
}

export default async function TradeLandingPage() {
  const session = await requireTradeSession()
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database

  const hasPourIq = await hasActivePourIqLicence(db, session.tradeAccountId)

  return (
    <main className="min-h-screen bg-jerry-green-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-24">
        <div className="flex items-center justify-between mb-8">
          <TradePortalHeader />
          <SignOutLink />
        </div>

        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-10">
          Welcome back, {session.venue_name}.
        </h1>

        <AnnouncementBanner />

        <div className="grid sm:grid-cols-2 gap-4">
          <TradeTile
            variant="active"
            title="Order Portal"
            description="Place new orders, view trade pricing, repeat past orders."
            href="/trade/order/"
            ctaLabel="Go to orders"
          />
          {/* Pour IQ is a separate company: tiles render only for venues with a
              live licence (functional navigation). The greyed upsell tiles were
              removed as part of the corporate separation. */}
          {hasPourIq && (
            <TradeTile
              variant="active"
              title="Pour IQ™"
              description="Menu and cost engineering for independent UK bars."
              href="https://app.pour-iq.co.uk/"
              ctaLabel="Open Pour IQ™"
            />
          )}
          {hasPourIq && (
            <TradeTile
              variant="active"
              title="Pour IQ™ help"
              description="A working operations guide. How to scan invoices, read margin, fix gotchas."
              href="https://app.pour-iq.co.uk/help"
              ctaLabel="Open guide"
            />
          )}
          <TradeTile
            variant="active"
            title="Trade resources"
            description="Bar signage, pour guides, and other downloads for your venue."
            href="/trade/resources/"
            ctaLabel="Browse resources"
          />
        </div>
      </div>
    </main>
  )
}
