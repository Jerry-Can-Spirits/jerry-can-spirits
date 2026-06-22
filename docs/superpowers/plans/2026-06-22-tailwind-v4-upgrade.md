# Tailwind CSS 3 → 4 Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the site from Tailwind CSS 3.4.19 to Tailwind 4 (CSS-first config, new PostCSS plugin) with no intended visual change.

**Architecture:** Run the official `@tailwindcss/upgrade` codemod to do the mechanical bulk (PostCSS plugin swap, directive rewrite, `tailwind.config.js` → `@theme`, renamed utilities, border/ring compat shim), then hand-finish the one thing the codemod cannot convert — the `@tailwindcss/typography` prose customisation — and audit every file the codemod touched. Verify by build + lint + unit tests, then a guided manual visual spot-check, then CI + Cloudflare Workers build on the PR.

**Tech Stack:** Tailwind CSS 4, `@tailwindcss/postcss`, `@tailwindcss/typography` 0.5.x, PostCSS, Next.js 15 (App Router), OpenNext Cloudflare.

**Reference spec:** `docs/superpowers/specs/2026-06-22-tailwind-v4-upgrade-design.md`

**Branch:** `chore/tailwind-v4-upgrade` (already created off `origin/main` @ #775).

**Note on task shape:** This is a config/build migration, not feature work, so most tasks verify with build/grep commands and a final visual gate rather than unit tests written first. Follow the steps in order; do not skip verifications.

---

### Task 1: Pre-flight — confirm clean starting state

**Files:** none (verification only)

- [ ] **Step 1: Confirm the branch and a clean tree**

Run:
```bash
git branch --show-current
git status --porcelain
```
Expected: branch is `chore/tailwind-v4-upgrade`; `git status --porcelain` prints nothing (clean). If the tree is dirty, stop and resolve before continuing — the codemod needs a clean tree so its changes are reviewable as a single diff.

- [ ] **Step 2: Capture the baseline — current build passes on Tailwind 3**

Run:
```bash
npm run build
```
Expected: build completes successfully ("Compiled successfully" / route list printed). This proves the pre-upgrade baseline is green so any later failure is attributable to the upgrade. If this fails, stop — the working tree is not a valid baseline.

- [ ] **Step 3: Record the current Tailwind-related versions for later comparison**

Run:
```bash
node -e "const p=require('./package.json');console.log('tailwindcss',p.devDependencies.tailwindcss,'| autoprefixer',p.devDependencies.autoprefixer,'| @tailwindcss/postcss',p.devDependencies['@tailwindcss/postcss']||'(none)')"
```
Expected: `tailwindcss ^3.4.19 | autoprefixer ^10.5.0 | @tailwindcss/postcss (none)`. No commit this task.

---

### Task 2: Run the official upgrade codemod

**Files:** the codemod will modify, at minimum: `package.json`, `package-lock.json`, `postcss.config.js`, `src/app/globals.css`, `tailwind.config.js` (likely deleted), and various `src/**/*.tsx` (renamed utilities).

- [ ] **Step 1: Run the codemod**

Run:
```bash
npx @tailwindcss/upgrade --force
```
(`--force` allows it to run even though this is not a brand-new git state; our state is clean and committed so this is safe.)

Expected: the tool reports the steps it performed (dependency upgrade, config migration, template-class migration, stylesheet migration) and finishes without an error exit. It may print warnings about classes it could not migrate — read them; they feed Task 5 and Task 9.

- [ ] **Step 2: Review the full diff before doing anything else**

Run:
```bash
git status
git --no-pager diff --stat
```
Expected: changes to `package.json`, `package-lock.json`, `postcss.config.js`, `src/app/globals.css`, a deleted `tailwind.config.js`, and some `.tsx` files. Read `git --no-pager diff -- src` for the `.tsx` changes and confirm they are only renamed utility classes (e.g. `shadow-sm`→`shadow-xs`, `outline-none`→`outline-hidden`), not structural edits. Note anything surprising for follow-up.

- [ ] **Step 3: Commit the raw codemod output as a checkpoint**

```bash
git add -A
git commit -m "chore(tailwind): run v4 upgrade codemod (raw output)"
```
Committing the raw output first means the hand-finishing in later tasks shows up as separate, reviewable diffs.

---

### Task 3: Verify and finalise `postcss.config.js`

**Files:**
- Modify: `postcss.config.js`

- [ ] **Step 1: Inspect the file**

Run:
```bash
cat postcss.config.js
```
Expected: it should reference `@tailwindcss/postcss` and no longer reference `tailwindcss` or `autoprefixer`.

- [ ] **Step 2: Ensure the contents exactly match this**

The file must read (CommonJS, matching the project's existing style):
```js
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```
If the codemod produced an equivalent but differently-formatted version (e.g. ESM `export default`), that is acceptable as long as the only plugin is `@tailwindcss/postcss`. If `autoprefixer` or `tailwindcss` still appears, remove it — v4 includes autoprefixing and the old `tailwindcss` PostCSS entry no longer exists.

- [ ] **Step 3: Commit only if you changed it**

```bash
git add postcss.config.js
git commit -m "chore(tailwind): postcss config uses @tailwindcss/postcss only"
```
If the file was already correct from the codemod, skip the commit.

---

### Task 4: Verify `package.json` dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Inspect the Tailwind-related dependencies**

Run:
```bash
node -e "const p=require('./package.json');const d={...p.dependencies,...p.devDependencies};console.log('tailwindcss',d.tailwindcss,'| @tailwindcss/postcss',d['@tailwindcss/postcss'],'| autoprefixer',d.autoprefixer||'(removed)','| @tailwindcss/typography',d['@tailwindcss/typography'])"
```
Expected: `tailwindcss` is `^4.x`, `@tailwindcss/postcss` is `^4.x`, `autoprefixer` is `(removed)`, `@tailwindcss/typography` is still `^0.5.x`.

- [ ] **Step 2: If `autoprefixer` was left behind, remove it**

Only if Step 1 shows `autoprefixer` still present:
```bash
npm uninstall autoprefixer
```
Expected: it is removed from `package.json` devDependencies. (`postcss` itself may remain as a transitive/dev dep; leave it.)

- [ ] **Step 3: Confirm a clean install resolves**

Run:
```bash
npm install
```
Expected: completes with no peer-dependency errors related to Tailwind. (npm audit findings unrelated to Tailwind are expected and out of scope — see `memory/reference_npm_audit_known_advisories.md`.)

- [ ] **Step 4: Commit if anything changed**

```bash
git add package.json package-lock.json
git commit -m "chore(tailwind): drop autoprefixer, pin tailwindcss v4 deps"
```
Skip if nothing changed beyond Task 2's checkpoint.

---

### Task 5: Verify `globals.css` directives, import order, and `@theme` completeness

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Confirm the directive rewrite and import order**

Run:
```bash
grep -nE "@import|@tailwind|@theme|@plugin" src/app/globals.css | head -20
```
Expected:
- `@import '../styles/animations.css';` is still present.
- The three `@tailwind base/components/utilities` lines are gone, replaced by a single `@import "tailwindcss";`.
- An `@theme` block exists.
- Both `@import` lines appear before any non-import rule (CSS requires all `@import` first). If `@import '../styles/animations.css'` ended up after a rule, move it up to sit next to `@import "tailwindcss";`.

- [ ] **Step 2: Confirm every v3 theme token has a v4 `@theme` equivalent**

The v3 `tailwind.config.js` defined these custom tokens. Read the generated `@theme` block (`grep -nA200 "@theme" src/app/globals.css`) and confirm each is represented. Use this checklist:

- Colours: `jerry-green` (50–950), `parchment` (50–950), `gold` (50–950) → expect `--color-jerry-green-50` … `--color-gold-950`.
- Fonts: serif / sans / display → expect `--font-serif`, `--font-sans`, `--font-display`.
- Animations: `fade-in`, `slide-up`, `pulse-slow`, `bounce-gentle`, `float`, `shimmer` → expect `--animate-fade-in` … `--animate-shimmer`, with their `@keyframes` (`fadeIn`, `slideUp`, `bounceGentle`, `float`, `shimmer`) present either inside `@theme` or as top-level at-rules. (`pulse-slow` reuses the built-in `pulse` keyframes.)
- `backdropBlur.xs` (2px), `boxShadow` (`glow`, `glow-sm`, `inner-glow`, `elegant`), `backgroundImage` (`gradient-radial`, `gradient-conic`, `hero-pattern`, `card-pattern`).

- [ ] **Step 3: Find any custom token the codemod failed to carry over**

For each custom utility class the codebase actually uses, confirm it still resolves. Run:
```bash
grep -rohE "\b(bg-(hero-pattern|card-pattern|gradient-radial|gradient-conic)|shadow-(glow|glow-sm|inner-glow|elegant)|backdrop-blur-xs|animate-(fade-in|slide-up|pulse-slow|bounce-gentle|float|shimmer))\b" src --include=*.tsx | sort -u
```
Expected: a list of the custom utilities in use. For each one returned, confirm a matching token exists in the `@theme` block from Step 2. If a used utility has no token (most likely candidates are the `backgroundImage` and `boxShadow` custom keys, whose v4 namespace the codemod sometimes omits), add it to `@theme`. The v4 namespaces are:
- box-shadow: `--shadow-glow: 0 0 20px rgba(252,211,77,0.3);` `--shadow-glow-sm: 0 0 10px rgba(252,211,77,0.2);` `--shadow-inner-glow: inset 0 0 20px rgba(252,211,77,0.1);` `--shadow-elegant: 0 10px 25px -3px rgba(0,0,0,0.3), 0 4px 6px -2px rgba(0,0,0,0.05);`
- background-image: `--background-image-hero-pattern: linear-gradient(135deg, rgba(26,68,46,0.9) 0%, rgba(30,83,55,0.8) 100%);` `--background-image-card-pattern: linear-gradient(135deg, rgba(241,231,208,0.1) 0%, rgba(223,195,150,0.05) 100%);` `--background-image-gradient-radial: radial-gradient(var(--tw-gradient-stops));` `--background-image-gradient-conic: conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops));`
- backdrop-blur: `--blur-xs: 2px;` (v4 maps `backdrop-blur-xs` and `blur-xs` to the same `--blur-*` namespace.)

Add only the tokens that Step 3's grep proves are used but Step 2 showed missing. Do not invent tokens for utilities the codebase never references.

- [ ] **Step 4: Confirm the hand-written CSS is intact**

Run:
```bash
grep -nE "\.btn-primary|\.cartography-background|\.age-gate-cartography|@media print|color-scheme: only light" src/app/globals.css
```
Expected: all of these still present and unchanged. The four `@apply` rules (`body`, `h1–h6`, `.btn-primary`, `.btn-primary:hover`) must still reference the brand colour utilities (`bg-parchment-50`, `text-jerry-green-900`, `text-jerry-green-800`, `bg-jerry-green-800`, etc.). Because these `@apply` rules live in the same file as `@import "tailwindcss"`, no `@reference` directive is needed.

- [ ] **Step 5: Commit any fixes**

```bash
git add src/app/globals.css
git commit -m "chore(tailwind): complete @theme tokens and verify import order"
```
Skip if no changes were needed beyond Task 2's checkpoint.

---

### Task 6: Hand-convert the typography prose customisation

**Files:**
- Modify: `src/app/globals.css`

The v3 `typography.DEFAULT.css` override is gone with `tailwind.config.js`. The codemod does not convert typography-plugin config to CSS, so re-create it as `--tw-prose-*` variables.

- [ ] **Step 1: Confirm the typography plugin is loaded in CSS**

Run:
```bash
grep -n "@plugin" src/app/globals.css
```
Expected: a line `@plugin "@tailwindcss/typography";` near the top (after `@import "tailwindcss";`). If it is missing, add it on its own line directly after `@import "tailwindcss";`.

- [ ] **Step 2: Add the prose variable block and link-hover rule**

Add this block to `src/app/globals.css`, placed after the `@theme` block (an un-layered rule so it overrides the plugin's layered defaults):
```css
/* Brand prose colours (was typography.DEFAULT.css in tailwind.config.js).
   Set as --tw-prose-* variables, the v4 way to customise @tailwindcss/typography. */
.prose {
  --tw-prose-body: #f1e7d0;
  --tw-prose-headings: #fef3c7;
  --tw-prose-lead: #dfc396;
  --tw-prose-links: #fcd34d;
  --tw-prose-bold: #fef3c7;
  --tw-prose-counters: #d97706;
  --tw-prose-bullets: #d97706;
  --tw-prose-hr: #92400e;
  --tw-prose-quotes: #dfc396;
  --tw-prose-quote-borders: #d97706;
  --tw-prose-captions: #dfc396;
  --tw-prose-code: #fcd34d;
  --tw-prose-pre-code: #f1e7d0;
  --tw-prose-pre-bg: #1a442e;
  --tw-prose-th-borders: #92400e;
  --tw-prose-td-borders: #432f20;
}

/* No --tw-prose variable exists for link hover; preserve the v3 hover colour. */
.prose a:hover {
  color: #f59e0b;
}
```

- [ ] **Step 3: Confirm prose is actually rendered somewhere (so the override is reachable)**

Run:
```bash
grep -rn "prose" src/components/FieldManualPortableText.tsx src/components --include=*.tsx | grep -i "prose" | head
```
Expected: at least one `className` containing `prose` (the Field Manual long-description renderer). This is the page used for visual verification in Task 9. If `prose` appears nowhere in the codebase, the override is dead and you should flag it — but per the spec the typography config existed precisely because prose is used, so expect a hit.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(tailwind): port prose theme to --tw-prose-* variables"
```

---

### Task 7: Confirm the border/ring compatibility shim

**Files:**
- Modify (only if missing): `src/app/globals.css`

v4 changes two defaults: the default border colour becomes `currentColor` (was `gray-200`) and the default ring becomes 1px `currentColor` (was 3px blue). The codemod normally injects a compatibility shim to preserve v3 behaviour.

- [ ] **Step 1: Check for the shim**

Run:
```bash
grep -nE "border-color: var\(--color-gray-200|@layer base" src/app/globals.css
```
Expected: a `@layer base` rule setting `border-color: var(--color-gray-200, currentColor)` on `*, ::after, ::before, ::backdrop, ::file-selector-button`.

- [ ] **Step 2: Add it if missing**

If Step 1 found nothing, add this block (the codemod's standard shim) after the `@theme` block:
```css
@layer base {
  *,
  ::after,
  ::before,
  ::backdrop,
  ::file-selector-button {
    border-color: var(--color-gray-200, currentColor);
  }
}
```
This keeps every existing `border` class rendering with the v3 default colour. (The codebase's many explicit `border-jerry-green-*`/`border-gold-*` classes are unaffected either way; this only matters for bare `border` usage.)

- [ ] **Step 3: Commit if you added it**

```bash
git add src/app/globals.css
git commit -m "chore(tailwind): keep v3 default border colour via compat shim"
```
Skip if the shim was already present.

---

### Task 8: Confirm `tailwind.config.js` is gone

**Files:**
- Delete (if still present): `tailwind.config.js`

- [ ] **Step 1: Check whether the config still exists**

Run:
```bash
ls tailwind.config.js 2>/dev/null && echo "STILL PRESENT" || echo "deleted"
grep -rn "@config" src/app/globals.css || echo "no @config directive"
```
Expected: `deleted` and `no @config directive`. The full CSS-first migration means there is no JS config and no `@config` line pointing back to one.

- [ ] **Step 2: If it is still present, delete it and remove any `@config` line**

Only if Step 1 reported `STILL PRESENT`:
```bash
git rm tailwind.config.js
```
And if a `@config "./tailwind.config.js";` line exists in `src/app/globals.css`, delete that line (its theme content must already be in the `@theme` block from Task 5 — verify before removing).

- [ ] **Step 3: Commit if you changed anything**

```bash
git add -A
git commit -m "chore(tailwind): remove JS config (now CSS-first @theme)"
```

---

### Task 9: Build, lint, and unit-test gates

**Files:** none (verification only)

- [ ] **Step 1: Production build**

Run:
```bash
npm run build
```
Expected: completes successfully, same as the Task 1 baseline. A failure here most likely means a `@theme` token is malformed or an `@apply` references a class that no longer exists — read the PostCSS error, fix in `globals.css`, and re-run.

- [ ] **Step 2: Lint**

Run:
```bash
npm run lint
```
Expected: passes (or only pre-existing warnings unrelated to this change). Tailwind class changes do not affect ESLint, so this should be clean.

- [ ] **Step 3: Unit tests**

Run:
```bash
npm run test:unit
```
Expected: all pass. None of the unit tests touch CSS, so this is a regression guard confirming the dependency churn did not break the module graph.

- [ ] **Step 4: Commit (only if a fix was needed in Step 1)**

```bash
git add src/app/globals.css
git commit -m "fix(tailwind): resolve build error in v4 stylesheet"
```
Skip if all three gates passed with no edits.

---

### Task 10: Local OpenNext build (insurance)

**Files:** none (verification only)

The spec notes Tailwind is build-time CSS only, so `next build` is the real gate. Running the OpenNext build locally is cheap insurance against any worker-bundle surprise (a lesson from the earlier esbuild incident) before relying on the Cloudflare CI step.

- [ ] **Step 1: Run the OpenNext build**

Run:
```bash
npx opennextjs-cloudflare build
```
Expected: completes and produces the worker bundle without error. If it fails for a reason unrelated to Tailwind (e.g. environment), note it and rely on the Cloudflare Workers CI build on the PR instead — but a Tailwind-caused failure must be fixed here. No commit.

---

### Task 11: Guided manual visual spot-check

**Files:** none (manual verification gate)

This is the gate that protects the "no intended visual change" requirement. Do not open the PR until it passes.

- [ ] **Step 1: Start the dev server**

Run:
```bash
npm run dev
```
Expected: server starts on `http://localhost:3000`.

- [ ] **Step 2: Check each surface, in risk order**

Open each and confirm it looks identical to production (compare against the live site `jerrycanspirits.co.uk` in a second tab where useful):

1. **A Field Manual cocktail page** (`/field-manual/...` cocktail with a long description) — prose body/heading/link/blockquote/code colours match the brand palette; hover a link and confirm it goes gold (`#f59e0b`). This validates Task 6.
2. **A print/menu preview** — open a page that uses `.print-region` (a Pour IQ menu or trade sheet) and trigger the browser print preview (Ctrl+P). Confirm white background, dark text, hidden header/footer, visible borders, no UI tiles. This validates the print block survived the cascade change.
3. **Homepage** (`/`) — cartography background texture renders; fade/slide reveal animations play on scroll; the ticker strip marquee scrolls and pauses on hover.
4. **A product page** — buttons (`.btn-primary` hover lift), shadows, gold accents render correctly.
5. **A Pour IQ dashboard screen** — dense UI: borders, rings on focus, card shadows look unchanged.

- [ ] **Step 3: Record the result**

If everything matches: note "visual spot-check passed" and proceed. If anything differs, stop, identify the offending token/rule in `globals.css`, fix, re-run Task 9 Step 1, and re-check. Commit any fix:
```bash
git add src/app/globals.css
git commit -m "fix(tailwind): restore <surface> visual parity"
```

- [ ] **Step 4: Stop the dev server** (Ctrl+C).

---

### Task 12: Finish the branch

**Files:** none

- [ ] **Step 1: Invoke the finishing skill**

Announce: "I'm using the finishing-a-development-branch skill to complete this work." Then follow `superpowers:finishing-a-development-branch`: it re-verifies tests, then presents options. Choose **option 2 (push and create a PR)** so CI (Lint/Type/Build/CodeQL) and the Cloudflare Workers build run before merge.

- [ ] **Step 2: PR body**

Use this summary:
```
## Summary
- Upgrade Tailwind CSS 3.4.19 → 4 (CSS-first config)
- Replace tailwind.config.js with @theme tokens in globals.css
- Swap PostCSS plugin to @tailwindcss/postcss; drop autoprefixer
- Port @tailwindcss/typography customisation to --tw-prose-* variables
- No intended visual change (modern-browser baseline accepted)

## Test Plan
- [ ] npm run build passes
- [ ] npm run lint passes
- [ ] npm run test:unit passes
- [ ] opennextjs-cloudflare build passes locally
- [ ] Manual visual spot-check: Field Manual prose, print/menu preview, homepage, product page, Pour IQ dashboard
- [ ] CI + Cloudflare Workers build green
```

- [ ] **Step 3: Let CI go green before merge.** Do not merge until GitHub CI and the Cloudflare Workers build both pass.

---

## Post-merge follow-up (not part of this plan)

Once stable on v4, evaluate v4-only visual enhancements in a separate spec: view transitions, `@starting-style` entry animations, scroll-driven animations, and the new `not-*`/`in-*`/`nth-*` variants. Candidate surfaces: route transitions, Field Manual card reveals, Pour IQ panel transitions.
