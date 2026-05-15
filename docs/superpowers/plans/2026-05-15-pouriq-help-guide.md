# Pour IQ™ In-App Help Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A quiet, accordion-style help page at `/trade/pouriq/help` for Pour IQ™ licence-holders, with content authored in Sanity Studio. Trade Hub tile drops onto the existing landing.

**Architecture:** New singleton Sanity document type (`tradeHelp`) registered in `schemaTypes.ts` and pinned in the Studio structure. Server-rendered Next.js page fetches the singleton, falls back gracefully across the content lifecycle (no doc → empty sections → empty bodies → full), renders via native `<details>`/`<summary>` for zero-JS accessibility. A thin portable-text renderer (`HelpPortableText`) handles section bodies.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Sanity v4 + `next-sanity` `PortableText`, Cloudflare D1 (for the access check, not the content). No new dependencies.

**Spec:** [docs/superpowers/specs/2026-05-15-pouriq-help-guide-design.md](../specs/2026-05-15-pouriq-help-guide-design.md)

**Verification path:** `npm run lint`, `npm run build` (runs `tsc`), and manual integration checks on the deploy preview. No unit test framework is installed; do not introduce one.

---

## Phase 1 — Single PR: `feat/pouriq-help-guide`

**Branch:** already created. The spec is already committed at HEAD.

### Task 1: Sanity schema + registration

**Files:**
- Create: `src/sanity/schemaTypes/tradeHelp.ts`
- Modify: `src/sanity/schemaTypes.ts`

- [ ] **Step 1: Create the schema file**

```ts
import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'tradeHelp',
  title: 'Pour IQ™ help guide',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Page title',
      type: 'string',
      description: 'Shown at the top of /trade/pouriq/help',
      initialValue: 'Pour IQ™ help',
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: 'intro',
      title: 'Intro paragraph',
      type: 'text',
      rows: 3,
      description: 'Short paragraph shown above the accordion. Measured, no hype.',
      validation: (Rule) => Rule.required().max(400),
    }),
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      description: 'Drag to reorder. Each section becomes one accordion panel.',
      of: [
        {
          type: 'object',
          name: 'helpSection',
          title: 'Section',
          fields: [
            defineField({
              name: 'title',
              title: 'Section title',
              type: 'string',
              description: 'Answers a "how do I X?" question. Visible in the closed accordion.',
              validation: (Rule) => Rule.required().max(80),
            }),
            defineField({
              name: 'body',
              title: 'Body',
              type: 'array',
              of: [
                { type: 'block' },
                { type: 'image', options: { hotspot: true } },
              ],
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: { select: { title: 'title' } },
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Pour IQ™ help guide' }),
  },
})
```

- [ ] **Step 2: Register the schema**

Open `src/sanity/schemaTypes.ts`. Replace its contents with:

```ts
import { type SchemaTypeDefinition } from 'sanity'

import cocktail from './schemaTypes/cocktail'
import ingredient from './schemaTypes/ingredient'
import equipment from './schemaTypes/equipment'
import product from './schemaTypes/product'
import guide from './schemaTypes/guide'
import tradeHelp from './schemaTypes/tradeHelp'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [cocktail, ingredient, equipment, product, guide, tradeHelp],
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: PASS. The schema isn't yet wired into Studio structure, but the type system should be happy.

- [ ] **Step 4: Commit**

```bash
git add src/sanity/schemaTypes/tradeHelp.ts src/sanity/schemaTypes.ts
git commit -m "feat(pouriq): tradeHelp Sanity singleton schema"
```

---

### Task 2: Studio singleton structure + GROQ query

**Files:**
- Modify: `src/sanity/structure.ts`
- Modify: `src/sanity/queries.ts`

- [ ] **Step 1: Update Studio structure to pin the singleton**

Replace the contents of `src/sanity/structure.ts` with:

```ts
import type { StructureResolver } from 'sanity/structure'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      // Pin Pour IQ™ help guide as a singleton at the top of the list.
      S.listItem()
        .title('Pour IQ™ help guide')
        .id('tradeHelp')
        .child(
          S.editor()
            .id('tradeHelp')
            .schemaType('tradeHelp')
            .documentId('tradeHelp'),
        ),
      S.divider(),
      // Everything else uses the default document-type listing, except the
      // singleton (which is already surfaced above).
      ...S.documentTypeListItems().filter(
        (listItem) => listItem.getId() !== 'tradeHelp',
      ),
    ])
```

- [ ] **Step 2: Append the GROQ query**

Open `src/sanity/queries.ts`. Append at the end of the file (after the existing `adjacentGuidesQuery` block):

```ts

