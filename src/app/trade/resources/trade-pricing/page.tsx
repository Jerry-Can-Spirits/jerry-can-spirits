import { requireTradeSession } from '@/lib/trade-portal/session-check'
import { TradeSheetSection, TradeSheetShell } from '@/components/trade-portal/TradeSheetShell'
import {
  EXPEDITION_BOTTLE_HANDLE,
  EXPEDITION_CASE_HANDLE,
  getTradeProducts,
  type TradeProduct,
} from '@/lib/trade-products'
import {
  EXPEDITION_SPICED,
  TRADE_DISCOUNT_PCT,
  formatPence,
  priceRows,
  toPence,
  type PriceRow,
} from '@/lib/trade-portal/product-data'

export const dynamic = 'force-dynamic'

/**
 * The trade pricing sheet, priced from live Shopify.
 *
 * It used to render from a constant, `trade_standard_case_p`, which had drifted
 * to £18 a case behind the shop: the sheet quoted £210 for six bottles while
 * checkout charged £228. A venue read one number and was billed another. The
 * order page has always resolved prices live through getTradeProducts(), so the
 * sheet now reads the same source and the two cannot disagree.
 *
 * Both SKUs are quoted, not just the case. The single bottle used to be excluded
 * from the trade discount, so there was nothing to say about it; it is covered
 * now, and most first orders are one or two bottles.
 */

/** The first variant's price in pence, or null if Shopify did not resolve it. */
function priceOf(products: TradeProduct[], handle: string): number | null {
  const amount = products.find((p) => p.handle === handle)?.variants[0]?.price
  return amount ? toPence(amount) : null
}

function PriceTable({ rows, unit }: { rows: PriceRow[]; unit: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-parchment-400 print:text-black/70 border-b border-gold-500/30 print:border-black/40">
            <th className="py-2 pr-4 font-medium">Price</th>
            <th className="py-2 pr-4 font-medium">Discount</th>
            <th className="py-2 pr-4 font-medium text-right">{unit} (ex VAT)</th>
            <th className="py-2 font-medium text-right">{unit} (inc VAT)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.key}
              className={`border-b border-gold-500/15 print:border-black/30 ${
                row.key === 'trade' ? 'bg-gold-500/10 print:bg-transparent' : ''
              }`}
            >
              <td className="py-2 pr-4">{row.label}</td>
              <td className="py-2 pr-4">{row.discount_pct > 0 ? `${row.discount_pct}% off` : '—'}</td>
              <td className="py-2 pr-4 text-right font-medium">{formatPence(row.ex_vat_p)}</td>
              <td className="py-2 text-right text-parchment-300 print:text-black/70">
                {formatPence(row.inc_vat_p)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Shown in place of a table when Shopify did not return that product. */
function PriceUnavailable() {
  return (
    <p className="text-sm leading-relaxed text-parchment-300 print:text-black/70">
      This price could not be read from the shop just now. Refresh the page, or email
      trade@jerrycanspirits.co.uk and we will confirm it.
    </p>
  )
}

export default async function TradePricingPage() {
  const session = await requireTradeSession()
  const products = await getTradeProducts()

  const casePence = priceOf(products, EXPEDITION_CASE_HANDLE)
  const bottlePence = priceOf(products, EXPEDITION_BOTTLE_HANDLE)

  const caseRows = casePence === null ? null : priceRows(casePence)
  const bottleRows = bottlePence === null ? null : priceRows(bottlePence)

  // What a bottle works out at inside a case, which is the figure a venue
  // actually compares against the single-bottle price when deciding what to buy.
  const perBottleInCase =
    caseRows === null
      ? null
      : Math.round(
          caseRows.find((r) => r.key === 'trade')!.ex_vat_p / EXPEDITION_SPICED.case.units_per_case,
        )

  return (
    <TradeSheetShell
      title="Trade Pricing"
      eyebrow="Expedition Spiced Rum"
      // No tier in the subtitle. Every account is on the same rate, so naming a
      // tier here would imply a price it no longer sets.
      subtitle={`Your account: ${session.venue_name}.`}
    >
      <TradeSheetSection title="Per case (6 × 700ml)">
        {caseRows ? <PriceTable rows={caseRows} unit="Case" /> : <PriceUnavailable />}
        {perBottleInCase !== null && (
          <p className="text-sm leading-relaxed mt-3 text-parchment-300 print:text-black/70">
            Works out at {formatPence(perBottleInCase)} a bottle ex VAT.
          </p>
        )}
      </TradeSheetSection>

      <TradeSheetSection title="Single bottle (700ml)">
        {bottleRows ? <PriceTable rows={bottleRows} unit="Bottle" /> : <PriceUnavailable />}
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
          Prices are read live from the shop, so this sheet always matches what checkout will charge. Ex-VAT
          figures are the bold column, to compare against your other suppliers. VAT-inclusive figures are shown
          alongside, and are what you pay. Prices subject to change with notice.
        </p>
      </TradeSheetSection>
    </TradeSheetShell>
  )
}
