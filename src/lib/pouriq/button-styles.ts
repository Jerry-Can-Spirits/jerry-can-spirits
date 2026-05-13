// Shared Tailwind class strings for the Pour IQ trade portal so the
// button hierarchy stays consistent across menus / library / what-if /
// import / print / delete pages.

export const PRIMARY_BUTTON =
  'inline-flex items-center px-5 py-3 bg-gold-500 text-jerry-green-900 font-bold rounded-lg hover:bg-gold-400 transition-colors text-sm'

// Use for secondary actions that should still read as a button — has a
// gold tint so it doesn't disappear next to PRIMARY_BUTTON the way a
// plain outline does.
export const SECONDARY_BUTTON =
  'inline-flex items-center px-4 py-3 bg-gold-500/15 border border-gold-400/60 text-gold-100 hover:bg-gold-500/25 hover:border-gold-400 rounded-lg transition-colors text-sm font-semibold'

// Smaller variant of SECONDARY_BUTTON for inline / dense placements.
export const SECONDARY_BUTTON_SM =
  'inline-flex items-center px-4 py-2 bg-gold-500/15 border border-gold-400/60 text-gold-100 hover:bg-gold-500/25 hover:border-gold-400 rounded-lg transition-colors text-sm font-semibold'

export const DESTRUCTIVE_BUTTON =
  'inline-flex items-center px-4 py-2 bg-red-700/80 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors text-sm disabled:opacity-50'
