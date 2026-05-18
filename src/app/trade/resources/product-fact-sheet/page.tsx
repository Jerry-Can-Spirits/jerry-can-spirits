import { requireTradeSession } from '@/lib/trade-portal/session-check'
import {
  TradeSheetSection,
  TradeSheetShell,
  TradeSpecGrid,
} from '@/components/trade-portal/TradeSheetShell'
import { EXPEDITION_SPICED, formatPence } from '@/lib/trade-portal/product-data'

export const dynamic = 'force-dynamic'

export default async function ProductFactSheetPage() {
  await requireTradeSession()
  const p = EXPEDITION_SPICED

  return (
    <TradeSheetShell
      title="Product Fact Sheet"
      eyebrow="Expedition Spiced"
      subtitle={p.tagline}
    >
      <TradeSheetSection title="Product">
        <TradeSpecGrid
          rows={[
            { label: 'Name', value: p.name },
            { label: 'Category', value: p.category },
            { label: 'Base spirit', value: p.base_spirit },
            { label: 'ABV', value: `${p.abv_percent}%` },
            { label: 'Volume', value: `${p.volume_ml}ml` },
            { label: 'RRP (inc VAT)', value: formatPence(p.rrp_p) },
            { label: 'Country of production', value: p.country_of_production },
            { label: 'Distillery', value: p.distillery },
            { label: 'Brand owner', value: p.brand_owner },
          ]}
        />
      </TradeSheetSection>

      <TradeSheetSection title="Bottle">
        <TradeSpecGrid
          rows={[
            { label: 'Bottle EAN', value: p.ean.bottle },
            { label: 'Item code', value: p.bottle.item_code },
            { label: 'Glass colour', value: p.bottle.glass_colour },
            { label: 'Closure', value: p.bottle.closure },
            {
              label: 'Height',
              value: `${p.bottle.height_mm} ± ${p.bottle.height_tolerance_mm} mm`,
            },
            { label: 'Max diameter', value: `${p.bottle.max_diameter_mm} mm` },
            { label: 'Weight (empty)', value: `${p.bottle.weight_empty_g} g` },
            { label: 'Weight (filled, approx.)', value: `${p.bottle.weight_filled_g} g` },
            {
              label: 'Nominal capacity',
              value: `${p.bottle.nominal_capacity_ml} ± ${p.bottle.nominal_capacity_tolerance_ml} ml`,
            },
            { label: 'Brimful capacity', value: `${p.bottle.brimful_capacity_ml} ml` },
          ]}
        />
      </TradeSheetSection>

      <TradeSheetSection title="Case">
        <TradeSpecGrid
          rows={[
            { label: 'Case EAN', value: p.ean.case },
            { label: 'Units per case', value: String(p.case.units_per_case) },
            {
              label: 'Outer dimensions',
              value: `${p.case.length_mm} × ${p.case.width_mm} × ${p.case.height_mm} mm`,
            },
            { label: 'Divider dimensions', value: `${p.case.divider_dimensions_mm} mm` },
            { label: 'Board specification', value: p.case.board_spec },
            { label: 'Artwork reference', value: p.case.artwork_ref },
            { label: 'Print', value: p.case.print },
            { label: 'Finishing', value: p.case.finishing },
          ]}
        />
      </TradeSheetSection>

      <TradeSheetSection title="Pallet">
        <TradeSpecGrid
          rows={[
            { label: 'Layers', value: String(p.pallet.layers) },
            { label: 'Cases per pallet', value: String(p.pallet.cases_per_pallet) },
            { label: 'Units per pallet', value: String(p.pallet.units_per_pallet) },
            { label: 'Pallet height', value: `${p.pallet.height_m} m` },
            { label: 'Pallet weight', value: `${p.pallet.weight_kg} kg` },
          ]}
        />
      </TradeSheetSection>

      <TradeSheetSection title="Ingredients">
        <p className="text-sm leading-relaxed">{p.ingredients}</p>
      </TradeSheetSection>

      <TradeSheetSection title="Dietary">
        <p className="text-sm leading-relaxed mb-2">
          Vegan. Vegetarian. Gluten-free. Dairy-free. Nut-free.
        </p>
        <p className="text-sm leading-relaxed">
          No artificial flavourings. No artificial colours. Declared allergens: {p.dietary.declared_allergens.toLowerCase()}
        </p>
      </TradeSheetSection>

      <TradeSheetSection title="Tasting (summary)">
        <p className="text-sm leading-relaxed">{p.tasting.character} Full tasting notes available on the dedicated trade resource.</p>
      </TradeSheetSection>

      <TradeSheetSection title="Brand">
        <p className="text-sm leading-relaxed">
          Jerry Can Spirits is veteran-owned and bootstrapped. Founded by two Royal Signals veterans. Macerated at Spirit of Wales Distillery in Newport. 5% of profits go to military charities. Expedition Spiced is the company&apos;s first release.
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
