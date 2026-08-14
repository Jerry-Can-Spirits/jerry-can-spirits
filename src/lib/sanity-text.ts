// Text and link extraction for Sanity documents.
//
// Two field-shape gaps have each caused a wrong answer in this repo, and both
// share a cause: a query that names the fields it reads silently returns
// nothing for anything it did not name.
//
//   1. Guide body copy lives in sections[].content (a plain string) and
//      sections[].contentRich (portable text), and again in
//      sections[].subsections[]. A pt::text() read of the string field
//      returned nothing at all, and the subsections — 68,670 words, 57% of
//      guide body copy — were in neither field and were missed entirely.
//   2. Inline links live in portable-text markDefs, so a link audit reading
//      rendered text saw 1,173 anchor phrases and none of their destinations.
//      That is how a wrong Penderyn link survived a sweep that reported clean.
//
// Two properties answer both, and the second matters more than the first:
//
//   Shape-driven, not name-driven. Fields are classified by what they are —
//   string, portable text, array, reference — so a field added to the schema
//   tomorrow is walked without anyone remembering to add it here.
//
//   Present but empty is an error, not a blank. A field that exists and holds
//   something, yet yields no text, throws. Every silent-zero failure logged on
//   this project looked exactly like an empty field, and an empty field is
//   indistinguishable from a broken read unless the two are separated.

// The one name-based rule in the module, deliberately a single entry:
// everything else is decided by shape. A slug is a machine value that would
// otherwise read as a word. Image fields are NOT listed here — they are
// recognised by shape as asset-bearing, which keeps their alt text, and alt
// text is copy.
const NON_PROSE_KEYS = new Set(['slug'])

// String fields that hold a destination rather than a sentence. These are
// extracted as links instead of text.
const LINK_KEYS = new Set(['url', 'href', 'path', 'link'])

export interface ExtractedText {
  text: string
  words: number
  // Word count contributed by each top-level field, so a field that returns
  // implausibly little is visible rather than merely absent from the total.
  byField: Record<string, number>
}

export interface ExtractedLink {
  // 'reference' for a Sanity document ref, 'href' for a literal URL or path.
  kind: 'reference' | 'href'
  value: string
  // Dotted path to the field the link came from, e.g. sections[2].contentRich.
  field: string
}

export class EmptyExtractionError extends Error {
  constructor(
    readonly path: string,
    readonly shape: string
  ) {
    super(
      `${path} is present (${shape}) but yielded no text. ` +
        `A field that exists and holds something must produce words; ` +
        `this is the signature of a read that silently returned nothing.`
    )
    this.name = 'EmptyExtractionError'
  }
}

interface PortableTextSpan {
  _type?: string
  text?: string
}

interface PortableTextBlockish {
  _type?: string
  style?: string
  children?: PortableTextSpan[]
  markDefs?: Array<Record<string, unknown>>
}

/**
 * The anchor id for a heading, derived from its text.
 *
 * Shared by FieldManualPortableText, which stamps the id onto the rendered
 * heading, and the contents rail, which links to it. Both must agree, so
 * neither owns it.
 */
export function headingSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** The plain text of one portable-text block. */
export function blockPlainText(block: { children?: PortableTextSpan[] }): string {
  return (block.children ?? []).map((c) => c.text ?? '').join('')
}

export interface ExtractedHeading {
  text: string
  slug: string
}

/** The H2 headings of a portable-text body, in document order. */
export function extractHeadings(value: unknown): ExtractedHeading[] {
  if (!Array.isArray(value)) return []
  return (value as PortableTextBlockish[])
    .filter((b) => b?._type === 'block' && b.style === 'h2')
    .map((b) => blockPlainText(b))
    .filter((text) => text.trim().length > 0)
    .map((text) => ({ text, slug: headingSlug(text) }))
}

function isPortableTextArray(value: unknown): value is PortableTextBlockish[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((b) => typeof b === 'object' && b !== null && (b as PortableTextBlockish)._type === 'block')
  )
}

// An object carrying a document reference or an uploaded asset rather than
// copy. Detected by shape so that any future reference field is handled.
function isReferenceLike(value: Record<string, unknown>): boolean {
  return typeof value._ref === 'string' || 'asset' in value
}

function countWords(text: string): number {
  const trimmed = text.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}

interface WalkResult {
  text: string[]
  links: ExtractedLink[]
}

// True when a value holds at least one string a reader could see, anywhere
// inside it. This is what separates "the field is absent, or holds no copy" —
// priceRange is two numbers, and silence about it is correct — from "the field
// holds prose and we got nothing out of it", which is the failure this module
// exists to catch. Deliberately independent of walk(): it reads the raw
// document, so it still reports the truth when walk() is the thing that broke.
function containsProse(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.some((v) => containsProse(v))
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value).some(
      ([k, v]) => !k.startsWith('_') && !NON_PROSE_KEYS.has(k) && !LINK_KEYS.has(k) && containsProse(v)
    )
  }
  return false
}

