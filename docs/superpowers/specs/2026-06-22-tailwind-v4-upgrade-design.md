# Tailwind CSS 3 → 4 Upgrade — Design

**Date:** 2026-06-22
**Branch:** `chore/tailwind-v4-upgrade` (off `origin/main` @ #775)
**Status:** Approved, ready for implementation plan

## Goal

Move the site from Tailwind CSS 3.4.19 to Tailwind 4 with no intended visual change, adopting the v4 engine, the new PostCSS plugin, and the CSS-first config idiom (retiring `tailwind.config.js`). New v4-only visual capabilities are explicitly out of scope and parked for a later pass.

## Decisions

- **Browser floor:** Accept v4's modern-browser baseline (Safari 16.4+, Chrome 111+, Firefox 128+). No older-browser fallback required.
- **Config style:** Full CSS-first. `tailwind.config.js` is deleted; the bespoke theme moves into a `@theme` block in `globals.css`.
- **Verification:** Guided manual spot-check on the dev server (no new screenshot tooling).
- **Scope discipline:** This spec is visual-parity only. Adding v4-only effects (view transitions, `@starting-style` entry animations, scroll-driven animations, new variants) is a separate follow-up, not part of this work.

## Current surface (verified)

- `tailwindcss@3.4.19`, `postcss@8.5.15`, `autoprefixer@10.5.0`, `@tailwindcss/typography@0.5.20`.
- `postcss.config.js` uses the classic `{ tailwindcss: {}, autoprefixer: {} }` form.
- `src/app/globals.css`: `@import '../styles/animations.css'`; `@tailwind base/components/utilities`; a large body of hand-written un-layered CSS (base resets, `body`, `h1–h6`, `.btn-primary`, `.cartography-background`/`.age-gate-cartography`, stockist popup, and a substantial `@media print` block scoped to `.print-region`). Four `@apply` rules, all in this file.
- `tailwind.config.js` (189 lines): custom colour scales `jerry-green`/`parchment`/`gold`; `fontFamily` serif/sans/display; a `typography.DEFAULT.css` prose override; `animation` + `keyframes` (fadeIn, slideUp, pulse-slow, bounceGentle, float, shimmer); `backdropBlur.xs`; `backgroundImage` (gradient-radial/conic, hero-pattern, card-pattern); `boxShadow` (glow, glow-sm, inner-glow, elegant); `@tailwindcss/typography` plugin.
- `src/styles/animations.css`: pure plain CSS (reveal classes, ticker/toast keyframes, reduced-motion block). No `@apply`, no directives.
- Arbitrary values in components are trivial: a few brand hex chips (`bg-[#00b67a]` etc.) and `text-[10px]`. Unaffected by the upgrade.

## Approach: codemod-led, hand-finished

Run the official codemod `npx @tailwindcss/upgrade`, which performs the mechanical bulk:

- Swaps the PostCSS plugin (`tailwindcss` + `autoprefixer` → `@tailwindcss/postcss`).
- Rewrites `@tailwind base/components/utilities` → `@import "tailwindcss"`.
- Migrates `tailwind.config.js` theme values into a `@theme` block.
- Rewrites renamed utility classes across `.tsx` files (`shadow-sm`→`shadow-xs`, `shadow`→`shadow-sm`, `outline-none`→`outline-hidden`, `blur-sm`→`blur-xs`, ring defaults, etc.).
- Injects a compatibility shim preserving v3 defaults for border colour (`gray-200` vs v4's `currentColor`) and ring (`3px blue` vs v4's `1px currentColor`).

Then hand-finish the parts the codemod cannot safely do (typography, cascade verification, plus auditing whatever the codemod produced).

## File-by-file changes

- **`postcss.config.js`** — `{ plugins: { '@tailwindcss/postcss': {} } }`. Remove `tailwindcss` and `autoprefixer`.
- **`package.json`** — remove `tailwindcss@3` and `autoprefixer`; add `tailwindcss@^4` and `@tailwindcss/postcss@^4`. Keep `@tailwindcss/typography` (0.5.x is v4-compatible). `postcss` may remain (transitive); not referenced directly after this.
- **`tailwind.config.js`** — deleted. All theme values move to `@theme` in `globals.css`.
- **`src/app/globals.css`** — `@tailwind` directives → `@import "tailwindcss"`; add `@theme` block (colours, fonts, animations+keyframes, backgroundImage, boxShadow, backdropBlur); add `@plugin "@tailwindcss/typography"`; add the prose `--tw-prose-*` variable block + link-hover rule (see below); keep the border/ring compatibility shim. All existing hand-written CSS (cartography, btn-primary, print block, base resets, dark-scheme opt-out) stays byte-for-byte unless the codemod must touch it.
- **`src/styles/animations.css`** — untouched. Its `@import` stays at the top of `globals.css`, ahead of `@import "tailwindcss"`.
- **`*.tsx`** — only the codemod's renamed-utility rewrites. Reviewed in the diff; no manual class edits expected.

## Typography conversion

The `typography.DEFAULT.css` override lives in the JS config being deleted. In v4, prose is customised via `--tw-prose-*` CSS variables. Mapping:

| v3 override | value | v4 variable |
|---|---|---|
| body | `#f1e7d0` | `--tw-prose-body` |
| h1–h4, thead text | `#fef3c7` | `--tw-prose-headings` |
| lead | `#dfc396` | `--tw-prose-lead` |
| links, code, `a code` | `#fcd34d` | `--tw-prose-links`, `--tw-prose-code` |
| strong | `#fef3c7` | `--tw-prose-bold` |
| `ul`/`ol` markers | `#d97706` | `--tw-prose-bullets`, `--tw-prose-counters` |
| hr | `#92400e` | `--tw-prose-hr` |
| blockquote text | `#dfc396` | `--tw-prose-quotes` |
| blockquote border | `#d97706` | `--tw-prose-quote-borders` |
| figcaption | `#dfc396` | `--tw-prose-captions` |
| pre text | `#f1e7d0` | `--tw-prose-pre-code` |
| pre background | `#1a442e` | `--tw-prose-pre-bg` |
| thead border | `#92400e` | `--tw-prose-th-borders` |
| tbody tr border | `#432f20` | `--tw-prose-td-borders` |

These variables are set on `.prose`. The single override with no variable equivalent is the link hover (`a:hover → #f59e0b`), implemented as a one-line rule: `.prose a:hover { color: #f59e0b }`.

**Verification target:** a Field Manual cocktail page, where `longDescription` renders through `FieldManualPortableText`/`PortableText` into prose.

## Risk areas

**Cascade / layering (primary risk).** v4 places utilities in a real CSS `@layer`, and un-layered CSS always wins over layered. The hand-written rules (`body`, `h1–h6`, `.btn-primary`, cartography, the `@media print` block) are un-layered today and were already source-ordered after `@tailwind utilities` in v3, so they already out-prioritise utilities. v4 preserves this ordering, so parity is expected — but this is the focus of the spot-check. The `.print-region` print block (which intentionally fights utilities with `!important` and attribute selectors) is the highest-consequence spot to confirm.

**Border/ring defaults.** Neutralised by the codemod's compatibility shim; the shim is kept so existing `border`/`ring` classes render identically.

**Renamed utilities.** Handled by the codemod; confirmed by reviewing the `.tsx` diff.

**Build pipeline.** Tailwind is build-time CSS only, so `next build` is the real gate. No OpenNext-runtime exposure (unlike the earlier esbuild incident). Still confirm the Cloudflare Workers build is green before merge.

## Verification plan

1. `npm run build` and type-check pass.
2. Dev server spot-check, in risk order:
   - Field Manual cocktail page (prose / typography variables).
   - A print/menu preview, e.g. a Pour IQ menu or trade sheet (print block, `.print-region`).
   - Homepage (cartography background, fade/slide animations, ticker strip).
   - A product page (buttons, shadows, gold accents).
   - A Pour IQ dashboard screen (dense UI, borders, rings).
3. Open a PR; let GitHub CI (Lint/Type/Build/CodeQL) and the Cloudflare Workers build go green before merge.

## Out of scope (follow-up backlog)

New v4-only capabilities to evaluate in a later, separate pass once the migration is stable: view transitions, `@starting-style` entry animations, scroll-driven animations, and the new `not-*` / `in-*` / `nth-*` variants. Candidate surfaces: page/route transitions, Field Manual card reveals, Pour IQ panel transitions. Not built here.

## Success criteria

- Tailwind 4 engine in use; `tailwind.config.js` removed; theme in `@theme`.
- No intended visual change across the spot-checked surfaces.
- Build, type-check, CI, and Cloudflare Workers build all green.
