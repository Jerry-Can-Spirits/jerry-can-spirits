/**
 * `trailingSlash: true` means every internal link has to end in "/" or Next
 * 308-redirects it. That rule is written down in CLAUDE.md and has now been
 * broken twice: the shop links were corrected in #969 and the Field Manual,
 * guides, team and trade links were never covered at all.
 *
 * A Google Search Console export on 20 August 2026 measured the cost —
 * 164 URLs indexed without a trailing slash carrying roughly 9,000 impressions,
 * every one of them redirecting, with both forms of the same page indexed
 * separately so the ranking signal was split as well as the crawl budget
 * wasted. `/field-manual/cocktails/french-connection` alone had 1,469.
 *
 * A convention nobody can check is a convention that decays, so this test asks
 * the source rather than the author. A link written without its slash fails
 * here instead of eight months later in a performance report.
 */
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) sourceFiles(path, out)
    else if (/\.(ts|tsx)$/.test(entry) && !/\.test\./.test(entry)) out.push(path)
  }
  return out
}

/** An internal link or share URL written as a template literal. */
const INTERNAL_LINK =
  /(href|url|destination|canonical)\s*[=:]\s*\{?`(\/[^`]*|https:\/\/jerrycanspirits\.co\.uk[^`]*)`/g

/**
 * Helpers that return a slash-terminated path already, so a template ending in
 * a call to one is correct. Keyed on the function name rather than the file, so
 * a helper that stops terminating its output fails its own tests rather than
 * silently excusing every caller here.
 */
const RETURNS_TERMINATED_PATH = /\$\{(canonicalFor|facetPath)\([^}]*\)\}$/

describe('trailingSlash convention', () => {
  it('every internal link template literal ends in a slash', () => {
    const offenders: string[] = []

    for (const file of sourceFiles('src')) {
      const source = readFileSync(file, 'utf8')
      let match: RegExpExecArray | null
      INTERNAL_LINK.lastIndex = 0
      while ((match = INTERNAL_LINK.exec(source))) {
        const url = match[2]
        // A query string or fragment carries its own terminator.
        if (url.endsWith('/') || /[?#]/.test(url)) continue
        if (RETURNS_TERMINATED_PATH.test(url)) continue
        const line = source.slice(0, match.index).split('\n').length
        offenders.push(`${file.split('\\').join('/')}:${line}  ${url}`)
      }
    }

    expect(offenders, `Add the trailing slash; each of these 308-redirects:\n${offenders.join('\n')}`).toEqual([])
  })
})
