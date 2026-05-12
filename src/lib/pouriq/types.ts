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

export interface MenuRow {
  id: string
  trade_account_id: string
  name: string
  venue_type: string | null
  city: string | null
  target_gp_pct: number
  positioning: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface CocktailRow {
  id: string
  menu_id: string
  name: string
  sale_price_p: number
  position: number
  field_manual_slug: string | null
  notes: string | null
}

export interface IngredientLibraryRow {
  id: string
  trade_account_id: string
  name: string
  ingredient_type: IngredientType
  bottle_size_ml: number | null
  bottle_cost_p: number | null
  unit_cost_p: number | null
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
  cocktail_id?: string
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
