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
