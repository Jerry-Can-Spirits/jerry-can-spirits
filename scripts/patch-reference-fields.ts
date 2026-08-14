/**
 * Patch named fields on an ingredient or equipment page, leaving the rest alone.
 *
 * The counterpart to scripts/patch-cocktail-fields.ts, which has carried every
 * cocktail copy pass and has no equivalent on the reference side. 282 of 298
 * ingredient pages and all 72 equipment pages miss at least one band of the
 * standard, and single-purpose fix scripts cannot carry a pass that size.
 *
 * Everything is addressed by content rather than by index: FAQ answers by their
 * existing question, section bodies by their existing heading. An address that
 * does not match throws, so a page that has moved underneath the patch fails
 * loudly instead of writing nothing — the failure mode that let the Clover Club
 * ship an instruction naming an ingredient it no longer had.
 *
 * The dry run prints the bands from scripts/audit-reference-standard.ts, any
 * self-reference, and any breach of the docs/VOICE.md hard rules, so a page
 * cannot pass review by being long enough while writing about itself or in the
 * wrong voice.
 *
 * Transient. Reset with `git checkout -- scripts/patch-reference-fields.ts`.
 *
 * Run:  npx sanity exec scripts/patch-reference-fields.ts --with-user-token -- --batch=1
 *       ...add --write to execute.
 */
import { getCliClient } from 'sanity/cli'
import { selfReferences } from './self-reference'
import { voiceBreaches, voiceReviews } from './voice-rules'

const client = getCliClient()
const WRITE = process.argv.includes('--write')
const BATCH = Number(process.argv.find((a) => a.startsWith('--batch='))?.split('=')[1] ?? '1')

interface Patch {
  /** Document id. */
  id: string
  name: string
  description?: string
  usage?: string
  storage?: string
  /** Ingredients call these top tips; equipment calls them tips. */
  topTips?: string[]
  tips?: string[]
  /**
   * Replaces the whole long description with [heading, body] sections.
   *
   * For pages with nothing to address by heading. All 72 equipment pages carry
   * two or three unheaded paragraphs and no h2 at all, so `sections` has no
   * anchor to work from and `addSections` would leave the old body stranded
   * above the new ones. Rebuilding is the honest operation there.
   *
   * Also clears the empty trailing blocks several equipment pages carry.
   */
  longDescription?: Array<[string, string]>
  /** Existing section heading -> replacement body. Paragraphs split on blank lines. */
  sections?: Record<string, string>
  /** Existing section heading -> replacement heading, applied after `sections`. */
  sectionHeadings?: Record<string, string>
  /** New [heading, body] sections appended to the long description. */
  addSections?: Array<[string, string]>
  /** Existing FAQ question -> replacement answer. */
  faqAnswers?: Record<string, string>
  /** Existing FAQ question -> replacement question, applied after faqAnswers. */
  faqQuestions?: Record<string, string>
  /** New [question, answer] pairs appended to the existing FAQs. */
  addFaqs?: Array<[string, string]>
  /** Ingredients only. Replaces the whole object. */
  flavorProfile?: { primary: string[]; strength: string; tasting: string }
}

const BATCHES: Record<number, Patch[]> = {
  1: [],
}

const key = (id: string, p: string, i: number) =>
  `${id.replace(/[^a-z0-9]/gi, '').slice(-8)}${p}${String(i).padStart(2, '0')}`
const words = (s: string | null | undefined) => (s ? s.trim().split(/\s+/).filter(Boolean).length : 0)

/** "em-dash ×6" rather than six identical lines. */
const tally = (hits: string[]) => {
  const counts = new Map<string, number>()
  for (const h of hits) counts.set(h, (counts.get(h) ?? 0) + 1)
  return [...counts].map(([h, n]) => (n > 1 ? `${h} ×${n}` : h))
}

interface Span { _key: string; _type: string; text?: string; marks?: string[] }
interface Block { _key: string; _type: string; style?: string; children?: Span[]; markDefs?: unknown[] }
interface Faq { _key: string; _type?: string; question?: string; answer?: string }
interface Doc {
  _id: string
  _type: string
  name: string
  description: string | null
  usage: string | null
  storage: string | null
  longDescription: Block[] | null
  faqs: Faq[] | null
}

const blockText = (b: Block[]) =>
  b.filter((x) => x._type === 'block').map((x) => (x.children ?? []).map((c) => c.text ?? '').join('')).join(' ')

function bodyBlocks(id: string, tag: string, body: string): Block[] {
  return body.split(/\n\s*\n/).map((para, j) => ({
    _key: key(id, `${tag}p`, j),
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [{ _key: key(id, `${tag}s`, j), _type: 'span', text: para.trim(), marks: [] }],
  }))
}

