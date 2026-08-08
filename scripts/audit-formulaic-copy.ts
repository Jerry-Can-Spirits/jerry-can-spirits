/**
 * Measure how formulaic the cocktail writing has become.
 *
 * Dan's read is that "some things are being done that I am not asking for and I
 * feel it is weakening the material". This turns that into numbers before the
 * copy pass, so the batch review knows what it is looking for rather than
 * discovering each tic 349 times.
 *
 * Two measurements:
 *
 * 1. REPEATED PHRASES. Every 5-word sequence that appears in three or more
 *    DIFFERENT cocktails. A phrase repeated across documents is a template;
 *    one repeated inside a single document is emphasis.
 *
 * 2. NEAR-DUPLICATE DESCRIPTIONS. Jaccard similarity over word trigrams. Two
 *    descriptions sharing most of their trigrams are the same paragraph with
 *    the nouns swapped.
 *
 * Read-only. Writes nothing.
 */
import { getCliClient } from 'sanity/cli'
import { extractText } from '../src/lib/sanity-text'

const client = getCliClient()

const NGRAM = 5
const MIN_DOCS = 3
const SIMILARITY_FLOOR = 0.35

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9' ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

function ngrams(words: string[], n: number): string[] {
  const out: string[] = []
  for (let i = 0; i + n <= words.length; i++) out.push(words.slice(i, i + n).join(' '))
  return out
}

function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0
  for (const x of a) if (b.has(x)) inter++
  return inter / (a.size + b.size - inter)
}

interface Doc {
  name: string
  slug: string
  description: string | null
  longDescription: unknown
  note: string | null
  history: string | null
}

async function main() {
  // Ingredients and equipment carry the same tics: the Tia Maria, Hot Sauce,
  // Whole Milk and Green Ginger Wine pages all held CMS vocabulary. Scanning
  // cocktails alone reported 4 "Dan's list" hits where there were 5.
  const docs = await client.fetch<Doc[]>(`
    *[_type in ["cocktail","ingredient","equipment","guide"]]{
      name, "slug": slug.current, description, longDescription, note, history
    }
  `)
  console.log(`Scanned ${docs.length} cocktails.\n`)

  // ---- 1. Repeated phrases across documents -------------------------------
  const phraseDocs = new Map<string, Set<string>>()
  const bodies = new Map<string, string>()

  for (const d of docs) {
    let text: string
    try {
      text = extractText({
        description: d.description,
        longDescription: d.longDescription,
        note: d.note,
        history: d.history,
      }).text
    } catch (err) {
      console.log(`  ! extraction failed for ${d.name}: ${(err as Error).message}`)
      continue
    }
    bodies.set(d.name, norm(text))
    const words = norm(text).split(' ').filter(Boolean)
    for (const g of new Set(ngrams(words, NGRAM))) {
      if (!phraseDocs.has(g)) phraseDocs.set(g, new Set())
      phraseDocs.get(g)!.add(d.name)
    }
  }

  const repeated = [...phraseDocs.entries()]
    .filter(([, set]) => set.size >= MIN_DOCS)
    .sort((a, b) => b[1].size - a[1].size)

  console.log(`=== PHRASES OF ${NGRAM} WORDS APPEARING IN ${MIN_DOCS}+ DIFFERENT COCKTAILS ===`)
  console.log(`${repeated.length} distinct phrases\n`)
  for (const [phrase, set] of repeated.slice(0, 45)) {
    console.log(`  ${String(set.size).padStart(3)}  "${phrase}"`)
    console.log(`       ${[...set].slice(0, 6).join(', ')}${set.size > 6 ? `, +${set.size - 6}` : ''}`)
  }

  // ---- 2. Near-duplicate descriptions --------------------------------------
  const shingles = new Map<string, Set<string>>()
  for (const d of docs) {
    if (!d.description) continue
    const words = norm(d.description).split(' ').filter(Boolean)
    if (words.length < 20) continue
    shingles.set(d.name, new Set(ngrams(words, 3)))
  }

  const names = [...shingles.keys()]
  const pairs: Array<{ a: string; b: string; score: number }> = []
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const score = jaccard(shingles.get(names[i])!, shingles.get(names[j])!)
      if (score >= SIMILARITY_FLOOR) pairs.push({ a: names[i], b: names[j], score })
    }
  }
  pairs.sort((x, y) => y.score - x.score)

  // ---- 3. Named tics --------------------------------------------------------
  //
  // The n-gram list mixes two very different things. Serving method repeats
  // ("double strained into a chilled coupe") are technical accuracy: there are
  // only so many ways to describe a shake. Evaluative constructions are the
  // crutch. These patterns isolate the second kind.
  const TICS: Array<{ label: string; re: RegExp }> = [
    // CMS vocabulary. Cleared to zero on 8 Aug 2026 (71 spans). Kept here so a
    // regression shows up as a number rather than being noticed by a reader.
    { label: 'doc / docs (CMS vocabulary)', re: /\b(doc|docs)\b/gi },
    { label: "Dan's list (internal artefact)", re: /\bdan[’']s list\b/gi },
    { label: 'Difford (competitor as authority)', re: /\bdifford/gi },
    { label: 'one of the most / oldest / few / best', re: /\bone of the (most|oldest|few|best|greatest|finest)\b/gi },
    { label: 'from first sip to last', re: /\bfrom first sip to last\b/gi },
    { label: 'serve it to those who', re: /\bserve it to those who\b/gi },
    { label: 'drinks in the Field Manual', re: /\bdrinks in the field manual\b/gi },
    { label: 'this page pours / follows', re: /\bthis page (pours|follows|keeps|names)\b/gi },
    { label: 'earns / earned its page, place, slot', re: /\bearn(s|ed) (its|the) (page|place|slot)\b/gi },
    { label: 'canonised / codified / preserved the spec', re: /\b(canonised|canonized|codified)\b/gi },
    { label: 'the honest way', re: /\bthe honest way\b/gi },
    { label: 'the modern school', re: /\bthe modern school\b/gi },
  ]

  console.log('\n\n=== NAMED TICS ===')
  console.log('Evaluative constructions, separated from method repetition.\n')
  for (const { label, re } of TICS) {
    let total = 0
    const docsHit: string[] = []
    for (const [name, body] of bodies) {
      const m = body.match(re)
      if (!m) continue
      total += m.length
      docsHit.push(name)
    }
    console.log(`  ${String(total).padStart(4)} uses across ${String(docsHit.length).padStart(3)} cocktails  ${label}`)
    if (docsHit.length && docsHit.length <= 12) console.log(`         ${docsHit.join(', ')}`)
  }

  console.log(`\n\n=== NEAR-DUPLICATE DESCRIPTIONS (trigram Jaccard >= ${SIMILARITY_FLOOR}) ===`)
  console.log(`${pairs.length} pair(s) from ${names.length} descriptions\n`)
  pairs.slice(0, 25).forEach((p) => console.log(`  ${p.score.toFixed(2)}  ${p.a}  <->  ${p.b}`))
  if (!pairs.length) console.log('  none')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
