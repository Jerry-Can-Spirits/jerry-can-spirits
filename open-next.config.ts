import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import memoryQueue from "@opennextjs/cloudflare/overrides/queue/memory-queue";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

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
//
// The tag cache is what makes on-demand revalidation real. Without one,
// revalidatePath and revalidateTag are no-ops on this adapter, so the Sanity
// and Shopify webhooks (src/app/api/webhooks/*) returned 200 and refreshed
// nothing; a publish waited for the hourly window. The D1 next-mode tag
// cache records each revalidation in a `revalidations` table, and every
// cache hit checks it, so a webhook-triggered path serves fresh on the next
// request. It binds as NEXT_TAG_CACHE_D1 to the existing database (a second
// binding on the same D1, see wrangler.jsonc); the deploy's populateCache
// step creates the table if it is missing.
export default defineCloudflareConfig({
  incrementalCache: withRegionalCache(r2IncrementalCache, { mode: "long-lived" }),
  tagCache: d1NextTagCache,
  queue: memoryQueue,
  enableCacheInterception: true,
});