function describeShape(value: unknown): string {
  if (typeof value === 'string') return 'string'
  if (isPortableTextArray(value)) return 'portable text'
  if (Array.isArray(value)) return `array of ${value.length}`
  return 'object'
}

function walk(value: unknown, path: string, out: WalkResult): void {
  if (value === null || value === undefined) return

  // Numbers and booleans are data, not copy. Not text-bearing, so silence here
  // is correct rather than suspicious.
  if (typeof value === 'number' || typeof value === 'boolean') return

  if (typeof value === 'string') {
    if (value.trim()) out.text.push(value)
    return
  }

  if (isPortableTextArray(value)) {
    for (const block of value) {
      for (const child of block.children ?? []) {
        if (typeof child.text === 'string' && child.text.trim()) out.text.push(child.text)
      }
      // The destinations the text itself never shows.
      for (const mark of block.markDefs ?? []) {
        const ref = mark._ref ?? mark.reference
        if (typeof ref === 'string') {
          out.links.push({ kind: 'reference', value: ref, field: path })
        } else if (
          ref &&
          typeof ref === 'object' &&
          typeof (ref as Record<string, unknown>)._ref === 'string'
        ) {
          out.links.push({ kind: 'reference', value: (ref as Record<string, unknown>)._ref as string, field: path })
        }
        for (const key of LINK_KEYS) {
          const v = mark[key]
          if (typeof v === 'string' && v.trim()) out.links.push({ kind: 'href', value: v, field: path })
        }
      }
    }
    return
  }

  if (Array.isArray(value)) {
    value.forEach((item, i) => walk(item, `${path}[${i}]`, out))
    return
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>

    if (isReferenceLike(obj)) {
      if (typeof obj._ref === 'string') out.links.push({ kind: 'reference', value: obj._ref, field: path })
      const asset = obj.asset as Record<string, unknown> | undefined
      if (asset && typeof asset._ref === 'string') {
        out.links.push({ kind: 'reference', value: asset._ref, field: path })
      }
      // An alt or caption alongside an asset is still copy. Only direct
      // strings are taken: by schema convention an asset object carries flat
      // alt and caption text, never a nested prose tree. If one ever appears,
      // containsProse still sees it and the caller gets an
      // EmptyExtractionError rather than a silently dropped field — which is
      // the whole point of keeping that check independent of this walk.
      for (const [key, v] of Object.entries(obj)) {
        if (key === 'asset' || key.startsWith('_')) continue
        if (typeof v === 'string' && !LINK_KEYS.has(key)) walk(v, `${path}.${key}`, out)
      }
      return
    }

    for (const [key, v] of Object.entries(obj)) {
      if (key.startsWith('_')) continue
      if (NON_PROSE_KEYS.has(key)) continue
      if (LINK_KEYS.has(key)) {
        if (typeof v === 'string' && v.trim()) out.links.push({ kind: 'href', value: v, field: `${path}.${key}` })
        continue
      }
      walk(v, path ? `${path}.${key}` : key, out)
    }
  }
}

/**
 * Every word of copy in a document, whatever shape it is stored in.
 *
 * Throws EmptyExtractionError when a top-level field is present and holds
 * something but produces no text and no links. That case is the one this
 * module exists to catch: it is what a broken read looks like, and it is
 * otherwise indistinguishable from a field nobody filled in.
 */
export function extractText(doc: Record<string, unknown>): ExtractedText {
  const byField: Record<string, number> = {}
  const all: string[] = []

  for (const [key, value] of Object.entries(doc)) {
    if (key.startsWith('_')) continue
    if (NON_PROSE_KEYS.has(key)) continue

    const out: WalkResult = { text: [], links: [] }
    walk(value, key, out)

    const words = out.text.reduce((sum, t) => sum + countWords(t), 0)

    if (words === 0 && out.links.length === 0 && containsProse(value)) {
      throw new EmptyExtractionError(key, describeShape(value))
    }

    if (words > 0) {
      byField[key] = words
      all.push(...out.text)
    }
  }

  const text = all.join(' ').replace(/\s+/g, ' ').trim()
  return { text, words: countWords(text), byField }
}

/**
 * Every destination a document points at: portable-text markDefs, reference
 * fields, asset references, and literal url/href/path strings.
 */
export function extractLinks(doc: Record<string, unknown>): ExtractedLink[] {
  const out: WalkResult = { text: [], links: [] }

  for (const [key, value] of Object.entries(doc)) {
    if (key.startsWith('_')) continue
    walk(value, key, out)
  }

  return out.links
}
