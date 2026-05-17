// Shared types for Pour IQ. Source of truth for everything from D1 row shapes
// to AI tool output. Keep this file small and import-only — no logic here.

export type LicenceType = 'pilot' | 'annual' | 'biannual' | 'monthly'

export type IngredientType =
  | 'spirit' | 'liqueur' | 'wine' | 'beer' | 'mixer'
  | 'syrup' | 'juice' | 'garnish' | 'other'

export type RecommendationSeverity = 'info' | 'warn' | 'action'
export type RecommendationCategory = 'pricing' | 'waste' | 'balance' | 'complexity' | 'opportunity'
export type RecommendationAction = 'adjust_price' | 'remove_cocktail' | 'remove_ingredient' | 'swap_ingredient'

export interface PourIqLicence {
  id: string
  trade_account_id: string
  licence_type: LicenceType
  valid_from: string
  valid_until: string
  price_paid_p: number
}

export type VolumeCadence = 'weekly' | 'monthly'
export type VolumeSource = 'manual' | 'pos'

export interface MenuRow {
  id: string
  trade_account_id: string
  name: string
  venue_type: string | null
  city: string | null
  target_gp_pct: number
  positioning: string | null
  notes: string | null
  // 1 (default): sale prices include 20% UK VAT (customer-facing).
  // 0: sale prices are net of VAT (internal margin tracking).
  prices_include_vat: number
  volume_cadence: VolumeCadence
  created_at: string
  updated_at: string
}

export interface DrinkVolumeRow {
  id: string
  cocktail_id: string
  period_start: string  // ISO date YYYY-MM-DD
  period_end: string    // ISO date YYYY-MM-DD, inclusive
  units_sold: number
  source: VolumeSource
  created_at: string
  updated_at: string
}

export interface CocktailRow {
  id: string
  menu_id: string
  name: string
  sale_price_p: number
  promotional_price_p: number | null
  promotional_label: string | null
  // CSV of day numbers, 0=Sun .. 6=Sat. NULL = every day.
  promotional_days: string | null
  promotional_valid_from: string | null  // ISO YYYY-MM-DD
  promotional_valid_until: string | null
  position: number
  field_manual_slug: string | null
  notes: string | null
  description: string | null
  description_updated_at: string | null
}

export interface IngredientLibraryRow {
  id: string
  trade_account_id: string
  name: string
  ingredient_type: IngredientType
  bottle_size_ml: number | null
  bottle_cost_p: number | null
  unit_cost_p: number | null
  barcode: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface IngredientRow {
  id: string
  cocktail_id: string
  library_ingredient_id: string
  pour_ml: number | null
  unit_count: number | null
}

// IngredientRow with the library entry joined in — what calculations and
// rendering layers actually want to work with.
export interface IngredientWithLibrary extends IngredientRow {
  library: IngredientLibraryRow
}

export interface CocktailWithIngredients extends CocktailRow {
  ingredients: IngredientWithLibrary[]
}

export interface CocktailMetrics {
  cocktail_id: string
  name: string
  sale_price_p: number
  pour_cost_p: number
  margin_p: number
  gp_pct: number
  // Populated only when the drink has a promotional price set. Same
  // pour_cost; margin and GP recomputed against the promotional price.
  promo?: {
    sale_price_p: number
    margin_p: number
    gp_pct: number
    label: string | null
    // Day-of-week numbers (0=Sun..6=Sat). null = applies every day.
    days: number[] | null
    valid_from: string | null
    valid_until: string | null
    // True iff the promo is in effect on the date the metrics were
    // computed (server "now"). Drives the UI's "Active today" badge.
    active_today: boolean
  }
  // Populated when a volume entry exists for the current period. The
  // contribution is margin_p × units_sold and is the real "drink
  // pulling its weight" number once volumes are tracked.
  volume?: {
    units_sold: number
    period_start: string
    period_end: string
    contribution_p: number
  }
}

export interface IngredientOverlap {
  ingredient_name: string
  cocktail_count: number
  cocktail_ids: string[]
}

export interface WasteRisk {
  ingredient_name: string
  cocktail_id: string
  cocktail_name: string
  reason: string
}

export interface MenuMetrics {
  avg_gp_pct: number
  best_margin: CocktailMetrics | null
  worst_margin: CocktailMetrics | null
  waste_risk_count: number
  cocktail_metrics: CocktailMetrics[]
  ingredient_overlap: IngredientOverlap[]
  waste_risks: WasteRisk[]
}

export interface FieldManualMatch {
  cocktail_id: string
  cocktail_name: string
  field_manual_url: string
}

export interface Recommendation {
  severity: RecommendationSeverity
  category: RecommendationCategory
  drink_id?: string
  title: string
  body: string
  suggested_change?: {
    action: RecommendationAction
    from?: string
    to?: string
    impact_summary: string
  }
  field_manual_reference?: {
    url: string
    why_relevant: string
  }
}