async function apply(p: Patch) {
  const doc = await client.fetch<Doc | null>(
    `*[_id == $id][0]{ _id, _type, name, description, usage, storage, longDescription, faqs }`,
    { id: p.id }
  )
  if (!doc) throw new Error(`${p.name}: no document with id ${p.id}`)
  if (doc._id.startsWith('drafts.')) throw new Error(`${p.name}: ${p.id} is a draft`)

  const set: Record<string, unknown> = {}
  if (p.description !== undefined) set.description = p.description
  if (p.usage !== undefined) set.usage = p.usage
  if (p.storage !== undefined) set.storage = p.storage
  if (p.topTips !== undefined) set.topTips = p.topTips
  if (p.tips !== undefined) set.tips = p.tips
  if (p.flavorProfile !== undefined) set.flavorProfile = p.flavorProfile

  // Long description: replace bodies by heading, rename headings, append new
  // sections. Rebuilt as a whole array because a heading's body is a run of
  // sibling blocks rather than one addressable field.
  let blocks = (doc.longDescription ?? []).map((b) => ({ ...b }))

  if (p.longDescription) {
    if (p.sections || p.sectionHeadings || p.addSections) {
      throw new Error(`${p.name}: longDescription replaces the body, so it cannot be combined with sections`)
    }
    blocks = p.longDescription.flatMap(([heading, body], i) => [
      {
        _key: key(p.id, 'lh', i),
        _type: 'block',
        style: 'h2',
        markDefs: [],
        children: [{ _key: key(p.id, 'lhs', i), _type: 'span', text: heading, marks: [] }],
      } as Block,
      ...bodyBlocks(p.id, `l${i}`, body),
    ])
    set.longDescription = blocks
  }

  if (p.sections || p.sectionHeadings || p.addSections) {
    const headingIndex = (heading: string) => {
      const i = blocks.findIndex(
        (b) => /^h\d$/.test(b.style ?? '') && (b.children ?? []).map((c) => c.text ?? '').join('') === heading
      )
      if (i === -1) throw new Error(`${p.name}: no section headed "${heading}"`)
      return i
    }

    for (const [heading, body] of Object.entries(p.sections ?? {})) {
      const start = headingIndex(heading)
      let end = start + 1
      while (end < blocks.length && !/^h\d$/.test(blocks[end].style ?? '')) end++
      blocks.splice(start + 1, end - start - 1, ...bodyBlocks(p.id, `s${start}`, body))
    }

    // Headings last, so a `sections` entry can still address the old title.
    for (const [from, to] of Object.entries(p.sectionHeadings ?? {})) {
      const i = headingIndex(from)
      blocks[i] = { ...blocks[i], children: [{ _key: key(p.id, 'rh', i), _type: 'span', text: to, marks: [] }] }
    }

    for (const [i, [heading, body]] of (p.addSections ?? []).entries()) {
      blocks.push({
        _key: key(p.id, 'nh', i),
        _type: 'block',
        style: 'h2',
        markDefs: [],
        children: [{ _key: key(p.id, 'nhs', i), _type: 'span', text: heading, marks: [] }],
      })
      blocks.push(...bodyBlocks(p.id, `n${i}`, body))
    }
    set.longDescription = blocks
  }

  let faqs = (doc.faqs ?? []).map((f) => ({ ...f }))
  if (p.faqAnswers || p.faqQuestions || p.addFaqs) {
    for (const [question, answer] of Object.entries(p.faqAnswers ?? {})) {
      const hit = faqs.find((f) => f.question === question)
      if (!hit) throw new Error(`${p.name}: no FAQ asking "${question}"`)
      hit.answer = answer
    }
    for (const [from, to] of Object.entries(p.faqQuestions ?? {})) {
      const hit = faqs.find((f) => f.question === from)
      if (!hit) throw new Error(`${p.name}: no FAQ asking "${from}"`)
      hit.question = to
    }
    faqs = [
      ...faqs,
      ...(p.addFaqs ?? []).map(([question, answer], i) => ({
        _key: key(p.id, 'nf', i),
        _type: 'faq',
        question,
        answer,
      })),
    ]
    set.faqs = faqs
  }

  // Report against the same bands the audit uses, so a page cannot be written
  // to a different ruler from the one that will judge it.
  const finalDescription = p.description ?? doc.description
  const finalUsage = p.usage ?? doc.usage
  const long = words(blockText(blocks))
  const sections = blocks.filter((b) => /^h\d$/.test(b.style ?? '')).length
  const answers = faqs.map((f) => words(f.answer))

  console.log(`  ${doc.name}  (${doc._type})`)
  console.log(
    `    description ${words(finalDescription)}w | usage ${words(finalUsage)}w | long ${long}w / ${sections} sections`
  )
  console.log(`    faqs ${answers.join(', ') || 'none'}`)
  const thin = answers.filter((n) => n < 30).length
  if (thin) console.log(`    !! ${thin} FAQ answer(s) under 30 words`)
  if (long < 330) console.log(`    !! long description under band (330w)`)
  if (sections < 4) console.log(`    !! ${sections} sections, band is 4`)

  const prose = [
    finalDescription,
    finalUsage,
    p.storage ?? doc.storage,
    ...(p.topTips ?? p.tips ?? []),
    blockText(blocks),
    ...faqs.flatMap((f) => [f.question, f.answer]),
  ]
    .filter(Boolean)
    .join('\n\n')
  const self = selfReferences(prose)
  if (self.length) console.log(`    !! SELF-REFERENCE: ${self.join(' | ')}`)

  const breaches = voiceBreaches(prose)
  if (breaches.length) console.log(`    !! VOICE: ${tally(breaches).join(' | ')}`)
  const reviews = voiceReviews(prose)
  if (reviews.length) console.log(`    ?? CHECK: ${tally(reviews).join(' | ')}`)

  if (WRITE && Object.keys(set).length) await client.patch(p.id).set(set).commit()
}

async function main() {
  const batch = BATCHES[BATCH]
  if (!batch?.length) {
    console.log(`Batch ${BATCH} is empty.`)
    return
  }
  console.log(`Patch batch ${BATCH}: ${batch.length} page(s)\n`)
  for (const p of batch) await apply(p)
  console.log(WRITE ? '\nWRITTEN.' : '\nDRY RUN. Nothing written. Pass --write to execute.')
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
