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
  // rrp_p removed (Audit 8 PR B): no hardcoded price in copy anywhere; the RRP
  // re-enters copy from live pricing after the 1 Aug 2026 change.
  trade_standard_case_p: 21000, // pence, inc VAT

  // Tasting (mirrored from contact/media/kit)
  tasting: {
    nose:
      'Warm Madagascan vanilla leads with a rich, creamy softness, followed by Ceylon cinnamon and toasted bourbon oak, lifted by bright orange peel with clove and allspice in the background.',
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

// Trade pricing tiers. The tier names match the `tier` column on
// trade_accounts (migration 0013). Discount percentages confirmed by brand
// owner: intro 5%, standard 10%, partner 15%, all on the standard case price.
export type TradeTier = 'intro' | 'standard' | 'partner'

export interface PricingRow {
  tier: TradeTier | 'standard_rrp'
  label: string
  discount_pct: number
  case_inc_vat_p: number
  bottle_inc_vat_p: number
  case_ex_vat_p: number
  bottle_ex_vat_p: number
}

const VAT_DIVISOR = 1.2

function makeRow(tier: PricingRow['tier'], label: string, discount_pct: number): PricingRow {
  const standard = EXPEDITION_SPICED.trade_standard_case_p
  const case_inc = Math.round(standard * (1 - discount_pct / 100))
  const bottle_inc = Math.round(case_inc / EXPEDITION_SPICED.case.units_per_case)
  const case_ex = Math.round(case_inc / VAT_DIVISOR)
  // Derive the ex-VAT bottle from the exact inc-VAT case, not the already-rounded
  // bottle_inc, so it doesn't compound rounding error against the case figure.
  const bottle_ex = Math.round(case_inc / EXPEDITION_SPICED.case.units_per_case / VAT_DIVISOR)
  return {
    tier,
    label,
    discount_pct,
    case_inc_vat_p: case_inc,
    bottle_inc_vat_p: bottle_inc,
    case_ex_vat_p: case_ex,
    bottle_ex_vat_p: bottle_ex,
  }
}

// Single source of truth for trade discounts, keyed by the Shopify discount code
// (what the checkout actually applies). Confirmed in Shopify admin 21 Jul 2026:
// all percentage codes, £100 minimum order. The PARTNER-n ladder is volume-based
// (1 = individual bottles 5%, 2 = ~a case 10%, 3 = 2+ cases 15%); TRADE-INTRO is
// the first-order incentive. TRADE-INTRO and TRADE-PARTNER-3 both sit at 15% by
// intent (pending review) — mirror Shopify, do not "correct" it here.
export const TRADE_DISCOUNT_PCT_BY_CODE = {
  'TRADE-INTRO': 15,
  'TRADE-PARTNER-1': 5,
  'TRADE-PARTNER-2': 10,
  'TRADE-PARTNER-3': 15,
} as const
export type TradeDiscountCode = keyof typeof TRADE_DISCOUNT_PCT_BY_CODE

// Minimum order value every trade code enforces in Shopify.
export const TRADE_MIN_ORDER_GBP = 100

// Canonical tier → discount code (confirmed with Dan 21 Jul 2026). Both the
// pricing page (PRICING_ROWS) and the order form derive their percentage from
// TRADE_DISCOUNT_PCT_BY_CODE via this map, so the two surfaces can no longer quote
// different numbers for the same account.
const TRADE_CODE_BY_TIER: Record<TradeTier, TradeDiscountCode> = {
  intro: 'TRADE-INTRO',
  standard: 'TRADE-PARTNER-2',
  partner: 'TRADE-PARTNER-3',
}

export const PRICING_ROWS: PricingRow[] = [
  makeRow('standard_rrp', 'Standard case price', 0),
  makeRow('intro', 'Intro tier', TRADE_DISCOUNT_PCT_BY_CODE[TRADE_CODE_BY_TIER.intro]),
  makeRow('standard', 'Standard tier', TRADE_DISCOUNT_PCT_BY_CODE[TRADE_CODE_BY_TIER.standard]),
  makeRow('partner', 'Partner tier', TRADE_DISCOUNT_PCT_BY_CODE[TRADE_CODE_BY_TIER.partner]),
]

export function formatPence(p: number): string {
  return `£${(p / 100).toFixed(2)}`
}
