import { requireTradeSession } from '@/lib/trade-portal/session-check'
import { TradeSheetSection, TradeSheetShell } from '@/components/trade-portal/TradeSheetShell'
import { EXPEDITION_SPICED } from '@/lib/trade-portal/product-data'

export const dynamic = 'force-dynamic'

export default async function TastingNotesPage() {
  await requireTradeSession()
  const p = EXPEDITION_SPICED

  return (
    <TradeSheetShell
      title="Tasting Notes"
      eyebrow="Expedition Spiced Rum"
      subtitle={p.tagline}
    >
      <TradeSheetSection title="Character">
        <p className="text-sm leading-relaxed">{p.tasting.character}</p>
        <p className="text-sm leading-relaxed mt-2">
          {p.abv_percent}% ABV. {p.volume_ml}ml. Caribbean rum base, macerated at {p.distillery}.
        </p>
      </TradeSheetSection>

      <TradeSheetSection title="Nose">
        <p className="text-sm leading-relaxed">{p.tasting.nose}</p>
      </TradeSheetSection>

      <TradeSheetSection title="Palate">
        <p className="text-sm leading-relaxed">{p.tasting.palate}</p>
      </TradeSheetSection>

      <TradeSheetSection title="Finish">
        <p className="text-sm leading-relaxed">{p.tasting.finish}</p>
      </TradeSheetSection>

      <TradeSheetSection title="Recommended serves">
        <div className="space-y-4 text-sm leading-relaxed">
          <div>
            <p className="font-serif text-lg text-white print:text-black mb-1">Neat</p>
            <p>{p.serving.house_neat_serve}</p>
          </div>
          <div>
            <p className="font-serif text-lg text-white print:text-black mb-1">Long</p>
            <p>{p.serving.house_long_serve}</p>
          </div>
        </div>
      </TradeSheetSection>

      <TradeSheetSection title="Glassware and temperature">
        <p className="text-sm leading-relaxed">
          <span className="text-parchment-400 print:text-black/70">Neat:</span> {p.serving.glassware_neat}
        </p>
        <p className="text-sm leading-relaxed mt-1">
          <span className="text-parchment-400 print:text-black/70">Long drinks:</span> {p.serving.glassware_long}
        </p>
        <p className="text-sm leading-relaxed mt-3">{p.serving.temperature_note}</p>
        <p className="text-sm leading-relaxed mt-1">{p.serving.bottle_storage}</p>
      </TradeSheetSection>

      <TradeSheetSection title="Ingredients">
        <p className="text-sm leading-relaxed">{p.ingredients}</p>
      </TradeSheetSection>
    </TradeSheetShell>
  )
}
