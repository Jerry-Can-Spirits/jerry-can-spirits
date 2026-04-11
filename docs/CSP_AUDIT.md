# Content Security Policy — Audit Notes

## What CSP Does

A Content Security Policy is an HTTP response header that tells the browser which sources are allowed to load resources. Each directive controls a specific resource type. If a resource doesn't match the policy, the browser blocks it.

Example header:
```
Content-Security-Policy: frame-ancestors 'none'; default-src 'self'; script-src '*://*.example.com:*'
```

- `frame-ancestors 'none'` — page cannot be embedded in any iframe (replaces X-Frame-Options)
- `default-src 'self'` — fallback: all resource types load only from the current origin
- `script-src '*://*.example.com:*'` — overrides default for scripts: any subdomain of example.com on any port

On this site, the CSP is set in `next.config.ts` `headers()` — the only location that works on the OpenNext + Cloudflare Workers runtime. See below for why.

---

## Architecture Constraint

This site deploys to **Cloudflare Workers** via `@opennextjs/cloudflare`. This imposes hard limits on where and how CSP can be set:

| Location | Works? | Notes |
|---|---|---|
| `next.config.ts` `headers()` | **Yes** | The only confirmed working location |
| `middleware.ts` `response.headers.set()` | No | Headers set here do not reach the browser on this runtime |
| `public/_headers` | No for CSP | Cloudflare enforces a 2000-character line limit; our CSP exceeds it |

---

## Finding 1: `unsafe-inline` in `script-src`

### What it means

`'unsafe-inline'` in `script-src` allows any inline `<script>` tag or event handler (`onclick`, `onload`, etc.) to execute. This is the primary XSS vector CSP is designed to prevent.

### What was investigated (April 2026)

Three approaches to replace `'unsafe-inline'` with nonces or hashes were attempted and all failed:

**Nonces** (generate a random per-request token, add to CSP and matching `<script>` tags):
1. Outer Worker injects `x-nonce` header → OpenNext drops custom headers at the boundary
2. Middleware `response.headers.set('x-nonce', ...)` → doesn't reach browser on this runtime
3. Middleware `NextResponse.next({ request: { headers } })` → does not propagate to `headers()` in server components on OpenNext + Cloudflare Workers

**SHA-256 hashes** (hash known inline script content, add to CSP):
- CSP spec: when any hash or nonce appears in a `script-src` source list, `'unsafe-inline'` is automatically ignored by the browser
- Adding hashes for our 3 static inline scripts caused 29 violations from inline scripts injected at runtime by Cookiebot auto-blocking, GTM, and the Next.js framework
- Pre-hashing dynamically injected scripts is not feasible

### Current status

`'unsafe-inline'` remains. It is the realistic ceiling for this architecture.

The domain allowlist in `script-src` still limits which external scripts can execute, providing meaningful protection beyond `default-src 'self'`.

### What would be needed to remove it

Removing `'unsafe-inline'` from `script-src` on this stack would require **all** of the following:
1. Nonce propagation fixed at the OpenNext level (framework change, not in our control)
2. Cookiebot switched from auto-blocking to manual mode — auto-blocking injects inline scripts at runtime that cannot be pre-hashed
3. GTM Custom HTML tags audited and removed or replaced with non-inline equivalents
4. All `<Script strategy="...">` components with `dangerouslySetInnerHTML` replaced

---

## Finding 2: `unsafe-inline` in `style-src`

### What it means

`'unsafe-inline'` in `style-src` allows inline `<style>` blocks and `style="..."` attributes on elements. The XSS risk is lower than `script-src` — you cannot execute JavaScript directly via CSS — but CSS injection can be used for data exfiltration, UI redressing, and clickjacking.

### Current sources of inline styles on this site

- **Tailwind CSS** — class-based, no inline styles
- **Next.js** — injects `<style>` blocks for font loading and critical CSS
- **Cookiebot** — injects inline styles as part of the consent UI
- **GTM** — may inject inline styles via Custom HTML tags
- **Inline `style=` props in JSX** — present in some components (e.g. `layout.tsx` uses `style={{ paddingTop: '...' }}`)

### Current status

Not separately investigated. The same architectural constraints apply — nonces cannot propagate to style elements, and hashes would nullify `'unsafe-inline'` for styles, which would break Cookiebot's consent UI and Next.js font injection.

`'unsafe-inline'` in `style-src` is also the realistic ceiling for this stack.

### Partial mitigation available

`style-src-attr` (which covers only `style="..."` attributes, not `<style>` blocks) could potentially be tightened separately. Removing inline `style=` props from JSX and replacing with Tailwind classes would reduce the surface area, but Cookiebot and GTM would still require `'unsafe-inline'` in `style-src-elem`.

---

## Current CSP Directives (Production)

Set in `next.config.ts`. Key directives:

| Directive | Notable entries | Notes |
|---|---|---|
| `default-src` | `'self'` | Strict fallback |
| `script-src` | `'self' 'unsafe-inline'` + domain allowlist | `'unsafe-inline'` cannot be removed — see above |
| `script-src-elem` | `'self' 'unsafe-inline'` + domain allowlist | Same |
| `style-src` | `'self' 'unsafe-inline'` + Google Fonts, Klaviyo, Trustpilot, Cookiebot | `'unsafe-inline'` cannot be removed |
| `frame-ancestors` | `'none'` | Prevents iframe embedding |
| `connect-src` | Explicit allowlist | All API endpoints enumerated |
| `img-src` | `'self' data: https: blob:` | CDN images require wildcard |

---

## Accepted Risk

Both `'unsafe-inline'` findings are accepted as architectural constraints of this stack. They are not fixable without changes to OpenNext's header propagation behaviour or replacing Cookiebot's auto-blocking integration.

Severity: Low–Medium (mitigated by domain allowlist and `frame-ancestors 'none'`).

Last reviewed: April 2026.
