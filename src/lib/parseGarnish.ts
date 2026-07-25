// Migration helper: turns a free-text cocktail garnish string into structured
// garnish items ({ slug?, note? }) so it can be stored as references + notes.
// Not used at render time (the cocktail page reads the resolved `garnishes`
// field directly); this powers the one-off string → structured migration.

export interface GarnishVocabEntry {
  name: string
  slug: string
}

export interface GarnishItem {
  slug?: string
  note?: string
}

// Common garnish spellings that do not match an ingredient page name exactly.
// Applied only when the target slug exists in the ingredient set.
const GARNISH_ALIASES: Record<string, string> = {
  'mint sprig': 'fresh-mint-sprig',
  'mint leaves': 'fresh-mint',
  nutmeg: 'freshly-grated-nutmeg',
  cherry: 'maraschino-cherry',
  cinnamon: 'ground-cinnamon',
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Build the garnish matching vocabulary from the ingredient list plus known
// aliases, sorted longest-name-first so multi-word names win over their
// fragments (e.g. "Orange Slice" before a bare "Orange").
export function buildGarnishVocab(ingredients: GarnishVocabEntry[]): GarnishVocabEntry[] {
  const slugs = new Set(ingredients.map((i) => i.slug))
  const entries: GarnishVocabEntry[] = ingredients.filter((e) => e.name && e.slug)
  for (const [name, slug] of Object.entries(GARNISH_ALIASES)) {
    if (slugs.has(slug)) entries.push({ name, slug })
  }
  return entries.sort((a, b) => b.name.length - a.name.length)
}

function findMatches(
  garnish: string,
  vocab: GarnishVocabEntry[]
): { start: number; end: number; slug: string }[] {
  const claimed: { start: number; end: number; slug: string }[] = []
  for (const entry of vocab) {
    const re = new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(entry.name)}(?![A-Za-z0-9])`, 'gi')
    let m: RegExpExecArray | null
    while ((m = re.exec(garnish)) !== null) {
      if (m[0].length === 0) {
        re.lastIndex++
        continue
      }
      const start = m.index
      const end = start + m[0].length
      if (claimed.some((c) => start < c.end && end > c.start)) continue
      claimed.push({ start, end, slug: entry.slug })
    }
  }
  return claimed.sort((a, b) => a.start - b.start)
}

// Trim separators and dangling connectors from a note fragment. A fragment that
// is only a connector ("and", "with") or separator collapses to empty.
function cleanNote(s: string): string {
  let t = s.trim().replace(/^[,;]+/, '').replace(/[,;]+$/, '').trim()
  t = t.replace(/^(?:and|with)\b\s*/i, '').replace(/\s*\b(?:and|with)$/i, '').trim()
  return t
}

// Parse a garnish string into items. Each recognised garnish name becomes an
// item with a `slug` and the trailing descriptor as its `note`; text that has no
// match becomes a note-only item. A garnish name is segmented at its match
// position (not by splitting on "and"/"with"), so a single garnish whose note
// contains "and" ("expressed over the glass and rested on the rim") stays one
// item. Leading modifiers directly before a name (e.g. "Luxardo", "Dehydrated")
// are dropped; comma-separated leading elements are kept as note-only items.
export function parseGarnishItems(
  garnish: string | undefined | null,
  vocab: GarnishVocabEntry[]
): GarnishItem[] {
  if (!garnish || !garnish.trim()) return []
  const matches = findMatches(garnish, vocab)
  if (matches.length === 0) return [{ note: garnish.trim() }]

  const items: GarnishItem[] = []

  // Text before the first match: comma-separated pieces are their own note-only
  // items; the final piece (an immediate modifier of the first name) is dropped.
  const preParts = garnish.slice(0, matches[0].start).split(',')
  for (let i = 0; i < preParts.length - 1; i++) {
    const n = cleanNote(preParts[i])
    if (n) items.push({ note: n })
  }

  matches.forEach((mt, i) => {
    const regionEnd = i + 1 < matches.length ? matches[i + 1].start : garnish.length
    // The text up to the first comma is this garnish's note; any further
    // comma-separated pieces are separate garnishes that have no page.
    const parts = garnish.slice(mt.end, regionEnd).split(',')
    const note = cleanNote(parts[0])
    items.push(note ? { slug: mt.slug, note } : { slug: mt.slug })
    for (let j = 1; j < parts.length; j++) {
      const n = cleanNote(parts[j])
      if (!n) continue
      if (/^or\b/i.test(n)) {
        // A disjunctive alternative ("or fresh blackberries") belongs to the
        // previous garnish, not a separate one.
        const prev = items[items.length - 1]
        prev.note = prev.note ? `${prev.note} ${n}` : n
      } else {
        items.push({ note: n })
      }
    }
  })

  return items
}
