# OpenNext Migration Plan

**Created:** 2025-02-05
**Status:** Planned (waiting a few weeks before execution)
**Priority:** Medium
**Estimated effort:** 2-3 hours

---

## Background

Cloudflare has deprecated `@cloudflare/next-on-pages` in favour of OpenNext (`@opennextjs/cloudflare`). The current setup works but will stop receiving updates.

**Current stack:**
- `@cloudflare/next-on-pages@1.13.16`
- Edge Runtime on 15 files
- 3 API routes using `getRequestContext()` for Cloudflare bindings
- KV namespace for cocktail ratings
- Middleware for bot detection

---

## Migration Steps

### Phase 1: Preparation

- [ ] Create a new branch: `feat/opennext-migration`
- [ ] Back up current wrangler.toml

### Phase 2: Package Changes

```bash
# Remove old package
npm uninstall @cloudflare/next-on-pages

# Install OpenNext
npm install @opennextjs/cloudflare@latest
npm install --save-dev wrangler@latest
```

### Phase 3: Configuration Files

#### 3.1 Create `wrangler.jsonc` (replaces wrangler.toml)

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "main": ".open-next/worker.js",
  "name": "jerry-can-spirits",
  "compatibility_date": "2024-12-30",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  },
  "kv_namespaces": [
    {
      "binding": "COCKTAIL_RATINGS",
      "id": "YOUR_KV_NAMESPACE_ID",
      "preview_id": "YOUR_PREVIEW_KV_NAMESPACE_ID"
    }
  ],
  "vars": {
    // Add any env vars needed
  }
}
```

#### 3.2 Create `open-next.config.ts`

```typescript
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Add incremental cache config if needed
});
```

#### 3.3 Create `.dev.vars`

```
NEXTJS_ENV=development
KLAVIYO_PRIVATE_KEY=your_dev_key
```

#### 3.4 Update `.gitignore`

Add:
```
.open-next
.dev.vars
```

### Phase 4: Update package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
    "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
    "cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"
  }
}
```

Remove old scripts:
- `pages:build`
- `pages:deploy`
- `pages:dev`

### Phase 5: Update next.config.ts

Add OpenNext dev initialisation:

```typescript
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// At the end of the file, after export:
initOpenNextCloudflareForDev();
```

### Phase 6: Remove Edge Runtime Declarations

Remove `export const runtime = 'edge'` from these 15 files:

**API Routes:**
- `src/app/api/search/route.ts`
- `src/app/api/ratings/route.ts`
- `src/app/api/klaviyo-signup/route.ts`
- `src/app/api/contact/route.ts`

**Pages:**
- `src/app/field-manual/ingredients/[slug]/page.tsx`
- `src/app/field-manual/cocktails/[slug]/page.tsx`
- `src/app/field-manual/equipment/[slug]/page.tsx`
- `src/app/guides/[slug]/page.tsx`
- `src/app/guides/page.tsx`
- `src/app/shop/product/[handle]/page.tsx`
- `src/app/shop/clothing/page.tsx`
- `src/app/shop/drinks/page.tsx`
- `src/app/shop/barware/page.tsx`
- `src/app/sitemap.ts`
- `src/app/studio/[[...tool]]/page.tsx`

### Phase 7: Rewrite API Routes (Critical)

The 3 API routes using `getRequestContext()` need rewriting:

#### 7.1 `src/app/api/contact/route.ts`

**Before:**
```typescript
import { getRequestContext } from '@cloudflare/next-on-pages'
const { env } = getRequestContext()
const KLAVIYO_PRIVATE_KEY = env.KLAVIYO_PRIVATE_KEY
```

**After (OpenNext approach - TBD):**
```typescript
// OpenNext provides bindings via getCloudflareContext() or similar
// Check OpenNext docs for exact API at migration time
import { getCloudflareContext } from "@opennextjs/cloudflare";
const { env } = getCloudflareContext();
const KLAVIYO_PRIVATE_KEY = env.KLAVIYO_PRIVATE_KEY;
```

#### 7.2 `src/app/api/ratings/route.ts`

Same pattern - needs KV namespace access updated.

#### 7.3 `src/app/api/klaviyo-signup/route.ts`

Same pattern - needs env var access updated.

### Phase 8: Update Type Definitions

Update `src/types/cloudflare-env.d.ts` if needed for new OpenNext types.

### Phase 9: Sentry Configuration

Review and potentially update:
- `sentry.edge.config.ts` - May need to become `sentry.server.config.ts` only
- Check Sentry docs for Node.js runtime compatibility

### Phase 10: Testing

- [ ] Local dev works (`npm run dev`)
- [ ] Preview deployment works (`npm run preview`)
- [ ] All API routes function correctly
- [ ] KV ratings system works
- [ ] Middleware bot detection works
- [ ] Sanity Studio accessible
- [ ] Shop pages load products
- [ ] Contact form submits

### Phase 11: Deployment

- [ ] Deploy to preview environment first
- [ ] Run full smoke test
- [ ] Check performance metrics
- [ ] Deploy to production
- [ ] Monitor for errors

---

## Files to Modify

| File | Change |
|------|--------|
| `package.json` | Update dependencies and scripts |
| `wrangler.toml` | Delete (replaced by wrangler.jsonc) |
| `wrangler.jsonc` | Create new |
| `open-next.config.ts` | Create new |
| `.dev.vars` | Create new |
| `.gitignore` | Add .open-next, .dev.vars |
| `next.config.ts` | Add OpenNext dev init |
| `src/app/api/contact/route.ts` | Rewrite bindings access |
| `src/app/api/ratings/route.ts` | Rewrite bindings access |
| `src/app/api/klaviyo-signup/route.ts` | Rewrite bindings access |
| 15 files with `runtime = 'edge'` | Remove declarations |

---

## Rollback Plan

If migration fails:
1. Revert to previous commit
2. `npm install` to restore old packages
3. Deploy previous working version

---

## Resources

- OpenNext Cloudflare docs: https://opennext.js.org/cloudflare
- OpenNext get-started: https://opennext.js.org/cloudflare/get-started
- Migration guide: https://opennext.js.org/cloudflare/migrate

---

## Notes

- OpenNext is still evolving - check for updates before executing
- The exact API for accessing Cloudflare bindings may change
- Test thoroughly in preview before production deployment
