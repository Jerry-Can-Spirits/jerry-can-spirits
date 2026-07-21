import { requireTradeSession } from '@/lib/trade-portal/session-check'
import { TradeSheetSection, TradeSheetShell } from '@/components/trade-portal/TradeSheetShell'
import { EXPEDITION_SPICED } from '@/lib/trade-portal/product-data'

export const dynamic = 'force-dynamic'

const STATEMENT_VERSION = '1.0'
const STATEMENT_DATE = '18 May 2026'

export default async function DietaryStatementPage() {
  await requireTradeSession()
  const p = EXPEDITION_SPICED

  return (
    <TradeSheetShell
      title="Dietary and Allergen Statement"
      eyebrow="Expedition Spiced Rum"
      subtitle={`Version ${STATEMENT_VERSION}. Issued ${STATEMENT_DATE}.`}
    >
      <TradeSheetSection title="Summary">
        <p className="text-sm leading-relaxed">
          Expedition Spiced Rum contains no declared allergens. It is suitable for vegan, vegetarian, gluten-free, dairy-free, and nut-free diets. No artificial flavourings, artificial colours, or essences are used at any stage of production.
        </p>
      </TradeSheetSection>

      <TradeSheetSection title="Dietary status">
        <ul className="text-sm leading-relaxed space-y-1">
          <li>Suitable for vegans.</li>
          <li>Suitable for vegetarians.</li>
          <li>Gluten-free.</li>
          <li>Dairy-free.</li>
          <li>Nut-free.</li>
          <li>No artificial flavourings.</li>
          <li>No artificial colours.</li>
        </ul>
      </TradeSheetSection>

      <TradeSheetSection title="Declared allergens">
        <p className="text-sm leading-relaxed">
          {p.dietary.declared_allergens} The product is produced in a facility that handles distilled spirits and natural botanical ingredients. No allergens listed in the UK Food Information Regulations 2014 (Schedule 2) are intentionally added.
        </p>
      </TradeSheetSection>

      <TradeSheetSection title="Ingredients">
        <p className="text-sm leading-relaxed">{p.ingredients}</p>
        <p className="text-sm leading-relaxed mt-2 text-parchment-300 print:text-black/70">
          All ingredients are sourced as whole botanicals or natural extracts. Maceration is carried out at {p.distillery}.
        </p>
      </TradeSheetSection>

      <TradeSheetSection title="Production notes">
        <p className="text-sm leading-relaxed">
          Caribbean rum base, {p.abv_percent}% ABV, {p.volume_ml}ml. Macerated with whole botanicals at {p.distillery}. Rested on bourbon barrel chips for finish. No additives, no essences, no artificial sweeteners.
        </p>
      </TradeSheetSection>

      <TradeSheetSection title="Verification">
        <p className="text-sm leading-relaxed">
          This statement reflects the formulation in effect on the date issued. For laboratory analysis, certificate of analysis, or product specification documents, contact{' '}
          <a
            href="mailto:trade@jerrycanspirits.co.uk"
            className="underline text-gold-300 print:text-black"
          >
            trade@jerrycanspirits.co.uk
          </a>
          .
        </p>
      </TradeSheetSection>

      <TradeSheetSection title="Responsible drinking">
        <p className="text-sm leading-relaxed">
          For the facts about alcohol, visit{' '}
          <a
            href="https://www.drinkaware.co.uk"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-gold-300 print:text-black"
          >
            drinkaware.co.uk
          </a>
          . Avoid alcohol if pregnant. Please drink responsibly.
        </p>
      </TradeSheetSection>
    </TradeSheetShell>
  )
}
