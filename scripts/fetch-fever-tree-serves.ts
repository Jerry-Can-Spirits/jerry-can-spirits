/**
 * Pull Fever-Tree's published serves from their own structured data.
 *
 * WHY THIS RATHER THAN COPYING BY HAND. Twenty-four branded mixer pages sit at
 * zero cocktail references after the routing fix of 21 August: nothing on the
 * site links to Fever-Tree's Aromatic Tonic or their Sicilian Lemonade, because
 * no recipe calls for a brand by name. Their own serves are the natural way to
 * populate those pages, and there are 52 of them.
 *
 * WHAT MAKES IT CLEAN. Every recipe page carries schema.org Recipe JSON-LD:
 * `recipeIngredient` as a list of measured strings and `recipeInstructions` as
 * steps. No HTML parsing, no vocabulary matching, none of the guesswork that
 * made the IBA comparison unreliable through three rewrites. The data is
 * published for machines and read as published.
 *
 * PERMISSION. fever-tree.com/robots.txt is `Allow: /` with only /admin
 * disallowed, and the sitemap is advertised in it. This reads the GB sitemap
 * and the pages it lists, at a request a second.
 *
 * ATTRIBUTION. These are somebody else's published specifications, so they take
 * `authority: 'brand'` with the note naming Fever-Tree — the same handling as
 * the Dark 'n' Stormy's Gosling spec and the Painkiller's Pusser's one. Filing
 * them as `house` would claim authorship of drinks we did not create.
 *
 * This only fetches. Nothing is written to Sanity: each serve still needs a page
 * written to docs/COCKTAIL_CONTENT_STANDARD.md in our own words. Their
 * specification, our prose.
 *
 * Run: npx tsx scripts/fetch-fever-tree-serves.ts
 *      ...add --json to emit machine-readable output instead of a summary.
 */
import { execFileSync } from 'child_process'

const SITEMAP = 'https://fever-tree.com/sitemaps/en-gb-sitemap.xml'
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

const strip = (s: string) =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&rsquo;/g, '’')
    .replace(/\s+/g, ' ')
    .trim()

/** The Recipe node from any JSON-LD block on the page. */
function recipeNode(html: string): Record<string, unknown> | null {
  for (const m of html.matchAll(
    /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
  )) {
    let parsed: unknown
    try {
      parsed = JSON.parse(m[1])
    } catch {
      continue
    }
    const nodes = Array.isArray(parsed) ? parsed : [parsed]
    for (const n of nodes) {
      const node = n as Record<string, unknown>
      if (node?.['@type'] === 'Recipe') return node
      const graph = node?.['@graph']
      if (Array.isArray(graph)) {
        const hit = graph.find((g) => (g as Record<string, unknown>)?.['@type'] === 'Recipe')
        if (hit) return hit as Record<string, unknown>
      }
    }
  }
  return null
}

function steps(node: Record<string, unknown>): string[] {
  const raw = node.recipeInstructions
  if (typeof raw === 'string') return strip(raw).split(/(?=STEP\s)/i).map((s) => s.trim()).filter(Boolean)
  if (!Array.isArray(raw)) return []
  return raw
    .map((s) => (typeof s === 'string' ? s : ((s as Record<string, unknown>)?.text as string) ?? ''))
    .map(strip)
    .filter(Boolean)
}

async function main() {
  const sitemap = get(SITEMAP)
  const urls = [...sitemap.matchAll(/<loc>([^<]*\/cocktails\/[^<]+)<\/loc>/g)].map((m) => m[1])
  const serves: Serve[] = []
  const skipped: string[] = []

  for (const url of urls) {
    const node = recipeNode(get(url))
    if (!node) {
      skipped.push(url)
      continue
    }
    serves.push({
      url,
      name: strip(String(node.name ?? '')),
      ingredients: (node.recipeIngredient as string[] | undefined)?.map(strip) ?? [],
      steps: steps(node),
    })
    await new Promise((r) => setTimeout(r, 1000))
  }

  if (JSON_OUT) {
    console.log(JSON.stringify(serves, null, 2))
    return
  }

  console.log(`${urls.length} serve URLs in the GB sitemap; ${serves.length} carry Recipe structured data.\n`)
  for (const s of serves) {
    console.log(`  ${s.name}`)
    console.log(`    ${s.ingredients.join(' | ')}`)
  }
  if (skipped.length) {
    console.log(`\n${skipped.length} had no Recipe node:`)
    skipped.forEach((u) => console.log(`  ${u}`))
  }
}

main().catch((e) => {
  console.error(e.message ?? e)
  process.exit(1)
})
