/**
 * Retire "bourbon oak for maturation" from Sanity content.
 *
 * The standing ingredient formulation was "seven real spices, two natural
 * sweeteners, and bourbon oak for maturation". The oak is chips macerated with
 * the botanicals, not a cask the spirit sits in, so "for maturation" was the
 * inaccurate part of an otherwise approved sentence. The approved form is now
 * "seven real spices, two natural sweeteners, and bourbon oak".
 *
 * The code occurrences were replaced directly. These three are in Sanity and
 * were found only by scanning every field of all 1,423 documents rather than
 * the fields anyone thought to name — the same lesson as the media kit, one
 * layer further out.
 *
 * Dry run by default. Pass --write to execute.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

const OLD = 'bourbon oak for maturation'
const NEW = 'bourbon oak'

interface Target {
  query: string
  field: string
  label: string
}

const TARGETS: Target[] = [
  {
    query: `*[_type=="guide" && slug.current=="botanicals-behind-expedition-spiced-rum"][0]`,
    field: 'metaDescription',
    label: 'guide/botanicals-behind-expedition-spiced-rum',
  },
  {
    query: `*[_type=="ingredient" && slug.current=="jerry-can-spirits-expedition-spiced-rum"][0]`,
    field: 'productionMethod',
    label: 'ingredient/jerry-can-spirits-expedition-spiced-rum',
  },
]

async function main() {
  console.log(WRITE ? '=== WRITE MODE ===\n' : '=== DRY RUN — pass --write to execute ===\n')

  let planned = 0
  const patches: Array<{ id: string; field: string; value: string; label: string }> = []

  for (const t of TARGETS) {
    const doc = (await client.fetch(`${t.query}{ _id, "v": ${t.field} }`)) as { _id: string; v?: string } | null
    if (!doc) {
      console.log(`  ABORT — ${t.label} not found`)
      process.exit(1)
    }
    if (!doc.v?.includes(OLD)) {
      console.log(`  ${t.label}.${t.field}: already clean`)
      continue
    }
    const updated = doc.v.split(OLD).join(NEW)
    console.log(`${t.label}`)
    console.log(`  field: ${t.field}`)
    console.log(`  after: …${updated.slice(Math.max(0, updated.indexOf(NEW) - 60), updated.indexOf(NEW) + 20)}…\n`)
    patches.push({ id: doc._id, field: t.field, value: updated, label: t.label })
    planned++
  }

  // The product FAQ is an array entry, so it is patched by key rather than by
  // field name.
  const prod = (await client.fetch(
    `*[_type=="product" && slug.current=="expedition-spiced-rum"][0]{ _id, faqs[]{_key, question, answer} }`
  )) as { _id: string; faqs?: Array<{ _key: string; question: string; answer: string }> } | null

  const faqHits = (prod?.faqs ?? []).filter((f) => f.answer?.includes(OLD))
  for (const f of faqHits) {
    console.log(`product/expedition-spiced-rum`)
    console.log(`  faq: ${f.question}`)
    console.log(`  after: …${f.answer.split(OLD).join(NEW).slice(-90)}…\n`)
    planned++
  }

  console.log(`${planned} field(s) ${WRITE ? 'written' : 'planned'}`)
  if (!WRITE) return

  for (const p of patches) {
    await client.patch(p.id).set({ [p.field]: p.value }).commit()
  }
  for (const f of faqHits) {
    await client
      .patch(prod!._id)
      .set({ [`faqs[_key=="${f._key}"].answer`]: f.answer.split(OLD).join(NEW) })
      .commit()
  }

  // Re-read rather than trusting the writes: scan every document again.
  const remaining = (await client.fetch(
    `count(*[_type in ["guide","ingredient","product"] && (
       metaDescription match "*oak for maturation*" ||
       productionMethod match "*oak for maturation*" ||
       count(faqs[answer match "*oak for maturation*"]) > 0
     )])`
  )) as number
  console.log(
    remaining === 0
      ? '\n  verified: the retired formulation is gone from Sanity'
      : `\n  ${remaining} document(s) still carry it`
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
