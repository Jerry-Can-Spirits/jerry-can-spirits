/**
 * Remove the brand suffix from Sanity metaTitles.
 *
 * WHY. src/app/layout.tsx sets a '%s' title template with no brand suffix, and
 * says why: appending " | Jerry Can Spirits®" pushed most titles past sixty
 * characters, causing truncation and Google-rewritten titles. The homepage
 * keeps the brand through `default`.
 *
 * Twenty-one guides and one cocktail never got the memo, because their titles
 * live in Sanity rather than in a page file and the template does not reach
 * them. Ahrefs' audit caught three of them as "page and SERP titles do not
 * match" — and the mismatch is Google stripping the suffix itself:
 *
 *   page:  ABV vs Proof Explained | Jerry Can Spirits
 *   SERP:  ABV vs Proof Explained
 *
 * That is the search engine confirming the decision the layout already made.
 * Removing it locally means the title we write is the title that shows, which
 * is worth more than the twenty-odd characters it frees.
 *
 * Google appends the site name in results anyway, from the domain and
 * organisation markup. It was never ours to add.
 *
 * Run: npx sanity exec scripts/strip-brand-suffix-from-titles.ts --with-user-token
 *      ...add --write to apply.
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()
const WRITE = process.argv.includes('--write')

/** With or without the registered mark, and with a pipe or a dash. */
const SUFFIX = /\s*[|–—-]\s*Jerry Can Spirits\s*(®|®)?\s*$/

/** Below this a title stops earning its place in a result. */
const MIN = 25

/**
 * Titles that are too thin once the brand comes off, rewritten rather than
 * trimmed.
 *
 * Stripping "ABV vs Proof Explained | Jerry Can Spirits" leaves 22 characters,
 * which trades one Ahrefs finding for another — the audit flagged ten titles
 * under thirty this same week. The brand was padding these to length rather
 * than adding anything, and the fix is to say more about the page.
 */
const REWRITES: Record<string, string> = {
  'abv-vs-proof-explained': 'ABV vs Proof Explained: How Spirit Strength Works',
  'hampden-estate': "Hampden Estate Rum Guide: Jamaica's High-Ester House",
}

interface Row {
  _id: string
  _type: string
  slug: string
  metaTitle: string
}

async function main() {
  const rows = await client.fetch<Row[]>(
    `*[_type in ["guide","cocktail","ingredient"] && defined(metaTitle) &&
       metaTitle match "*Jerry Can Spirits*" && !(_id in path("drafts.**"))]{
       _id, _type, "slug": slug.current, metaTitle }`,
  )

  const changes: Array<Row & { next: string }> = []
  const skipped: string[] = []

  for (const row of rows) {
    const rewrite = REWRITES[row.slug]
    if (rewrite) {
      if (rewrite.length < MIN) {
        skipped.push(`${row.slug}: rewrite is only ${rewrite.length} chars`)
      } else {
        changes.push({ ...row, next: rewrite })
      }
      continue
    }

    const next = row.metaTitle.replace(SUFFIX, '').trim()
    if (next === row.metaTitle) {
      // The brand is inside the title rather than appended to it, which is a
      // different thing and not this script's business.
      skipped.push(`${row.slug}: brand is not a trailing suffix — "${row.metaTitle}"`)
      continue
    }
    if (next.length < MIN) {
      // Stripping would leave a title too thin to stand alone. Ahrefs has
      // already flagged ten of those this week; trading one finding for another
      // is not a fix.
      skipped.push(`${next.length} chars after stripping, too short — ${row.slug}: "${next}"`)
      continue
    }
    changes.push({ ...row, next })
  }

  console.log(`${rows.length} carry the brand; ${changes.length} to strip, ${skipped.length} left alone.\n`)
  for (const c of changes) {
    console.log(`  ${String(c.metaTitle.length).padStart(2)} -> ${String(c.next.length).padStart(2)}  ${c.next}`)
  }
  if (skipped.length) {
    console.log('\nLeft alone:')
    skipped.forEach((s) => console.log(`  ${s}`))
  }

  if (!WRITE) {
    console.log('\nDry run. Add --write to apply.')
    return
  }

  let tx = client.transaction()
  for (const c of changes) tx = tx.patch(c._id, { set: { metaTitle: c.next } })
  await tx.commit()
  console.log(`\n${changes.length} updated.`)
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
