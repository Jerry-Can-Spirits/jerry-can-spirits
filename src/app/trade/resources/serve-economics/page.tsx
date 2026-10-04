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
  formatPence,
  priceRows,
  ruleForAccount,
  toPence,
} from '@/lib/trade-portal/product-data'
import {
  MENU_PRICES_P,
  POUR_ML,
  SERVES,
  SERVES_PER_BOTTLE,
  buildCostP,
  grossProfitPct,
  rumPerServeP,
  servesPerCase,
} from '@/lib/trade-portal/serve-economics'

export const dynamic = 'force-dynamic'

/**
 * The serve economics sheet. The rum price comes from the same live source
 * as the pricing sheet and the order page, with this account's own rate
 * applied, so a venue on a custom code sees its own figures. The build costs
 * and menu prices are the stated assumptions in serve-economics.ts.
 */

function tradeExVatP(products: TradeProduct[], handle: string, rule: ReturnType<typeof ruleForAccount>): number | null {
  const amount = products.find((p) => p.handle === handle)?.variants[0]?.price
  if (!amount) return null
  return priceRows(toPence(amount), rule, handle).find((r) => r.key === 'trade')!.ex_vat_p
}

const CELL = 'py-2 pr-3 text-right'
const HEAD = 'py-2 pr-3 font-medium text-right'

export default async function ServeEconomicsPage() {
  const session = await requireTradeSession()
  const products = await getTradeProducts()
  const rule = ruleForAccount(session)

  const bottleExVatP = tradeExVatP(products, EXPEDITION_BOTTLE_HANDLE, rule)
  const caseExVatP = tradeExVatP(products, EXPEDITION_CASE_HANDLE, rule)
  const bottlesPerCase = EXPEDITION_SPICED.case.units_per_case
  const caseBottleExVatP = caseExVatP === null ? null : Math.round(caseExVatP / bottlesPerCase)

  const rumSingleP = bottleExVatP === null ? null : rumPerServeP(bottleExVatP)
  const rumCaseP = caseBottleExVatP === null ? null : rumPerServeP(caseBottleExVatP)

  if (rumSingleP === null || rumCaseP === null || caseExVatP === null) {
    return (
      <TradeSheetShell title="Serve Economics" eyebrow="Expedition Spiced Rum" subtitle={`Your account: ${session.venue_name}.`}>
        <p className="text-sm leading-relaxed text-parchment-300 print:text-black/70">
          The price could not be read from the shop just now. Refresh the page, or email trade@jerrycanspirits.co.uk and we
          will send the sheet.
        </p>
      </TradeSheetShell>
    )
  }

  const caseServes = servesPerCase(bottlesPerCase)
  const oldStandard = SERVES.find((s) => s.slug === 'the-old-standard')!
  const storm = SERVES.find((s) => s.slug === 'storm-and-spice')!
  const example = (serve: typeof oldStandard, menuP: number) => ({
    takingsP: caseServes * menuP,
    profitP: caseServes * (Math.round(menuP / 1.2) - buildCostP(serve, rumCaseP)),
  })
  const stormCase = example(storm, 900)
  const oldStandardCase = example(oldStandard, 1000)

  return (
    <TradeSheetShell
      title="Serve Economics"
      eyebrow="Expedition Spiced Rum"
      subtitle={`Your account: ${session.venue_name}. Rum priced at your trade rate, read live.`}
    >
      <TradeSheetSection title="The pour">
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b border-gold-500/15 print:border-black/30">
              <td className="py-2 pr-3">Serves per {EXPEDITION_SPICED.volume_ml}ml bottle at {POUR_ML}ml</td>
              <td className={`${CELL} font-medium`}>{SERVES_PER_BOTTLE}</td>
            </tr>
            <tr className="border-b border-gold-500/15 print:border-black/30">
              <td className="py-2 pr-3">Rum per serve, single bottle ({formatPence(bottleExVatP!)} ex VAT)</td>
              <td className={`${CELL} font-medium`}>{formatPence(rumSingleP)}</td>
            </tr>
            <tr className="border-b border-gold-500/15 print:border-black/30">
              <td className="py-2 pr-3">
                Rum per serve, by the case ({formatPence(caseExVatP)} ex VAT, {formatPence(caseBottleExVatP!)} a bottle)
              </td>
              <td className={`${CELL} font-medium`}>{formatPence(rumCaseP)}</td>
            </tr>
          </tbody>
        </table>
      </TradeSheetSection>

      <TradeSheetSection title="The four house serves">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-parchment-400 print:text-black/70 border-b border-gold-500/30 print:border-black/40">
                <th className="py-2 pr-3 font-medium">Serve</th>
                <th className={HEAD}>Build, single bottle</th>
                <th className={HEAD}>Build, by the case</th>
                {MENU_PRICES_P.map((p) => (
                  <th key={p} className={HEAD}>
                    GP at {formatPence(p).replace('.00', '')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SERVES.map((serve) => {
                const single = buildCostP(serve, rumSingleP)
                const byCase = buildCostP(serve, rumCaseP)
                return (
                  <tr key={serve.slug} className="border-b border-gold-500/15 print:border-black/30">
                    <td className="py-2 pr-3">{serve.name}</td>
                    <td className={`${CELL} font-medium`}>{formatPence(single)}</td>
                    <td className={`${CELL} font-medium`}>{formatPence(byCase)}</td>
                    {MENU_PRICES_P.map((p) => (
                      <td key={p} className={CELL}>
                        {grossProfitPct(p, single)}% / {grossProfitPct(p, byCase)}%
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-sm leading-relaxed mt-3 text-parchment-300 print:text-black/70">
          Gross profit is on the ex VAT menu price, the way a bar measures it. Each cell reads single bottle / by the case.
        </p>
      </TradeSheetSection>

      <TradeSheetSection title="Behind the bar">
        <ul className="space-y-3 text-sm leading-relaxed">
          {SERVES.map((serve) => (
            <li key={serve.slug}>
              <span className="font-medium">{serve.name}.</span> {serve.build} {serve.touches} touches, about {serve.seconds}{' '}
              seconds. {serve.placement}
            </li>
          ))}
        </ul>
      </TradeSheetSection>

      <TradeSheetSection title="One case">
        <p className="text-sm leading-relaxed">
          A case is {caseServes} serves. Sold through as Storm and Spice at £9 it takes {formatPence(stormCase.takingsP)} and
          leaves about {formatPence(stormCase.profitP)} after every ingredient. Sold through as the Old Standard at £10 it
          takes {formatPence(oldStandardCase.takingsP)} and leaves about {formatPence(oldStandardCase.profitP)}. At two
          serves a night a case lasts six weeks.
        </p>
      </TradeSheetSection>

      <TradeSheetSection title="What the figures assume">
        <ul className="space-y-1 text-sm leading-relaxed text-parchment-300 print:text-black/70">
          {SERVES.map((serve) => (
            <li key={serve.slug}>
              {serve.name}: {serve.assumes}.
            </li>
          ))}
        </ul>
        <p className="text-sm leading-relaxed mt-3 text-parchment-300 print:text-black/70">
          Ingredient costs are typical UK wholesale prices, ex VAT. Put your own in and the rum figure still holds: it is read
          from the shop at your trade rate, so it matches what checkout charges.
        </p>
      </TradeSheetSection>
    </TradeSheetShell>
  )
}
