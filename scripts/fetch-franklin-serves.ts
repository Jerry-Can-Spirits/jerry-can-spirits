/**
 * Pull Franklin & Sons' published serves from their recipe pages.
 *
 * WHY IT PARSES HTML WHEN THE FEVER-TREE ONE DID NOT. Fever-Tree publish
 * schema.org Recipe JSON-LD and that script reads it as published. Franklin &
 * Sons publish no Recipe node at all — their pages carry WebPage, ImageObject,
 * BreadcrumbList and WebSite, and the recipe itself exists only as markup. So
 * this reads the markup, which is a weaker position and worth being honest
 * about.
 *
 * WHAT MAKES IT TRACTABLE ANYWAY. The markup is consistent and specifically
 * classed: `ul.list-ingred` holds one `<li>` per ingredient with the measure and
 * the name together in a single `.column-name`, and `ul.list-method` holds the
 * numbered steps in `.column-content`. There is none of the ambiguity that made
 * the IBA comparison unreliable through three rewrites — no measures running
 * together inside one list item, no vocabulary matching, no guessing where a
 * line ends. Each field is read from its own container or is not read at all.
 *
 * IT REPORTS RATHER THAN SKIPS. A page whose ingredient list does not parse is
 * printed as a failure with its URL, never dropped. Silent skipping is how a
 * fetch of 59 pages quietly becomes a fetch of 40 and nobody notices which 19
 * went missing.
 *
 * PERMISSION. franklinandsons.co.uk/robots.txt is `Disallow:` with nothing after
 * it, which permits everything, and the sitemap index is advertised in it. This
 * reads recipes-sitemap.xml and the pages it lists, at a request a second.
 *
 * ATTRIBUTION. These take `authority: 'brand-serve'` with the note naming
 * Franklin & Sons — the same handling as the Fever-Tree batch. The Field Manual
 * carries serves from any producer who publishes them, and no producer gets
 * exclusivity.
 *
 * This only fetches. Nothing is written to Sanity: each serve still needs a page
 * written to docs/COCKTAIL_CONTENT_STANDARD.md in our own words, through
 * scripts/create-brand-serves.ts. Their specification, our prose.
 *
 * Run: npx tsx scripts/fetch-franklin-serves.ts
 *      ...add --json to emit machine-readable output instead of a summary.
 */
import { execFileSync } from 'child_process'
import { htmlToText } from './html-text'

const SITEMAP = 'https://franklinandsons.co.uk/recipes-sitemap.xml'
const JSON_OUT = process.argv.includes('--json')

interface Serve {
  url: string
  name: string
  ingredients: string[]
  steps: string[]
}

function get(url: string): string {
  return execFileSync('curl', ['-sL', '-A', 'Mozilla/5.0', '--max-time', '30', url], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  })
}

/**
 * The text of every element with `className` inside the first `ul.className`
 * list of the given kind.
 *
 * Scoped to the list rather than searched for across the page, because "MORE
 * RECIPES" at the foot of every page carries three other drinks. A page-wide
 * search for ingredient markup would pull those in and silently attach another
 * recipe's lines to this one.
 */
function listItems(html: string, list: string, cell: string): string[] {
  const start = html.indexOf(`<ul class="${list}">`)
  if (start === -1) return []
  const end = html.indexOf('</ul>', start)
  if (end === -1) return []

  const block = html.slice(start, end)
  return [...block.matchAll(new RegExp(`<div class="column ${cell}">([\\s\\S]*?)</div>`, 'g'))]
    .map((m) => htmlToText(m[1]))
    .filter(Boolean)
}

function name(html: string): string {
  const m = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)
  return m ? htmlToText(m[1]) : ''
}

async function main() {
  const sitemap = get(SITEMAP)
  const urls = [...sitemap.matchAll(/<loc>([^<]*\/recipes\/[^<]+)<\/loc>/g)].map((m) => m[1])

  const serves: Serve[] = []
  const failed: string[] = []

  for (const url of urls) {
    const html = get(url)
    const serve: Serve = {
      url,
      name: name(html),
      ingredients: listItems(html, 'list-ingred', 'column-name'),
      steps: listItems(html, 'list-method', 'column-content'),
    }

    // A serve with no name or no ingredients has not been read, whatever else
    // came back. Reported with its URL rather than quietly dropped.
    if (!serve.name || !serve.ingredients.length) {
      failed.push(`${url} (name: ${serve.name || 'none'}, ingredients: ${serve.ingredients.length})`)
    } else {
      serves.push(serve)
    }

    await new Promise((r) => setTimeout(r, 1000))
  }

  if (JSON_OUT) {
    console.log(JSON.stringify(serves, null, 2))
    return
  }

  console.log(`${urls.length} recipe URLs in the sitemap; ${serves.length} parsed.\n`)
  for (const s of serves) {
    console.log(`  ${s.name}`)
    console.log(`    ${s.ingredients.join(' | ')}`)
    if (!s.steps.length) console.log('    NO METHOD PARSED')
  }

  if (failed.length) {
    console.log(`\n${failed.length} did not parse:`)
    failed.forEach((f) => console.log(`  ${f}`))
  }
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
