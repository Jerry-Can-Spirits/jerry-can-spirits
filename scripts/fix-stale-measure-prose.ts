/**
 * Restate 22ml in prose after the recipes were repaired to 22.5ml.
 *
 * scripts/fix-truncated-measures.ts corrected 66 recipe lines from 22ml to the
 * 22.5ml that three quarters of an ounce actually converts to. It changed
 * ingredients[].amount and nothing else, which left every sentence quoting
 * those numbers behind: 35 mentions across roughly 25 pages, saying 22ml above
 * a recipe line pouring 22.5. The Poet's Dream read "Twenty-two millilitres is
 * the point and it is not a typo", which by then was exactly wrong.
 *
 * That is the lesson worth keeping more than the script: repairing a measure is
 * not finished when the recipe is right, because prose quotes measures and
 * nothing links the two.
 *
 * THE GUARD. A page is only rewritten when its own recipe contains a 22.5ml
 * line. A mention of 22ml on a page that pours no 22.5 is either about another
 * drink or about a measure nobody repaired, and substituting there would invent
 * a number rather than correct one. Those are reported for a human instead.
 *
 * Sentences naming another cocktail are left alone for the same reason. "the
 * 22ml used in the Grateful Dead" is a claim about the Grateful Dead, and it is
 * only correct to change it once that page has been checked.
 *
 * Dry run by default. Pass --write to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

const DIGITS = /\b22\s*ml\b/g
const WORDS = /\btwenty-two millilitres\b/gi

interface Span {
  _key?: string
  text?: string
}
interface Block {
  _key?: string
  _type?: string
  style?: string
  children?: Span[]
}
interface Faq {
  _key?: string
  question?: string
  answer?: string
}
interface Doc {
  _id: string
  name: string
  description: string | null
  note: string | null
  longDescription: Block[] | null
  faqs: Faq[] | null
  ingredients: Array<{ amount?: string }> | null
}

const norm = (s: string) => s.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim()

/**
 * Deliberately not DIGITS.test(). A global regex carries lastIndex between
 * calls, so testing the same pattern repeatedly returns false every other time
 * and skips real matches. The first run of this script missed the Jack Rose
 * and half of Between the Sheets exactly that way.
 */
const STALE = /\b(?:22\s*ml|twenty-two millilitres)\b/i
const hasStale = (s: string | null | undefined) => Boolean(s) && STALE.test(s as string)

/** Both spellings, matching the register each was written in. */
function restate(text: string): string {
  return text.replace(DIGITS, '22.5ml').replace(WORDS, 'twenty-two and a half millilitres')
}

async function main() {
  const docs = await client.fetch<Doc[]>(
    `*[_type == "cocktail" && !(_id in path("drafts.**"))]{
      _id, name, description, note, longDescription, faqs, ingredients[]{ amount }
    } | order(name asc)`
  )
  const names = docs.map((d) => norm(d.name)).filter((n) => n.length >= 5)

  const planned: Array<{ doc: Doc; patches: Record<string, unknown>; shown: string[] }> = []
  const skipped: string[] = []
  let edits = 0

  for (const doc of docs) {
    const pours225 = (doc.ingredients ?? []).some((i) => /^22\.5\s*ml\b/i.test((i.amount ?? '').trim()))
    const others = names.filter((n) => n !== norm(doc.name))

    // A sentence naming another drink is a claim about that drink, so it is
    // left as written. The test has to be per sentence rather than per field:
    // checking the whole field means one incidental mention anywhere in a
    // description protects every other sentence in it, and the first version of
    // this script skipped ten pages that way.
    const namesOther = (sentence: string) => {
      const lower = norm(sentence)
      return others.some((n) => lower.includes(n))
    }

    /** Rewrite only the sentences that are safe, and report what was left. */
    const restateSafely = (label: string, text: string): { out: string; held: number } => {
      let held = 0
      const out = text
        .split(/(?<=[.!?])(\s+)/)
        .map((part) => {
          if (!hasStale(part)) return part
          if (namesOther(part)) {
            held++
            skipped.push(`  ${doc.name} [${label}]: "${part.trim().slice(0, 80)}" names another cocktail`)
            return part
          }
          return restate(part)
        })
        .join('')
      return { out, held }
    }

    const patches: Record<string, unknown> = {}
    const shown: string[] = []

    const consider = (label: string, path: string, text: string | null | undefined) => {
      if (!text || !hasStale(text)) return
      if (!pours225) {
        skipped.push(`  ${doc.name} [${label}]: no 22.5ml line on this page`)
        return
      }
      const { out } = restateSafely(label, text)
      if (out === text) return
      patches[path] = out
      shown.push(`   [${label}] ${out.slice(0, 120)}`)
      edits++
    }

    consider('description', 'description', doc.description)
    consider('expert tip', 'note', doc.note)
    ;(doc.longDescription ?? []).forEach((b, i) => {
      if (b?._type !== 'block') return
      ;(b.children ?? []).forEach((c, j) => {
        consider(`section block ${i}`, `longDescription[${i}].children[${j}].text`, c.text)
      })
    })
    ;(doc.faqs ?? []).forEach((f, i) => {
      consider(`FAQ ${i + 1}`, `faqs[${i}].answer`, f.answer)
    })

    if (Object.keys(patches).length) planned.push({ doc, patches, shown })
  }

  for (const p of planned) {
    console.log(`\n${p.doc.name}`)
    for (const s of p.shown) console.log(s)
  }

  if (skipped.length) {
    console.log(`\n\nLEFT FOR A HUMAN (${skipped.length}):`)
    for (const s of skipped) console.log(s)
  }

  console.log(`\n${edits} edit(s) across ${planned.length} page(s).`)

  if (!WRITE) {
    console.log('DRY RUN. Nothing written. Pass --write to execute.')
    return
  }
  for (const p of planned) await client.patch(p.doc._id).set(p.patches).commit()
  console.log('WRITTEN.')
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
