import { requireTradeSession } from '@/lib/trade-portal/session-check'
import { TradeTile } from '@/components/trade-portal/TradeTile'
import { AnnouncementBanner } from '@/components/trade-portal/AnnouncementBanner'
import { SignOutLink } from '@/components/trade-portal/SignOutLink'
import { TradePortalHeader } from '@/components/trade-portal/TradePortalHeader'

export const dynamic = 'force-dynamic'

export default async function TradeLandingPage() {
  const session = await requireTradeSession()

  return (
    <section className="band-dark min-h-screen">
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
          <TradeTile
            variant="active"
            title="Trade resources"
            description="Bar signage, pour guides, and other downloads for your venue."
            href="/trade/resources/"
            ctaLabel="Browse resources"
          />
        </div>
      </div>
    </section>
  )
}
