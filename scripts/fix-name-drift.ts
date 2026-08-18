/**
 * Bring cocktail names into one spelling: first in the documents that define
 * them, then in every page that mentions them.
 *
 * The repair for scripts/audit-name-drift.ts. Run the audit first; it explains
 * what drift is and why capitalisation is required to find it.
 *
 * ORDER MATTERS, and it is the whole design of this script.
 *
 * The audit found 80 drifted mentions, and most were not careless prose. They
 * were prose disagreeing with a source that disagreed with itself: 13 pages
 * wrote "Bee’s Knees" while the cocktail document said "Bee's Knees", and 12
 * wrote "Corpse Reviver No. 2" while the document said "No.2". In those cases
 * the prose was right and the canonical name was the outlier. Rewriting prose
 * to match an inconsistent source would have standardised on the worse
 * spelling and guaranteed the drift came back.
 *
 * So phase one renames the cocktail documents to the house style, and phase
 * two re-reads them and fixes whatever prose still disagrees. Renaming touches
 * `name` only. Slugs are a separate field, so no URL changes and no redirects
 * are needed.
 *
 * THE HOUSE STYLE, ruled by Dan 2026-08-17:
 *   - typographic apostrophe (’) throughout, matching the 13 names that
 *     already used it against the 4 that did not
 *   - "No. 2" with a space, which is what 12 of 14 prose mentions already wrote
 *   - Planter’s Punch takes the apostrophe it was missing; it is the
 *     historically correct name and our own prose already wrote it that way
 *
 * Dry run by default. Pass --write to execute.
 *
 * Run:  npx sanity exec scripts/fix-name-drift.ts --with-user-token
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

/**
 * Canonical renames, written out rather than derived.
 *
 * A rule that swapped every straight apostrophe for a typographic one would
 * also have to decide about Planter’s Punch, which has no apostrophe to swap,
 * and about "No.2", which is spacing rather than punctuation. Three small
 * rules with exceptions are less honest than one reviewed list.
 */
const RENAMES: Array<[string, string]> = [
  ["Bee's Knees", 'Bee’s Knees'],
  ["Don's Special Daiquiri", 'Don’s Special Daiquiri'],
  ["Horse's Neck", 'Horse’s Neck'],
  ["Witch's Brew", 'Witch’s Brew'],
  ['Planters Punch', 'Planter’s Punch'],
  ['Coronation No.1', 'Coronation No. 1'],
  ['Corpse Reviver No.1', 'Corpse Reviver No. 1'],
  ['Corpse Reviver No.2', 'Corpse Reviver No. 2'],
  ['East India No.2', 'East India No. 2'],
]

const CONNECTORS = new Set([
  'and', 'n', 'the', 'of', 'in', 'de', 'la', 'le', 'a', 'al', 'with', 'at', 'on', 'to', '&',
])

function key(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’'ʼ‘]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => (w === 'n' ? 'and' : w))
    .join(' ')
}

interface Block {
  _key?: string
  _type?: string
  children?: Array<{ _key?: string; text?: string }>
}

const MAX_WORDS = 6

/**
 * Distinct drifted spellings in one passage, longest first so replacement is safe.
 *
 * There is deliberately no exemption for a document naming itself. An earlier
 * version skipped those, reasoning that a page owned its own title; the effect
 * was that renaming the Bee’s Knees left its own description reading "The
 * Bee's Knees is a gin sour" with the old apostrophe, and the audit could not
 * see it either. A page discussing itself should be the most consistent, not
 * the least.
 */
