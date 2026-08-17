/**
 * Find cocktail names written one way in prose and another way in the document
 * that defines them.
 *
 * The third mechanical check, after scripts/audit-prose-mismatch.ts (is the
 * right ingredient named) and scripts/audit-measure-contradictions.ts (is the
 * right number named). This one asks whether the right NAME is written.
 *
 * It exists because nothing linked the two. A cocktail's name lives in its own
 * document, and every other page that mentions the drink retypes it by hand,
 * so an apostrophe or an ampersand drifts silently and no test notices. The
 * Dark ’n’ Stormy is the case that prompted it: the cocktail document reads
 * "Dark ’n’ Stormy" with apostrophes both sides, the Ginger Beer page had
 * "Dark 'n' Stormy" with straight quotes, and I then wrote "Dark ’n Stormy"
 * with one apostrophe onto the Dark Rum page. Three spellings, one drink, and
 * the only reason it surfaced was Dan pasting a screenshot.
 *
 * TWO REPORTS, and the second matters more than the first.
 *
 * PROSE DRIFT is a mention that resolves to a real cocktail but is not spelled
 * the way that cocktail's document spells it.
 *
 * CANONICAL DRIFT is the cocktail documents disagreeing with each other:
 * "Bee's Knees" with a straight apostrophe sitting beside "Buck’s Fizz" with a
 * typographic one. That is worse, because those names are the page titles and
 * every prose mention is copied from them, so an inconsistent source guarantees
 * inconsistent prose for ever.
 *
 * THE MATCHING RULE, and why it is not "search for every name".
 *
 * Names are matched on a key that deliberately ignores the things that drift:
 * case, diacritics, apostrophes, "&" against "and", and the "’n’" connector.
 * "Dark and Stormy", "Dark 'n' Stormy" and "Dark ’n’ Stormy" all key to
 * "dark and stormy", so a mention is found however it was typed. The raw text
 * is then compared against the canonical spelling, and only a difference is
 * reported.
 *
 * That key is loose enough to match ordinary English, so capitalisation is
 * required: every word in a candidate that is not a connector must start with a
 * capital. Without it "a dark and stormy night" reports as a Dark ’n’ Stormy,
 * and the Alaska, Paradise, Hunter and Illegal cocktails turn every use of
 * those words into a finding. With it, prose has to be naming the drink.
 *
 * Read-only. Writes nothing.
 *
 * Run:  npx sanity exec scripts/audit-name-drift.ts --with-user-token
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()

/** Words that may stay lowercase inside a drink's name. */
const CONNECTORS = new Set([
  'and', 'n', 'the', 'of', 'in', 'de', 'la', 'le', 'a', 'al', 'with', 'at', 'on', 'to', '&',
])

/**
 * The comparison key: everything that drifts is flattened out of it.
 *
 * Diacritics go because "Vieux Carre" for "Vieux Carré" is exactly the drift
 * worth catching. Apostrophes go entirely rather than being unified, so that a
 * missing one ("Bees Knees") still matches. A lone "n" becomes "and" so the
 * ’n’ connector keys the same as the word.
 */
function key(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’'ʼ‘ʼ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => (w === 'n' ? 'and' : w))
    .join(' ')
}

interface Block {
  _type?: string
  style?: string
  children?: Array<{ text?: string }>
}

function blockText(value: unknown): string[] {
  return ((value as Block[] | null) ?? [])
    .filter((b) => b?._type === 'block')
    .map((b) => (b.children ?? []).map((c) => c.text ?? '').join(''))
    .filter((t) => t.trim())
}

/** Every prose field on a document, labelled so a finding can be located. */
function passages(doc: Record<string, unknown>): Array<[string, string]> {
  const out: Array<[string, string]> = []
  const push = (label: string, v: unknown) => {
    if (typeof v === 'string' && v.trim()) out.push([label, v])
  }
  push('description', doc.description)
  push('usage', doc.usage)
  push('storage', doc.storage)
  push('expert tip', doc.note)
  push('history', doc.history)
  push('professional tip', doc.professionalTip)
  for (const field of ['topTips', 'tips', 'whatToLookFor', 'instructions'] as const) {
    const arr = doc[field]
    if (Array.isArray(arr)) arr.forEach((v, i) => push(`${field}[${i}]`, v))
  }
  blockText(doc.longDescription).forEach((t, i) => out.push([`longDescription[${i}]`, t]))
  const faqs = doc.faqs
  if (Array.isArray(faqs)) {
    faqs.forEach((f: { question?: string; answer?: string }, i) => {
      push(`faq[${i}].question`, f?.question)
      push(`faq[${i}].answer`, f?.answer)
    })
  }
  return out
}

/**
 * Candidate name mentions: capitalised runs of up to six words.
 *
 * Six because "Slow Comfortable Screw Against the Wall" is seven and the tail
 * is connectors; anything longer than that is not being retyped by hand.
 */
const MAX_WORDS = 6

