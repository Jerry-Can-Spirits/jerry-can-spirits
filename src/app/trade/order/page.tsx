import type { Metadata } from 'next'
import TradeOrderForm from '@/components/TradeOrderForm'

export const metadata: Metadata = {
  title: 'Trade Order Portal | Jerry Can Spirits',
  robots: { index: false, follow: false },
}

export default function TradeOrderPage() {
  return (
    <main className="min-h-screen py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-8">
          <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
            Trade
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">
          Place a Trade Order
        </h1>
        <p className="text-parchment-400 text-sm mb-12 max-w-lg">
          Enter your trade PIN to access your account and place an order.
        </p>
        <TradeOrderForm />
      </div>
    </main>
  )
}
