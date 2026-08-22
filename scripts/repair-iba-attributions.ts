/**
 * Bring the 102 IBA-attributed cocktails into line with what we claim.
 *
 * scripts/audit-iba-specs.ts fetched all 102 published specifications and found
 * ZERO millilitre divergences. The measures were already right. What was wrong
 * was narrower and in three parts.
 *
 * 1. NAMING. We were inconsistent about brands. Where the IBA names one we
 *    sometimes generalised it away (their Cointreau became our Triple Sec) and
 *    where they name a category we sometimes narrowed it (their Raspberry
 *    Liqueur became our Chambord). Dan's rule, 21 August: follow the source. If
 *    the IBA names a brand we name it; if they name a category so do we.
 *
 *    The guide reference follows the meaning rather than the label. Cointreau
 *    stays pointed at the Triple Sec page because Cointreau is a triple sec and
 *    we have no Cointreau page; the two curaçao lines move to Triple Sec, which
 *    is what the IBA specifies and what they now say.
 *
 * 2. TWO REAL DIVERGENCES, both found by reading the side-by-side rather than
 *    by the tool. The Mimosa was built on Champagne where the IBA specifies
 *    Prosecco, and the Mint Julep listed 8 mint leaves where the IBA specifies
 *    4 sprigs. Both move their guide reference too: the Mimosa to the Prosecco
 *    page, the Julep to Fresh Mint Sprig, which is a different page from Fresh
 *    Mint and the correct one for a sprig.
 *
 * 3. WHAT THE ATTRIBUTION CLAIMS. Every page rendered "Source: the IBA
 *    (Official IBA specification)", which reads as covering the whole recipe.
 *    It does not: our methods are house-written throughout and deliberately
 *    better than the published ones. The IBA builds a Negroni in the glass and
 *    we stir and strain; the IBA shakes a Whiskey Sour once and we dry shake
 *    twice first.
 *
 *    Rewriting a hundred methods into worse technique to satisfy a label would
 *    be the wrong repair, and a disclaimer block would be ugly. So the claim is
 *    scoped in the line that makes it. The note becomes "Official IBA
 *    specification; method ours", which renders as
 *
 *      Source: the IBA (Official IBA specification; method ours).
 *
 *    Six pages carry the IBA's different name for the drink in that note. Those
 *    keep it, reworded out of nested brackets.
 *
 * Dry run by default; --write executes.
 *
 * Run: npx sanity exec scripts/repair-iba-attributions.ts --with-user-token
 *      ...add --write to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

/** Cocktail slug -> ingredient _key -> what to set. */
const LINES: Record<string, Record<string, { name: string; amount?: string; ref?: string; why: string }>> = {
  cosmopolitan: {
    v60052: { name: 'Cointreau', why: 'IBA names the brand' },
  },
  'long-island-iced-tea': {
    a72471a8f639: { name: 'Cointreau', why: 'IBA names the brand' },
  },
  'singapore-sling': {
    d5fd753760fe: { name: 'Cointreau', why: 'IBA names the brand' },
  },
  'espresso-martini': {
    '913ffa5d2555': { name: 'Kahlúa', why: 'IBA names the brand' },
  },
  'corpse-reviver-no-2': {
    '973e8085a196': { name: 'Cointreau', ref: 'triple-sec', why: 'IBA names Cointreau alone, with no alternative' },
  },
  'french-martini': {
    v6b0002: { name: 'Raspberry liqueur', why: 'IBA names the category, not Chambord' },
  },
  margarita: {
    c4bdae8f8153: { name: 'Triple Sec', why: 'IBA names triple sec, not curaçao' },
  },
  'white-lady': {
    '2fabb691b9b0': { name: 'Triple Sec', ref: 'triple-sec', why: 'IBA names triple sec, not curaçao' },
  },
  mimosa: {
    f70078: { name: 'Prosecco', ref: 'prosecco', why: 'IBA specifies prosecco, not champagne' },
  },
  'mint-julep': {
    c4d4788ec00d: {
      name: 'Fresh mint sprigs',
      amount: '4 sprigs',
      ref: 'fresh-mint-sprig',
      why: 'IBA specifies 4 sprigs, not 8 leaves',
    },
  },
}

