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
}
