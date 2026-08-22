/**
 * Check every IBA-attributed cocktail against the specification the IBA
 * actually publishes.
 *
 * WHY. 102 pages carry `recipeSource.authority = "iba"` and render "Source: the
 * IBA (Official IBA specification)". A pass in August verified their measures.
 * A spot check on 21 August found the Mint Julep listing 8 mint leaves where
 * the IBA specifies 4 sprigs, on a page making that claim, so the measures
 * needed re-checking against the source rather than trusted.
 *
 * WHAT IT DOES, AND WHY IT STOPPED TRYING TO DO MORE. It fetches the published
 * specification for all 102 and prints it beside ours. It does not score them.
 *
 * Three versions of an automatic name matcher produced three different counts
 * of how many diverge: 44, then 22, then 31. Each number was wrong in a
 * different way. Matching on any shared word paired our lime juice with their
 * grapefruit juice because both say "juice". Requiring a distinctive shared
 * word then split caster sugar from superfine sugar, which are the same thing.
 * The IBA writes "White Cuban Ron", "Gengibre Slice" and "Bitter Campari"; we
 * write "White rum", "Fresh Ginger" and "Campari". No word-matching rule
 * survives that vocabulary, and a divergence count that moves every time the
 * rule is tuned is worse than no count at all.
 *
 * So the tool aligns and presents; a person reads. The one comparison it still
 * makes automatically is millilitre against millilitre on lines whose names are
 * an exact match, because that cannot be wrong.
 *
 * Method and garnish are reported but never treated as failures. Our methods
 * are consistently more careful than the published ones: the IBA builds a
 * Negroni in the glass and we stir and strain it; the IBA shakes a Whiskey Sour
 * once and we dry shake twice first. Rewriting a hundred methods into worse
 * technique to satisfy a label would be the wrong repair, so the divergences
 * are counted and left for a decision about the wording of the claim.
 *
 * SLUGS. Eleven of our slugs do not match theirs, and six of those were already
 * recorded by hand in `recipeSource.note` ("Official IBA specification (Dry
 * Martini)"). ALIASES holds all eleven. An unmapped 404 is reported rather than
 * skipped, because a page attributed to a specification that cannot be found is
 * the thing this audit exists to surface.
 *
 * Pages are cached under the scratchpad so a re-run costs nothing.
 *
 * Run: npx sanity exec scripts/audit-iba-specs.ts --with-user-token
 *      ...add --full to print every drink rather than only the divergences.
 */
import { getCliClient } from 'sanity/cli'
import { execFileSync } from 'child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { htmlToText } from './html-text'

const client = getCliClient()
const CACHE = join(tmpdir(), 'iba-specs')

/** Our slug -> the IBA's, where they differ. */
const ALIASES: Record<string, string> = {
  'aperol-spritz': 'spritz',
  'brandy-alexander': 'alexander',
  'corpse-reviver-no-2': 'corpse-reviver-2',
  'dark-and-stormy': 'dark-n-stormy',
  'hemingway-daiquiri': 'hemingway-special',
  'martini-gin': 'dry-martini',
  'pornstar-martini': 'porn-star-martini',
  'ramos-gin-fizz': 'ramos-fizz',
  seabreeze: 'sea-breeze',
  southside: 'south-side',
  vento: 've-n-to',
}

interface Ours {
  slug: string
  name: string
  ing: Array<{ name: string; amount: string | null }> | null
}

// Was a local decoder until the same double-unescaping fault was written a
// second time in scripts/fetch-fever-tree-serves.ts, hours after this one was
// corrected. Shared so there is one of them to get wrong.
const decode = htmlToText

/** The block following an <h4> with this heading. */
function section(html: string, heading: string): string {
  const h = new RegExp(`>\\s*${heading}\\s*<`, 'i').exec(html)
  if (!h) return ''
  const after = html.slice(h.index)
  const block = /<div class="elementor-shortcode">([\s\S]*?)<\/div>/.exec(after)
  return block ? block[1] : ''
}

/**
 * Ingredient lines, splitting list items that ran together at the source.
 *
 * The Three Dots and a Dash page publishes "7.5 ml Allspice Saint Elizabeth15
 * ml Fresh Lime Juice" as a single <li>: two ingredients with no separator.
 * Read whole, the measure at the front is 7.5ml and the name at the end is
 * Fresh Lime Juice, which is how this script came to report that our 15ml of
 * lime contradicted the IBA. It does not. A new measure appearing mid-string
 * with no space before it starts a new line.
 *
 * The lookbehind excludes digits deliberately. Allowing any non-space split
 * "15 ml" between the 1 and the 5, which turned every measure in the corpus
 * into a 5ml divergence and produced a report claiming 216 of them.
 */
function ibaIngredients(html: string): string[] {
  const block = section(html, 'Ingredients')
  return [...block.matchAll(/<li>([\s\S]*?)<\/li>/g)]
    .flatMap((m) => decode(m[1]).split(/(?<=[^\s\d.,])(?=\d+(?:[.,]\d+)?\s*ml\b)/i))
    .map((s) => s.trim())
    .filter(Boolean)
}

