# Pour IQ™ In-App Help Guide — Design Spec

**Status:** Spec — not yet implemented. Next Pour IQ™ feature after AI invoice scanning (PRs #679 + #680, shipped 2026-05-15).

**Why:** Pour IQ™ has grown to a meaningful feature set — ingredient library, AI menu import, cost-change ripple analysis, sales volume tracking with POS sync, cost what-if, AI invoice scanning, supplier invoice ledger. Pilot venues onboarding for the first time need a quiet, operational reference they can scan in 30-second windows between covers. The guide also serves as spec-by-example: walking through it should be a working test of every claim Pour IQ™ makes about itself. The brand-voice owner authors content; engineering ships the page, schema, and Trade Hub tile.

**Scope discipline:** Content lives in Sanity (one singleton document with an array of sections). Page renders accordion-style at `/trade/pouriq/help`. Gated to Pour IQ™ licence-holders. Text-only in v1 with portable text supporting images for later. No in-guide search, no multi-language, no print stylesheet — all explicitly out of scope.

---

## Concepts

**Singleton.** A Sanity document type (`tradeHelp`) of which only one instance ever exists. Studio surfaces it as a fixed editable entry, not "list + create new". Adding a section means appending to the document's `sections` array, not creating a new document.

**Section.** One accordion panel. Has a question-shaped title and a portable-text body. Section ordering is drag-and-drop in Studio.

**Empty-state grace.** The page must render sensibly across the content lifecycle: doc missing → doc with empty sections → doc with section titles but empty bodies → doc fully populated. Each state has explicit fallback copy.

**Native disclosure.** Accordion via HTML `<details>`/`<summary>`. Zero JavaScript required. Server-rendered, immediately interactive, semantic for screen readers.

---

## What already exists

| Asset | Where | What it does |
|---|---|---|
| `TradeTile` component | `src/components/trade-portal/TradeTile.tsx` | Active / greyed tile variants. Drop-in for the help tile. |
| Trade Hub landing | `src/app/trade/landing/page.tsx` | Renders the existing tiles; conditional on `hasPourIq`. The help tile follows the same condition. |
| `checkPourIqAccess` | `src/lib/pouriq/access.ts` | Access check returning `'no-session' | 'no-licence' | 'ok'`. Used by every Pour IQ™ page. |
| `LicenceGate` component | `src/components/pouriq/LicenceGate.tsx` | Reusable gate screen. Already on `/trade/pour-iq` marketing as `learnMoreHref`. |
| Sanity client | `src/sanity/lib/client.ts` | Server-side fetch helper. Used by Field Manual. |
| Schema registry | `src/sanity/schemaTypes.ts` | Add new schema here. |
| Studio structure | `src/sanity/structure.ts` | Configure the singleton entry here. |
| Portable text precedent | `src/components/FieldManualPortableText.tsx` | Reference renderer; the help renderer is a slimmer variant. |
| `guide` schema | `src/sanity/schemaTypes/guide.ts` | Existing public-content schema. Deliberately NOT reused — its SEO/category/distillery fields are wrong for gated internal help. |

---

## Schema

New file: `src/sanity/schemaTypes/tradeHelp.ts`.

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
      validation: Rule => Rule.required().max(80),
    }),
    defineField({
      name: 'intro',
      title: 'Intro paragraph',
      type: 'text',
      rows: 3,
      description: 'Short paragraph shown above the accordion. Measured, no hype.',
      validation: Rule => Rule.required().max(400),
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
              validation: Rule => Rule.required().max(80),
            }),
            defineField({
              name: 'body',
              title: 'Body',
              type: 'array',
              of: [
                { type: 'block' },
                { type: 'image', options: { hotspot: true } },
              ],
              validation: Rule => Rule.required(),
            }),
          ],
          preview: { select: { title: 'title' } },
        },
      ],
      validation: Rule => Rule.required().min(1),
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Pour IQ™ help guide' }),
  },
})
```

**Why singleton:** there's only ever one help page. Multiple `tradeHelp` documents would be a Sanity mistake waiting to happen. The structure config below enforces this.

**Why portable text with image support:** matches the existing Field Manual `longDescription` pattern. Text-only today; adding an image to any section later is just dropping it into the body array — no schema or code change.

**Why NOT reuse the existing `guide` schema:** that schema is designed for public Field Manual content. Its SEO scaffolding (metaTitle, metaDescription, keywords, category, isPillar), distillery references, FAQ array, comparison tables, hero image, and CTA fields are all irrelevant for gated internal help and clutter Studio when editing.

### Schema registration

`src/sanity/schemaTypes.ts` — add the new type to the exports array.

`src/sanity/structure.ts` — pin the singleton:

```ts
S.listItem()
  .title('Pour IQ™ help guide')
  .id('tradeHelp')
  .child(
    S.editor()
      .id('tradeHelp')
      .schemaType('tradeHelp')
      .documentId('tradeHelp'),
  )