// Pour IQ™ help guide — singleton document fetch.
export const tradeHelpQuery = `*[_type == "tradeHelp"][0]{
  title,
  intro,
  sections[] {
    title,
    body
  }
}`
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/sanity/structure.ts src/sanity/queries.ts
git commit -m "feat(pouriq): tradeHelp singleton structure + GROQ query"
```

---

### Task 3: HelpPortableText renderer

**Files:**
- Create: `src/components/pouriq/HelpPortableText.tsx`

- [ ] **Step 1: Create the renderer**

```tsx
import { PortableText } from 'next-sanity'
import type { PortableTextBlock, PortableTextComponents } from 'next-sanity'

// Defence-in-depth: don't render clickable javascript: URIs even if a Sanity
// account is compromised. Same allow-list as FieldManualPortableText.
function safeLinkHref(href: string): string {
  const trimmed = href.trim()
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('#')
  ) {
    return trimmed
  }
  return '#'
}

const components: PortableTextComponents = {
  block: {
    // The page owns H1; section <summary> owns H2-equivalent. Authors' H1/H2
    // become styled divs so we don't ship duplicate heading levels.
    h1: ({ children }) => (
      <div className="text-lg font-serif font-bold text-gold-300 mt-6 mb-3 first:mt-0">{children}</div>
    ),
    h2: ({ children }) => (
      <div className="text-lg font-serif font-bold text-gold-300 mt-6 mb-3 first:mt-0">{children}</div>
    ),
    h3: ({ children }) => (
      <h3 className="text-base font-serif font-bold text-gold-400 mt-5 mb-2 first:mt-0">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-sm font-serif font-semibold text-gold-400 mt-4 mb-2 first:mt-0">{children}</h4>
    ),
    normal: ({ children }) => (
      <p className="text-parchment-300 leading-relaxed mb-4 last:mb-0">{children}</p>
    ),
  },
  marks: {
    strong: ({ children }) => (
      <strong className="text-white font-semibold">{children}</strong>
    ),
    em: ({ children }) => (
      <em className="italic">{children}</em>
    ),
    link: ({ value, children }) => {
      const rawHref: unknown = value?.href
      const href = typeof rawHref === 'string' ? safeLinkHref(rawHref) : '#'
      const isExternal = href.startsWith('http://') || href.startsWith('https://')
      return (
        <a
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="text-gold-300 hover:text-gold-200 underline decoration-dotted transition-colors"
        >
          {children}
        </a>
      )
    },
  },
  list: {
    bullet: ({ children }) => (
      <ul className="space-y-1.5 mb-4 last:mb-0">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="space-y-1.5 mb-4 last:mb-0 list-decimal list-inside">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => (
      <li className="flex items-start gap-3">
        <span className="w-1.5 h-1.5 bg-gold-400 rounded-full flex-shrink-0 mt-2" aria-hidden="true" />
        <span className="text-parchment-300 leading-relaxed">{children}</span>
      </li>
    ),
    number: ({ children }) => (
      <li className="text-parchment-300 leading-relaxed pl-1">{children}</li>
    ),
  },
}

interface HelpPortableTextProps {
  value: PortableTextBlock[]
}

export function HelpPortableText({ value }: HelpPortableTextProps) {
  return <PortableText value={value} components={components} />
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/pouriq/HelpPortableText.tsx
git commit -m "feat(pouriq): HelpPortableText renderer for help guide bodies"
```

---

### Task 4: Help page route

**Files:**
- Create: `src/app/trade/pouriq/help/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { redirect } from 'next/navigation'
import * as Sentry from '@sentry/nextjs'
import type { PortableTextBlock } from 'next-sanity'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { HelpPortableText } from '@/components/pouriq/HelpPortableText'
import { client as sanityClient } from '@/sanity/lib/client'
import { tradeHelpQuery } from '@/sanity/queries'

export const dynamic = 'force-dynamic'

interface HelpSection {
  title: string
  body: PortableTextBlock[]
}

interface TradeHelpDoc {
  title: string
  intro: string
  sections: HelpSection[] | null
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

async function fetchTradeHelp(): Promise<TradeHelpDoc | null> {
  try {
    return await sanityClient.fetch<TradeHelpDoc | null>(tradeHelpQuery)
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'pouriq-help', phase: 'sanity-fetch' } })
    return null
  }
}

