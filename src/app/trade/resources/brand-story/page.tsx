import { requireTradeSession } from '@/lib/trade-portal/session-check'
import { TradeSheetSection, TradeSheetShell } from '@/components/trade-portal/TradeSheetShell'

export const dynamic = 'force-dynamic'

export default async function BrandStoryPage() {
  await requireTradeSession()

  return (
    <TradeSheetShell
      title="Jerry Can Spirits"
      eyebrow="Brand Story"
      subtitle="Caribbean soul, British craft. Veteran-owned."
    >
      <p className="text-base leading-relaxed text-parchment-200 print:text-black mb-8 print:mb-5">
        A brand built around one principle: real spirits, made properly, with no shortcuts.
      </p>

      <TradeSheetSection title="Who we are">
        <p className="text-sm leading-relaxed mb-3">
          Jerry Can Spirits is a veteran-owned British spirits house. Founded in 2025 by Royal Signals veterans Dan Freeman and Rhys Williams. Independent and self-funded since the start. Decisions made by the founders, not by investors.
        </p>
        <p className="text-sm leading-relaxed">
          The company is named after the original jerry can, engineered in 1937 to do its job and nothing else. Eighty-eight years on, NATO still uses the same design. The standard we apply to the spirit in the bottle is the same: function over form, every time.
        </p>
      </TradeSheetSection>

      <TradeSheetSection title="What we make">
        <p className="text-sm leading-relaxed mb-3">
          Expedition Spiced, the first release, is a Caribbean-base spiced rum macerated at Spirit of Wales Distillery in Newport. 40% ABV. 700ml. Vegan, gluten-free, no declared allergens. Real botanicals: Madagascan vanilla, Ceylon cinnamon, ginger, orange peel, clove, allspice, cassia bark, agave. Rested on bourbon barrel chips. No essences, no artificial flavourings.
        </p>
        <p className="text-sm leading-relaxed">
          Full specification is on the Product Fact Sheet. Tasting notes are on the Tasting Notes resource. Both available in the trade resources section.
        </p>
      </TradeSheetSection>

      <TradeSheetSection title="The standard we hold">
        <div className="space-y-4">
          <div>
            <p className="font-serif text-lg text-white print:text-black mb-1">Reliable</p>
            <p className="text-sm leading-relaxed">
              Same product every time. Single production partnership at Spirit of Wales Distillery. No formulation drift, no rotated factories, no surprises in the case.
            </p>
          </div>
          <div>
            <p className="font-serif text-lg text-white print:text-black mb-1">Dependable</p>
            <p className="text-sm leading-relaxed">
              Bar-friendly bottle, robust 6 × 700ml outer case, stock continuity across mainland UK. The spirit performs neat, over ice, and in cocktails. Designed for slow sipping, engineered for service.
            </p>
          </div>
          <div>
            <p className="font-serif text-lg text-white print:text-black mb-1">Purpose</p>
            <p className="text-sm leading-relaxed">
              Every bottle contributes. 5% of profits go to UK military charities. The standard is the same whether one bottle moves or a thousand.
            </p>
          </div>
        </div>
      </TradeSheetSection>

      <TradeSheetSection title="What stocking us means for your venue">
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            <span className="font-serif text-white print:text-black">A point of difference on the back bar.</span> Caribbean soul, British craft, veteran-owned. Not another supermarket spiced rum.
          </p>
          <p>
            <span className="font-serif text-white print:text-black">A genuine story your guests will respond to.</span> Real ingredients, regional production, charitable commitment, all provable.
          </p>
          <p>
            <span className="font-serif text-white print:text-black">Consistent product and consistent supply.</span> One distillery, one specification, one named production partner.
          </p>
          <p>
            <span className="font-serif text-white print:text-black">A brand you can grow with.</span> We are deliberately small now, building toward a Jerry Can-owned distillery and an expanded range. Growth on our terms, with standards held constant.
          </p>
        </div>
      </TradeSheetSection>

      <TradeSheetSection title="Military commitment">
        <p className="text-sm leading-relaxed">
          Jerry Can Spirits is a signatory of the Armed Forces Covenant and a holder of the ERS Bronze Award. 5% of profits go to UK military charities. These commitments are public record, not marketing claims. Stocking venues can communicate this support to their guests with full provenance.
        </p>
      </TradeSheetSection>

      <TradeSheetSection title="Working with us">
        <ul className="text-sm leading-relaxed space-y-1.5">
          <li>
            <span className="text-parchment-400 print:text-black/70">Trade enquiries:</span>{' '}
            <a
              href="mailto:trade@jerrycanspirits.co.uk"
              className="underline text-gold-300 print:text-black"
            >
              trade@jerrycanspirits.co.uk
            </a>
          </li>
          <li>
            <span className="text-parchment-400 print:text-black/70">Trade Portal:</span>{' '}
            <a href="/trade/landing" className="underline text-gold-300 print:text-black">
              jerrycanspirits.co.uk/trade
            </a>
          </li>
          <li>
            <span className="text-parchment-400 print:text-black/70">Order Portal:</span>{' '}
            <a href="/trade/order" className="underline text-gold-300 print:text-black">
              jerrycanspirits.co.uk/trade/order
            </a>
          </li>
          <li>
            <span className="text-parchment-400 print:text-black/70">Main website:</span>{' '}
            <a
              href="https://jerrycanspirits.co.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-gold-300 print:text-black"
            >
              jerrycanspirits.co.uk
            </a>
          </li>
        </ul>
      </TradeSheetSection>
    </TradeSheetShell>
  )
}
