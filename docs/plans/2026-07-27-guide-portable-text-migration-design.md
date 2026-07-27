# Guide portable-text migration — design

**Date:** 2026-07-27
**Status:** Approved direction (founder, 27 Jul); spec for implementation

## Problem

Guide section bodies (`sections[].content` and `sections[].subsections[].content`)
are plain `text` fields rendered as raw strings (`GuideSections.tsx`,
`whitespace-pre-line`). Guides therefore cannot carry inline links: every
cocktail, ingredient and sibling-guide mention in body prose is dead text. The
structured `relatedCocktails`/`relatedGuides` modules exist, but inline links in
prose are the strongest internal-linking signal the site is missing, and the
forthcoming rum-house guides are link hubs by nature.

## Goal

1. Section bodies become portable text with support for **internal links** to
   cocktails, ingredients, equipment and other guides, plus external links.
2. All 35 existing guides migrate losslessly.
3. A **link retrofit** pass wraps Field Manual entity names in the migrated
   prose with internal links.
4. Zero downtime and no window where the live site or Studio breaks.

## Design

### 1. Parallel field, not in-place type change

Changing `content` from `text` to `array` in place would break either the live
site (deployed code reads a string, data becomes blocks) or Studio (schema says
blocks, data is strings) during any cutover window. Instead:

- Add **`contentRich`** (`array` of `block`) alongside each `content` field
  (sections and subsections).
- Renderer prefers `contentRich` when present, falls back to `content`.
- After migration is verified, `content` is marked `hidden: true` with a
  deprecation description (data retained, same pattern as the legacy cocktail
  `garnish` string).

### 2. The `internalLink` annotation

`contentRich` blocks support two marks beyond defaults:

```ts
marks: {
  annotations: [
    { name: 'link', fields: [{ name: 'href', type: 'url' }] },           // external
    { name: 'internalLink', fields: [{
        name: 'reference', type: 'reference',
        to: [{type:'cocktail'},{type:'ingredient'},{type:'equipment'},{type:'guide'}]
    }] },
  ]
}
```

### 3. Rendering

`GuideSections.tsx` renders `contentRich` via a `GuidePortableText` component
built on the existing `FieldManualPortableText` serializers (which already
harden external `link` hrefs). The GROQ projection dereferences internal links
to a path at query time:

```groq
contentRich[]{ ..., markDefs[]{ ..., _type == "internalLink" => {
  "docType": reference->_type, "slug": reference->slug.current } } }
```

The serializer maps docType → route (`cocktail` → `/field-manual/cocktails/<slug>/`,
`ingredient` → `/field-manual/ingredients/<slug>/`, `equipment` →
`/field-manual/equipment/<slug>/`, `guide` → `/guides/<slug>/`), always with the
trailing slash. A dangling reference (deleted target) renders as plain text, not
a broken link.

### 4. Data migration (text → blocks)

One-off `npx sanity exec` script (established pattern: temp script, run,
verify, delete):

- Split each `content` string on `\n\n` → one `block` (style `normal`) per
  paragraph.
- Runs of lines starting `"- "` → `listItem: 'bullet'` blocks.
- Unique `_key`s throughout; write to `contentRich`; NEVER modify `content`
  (it remains the rollback source).
- Idempotent: skip any section whose `contentRich` already exists.
- Verify: `pt::text(contentRich)` equals the source string modulo the bullet
  markers and paragraph joins (scripted comparison per section, zero-loss gate).

### 5. Link retrofit

Second pass over migrated `contentRich`:

- Vocabulary: all cocktail names + ingredient names + guide titles
  (longest-first, word-boundary, case-insensitive) — the proven garnish/mesh
  matcher.
- **First mention only** per section; cap ~6 links per section to avoid spam.
- Precision vetoes carried over from the Phase ④ mesh: glass names in glassware
  contexts ("Martini glass", "Hurricane glass"), bar names ("Pegu Club"),
  common-noun collisions ("Affinity", "Shaft", "Bamboo", era phrases like
  "20th Century"), and the christmas/easter avoid-context lists.
- A drink's own page is never linked from its own recipe section's heading
  context (no self-links on the guide currently being read).
- Wraps the matched span in an `internalLink` markDef referencing the target
  document. Print full log for review; idempotent (skip sections already
  containing any internalLink).

### 6. Tooling and consumers

- `estimatedWordCount` computations read `contentRich` when present (audit
  scripts and future agents told via the memory ledger).
- `docs/GUIDE_CONTENT_TEMPLATE.md` updated: section bodies are portable text;
  inline links to Field Manual entities are expected on first mention; the
  "no markdown" warning replaced by the block-content guidance.
- Future guide authoring (rum houses onward) writes `contentRich` natively and
  may leave `content` empty (renderer fallback makes it optional; the schema
  keeps `content` non-required once deprecated).

### 7. Rider: `baseSpirit` enum gap

The cocktail schema's `baseSpirit` list has no Welsh-whisky value; the three
Penderyn serves currently carry none. This PR adds `welsh-whisky` to the enum
(display "Welsh Whisky") and the three cocktails are patched after deploy.

## Rollout order

1. PR: schema (`contentRich` + annotation + baseSpirit rider) + renderer +
   queries + `GuidePortableText`. Deploy. (Site unchanged in behaviour: no
   `contentRich` data exists yet; fallback renders `content` exactly as today.)
2. Migration script (text → blocks), verify zero-loss, spot-render.
3. Link retrofit script, review log, verify.
4. Patch the three Penderyn cocktails' `baseSpirit`.
5. Schema follow-up in the same PR or a small second PR: mark `content`
   hidden/deprecated. `sanity deploy` for Studio.
6. IndexNow re-run (body links change page content).

## Out of scope

- `introduction` stays plain text (design uses it as a single lead paragraph).
- FAQ answers stay plain text.
- Retro-authoring new prose; this migrates and links what exists.

## Verification

- Zero-loss text comparison per section (gate in the migration script).
- Post-deploy visual spot-check of 5 guides (bullets, paragraphs, links).
- Link-retrofit log eyeballed; count of links added per guide reported.
- `npm run build` + unit tests green; Studio opens a migrated guide without
  validation errors.
