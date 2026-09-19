import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";

// Without an incremental cache, ISR regenerations have nowhere to be stored:
// every request to a page past its revalidate window pays a full origin
// render (worker start + Sanity queries), which Ahrefs measured at 2-3s TTFB
// on long-tail Field Manual pages. R2 stores regenerated pages; the regional
// cache keeps reads fast; interception serves cached HTML without invoking
// the Next server at all.
//
// The queue is what turns a stale hit into a regeneration. `queue: "direct"`
// (the adapter's dev queue, which its own build log says is not for
// production) revalidates by fetching the page's public URL, and that request
// leaves through the Cloudflare zone, where the bot challenge stops it. The
// result, measured 19 Sep 2026: every ISR page served STALE forever and only
// a deploy ever refreshed anything. The memory queue makes the same request
// through the WORKER_SELF_REFERENCE service binding declared in
// wrangler.jsonc, straight into this Worker, so it reaches the Next server
// and the regenerated page is written back to R2.
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, { mode: "long-lived" }),
  queue: memoryQueue,
  enableCacheInterception: true,
});
