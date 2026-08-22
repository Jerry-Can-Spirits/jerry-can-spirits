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

/**
 * The mixers themselves, which the serves cannot be written without.
 *
 * Nineteen of the twenty-four Franklin products named across the 59 recipes
 * have no ingredient page on this site, so they have to be created before the
 * cocktails can reference them. Writing those pages from memory would mean
 * inventing flavour claims about a real product, which is the defect that put
 * unproven process claims on our own pages earlier this year. This pulls the
 * producer's own published description instead.
 *
 * It deliberately does NOT try to read the nutrition panel. Our existing
 * Franklin tonic page cites 7.9g of sugar per 100ml, and a figure like that has
 * to come off the label rather than out of a regex over marketing copy.
 */
const PRODUCT_SITEMAP = 'https://franklinandsons.co.uk/product-sitemap.xml'

const JSON_OUT = process.argv.includes('--json')
const PRODUCTS = process.argv.includes('--products')

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

/**
 * Text that means a match has swallowed the page furniture rather than the copy.
 *
 * The first version of this took the first <p> containing "Franklin & Sons" and
 * reported 34 of 34 products read successfully. Every one of them was the site
 * navigation — "Menu Menu Our Range Tonic & Mixers Soft Drinks..." — because a
 * greedy match had run from an early paragraph straight through the header, and
 * a minimum-length check passes easily on junk that long.
 *
 * A guard that only measures length cannot tell copy from navigation. This
 * names the furniture instead, so the failure is loud.
 */
const FURNITURE = /Menu Menu|Our Range|Cocktail Finder|Newsletter|Privacy Overview|\.st0\{/

/**
 * A product's name and the producer's own description of it.
 *
 * Every one of these pages opens with a sentence of the form "Franklin & Sons
 * <product> is blended with...", so the description is the paragraph that
 * begins with the brand rather than merely mentions it somewhere.
 */
function products(): void {
  const urls = [...get(PRODUCT_SITEMAP).matchAll(/<loc>([^<]*\/product\/[^<]+)<\/loc>/g)].map((m) => m[1])
  const found: Array<{ url: string; name: string; description: string }> = []
  const thin: string[] = []

  for (const url of urls) {
    const html = get(url)
    const name = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)

    // Every <p> on the page, shortest-first matching, then the one that opens
    // with the brand. Searching for a single paragraph by regex is what let the
    // navigation through.
    const description =
      [...html.matchAll(/<p[^>]*>((?:(?!<\/?p[ >])[\s\S])*?)<\/p>/g)]
        .map((m) => htmlToText(m[1]))
        .find((text) => /^Franklin & Sons\b/.test(text) && text.length >= 80 && !FURNITURE.test(text)) ?? ''

    if (!name || !description) {
      thin.push(`${url} (name: ${name ? htmlToText(name[1]) : 'none'}, no opening description found)`)
    } else {
      found.push({ url, name: htmlToText(name[1]), description })
    }
  }

  if (JSON_OUT) {
    console.log(JSON.stringify(found, null, 2))
    return
  }

  console.log(`${urls.length} product URLs; ${found.length} with a usable description.\n`)
  found.forEach((p) => console.log(`  ${p.name}\n    ${p.description.slice(0, 200)}\n`))
  if (thin.length) {
    console.log(`${thin.length} had nothing worth reading:`)
    thin.forEach((t) => console.log(`  ${t}`))
  }
}

async function main() {
  if (PRODUCTS) return products()

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
