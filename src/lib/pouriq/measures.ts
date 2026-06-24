// Quick-select pour measures for recipe entry. "Dash" (~0.6ml, e.g. dashing
// bitters) and "Barspoon" (~5ml) cover the small bartending measures that a raw
// ml field alone makes fiddly to estimate. These are just quick chips; the ml
// field also takes free text for anything off-preset (7ml, 12.5ml, etc.).
// Shared by the add/edit drink form and the import match row so the options
// stay in sync.
export const POUR_PRESETS: ReadonlyArray<{ ml: number; label: string }> = [
  { ml: 0.6, label: 'Dash' },
  { ml: 5, label: 'Barspoon' },
  { ml: 10, label: '10ml' },
  { ml: 15, label: '15ml' },
  { ml: 25, label: '25ml' },
  { ml: 35, label: '35ml' },
  { ml: 50, label: '50ml' },
  { ml: 75, label: '75ml' },
  { ml: 100, label: '100ml' },
]

// Common per-item sizes for the "how you buy it" cost entry. Quick chips; the
// size field also accepts a typed value (e.g. 10000 for a 10L keg/BIB).
// Covers 150/200ml (Britvic/Fever-Tree splits) up to 2000ml bottled mixers.
export const BOTTLE_SIZES_ML: readonly number[] = [150, 200, 330, 500, 700, 750, 1000, 2000]

// Common bag/tub sizes for weight-bought ingredients (spices, sugar, citric
// acid, etc.). Quick chips; the size field also accepts free text.
export const WEIGHT_SIZES_G: readonly number[] = [500, 1000, 2500, 5000]

// Quick-pick glassware for spec cards. The glass field also accepts free text,
// so anything not listed here can still be typed in.
export const GLASS_OPTIONS = ['Rocks', 'Highball', 'Collins', 'Coupe', 'Martini', 'Nick & Nora', 'Wine', 'Flute', 'Shot', 'Hurricane'] as const

export type BaseUnit = 'ml' | 'g' | 'each'
export interface ServeUnit { name: string; base_per_unit: number }

// Standard serve units available for any ingredient of the matching base unit,
// with no per-ingredient setup. base_per_unit is in that base unit.
export const STANDARD_SERVE_UNITS: Record<BaseUnit, ServeUnit[]> = {
  ml: [
    { name: 'ml', base_per_unit: 1 },
    { name: 'dash', base_per_unit: 0.6 },
    { name: 'barspoon', base_per_unit: 5 },
    { name: 'tsp', base_per_unit: 5 },
  ],
  g: [
    { name: 'g', base_per_unit: 1 },
    { name: 'pinch', base_per_unit: 0.3 },
  ],
  each: [{ name: 'item', base_per_unit: 1 }],
}

// Standard units for the base dimension + the ingredient's custom units.
// A custom unit overrides a standard one of the same name.
export function serveUnitsFor(baseUnit: BaseUnit, custom: ServeUnit[]): ServeUnit[] {
  const byName = new Map<string, ServeUnit>()
  for (const u of STANDARD_SERVE_UNITS[baseUnit]) byName.set(u.name, u)
  for (const u of custom) byName.set(u.name, u)
  return [...byName.values()]
}

// The base-unit amount stored on the recipe line (pour_ml for ml/g, unit_count for each).
export function recipeBaseAmount(recipe_qty: number, base_per_unit: number): number {
  return recipe_qty * base_per_unit
}