function drifted(text: string, canonical: Map<string, string>): Array<[string, string]> {
  const tokens = text.split(/\s+/).filter(Boolean)
  const found = new Map<string, string>()
  for (let i = 0; i < tokens.length; i++) {
    for (let n = 1; n <= MAX_WORDS && i + n <= tokens.length; n++) {
      const raw = tokens
        .slice(i, i + n)
        .join(' ')
        .replace(/^[("“‘]+/, '')
        .replace(/[),.;:!?"”]+$/, '')
      if (!raw) continue
      const words = raw.split(' ')
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
      if (CONNECTORS.has(words[words.length - 1].toLowerCase())) continue
      const want = canonical.get(key(raw))
      if (!want || want === raw) continue
      // A bracketed suffix disambiguates two documents; it is not part of the
      // name in a sentence. "Vietnamese Iced Coffee Cocktail" is correct prose
      // and must not become "Vietnamese Iced Coffee (Cocktail)".
      if (want.includes('(')) continue
      // A difference of case alone is not drift. Candidates are already
      // required to be capitalised, so the only case that can differ is a
      // leading article or a connector, and "the Old Standard" mid-sentence is
      // correct English that "The Old Standard" would break.
      if (raw.toLowerCase() === want.toLowerCase()) continue
      found.set(raw, want)
    }
  }
  return [...found].sort((a, b) => b[0].length - a[0].length)
}

async function main() {
  // ---- Phase one: the documents that define the names. ----
  console.log('CANONICAL RENAMES')
  let renamed = 0
  for (const [from, to] of RENAMES) {
    const hits = await client.fetch<Array<{ _id: string; name: string }>>(
      `*[_type == "cocktail" && name == $from && !(_id in path("drafts.**"))]{ _id, name }`,
      { from }
    )
    if (!hits.length) {
      console.log(`  -- no cocktail named "${from}" (already renamed?)`)
      continue
    }
    for (const h of hits) {
      console.log(`  "${from}"  ->  "${to}"`)
      renamed++
      if (WRITE) await client.patch(h._id).set({ name: to }).commit()
    }
  }

  // Re-read after renaming so phase two measures prose against the new truth.
  const cocktails = await client.fetch<Array<{ name: string }>>(
    `*[_type == "cocktail" && defined(name)]{ name }`
  )
  const canonical = new Map<string, string>()
  for (const c of cocktails) {
    const applied = RENAMES.find(([from]) => from === c.name)
    canonical.set(key(c.name), applied ? applied[1] : c.name)
  }

  // ---- Phase two: every page that mentions them. ----
  const docs = await client.fetch<Array<Record<string, unknown>>>(
    `*[_type in ["cocktail", "ingredient", "equipment", "guide"] && !(_id in path("drafts.**"))]{
      _id, _type, name, title, description, usage, storage, note, history, professionalTip,
      topTips, tips, whatToLookFor, instructions, longDescription, faqs
    }`
  )

  console.log('\n\nPROSE FIXES')
  let edits = 0
  let pages = 0

  for (const doc of docs) {
    const label = (doc.name ?? doc.title ?? doc._id) as string
    const patch: Record<string, unknown> = {}
    const shown: string[] = []

    const consider = (path: string, value: unknown) => {
      if (typeof value !== 'string' || !value.trim()) return
      let out = value
      for (const [raw, want] of drifted(out, canonical)) {
        out = out.split(raw).join(want)
        shown.push(`   [${path}] "${raw}" -> "${want}"`)
      }
      if (out !== value) {
        patch[path] = out
        edits++
      }
    }

    consider('description', doc.description)
    consider('usage', doc.usage)
    consider('storage', doc.storage)
    consider('note', doc.note)
    consider('history', doc.history)
    consider('professionalTip', doc.professionalTip)

    for (const field of ['topTips', 'tips', 'whatToLookFor', 'instructions'] as const) {
      const arr = doc[field]
      if (Array.isArray(arr)) arr.forEach((v, i) => consider(`${field}[${i}]`, v))
    }

    const blocks = (doc.longDescription as Block[] | null) ?? []
    blocks.forEach((b, i) => {
      if (b?._type !== 'block') return
      ;(b.children ?? []).forEach((c, j) => {
        consider(`longDescription[${i}].children[${j}].text`, c?.text)
      })
    })

    const faqs = doc.faqs as Array<{ question?: string; answer?: string }> | null
    ;(faqs ?? []).forEach((f, i) => {
      consider(`faqs[${i}].question`, f?.question)
      consider(`faqs[${i}].answer`, f?.answer)
    })

    if (!Object.keys(patch).length) continue
    pages++
    console.log(`\n${label}  (${doc._type})`)
    for (const s of [...new Set(shown)]) console.log(s)
    if (WRITE) await client.patch(doc._id as string).set(patch).commit()
  }

  console.log(`\n\n${renamed} rename(s); ${edits} prose field(s) across ${pages} page(s).`)
  console.log(WRITE ? 'WRITTEN.' : 'DRY RUN. Nothing written. Pass --write to execute.')
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
