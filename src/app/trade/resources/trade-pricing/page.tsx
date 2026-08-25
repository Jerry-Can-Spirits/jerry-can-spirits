import { requireTradeSession } from '@/lib/trade-portal/session-check'
import { TradeSheetSection, TradeSheetShell } from '@/components/trade-portal/TradeSheetShell'
import {
  EXPEDITION_SPICED,
  PRICING_ROWS,
  TRADE_DISCOUNT_PCT,
  formatPence,
} from '@/lib/trade-portal/product-data'

export const dynamic = 'force-dynamic'

export default async function TradePricingPage() {
  const session = await requireTradeSession()

  return (
    <TradeSheetShell
      title="Trade Pricing"
      eyebrow="Expedition Spiced Rum"
      // No tier in the subtitle. Every account is on the same rate, so naming a
      // tier here would imply a price it no longer sets.
      subtitle={`Your account: ${session.venue_name}.`}
    >
      <TradeSheetSection title="Per case (6 × 700ml)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-parchment-400 print:text-black/70 border-b border-gold-500/30 print:border-black/40">
                <th className="py-2 pr-4 font-medium">Price</th>
                <th className="py-2 pr-4 font-medium">Discount</th>
                <th className="py-2 pr-4 font-medium text-right">Case (ex VAT)</th>
                <th className="py-2 font-medium text-right">Case (inc VAT)</th>
              </tr>
            </thead>
            <tbody>
              {PRICING_ROWS.map((row) => (
                <tr
                  key={row.key}
                  className={`border-b border-gold-500/15 print:border-black/30 ${
                    row.key === 'trade' ? 'bg-gold-500/10 print:bg-transparent' : ''
                  }`}
                >
                  <td className="py-2 pr-4">{row.label}</td>
                  <td className="py-2 pr-4">
                    {row.discount_pct > 0 ? `${row.discount_pct}% off` : '—'}
                  </td>
                  <td className="py-2 pr-4 text-right font-medium">{formatPence(row.case_ex_vat_p)}</td>
                  <td className="py-2 text-right text-parchment-300 print:text-black/70">
                    {formatPence(row.case_inc_vat_p)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TradeSheetSection>

      <TradeSheetSection title="Per bottle (700ml)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-parchment-400 print:text-black/70 border-b border-gold-500/30 print:border-black/40">
                <th className="py-2 pr-4 font-medium">Price</th>
                <th className="py-2 pr-4 font-medium text-right">Bottle (ex VAT)</th>
                <th className="py-2 font-medium text-right">Bottle (inc VAT)</th>
              </tr>
            </thead>
            <tbody>
              {PRICING_ROWS.map((row) => (
                <tr
                  key={row.key}
                  className={`border-b border-gold-500/15 print:border-black/30 ${
                    row.key === 'trade' ? 'bg-gold-500/10 print:bg-transparent' : ''
                  }`}
                >
                  <td className="py-2 pr-4">{row.label}</td>
                  <td className="py-2 pr-4 text-right font-medium">{formatPence(row.bottle_ex_vat_p)}</td>
                  <td className="py-2 text-right text-parchment-300 print:text-black/70">
                    {formatPence(row.bottle_inc_vat_p)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TradeSheetSection>

      <TradeSheetSection title="Case configuration">
        <p className="text-sm leading-relaxed">
          {EXPEDITION_SPICED.case.units_per_case} × {EXPEDITION_SPICED.volume_ml}ml bottles per case. Case dimensions:{' '}
          {EXPEDITION_SPICED.case.length_mm} × {EXPEDITION_SPICED.case.width_mm} × {EXPEDITION_SPICED.case.height_mm} mm.
          Case EAN: {EXPEDITION_SPICED.ean.case}.
        </p>
        <p className="text-sm leading-relaxed mt-2">
          Pallet: {EXPEDITION_SPICED.pallet.cases_per_pallet} cases ({EXPEDITION_SPICED.pallet.units_per_pallet} units),{' '}
          {EXPEDITION_SPICED.pallet.layers} layers, {EXPEDITION_SPICED.pallet.weight_kg}kg.
        </p>
      </TradeSheetSection>

      <TradeSheetSection title="Ordering">
        <p className="text-sm leading-relaxed">
          Orders are placed through the trade portal at{' '}
          <a href="/trade/order/" className="underline text-gold-300 print:text-black">
            /trade/order
          </a>
          . For bespoke arrangements, larger volumes, or questions about your account, contact{' '}
          <a href="mailto:trade@jerrycanspirits.co.uk" className="underline text-gold-300 print:text-black">
            trade@jerrycanspirits.co.uk
          </a>
          .
        </p>
        <p className="text-sm leading-relaxed mt-3">
          Your {TRADE_DISCOUNT_PCT}% trade discount applies automatically at checkout, on every product and at
          any quantity. There is no minimum order.
        </p>
        <p className="text-sm leading-relaxed mt-3 text-parchment-300 print:text-black/70">
          All prices shown are per case or per bottle as labelled. Ex-VAT figures are the bold column, to compare
          against your other suppliers. VAT-inclusive figures are shown alongside, and are what the checkout will
          charge. Prices subject to change with notice.
        </p>
      </TradeSheetSection>
    </TradeSheetShell>
  )
}
