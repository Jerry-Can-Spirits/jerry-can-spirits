// Single source of truth for Expedition Spiced commercial + physical data
// referenced by the trade resource pages. Where content also appears on the
// consumer site (tasting notes, ingredients), this file mirrors the media kit
// (src/app/contact/media/kit/page.tsx) so the trade-facing version doesn't
// drift. When the product is updated, edit both.

export const EXPEDITION_SPICED = {
  // Product identity
  name: 'Expedition Spiced Rum',
  tagline: 'Caribbean soul, British craft. Veteran-owned.',
  category: 'Spiced rum',
  base_spirit: 'Caribbean rum',
  abv_percent: 40,
  volume_ml: 700,

  // Production
  distillery: 'our British partner distillery',
  country_of_production: 'United Kingdom',
  brand_owner: 'Jerry Can Spirits Ltd',

  // Bottle physical
  bottle: {
    description: '700ml QBIC',
    item_code: 'CRSA3927',
    glass_colour: 'Premium White Flint',
    weight_empty_g: 970,
    weight_filled_g: 970 + 660, // bottle + ~660g spirit (40% ABV ≈ 0.943 g/ml × 700ml)
    nominal_capacity_ml: 700,
    nominal_capacity_tolerance_ml: 10,
    brimful_capacity_ml: 725,
    closure: 'Bar top',
    height_mm: 203.8,
    height_tolerance_mm: 1.5,
    max_diameter_mm: 120.167,
    drawing_ref: 'PE09836-D',
    drawing_checked: 'V. Chambers',
    drawing_date: '20/01/2025',
  },

  // Case
  case: {
    units_per_case: 6,
    length_mm: 275,
    width_mm: 182,
    height_mm: 222,
    divider_dimensions_mm: '621 × 222',
    artwork_ref: '0201 — Skillet',
    board_spec: '150K/B/150T (dividers 125K/B/125T)',
    print: 'One colour, outer case only',
    finishing: 'Cut and glued',
  },

  // Pallet
  pallet: {
    height_m: 1.61,
    weight_kg: 860,
    units_per_pallet: 840,
    cases_per_pallet: 140,
    layers: 7,
  },

  // Barcodes
  ean: {
    bottle: '5070004142209',
    case: '15070004142206',
  },

  // Commercial
  // No price lives here. rrp_p went in Audit 8 PR B; trade_standard_case_p
  // followed it once it was found to have drifted £18 a case behind the shop,
  // quoting £210 while Shopify charged £228 for the same six bottles. The trade
  // sheet now reads both the case and the bottle price live from Shopify, which
  // is the source the order page charges from, so the two cannot disagree.

  // Tasting (mirrored from contact/media/kit)
  tasting: {
    nose:
      'Warm Madagascan vanilla leads with a rich, creamy softness, followed by Ceylon cinnamon and toasted oak, lifted by bright orange peel with clove and allspice in the background.',
    palate:
      'Silky and naturally sweet on entry thanks to agave, with ginger heat and cassia bark developing into layered baking spices.',
    finish: 'Long, warming, and elegantly dry with oak tannins, vanilla, and a flicker of ginger.',
    character: 'Warm spice, not sweet. Designed for slow sipping.',
  },

  // Ingredients (mirrored from contact/media/kit)
  ingredients:
    'Madagascan vanilla pods, Ceylon cinnamon, ginger, orange peel, cloves, allspice, cassia bark, agave syrup, glucose syrup. Rested on bourbon barrel chips.',

  // Dietary
  dietary: {
    vegan: true,
    vegetarian: true,
    gluten_free: true,
    dairy_free: true,
    nut_free: true,
    artificial_flavourings: false,
    artificial_colours: false,
    declared_allergens: 'None.',
  },

  // Serving recommendations
  serving: {
    bottle_storage: 'Room temperature, away from direct sunlight.',
    glassware_neat: 'Rocks glass, single large-format ice cube.',
    glassware_long: 'Highball.',
    house_neat_serve:
      'Double measure over a large-format ice cube in a rocks glass. Fresh orange peel expressed and dropped in.',
    house_long_serve:
      'Storm & Spice. Double measure of Expedition Spiced, ginger beer, fresh lime. Built tall over cubed ice in a highball. Sub ginger ale for a softer build if the guest prefers.',
    temperature_note:
      'Bottle kept at room temperature. Served to customer preference using ice to chill rather than refrigeration.',
  },
} as const

// Account tiers. The names match the `tier` column on trade_accounts (migration
// 0013). Tiers no longer set price — since migration 0075 every venue is on one
// flat rate — but the column is kept because it still records which accounts are
// the large ones, which nothing else does.
export type TradeTier = 'intro' | 'standard' | 'partner'

// One price as the sheet shows it: list and trade, ex and inc VAT.
//
// Built from whatever price is passed in rather than from a constant. The
// constant this replaced had drifted £18 a case behind Shopify before anyone
// noticed, and a trade sheet that undercuts the checkout is worse than no sheet.
export interface PriceRow {
  key: 'rrp' | 'trade'
  label: string
  discount_pct: number
  inc_vat_p: number
  ex_vat_p: number
}

const VAT_DIVISOR = 1.2

function makeRow(
  key: PriceRow['key'],
  label: string,
  discount_pct: number,
  baseIncVatP: number,
): PriceRow {
  const inc = Math.round(baseIncVatP * (1 - discount_pct / 100))
  return {
    key,
    label,
    discount_pct,
    inc_vat_p: inc,
    // Derived from the rounded inc-VAT figure rather than the raw base, so the
    // two columns of a row always describe the same penny.
    ex_vat_p: Math.round(inc / VAT_DIVISOR),
  }
}

// The two rows the sheet shows for any product: what it lists at, and what this
// account pays.
export function priceRows(baseIncVatP: number): PriceRow[] {
  return [
    makeRow('rrp', 'List price', 0, baseIncVatP),
    makeRow('trade', 'Your trade price', TRADE_DISCOUNT_PCT, baseIncVatP),
  ]
}

// '228.00', as Shopify returns a money amount, to 22800 pence. Rounded rather
// than truncated: a float that lands on 227.99999 must not lose a penny.
export function toPence(amount: string): number {
  return Math.round(parseFloat(amount) * 100)
}

// The single trade discount, applied to every account whatever its tier
// (confirmed with Dan 25 Aug 2026). It replaces the TRADE-INTRO /
// TRADE-PARTNER-1/2/3 ladder, which priced small orders out of a discount
// altogether: every code carried a £100 minimum and none of them covered the
// single bottle, so a one- or two-bottle order — most first orders — reached no
// discount at all while the pricing sheet quoted it a tier rate.
//
// TRADE10 has no minimum and covers the single bottle. It mirrors the live
// Shopify code: change both together or neither. The old ladder's percentages
// were already drifting from Shopify in this file, which is the other reason
// there is now only one number to keep in step.
export const TRADE_DISCOUNT_CODE = 'TRADE10' as const
export const TRADE_DISCOUNT_PCT = 10

export const TRADE_DISCOUNT_PCT_BY_CODE = {
  [TRADE_DISCOUNT_CODE]: TRADE_DISCOUNT_PCT,
} as const
export type TradeDiscountCode = keyof typeof TRADE_DISCOUNT_PCT_BY_CODE

export function formatPence(p: number): string {
  return `£${(p / 100).toFixed(2)}`
}