interface Doc {
  _id: string
  name: string
  slug: string
  note: string | null
  ing: Array<{ _key: string; name: string; amount: string | null }> | null
}

/**
 * The scoped note.
 *
 * Nested brackets read badly once the line wraps this in its own pair, so an
 * alias is reworded rather than left as "(Dry Martini)".
 */
function scopedNote(note: string | null): string {
  const base = (note ?? 'Official IBA specification').trim().replace(/\.$/, '')

  // Six pages record the IBA's own name for the drink, in two different
  // phrasings. Both become the same one, so the corpus reads as one voice.
  const bracketed = /\(([^)]+)\)\s*$/.exec(base)
  const spelledOut = /lists as\s*[“"']?([^”"']+)[”"']?\s*$/i.exec(base)
  const alias = bracketed?.[1] ?? spelledOut?.[1]
  if (alias) return `Official IBA specification, listed as ${alias.trim()}; method ours`

  return `${base}; method ours`
}

async function main() {
  const docs = await client.fetch<Doc[]>(`
    *[_type=="cocktail" && recipeSource.authority=="iba" && !(_id in path("drafts.**"))]{
      _id, name, "slug": slug.current, "note": recipeSource.note,
      "ing": ingredients[]{ _key, name, amount }
    } | order(slug asc)`)

  const refIds = new Map<string, string>()
  const slugs = [...new Set(Object.values(LINES).flatMap((m) => Object.values(m).map((v) => v.ref).filter(Boolean)))]
  for (const r of await client.fetch<Array<{ s: string; id: string }>>(
    `*[_type=="ingredient" && slug.current in $slugs]{ "s": slug.current, "id": _id }`,
    { slugs }
  )) {
    refIds.set(r.s, r.id)
  }
  const missingRefs = (slugs as string[]).filter((s) => !refIds.has(s))
  if (missingRefs.length) throw new Error(`No ingredient page for: ${missingRefs.join(', ')}`)

  let lineChanges = 0
  console.log('=== RECIPE LINES ===')
  for (const [slug, keys] of Object.entries(LINES)) {
    const doc = docs.find((d) => d.slug === slug)
    if (!doc) throw new Error(`No IBA-attributed cocktail with slug "${slug}"`)
    for (const [key, want] of Object.entries(keys)) {
      const line = (doc.ing ?? []).find((i) => i._key === key)
      if (!line) throw new Error(`${doc.name}: no ingredient line with _key "${key}"`)
      console.log(`  ${doc.name}`)
      console.log(`    "${line.amount ?? ''} ${line.name}" -> "${want.amount ?? line.amount ?? ''} ${want.name}"`)
      console.log(`    ${want.why}${want.ref ? `, guide -> ${want.ref}` : ''}`)
      lineChanges++
    }
  }

  console.log(`\n=== ATTRIBUTION NOTE ON ALL ${docs.length} ===`)
  const sample = new Map<string, string>()
  for (const d of docs) sample.set(d.note ?? '(none)', scopedNote(d.note))
  for (const [from, to] of sample) console.log(`  "${from}"\n    -> "${to}"`)

  if (!WRITE) {
    console.log(`\nDRY RUN. ${lineChanges} line(s) and ${docs.length} note(s) would change. Pass --write.`)
    return
  }

  for (const [slug, keys] of Object.entries(LINES)) {
    const doc = docs.find((d) => d.slug === slug)!
    const patch = client.patch(doc._id)
    for (const [key, want] of Object.entries(keys)) {
      patch.set({ [`ingredients[_key=="${key}"].name`]: want.name })
      if (want.amount) patch.set({ [`ingredients[_key=="${key}"].amount`]: want.amount })
      if (want.ref) {
        patch.set({ [`ingredients[_key=="${key}"].ingredientRef._ref`]: refIds.get(want.ref)! })
      }
    }
    await patch.commit()
  }
  for (const d of docs) {
    await client.patch(d._id).set({ 'recipeSource.note': scopedNote(d.note) }).commit()
  }
  console.log(`\nWRITTEN. ${lineChanges} line(s) and ${docs.length} note(s).`)
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