export default async function PourIqHelpPage() {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const doc = await fetchTradeHelp()

  // Empty-state fallbacks for the content lifecycle.
  const title = doc?.title ?? 'Pour IQ™ help'
  const intro = doc?.intro ?? null
  const sections = doc?.sections ?? []

  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">{title}</h1>
        {intro && <p className="text-parchment-300 text-base leading-relaxed mb-10">{intro}</p>}

        {sections.length === 0 ? (
          <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
            <p className="text-parchment-300 leading-relaxed">
              We are writing this guide as Pour IQ™ evolves. Check back soon.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sections.map((section, index) => {
              const id = `${slugify(section.title)}-${index}`
              const hasBody = Array.isArray(section.body) && section.body.length > 0
              return (
                <details
                  key={id}
                  id={id}
                  className="group bg-jerry-green-800/40 backdrop-blur-sm rounded-xl border border-gold-500/20 overflow-hidden"
                >
                  <summary className="cursor-pointer list-none px-6 py-4 flex items-center justify-between gap-4 text-base font-serif font-bold text-white hover:bg-jerry-green-700/30 transition-colors">
                    <span>{section.title}</span>
                    <span
                      aria-hidden="true"
                      className="text-gold-400 text-lg transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <div className="px-6 pb-6 pt-2 border-t border-gold-500/10">
                    {hasBody ? (
                      <HelpPortableText value={section.body} />
                    ) : (
                      <p className="text-parchment-400 italic">This section is being written.</p>
                    )}
                  </div>
                </details>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: PASS. The build manifest should include the new `/trade/pouriq/help` route.

- [ ] **Step 3: Commit**

```bash
git add src/app/trade/pouriq/help/page.tsx
git commit -m "feat(pouriq): help page route with empty-state-aware accordion"
```

---

### Task 5: Trade Hub tile

**Files:**
- Modify: `src/app/trade/landing/page.tsx`

- [ ] **Step 1: Apply the Edit**

Use the Edit tool on `src/app/trade/landing/page.tsx` with these exact strings (a literal `Edit` replace, not a manual insert).

old_string:

```tsx
          {hasPourIq ? (
            <TradeTile
              variant="active"
              title="Pour IQ™"
              description="Margin analysis and AI recommendations for your cocktail menu."
              href="/trade/pouriq/"
              ctaLabel="Open Pour IQ™"
            />
          ) : (
            <TradeTile
              variant="greyed"
              title="Pour IQ™"
              description="Margin analysis and AI recommendations for your cocktail menu."
              learnMoreHref="/trade/pour-iq/"
              unavailableNote="Available as an additional service."
            />
          )}
```

new_string:

```tsx
          {hasPourIq ? (
            <TradeTile
              variant="active"
              title="Pour IQ™"
              description="Margin analysis and AI recommendations for your cocktail menu."
              href="/trade/pouriq/"
              ctaLabel="Open Pour IQ™"
            />
          ) : (
            <TradeTile
              variant="greyed"
              title="Pour IQ™"
              description="Margin analysis and AI recommendations for your cocktail menu."
              learnMoreHref="/trade/pour-iq/"
              unavailableNote="Available as an additional service."
            />
          )}
          {hasPourIq ? (
            <TradeTile
              variant="active"
              title="Pour IQ™ help"
              description="A working operations guide. How to scan invoices, read margin, fix gotchas."
              href="/trade/pouriq/help"
              ctaLabel="Open guide"
            />
          ) : (
            <TradeTile
              variant="greyed"
              title="Pour IQ™ help"
              description="A working operations guide for the Pour IQ™ platform."
              learnMoreHref="/trade/pour-iq"
              unavailableNote="Available with a Pour IQ™ licence."
            />
          )}
```

If the existing Pour IQ™ tile block doesn't match `old_string` byte-for-byte (whitespace, line endings, or a recent commit changed the copy), stop and ask the controller — don't guess.

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/trade/landing/page.tsx
git commit -m "feat(pouriq): Trade Hub help tile"
```

---

### Task 6: Lint sweep + final type-check

This task doesn't produce code; it confirms everything compiles cleanly together before pushing.

- [ ] **Step 1: Run the build one more time**

```bash
npm run build
```

Expected: PASS. Build manifest includes:
- `/trade/pouriq/help` (dynamic, server-rendered)
- The trade landing page registers a slightly larger bundle (new tile)
- No TypeScript errors

- [ ] **Step 2: Scoped lint on the touched files**

```bash
npx eslint src/sanity/schemaTypes/tradeHelp.ts src/sanity/schemaTypes.ts src/sanity/structure.ts src/sanity/queries.ts src/components/pouriq/HelpPortableText.tsx src/app/trade/pouriq/help/page.tsx src/app/trade/landing/page.tsx
```

Expected: clean output (no errors). If `npm run lint` repo-wide OOMs as usual, that's the pre-existing environmental issue and not a regression.

- [ ] **Step 3: Skim the help page locally if you can**

If `npm run dev` is workable in your environment (it requires Cloudflare bindings), open `http://localhost:3000/trade/pouriq/help`. You won't have a Sanity doc yet, so you should see the empty-state ("We are writing this guide as Pour IQ™ evolves. Check back soon."). If `npm run dev` is too gated to run locally, skip — manual integration happens on the deploy preview after PR open.

No commit for this task — it's verification only.

---

### Task 7: Push and open PR

- [ ] **Step 1: Push the branch**

```bash
git push -u origin feat/pouriq-help-guide
```

- [ ] **Step 2: Open the PR**

```bash
gh pr create --title "feat(pouriq): in-app help guide" --body "$(cat <<'EOF'
## Summary

A quiet, accordion-style help page at \`/trade/pouriq/help\` for Pour IQ™ licence-holders. Content authored in Sanity Studio via a new singleton document type (\`tradeHelp\`). Trade Hub landing gets a new help tile.

## What ships

- **Sanity schema** \`tradeHelp\` — title, intro, array of sections (title + portable-text body with image support)
- **Studio structure** pins the singleton at the top of the Content list (no \"create new\" affordance)
- **GROQ query** \`tradeHelpQuery\`
- **\`HelpPortableText\` renderer** — paragraphs, H3/H4, lists, bold/italic, links, images (link allow-list mirrors \`FieldManualPortableText\`)
- **Page route** \`/trade/pouriq/help\` — access check → licence gate → Sanity fetch → empty-state-aware native \`<details>\` accordion
- **Trade Hub tile** — active for licence-holders, greyed with \`Learn more\` for non-licensed (mirrors the existing Pour IQ™ tile)

## Accordion approach

Native \`<details>\` / \`<summary>\` — zero JS, semantic, accessible by default. Section IDs are stable for deep-linking (\`/help#section-id\`); auto-open on hash is deferred to a future iteration.

## Empty-state behaviour

The page renders sensibly through every step of content rollout:
- Doc missing → fallback h1 + \"We are writing this guide as Pour IQ™ evolves\"
- Doc exists, sections empty → \`doc.title\` + \`doc.intro\` + same fallback paragraph
- Section has title but empty body → expanding shows \"This section is being written.\"
- Fully populated → normal render

## Content authoring

Intentionally NOT in this PR. The brand-voice owner authors the 10 sections in Sanity Studio post-merge as a docs-as-test exercise (walking through each Pour IQ™ feature, writing the section, verifying behaviour as written).

## Spec

[\`docs/superpowers/specs/2026-05-15-pouriq-help-guide-design.md\`](../blob/main/docs/superpowers/specs/2026-05-15-pouriq-help-guide-design.md).

## Test plan

- [x] \`npm run build\` clean
- [x] Scoped \`npx eslint\` on touched files clean
- [ ] **Deploy-preview walkthrough** (trade login gated locally):
  - Trade Hub landing as a licence-holder → Help tile shows active, links to \`/trade/pouriq/help\`
  - Trade Hub landing as a non-licensed trade-account holder → Help tile shows greyed with \`Learn more\` → \`/trade/pour-iq\`
  - \`/trade/pouriq/help\` as a no-session user → redirected to \`/trade/login\`
  - \`/trade/pouriq/help\` as a no-licence user → \`<LicenceGate />\` renders
  - \`/trade/pouriq/help\` as a licence-holder before doc exists → \"We are writing this guide as Pour IQ™ evolves\"
  - In Sanity Studio: create the Pour IQ™ help doc with one section + one paragraph → page renders the section as an accordion; expanding shows the paragraph
  - Empty a section's body in Studio → expanding shows \"This section is being written.\"
  - Hash deep-link → browser scrolls to the section (stays closed; user expands)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Confirm PR opened**

The command prints the PR URL. CI build + lint should pass within a few minutes.

---

## Self-review checklist (engineer)

Before requesting review:

- [ ] Branch was cut from up-to-date `origin/main`
- [ ] No `console.log` left behind
- [ ] No `any` types introduced (use `unknown` with a cast if forced)
- [ ] No em-dashes, emojis, or exclamation marks in user-visible copy (intro fallback, empty-state paragraphs, the "+" indicator are all safe; review them anyway)
- [ ] The trade landing page still renders correctly for the existing tiles (no regression)
- [ ] The Field Manual still renders correctly (the portable-text renderer change is additive; verify nothing else imports anything you might have shifted)
- [ ] Sanity Studio shows "Pour IQ™ help guide" at the top of the Content list, opens directly into the editor (no "create new" prompt)
