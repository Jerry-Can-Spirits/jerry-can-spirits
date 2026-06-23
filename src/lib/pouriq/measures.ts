// Quick-select pour measures for recipe entry. "Dash" (~2ml) and "Barspoon"
// (~5ml) cover the small bartending measures (e.g. dashing bitters) that a raw
// ml field alone makes fiddly to estimate. Shared by the add/edit drink form
// and the import match row so the options stay in sync.
export const POUR_PRESETS: ReadonlyArray<{ ml: number; label: string }> = [
  { ml: 2, label: 'Dash' },
  { ml: 5, label: 'Barspoon' },
  { ml: 15, label: '15ml' },
  { ml: 25, label: '25ml' },
  { ml: 35, label: '35ml' },
  { ml: 50, label: '50ml' },
  { ml: 75, label: '75ml' },
  { ml: 100, label: '100ml' },
]
