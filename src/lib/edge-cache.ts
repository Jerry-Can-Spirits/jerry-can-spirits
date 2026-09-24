// The key the Worker's edge cache stores a page under.
//
// It carries the build id, because the HTML in that cache names the hashed
// stylesheets and scripts of the build that produced it. Keyed on the URL
// alone, as it was until 24 Sep 2026, a deploy left the cache holding a page
// pointing at assets the new deploy had already deleted: visitors were served
// the homepage with its stylesheet 404ing, so it rendered with no CSS at all
// until the entry aged out. A new build now simply misses and fills again.
//
// Lives here rather than in cloudflare-worker-entry.mjs so it can be tested;
// the entry imports it.

export interface VersionMetadata {
  id?: string
}

/**
 * Which deploy this is.
 *
 * The version metadata binding is Cloudflare's own answer and changes on every
 * deploy. OPEN_NEXT_BUILD_ID is the fallback: OpenNext sets it on the worker
 * module the entry imports, so it is in place before any request is served.
 * The last fallback only costs the stale window we already had, and cannot mix
 * builds, because every key within one deploy resolves the same way.
 */
export function buildId(env?: { CF_VERSION_METADATA?: VersionMetadata }): string {
  const fromBinding = env?.CF_VERSION_METADATA?.id
  if (fromBinding) return fromBinding
  const fromOpenNext =
    typeof process !== 'undefined' ? process.env?.OPEN_NEXT_BUILD_ID : undefined
  return fromOpenNext || 'nobuildid'
}

/**
 * A same-origin URL to store this page under. The Cache API needs a Request,
 * and namespacing the path is the standard way to key on something the real
 * URL does not carry.
 */
export function edgeCacheKeyUrl(
  url: { pathname: string; search: string; origin: string },
  env?: { CF_VERSION_METADATA?: VersionMetadata },
): string {
  return new URL(`/__edge/${buildId(env)}${url.pathname}${url.search}`, url.origin).toString()
}