```

The fixed `documentId: 'tradeHelp'` is what makes it a singleton — Studio always opens the same document, no "create new" affordance.

---

## Page architecture

### Route

`src/app/trade/pouriq/help/page.tsx` — server component.

```
GET /trade/pouriq/help
  │
  ▼
checkPourIqAccess()
  ├── 'no-session'  → redirect('/trade/login')
  ├── 'no-licence'  → <LicenceGate />
  └── 'ok'          → continue
  │
  ▼
sanityClient.fetch(TRADE_HELP_QUERY)
  │
  ├── null / sections empty → render empty-state page
  └── doc present           → render full page
  │
  ▼
<main>
  <h1>{doc.title}</h1>
  <p>{doc.intro}</p>
  {doc.sections.map((s, i) => (
    <details key={i} id={slugify(s.title) + '-' + i}>
      <summary>{s.title}</summary>
      {s.body.length === 0
        ? <p>This section is being written.</p>
        : <HelpPortableText value={s.body} />}
    </details>
  ))}
</main>
```

### Accordion choice — native `<details>`/`<summary>`

Not Headless UI Disclosure. Reasons:

- **Zero JavaScript required.** Page works the moment HTML lands. Bar managers on slow pub-tablet connections get an interactive page immediately.
- **Semantic and accessible by default.** Screen readers announce the disclosure state correctly without ARIA work.
- **Bookmark-friendly.** Each `<summary>` carries a stable `id`; `#section-id` deep links work via browser scroll.
- **Brand voice.** Quiet, operational, no-flash. Matches the help guide's tone better than a custom JS animation.

Optional CSS transition on `details[open] summary ~ *` for smooth open/close. Snap-to-open is also fine.

### Portable text renderer

New file: `src/components/pouriq/HelpPortableText.tsx`. Thin wrapper around `<PortableText>` from `next-sanity` with the project's prose Tailwind styles. Handles: paragraphs, H3/H4 headings (no H1/H2 since the page already has H1 and section titles act as H2), bullet/numbered lists, bold, italic, inline links, images.

Smaller than `FieldManualPortableText` because the help content doesn't need recipe-card embeds, cocktail cross-links, ingredient tags, or any other Field Manual-specific marks.

### Sanity data layer

New GROQ query in `src/sanity/queries.ts`:

```ts
export const TRADE_HELP_QUERY = `
  *[_type == "tradeHelp"][0]{
    title,
    intro,
    sections[] {
      title,
      body
    }
  }
`
```

The page imports this query and the existing sanity client, fetches server-side, handles null gracefully.

### Caching

`export const dynamic = 'force-dynamic'` — same as other pouriq pages. Sanity fetch latency is low; cache invalidation gets messy with `revalidate`. Consistent with the pattern.

### Trade Hub tile

Modify `src/app/trade/landing/page.tsx` to add one more `<TradeTile>` block, conditional on the same `hasPourIq` flag that drives the existing Pour IQ™ tile:

```tsx
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

---

## Content scope — section list and authoring split

### Initial sections (10)

Question-shaped titles. The brand-voice owner authors content in Studio post-merge:

| # | Title | Covers |
|---|---|---|
| 1 | Logging in for the first time | PIN login, the Trade Hub landing tiles, what to expect |
| 2 | Adding and editing your ingredient library | Manual add, barcode scan, cost editing, ripple preview, the confirm modal when drinks would drop below target, the post-save toast |
| 3 | Creating your first menu | Manual entry, AI menu import (paste / PDF / Excel / CSV), the preview-and-confirm flow |
| 4 | Reading your menu report | Per-drink GP, contribution column, target line, what each metric means |
| 5 | Promotional pricing and VAT | Setting a promo price, bulk apply, the VAT toggle and what it changes |
| 6 | Tracking sales volumes | Manual entry, cadence (weekly / monthly), Square POS sync, where the numbers feed |
| 7 | Running a cost what-if | The `/what-if` sandbox: pick an ingredient, dial in a price, see the ripple, nothing committed |
| 8 | Scanning a supplier invoice | Upload PDF, preview with auto-tick + override, the combined ripple page, what gets logged |
| 9 | Reviewing past invoices | Ledger view, invoice detail, downloading the original PDF |
| 10 | Common problems and fixes | Square sandbox seller, POS not syncing, AI extraction failures, etc. |

Flow: setup → first menu → pricing → sales → cost intelligence → troubleshooting. Matches the order a venue actually encounters each feature.

### Authoring split

**Implementation PR ships:**

- Schema (`tradeHelp`) registered and added to the singleton structure
- GROQ query
- Page at `/trade/pouriq/help` rendering correctly across all four content states (see below)
- Portable text renderer
- Trade Hub tile (both variants)
- Empty-state copy hardcoded in the page for when the doc doesn't yet exist

**Implementation PR does NOT ship:**

- Initial content for the 10 sections (the brand-voice owner authors this in Studio post-merge; the implementer is not the brand-voice owner)
- A seed script that pre-populates Sanity (the brand-voice owner would overwrite drafts anyway; cleaner to start blank)

The docs-as-test exercise drives the content authoring: the brand-voice owner walks through each Pour IQ™ feature, writes a section, and verifies the feature behaves as written. UX gaps surface naturally.

### Empty-state behaviour

The page must render sensibly at every step of content rollout.

| State | What the user sees |
|---|---|
| Doc doesn't exist yet | `<h1>Pour IQ™ help</h1>` followed by a single paragraph: "We are writing this guide as Pour IQ™ evolves. Check back soon." No accordion rendered. |
| Doc exists, `sections` array empty | `<h1>{doc.title}</h1>` + `<p>{doc.intro}</p>` (both from Sanity — both fields are required by validation), then the same single fallback paragraph above. No accordion rendered. |
| Doc exists, section has title but `body` is empty | Full page renders. The empty-body accordion expands to show "This section is being written." |
| Doc fully populated | Normal render. |

The middle states matter because content is authored section-by-section over time.

---

## Edge cases (in scope for v1)

| Case | Behaviour |
|---|---|
| Sanity fetch fails (network / outage) | Server component catches, renders the empty state. Sentry captures a warning. Page never errors visibly. |
| Doc exists but a section has no title | Skipped from the render. Sanity validation requires title, so this only happens if the doc is mid-edit and unpublished. |
| Portable text contains an unknown block type | `HelpPortableText` falls back to ignoring unknown blocks (matches `FieldManualPortableText` pattern). |
| User opens page, licence expires server-side mid-session | Next navigation re-runs `checkPourIqAccess` and re-routes to `<LicenceGate />`. Already-open accordion content stays visible until they navigate. Acceptable. |
| Anchor link to a section (`/help#section-id`) | The `<summary>` carries a stable `id` derived from the section title (kebab-cased, position-suffixed for uniqueness). Browser scrolls to it. The `<details>` does NOT auto-open on hash — that's a small JS enhancement for a future iteration. User expands manually after navigating. |
| Mobile viewport | Sections stack naturally; `<summary>` has adequate tap target (44×44 minimum, WCAG); body uses project prose Tailwind classes. |