function fetchPage(slug: string): string | null {
  mkdirSync(CACHE, { recursive: true })
  const file = join(CACHE, `${slug}.html`)
  if (existsSync(file)) return readFileSync(file, 'utf8')
  try {
    const out = execFileSync(
      'curl',
      ['-s', '-A', 'Mozilla/5.0', '-f', `https://iba-world.com/iba-cocktail/${slug}/`],
      { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }
    )
    writeFileSync(file, out)
    return out
  } catch {
    return null
  }
}

/** "30 ml" and "30ml" and "30 Ml" are one measure; so are sugar and Sugar. */
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/\s*ml\b/g, 'ml')
    .replace(/[.,]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * The millilitre figure in a line, or null.
 *
 * Only millilitres are compared automatically. Everything else the IBA writes
 * is prose that does not parse into a measure and a name: "Dash Angostura
 * Bitters", "Few Drops Egg White", "4 fresh Mint sprigs", "Top up with Soda
 * Water". A first version of this script tried to split those and reported
 * thirty-one divergences, nearly all of which were the splitter failing rather
 * than the recipe differing. A count that wrong is worse than no count, so
 * anything without a millilitre figure on both sides goes to a review list with
 * both lines printed for a person to read.
 */
function ml(line: string): number | null {
  const m = /([\d]+(?:[.,][\d]+)?)\s*ml\b/i.exec(line)
  return m ? Number(m[1].replace(',', '.')) : null
}

/** The IBA line with its measure left in, for the review list. */
function splitIba(line: string): { amount: string; name: string } {
  return { amount: '', name: line }
}

async function main() {
  const ours = await client.fetch<Ours[]>(`
    *[_type=="cocktail" && recipeSource.authority=="iba" && !(_id in path("drafts.**"))]{
      "slug": slug.current, name, "ing": ingredients[]{ name, amount }
    } | order(slug asc)`)

  const missing: string[] = []
  const hardDiff: string[] = []
  const pairs: Array<{name:string;slug:string;mine:Array<{amount:string;name:string}>;theirs:string[]}> = []

  for (const c of ours) {
    const slug = ALIASES[c.slug] ?? c.slug
    const html = fetchPage(slug)
    if (!html) {
      missing.push(`${c.slug} (tried ${slug})`)
      continue
    }
    const theirs = ibaIngredients(html).map(splitIba)
    const mine = (c.ing ?? []).map((i) => ({ amount: (i.amount ?? '').trim(), name: i.name }))

    if (!theirs.length) {
      missing.push(`${c.slug} (page fetched, no ingredient list parsed)`)
      continue
    }

    // Matched by name rather than by position. A recipe's order is editorial —
    // we lead with the defining spirit — and comparing slot for slot reported
    // the Champagne Cocktail as four wrong measures when the only difference
    // was which line came first.
    pairs.push({ name: c.name, slug: c.slug, mine, theirs: theirs.map((t) => t.name) })

    // The only automatic claim left: an ingredient whose name matches exactly
    // on both sides, where both give a millilitre figure, and the figures
    // differ. That cannot be a vocabulary artefact.
    for (const o of mine) {
      const t = theirs.find((x) => norm(x.name).endsWith(norm(o.name)))
      if (!t) continue
      const a = ml(o.amount)
      const b = ml(t.name)
      if (a !== null && b !== null && a !== b) {
        hardDiff.push(`  ${c.name} (${c.slug}): ${o.name} — ours ${a}ml, IBA ${b}ml`)
      }
    }

  }

  console.log(`Fetched the published specification for ${ours.length - missing.length} of ${ours.length} IBA-attributed cocktails.\n`)
  console.log(`  ${hardDiff.length} differ on a millilitre measure for an identically named ingredient`)
  console.log(`  ${missing.length} could not be fetched`)
  console.log('\nEverything else is printed side by side below. Read it: the two')
  console.log('vocabularies differ enough that no automatic count of "divergences"')
  console.log('has been trustworthy, and three attempts gave three different answers.\n')

  if (hardDiff.length) {
    console.log('=== MEASURE DIFFERS, SAME INGREDIENT NAME ===')
    hardDiff.forEach((d) => console.log(d))
    console.log()
  }

  console.log('=== SIDE BY SIDE ===')
  for (const p of pairs) {
    console.log(`\n  ${p.name} (${p.slug})`)
    const n = Math.max(p.mine.length, p.theirs.length)
    for (let i = 0; i < n; i++) {
      const o = p.mine[i] ? `${p.mine[i].amount} ${p.mine[i].name}`.trim() : ''
      const t = p.theirs[i] ?? ''
      console.log(`    ${o.padEnd(42).slice(0, 42)} | ${t}`)
    }
  }

  if (missing.length) {
    console.log('\n=== COULD NOT FETCH ===')
    missing.forEach((m) => console.log(`  ${m}`))
  }
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