function candidates(text: string): Array<{ raw: string; key: string }> {
  const tokens = text.split(/\s+/).filter(Boolean)
  const out: Array<{ raw: string; key: string }> = []
  for (let i = 0; i < tokens.length; i++) {
    for (let n = 1; n <= MAX_WORDS && i + n <= tokens.length; n++) {
      const window = tokens.slice(i, i + n).join(' ')
      // Trailing sentence punctuation is not part of the name; a trailing
      // apostrophe is (Ti’ Punch), so it is stripped only from the end.
      const raw = window.replace(/^[("“‘]+/, '').replace(/[),.;:!?"”]+$/, '')
      if (!raw) continue
      const words = raw.split(' ')
      // Capitalisation is checked per hyphen-separated part, not per token.
      // "20th-century" passes a whole-token test because it starts with a
      // digit, and then keys to the 20th Century cocktail: the adjective in
      // "a 20th-century bar" was the first false positive this check produced.
      const named = words.every((w) => {
        const bare = w.replace(/[^A-Za-z0-9’'ʼ-]/g, '')
        if (!bare) return false
        if (CONNECTORS.has(bare.toLowerCase())) return true
        return bare.split('-').filter(Boolean).every((part) => {
          if (CONNECTORS.has(part.toLowerCase())) return true
          if (/^\d+(st|nd|rd|th)?$/i.test(part)) return true
          return /^[A-Z]/.test(part)
        })
      })
      if (!named) continue
      // A candidate cannot end on a connector: "Rum and" is not a name.
      if (CONNECTORS.has(words[words.length - 1].toLowerCase())) continue
      out.push({ raw, key: key(raw) })
    }
  }
  return out
}

async function main() {
  const cocktails = await client.fetch<Array<{ name: string; slug: string }>>(
    `*[_type == "cocktail" && defined(name)]{ name, "slug": slug.current } | order(name asc)`
  )

  // key -> canonical spelling. A collision means two drinks whose names differ
  // only by the punctuation this check ignores, which is worth knowing itself.
  const canonical = new Map<string, string>()
  const collisions: string[] = []
  for (const c of cocktails) {
    const k = key(c.name)
    const existing = canonical.get(k)
    if (existing && existing !== c.name) collisions.push(`${existing}  vs  ${c.name}`)
    else canonical.set(k, c.name)
  }

  // ---- Report 2 first: the source of every prose mention. ----
  const straight = cocktails.filter((c) => /['ʼ]/.test(c.name))
  const curly = cocktails.filter((c) => /’/.test(c.name))
  const ampersand = cocktails.filter((c) => /&/.test(c.name))
  const spelledAnd = cocktails.filter((c) => /\band\b/i.test(c.name))

  console.log('CANONICAL NAME CONSISTENCY')
  console.log(`  typographic apostrophe (’): ${curly.length}`)
  for (const c of curly) console.log(`     ${c.name}`)
  console.log(`  straight apostrophe ('):    ${straight.length}`)
  for (const c of straight) console.log(`     ${c.name}   <-- differs from the house style above`)
  console.log(`  ampersand (&): ${ampersand.length}   spelled "and": ${spelledAnd.length}`)
  for (const c of ampersand) console.log(`     ${c.name}`)
  for (const c of spelledAnd) console.log(`     ${c.name}`)
  if (collisions.length) {
    console.log('\n  NAMES THAT DIFFER ONLY BY PUNCTUATION:')
    for (const c of collisions) console.log(`     ${c}`)
  }

  // ---- Report 1: prose that spells a real cocktail differently. ----
  const docs = await client.fetch<Array<Record<string, unknown>>>(
    `*[_type in ["cocktail", "ingredient", "equipment", "guide"] && !(_id in path("drafts.**"))]{
      _id, _type, name, title, description, usage, storage, note, history, professionalTip,
      topTips, tips, whatToLookFor, instructions, longDescription, faqs
    }`
  )

  let findings = 0
  let pages = 0
  const byName = new Map<string, number>()

  for (const doc of docs) {
    const label = (doc.name ?? doc.title ?? doc._id) as string
    const hits: string[] = []

    for (const [where, text] of passages(doc)) {
      for (const cand of candidates(text)) {
        const want = canonical.get(cand.key)
        if (!want) continue
        if (cand.raw === want) continue
        // No exemption for a document naming itself. An earlier version had
        // one, and it hid the worst cases: after the Bee’s Knees was renamed,
        // its own description still read "The Bee's Knees is a gin sour" and
        // this audit reported zero drift. A page discussing itself should be
        // the most consistent, not the least.
        // A bracketed suffix disambiguates two documents rather than naming
        // the drink: "Vietnamese Iced Coffee Cocktail" is correct in a
        // sentence and must not acquire "(Cocktail)".
        if (want.includes('(')) continue
        // Case alone is not drift. Candidates must already be capitalised, so
        // the only thing that can differ is a leading article or connector,
        // and "the Old Standard" mid-sentence is correct English.
        if (cand.raw.toLowerCase() === want.toLowerCase()) continue
        hits.push(`   [${where}] "${cand.raw}"  ->  "${want}"`)
        byName.set(want, (byName.get(want) ?? 0) + 1)
      }
    }

    if (!hits.length) continue
    pages++
    findings += hits.length
    console.log(`\n${label}  (${doc._type})`)
    // The same mention often appears in several overlapping windows; one line
    // per distinct finding is what a human needs.
    for (const h of [...new Set(hits)]) console.log(h)
  }

  console.log(`\n\nPROSE DRIFT: ${findings} mention(s) across ${pages} page(s).`)
  if (byName.size) {
    console.log('\nMost-drifted names:')
    for (const [name, n] of [...byName].sort((a, b) => b[1] - a[1]).slice(0, 15)) {
      console.log(`  ${n.toString().padStart(4)}  ${name}`)
    }
  }
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