### Edge cases acknowledged but **out of scope**

- **In-guide search.** Browser Cmd-F covers it for v1. Add a real search if the guide grows past ~20 sections.
- **Multi-language.** Single English version. The schema has no language field.
- **Auto-open on hash deep-link.** User expands manually after navigating to `#section-id`. Small JS enhancement; future.
- **Versioning / "what's new" section.** Could become section 11 later. Not v1.
- **Inline screenshots or SVG diagrams.** Schema supports images via the portable text image block; v1 ships text-only.
- **Print stylesheet.** Help guide doesn't need to print well.
- **Deep linking from elsewhere in Pour IQ™** (e.g., a "?" icon next to a feature). Section IDs exist so this can be added later without page-level changes.

---

## Testing

Project has Playwright e2e only; no unit/component framework. Verification is `npm run lint`, `npm run build` (runs `tsc`), and manual integration on the deploy preview.

- `npm run build` clean (TypeScript type-check + Cloudflare Workers build)
- `npm run lint` clean (scoped to touched files if repo-wide OOMs)
- Sanity schema changes deploy with the standard project flow
- Manual integration on deploy preview:
  - Trade Hub landing as a licence-holder → Help tile shows active, links to `/trade/pouriq/help`
  - Trade Hub landing as a non-licensed trade-account holder → Help tile shows greyed with `Learn more` → `/trade/pour-iq`
  - `/trade/pouriq/help` as a no-session user → redirected to `/trade/login`
  - `/trade/pouriq/help` as a no-licence user → `<LicenceGate />` renders
  - `/trade/pouriq/help` as a licence-holder before doc exists → "Help content coming soon."
  - In Sanity Studio: create the Pour IQ™ help doc with one section and one paragraph → page renders that section as an accordion; expanding shows the paragraph
  - Add a second section in Studio → both render in array order
  - Empty a section's body → expanding shows "This section is being written."
  - Hash deep-link (`/trade/pouriq/help#some-section-id`) → browser scrolls to the section (it stays closed; user expands manually)

### CI

Branch off `origin/main`. Standard CI: build + lint + Cloudflare Workers build. Follows the branch-discipline rule (fresh branch from main, no commits on merged branches).

---

## File-level change summary

| File | Change |
|---|---|
| `src/sanity/schemaTypes/tradeHelp.ts` | **New.** Singleton document type with title, intro, sections array. |
| `src/sanity/schemaTypes.ts` | **Modified.** Register the new type in the exports array. |
| `src/sanity/structure.ts` | **Modified.** Pin the singleton list item with `documentId: 'tradeHelp'`. |
| `src/sanity/queries.ts` | **Modified.** Add `TRADE_HELP_QUERY`. |
| `src/app/trade/pouriq/help/page.tsx` | **New.** Server component: access check → licence gate → Sanity fetch → empty-state-aware accordion render. |
| `src/components/pouriq/HelpPortableText.tsx` | **New.** Thin portable text renderer for help body content (paragraphs, H3/H4, lists, bold, italic, links, images). |
| `src/app/trade/landing/page.tsx` | **Modified.** Add the help tile (active or greyed, conditional on `hasPourIq`). |

---

## Future work (not this spec)

1. **In-guide search.** A simple client-side filter input that highlights matching section titles. Useful once the guide exceeds ~20 sections.
2. **Auto-open on hash deep-link.** Small client-side enhancement so `#invoice-scanning` opens that section's `<details>` automatically.
3. **Per-feature "?" icons** inside Pour IQ™ that deep-link to the relevant help section.
4. **What's new section.** A monthly "what changed" entry at the top of the accordion, sourced from a separate `whatsNew` schema or as a marked section in `tradeHelp`.
5. **Screenshots and SVG flow diagrams.** The schema already supports images via portable text image blocks; this is purely a content-authoring activity, not a code change.
6. **Multi-language.** Would need a language field on the document plus a language selector on the page. Not on the roadmap.
