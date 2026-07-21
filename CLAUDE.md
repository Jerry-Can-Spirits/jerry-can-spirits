# Jerry Can Spirits — Claude Code Instructions

## About the Brand

Jerry Can Spirits is a veteran-owned British craft spirits house. Founded by two Royal Signals veterans. Bootstrapped. No investors. No shortcuts.

First expression: Expedition Spiced. Caribbean rum base. Macerated at our British partner distillery. Real ingredients. No artificial flavourings.

Price: £35 currently; RRP rises to £45 on 1 August 2026.
5% of profits support military charities.
Launch date: April 6, 2026.
Website: jerrycanspirits.co.uk

## Provenance and process claims require founder sign-off

Claims about where or how the rum is produced (distillation location, water source, molasses, sourcing, the named or unnamed producer) carry legal exposure and must not be added, changed, or restored without explicit founder sign-off. The approved framing is British, small batches, our British partner distillery, and Caribbean rum base. Do not assert a Welsh location, a specific water source, or that we use molasses (the Caribbean rum base is fermented upstream, before our process begins, so it describes work we do not do). When a task touches this class of copy, apply the copy discipline: remove a claim only where deletion leaves a clean, truthful sentence, otherwise stop and report rather than invent replacement copy. Run the grep in `docs/PROVENANCE_CHECKLIST.md` before shipping any copy change.

---

## The document set

Four documents govern work here. This file is the working contract; read the others when their territory comes up, and treat them as binding:

- `docs/VOICE.md` — voice, tone, and writing rules. **Read it before writing any customer-facing copy.** The hard rules are summarised below, but the full reference (language lists, messaging hierarchy, product facts, hooks) lives there.
- `docs/SECURITY.md` — the security baseline: headers, CSP, secrets, consent gating, disclosure. Read it before touching anything security-relevant.
- `docs/CONTRIBUTING.md` — the actual git workflow in detail.
- `docs/BRAND_GUIDELINES.md` — trademark, logo, colour, and legal usage rules.

---

## Technical Stack

- Next.js 15 (App Router) + Sanity CMS + Shopify Storefront API, deployed as a Cloudflare Worker via OpenNext (`@opennextjs/cloudflare`; see `wrangler.jsonc`, `open-next.config.ts`)
- Tailwind CSS, TypeScript. Runs on the Cloudflare Workers runtime (workerd, Node-compat; routes use `runtime = 'nodejs'`), not the Next.js Edge runtime
- Cookiebot for GDPR consent management (auto-blocking mode)
- GA4 + Google Ads via window.gtag() with Consent Mode v2
- Sentry for error tracking
- All third-party trackers are consent-gated via CookiebotOnAccept events

### Key Architecture Decisions
- Checkout is on Shopify's domain (headless) — not Next.js
- Field Manual content (cocktails, ingredients, equipment) lives in Sanity CMS
- Product FAQ is stored in Shopify metafields, not in code
- Cache headers are set in both `public/_headers` (Cloudflare edge) and `next.config.ts`
- `longDescription` portable text is rendered via `src/components/FieldManualPortableText.tsx`

---

## Git Workflow — Non-Negotiable

Trunk-based: every piece of work gets a fresh branch off up-to-date `origin/main`, ships as a PR to `main`, and merges only with CI green. Never commit directly to main; never reuse a merged branch. Full detail: `docs/CONTRIBUTING.md`.

```
git fetch origin && git checkout -b feat/description-of-work origin/main
```

---

## Coding Standards

- TypeScript throughout. No `any` unless unavoidable, use `unknown` with a cast instead.
- Do not create new files unless genuinely necessary. Prefer editing existing files.
- Do not add comments, docstrings, or type annotations to code that was not changed.
- Do not add error handling for scenarios that cannot happen.
- Do not over-engineer. The minimum complexity that solves the problem is correct.
- Tailwind classes only. No inline styles except where Tailwind cannot reach.
- Server components by default. `'use client'` only when interactivity requires it.

---

## Brand Voice — the hard rules

Measured. Grounded. Disciplined. Direct. Write like a founder who means it.

- No em-dashes in any content.
- No emojis in any content.
- No exclamation marks unless in direct quoted speech.
- No hype language, no manufactured urgency, no crowd addressing.
- No superlatives unless they can be proven.
- One CTA per piece of content. Write to one person, never a crowd.
- Short sentences. No padding. If a sentence does not add meaning, remove it.

The full voice reference — language to use and avoid, messaging hierarchy, product facts, what the brand is not, hook structure — is `docs/VOICE.md`. Read it before writing copy; do not write from this summary alone.

---

## Field Manual Content (Sanity CMS)

The Field Manual is the brand's cocktail and ingredient education hub. Three content types:

- **Cocktails** — recipe pages with structured data (Recipe schema), ratings, related guides
- **Ingredients** — detail pages with flavour profiles, recommended brands, substitutions
- **Equipment** — bar tool guides with specifications, care instructions, related cocktails

All rich editorial content goes in the `longDescription` portable text field in Sanity Studio. This renders via `FieldManualPortableText` using `next-sanity`'s `PortableText`. Use H2, H3, H4 headings — all are styled. H1 is suppressed (renders as H2 visually).

### Cocktail Keywords (JSON-LD)
The `keywords` field in each cocktail document is a `string[]`. It is fetched and merged into the Recipe structured data. Enter natural search terms, not slugs. The code also appends `name`, `family`, and `baseSpirit` automatically. Do not enter raw tag values.

### "Need the Rum?" CTA
Only renders on cocktails where `baseSpirit === 'spiced-rum'`. Intentional — it is inaccurate on non-Jerry Can cocktails.

---

## SEO Approach

- Meta titles and descriptions come from Sanity CMS fields where populated, with code fallbacks.
- Recipe JSON-LD structured data is generated on each cocktail page for Google rich results.
- Target low-competition, high-intent keywords first. See `memory/seo-keywords.md`.
- The Field Manual is the primary SEO vehicle — educational content, long-tail recipe searches.

---

## Cross-repo sessions

The sibling repo (`../pour-iq`) is granted via `additionalDirectories` in `.claude/settings.json`. The sibling's CLAUDE.md does NOT load automatically: before editing any file in the sibling repo, read its CLAUDE.md first and obey it, treating its rules as binding for any files edited there.
