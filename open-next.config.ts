import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";

// Without an incremental cache, ISR regenerations have nowhere to be stored:
// every request to a page past its revalidate window pays a full origin
// render (worker start + Sanity queries), which Ahrefs measured at 2-3s TTFB
// on long-tail Field Manual pages. R2 stores regenerated pages; the regional
// cache keeps reads fast; interception serves cached HTML without invoking
// the Next server at all.
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, { mode: "long-lived" }),
  queue: "direct",
  enableCacheInterception: true,
});
