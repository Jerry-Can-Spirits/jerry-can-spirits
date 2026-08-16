export type ShelfId = 'spirits' | 'wines-liqueurs' | 'mixers' | 'fresh' | 'bitters'
export type VesselType = 'spirit' | 'wine' | 'liqueur' | 'carton' | 'can' | 'dash'

export interface CocktailIndexItem {
  slug: string
  name: string
  baseSpirit: string
  coreIngredientIds: string[]
}

export interface BarIngredient {
  id: string
  name: string
  slug: string
  category: string
  shelf: ShelfId
  vessel: VesselType
  common: boolean
}

export interface ShelfGroup {
  id: ShelfId
  label: string
  ingredients: BarIngredient[]
}

export interface BarData {
  index: CocktailIndexItem[]
  shelves: ShelfGroup[]
  /**
   * Ingredient id -> the ids owning it also satisfies.
   *
   * A recipe calling for Rum is satisfied by a bottle of Spiced Rum, because
   * spiced rum is a rum. The reverse is not true: a recipe calling for Spiced
   * Rum is not satisfied by a generic bottle of rum, so this only ever walks
   * upward, and only where the parent shares the child's category. Sloe Gin
   * names Gin as its parent and is a liqueur, so owning it never implies gin.
   */
  implies: Record<string, string[]>
}
