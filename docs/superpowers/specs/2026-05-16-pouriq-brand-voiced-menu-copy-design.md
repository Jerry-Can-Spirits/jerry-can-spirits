# Pour IQ™ Brand-Voiced Menu Copy — Design Spec

**Date:** 2026-05-16
**Status:** Design approved; ready for implementation plan.

## Goal

Bar manager generates brand-voiced drink descriptions for the cocktails on a Pour IQ™ menu, ready to hand to a designer. The tone, voice, length, and rules come from a per-tenant **Voice Profile** that the manager configures once. Descriptions are saved on each cocktail and reused on every export.

## Why now

Sharpens the "PDF / printable outputs" backlog item from "printable menu" to "menu copy ready to hand to a designer." Competitive analysis on 2026-05-14 confirmed: no Pour IQ™ competitor generates brand-voiced copy. Genuine moat. Cheap to build (one new table, one new column, one AI route, three small UI pieces).

## Architecture

- **Voice Profile** (per `trade_account`): one row, edited in place. Holds the dropdown answers, hard rules, sample descriptions, and free-text notes.
- **Descriptions** stored on `pouriq_cocktails.description` as the canonical text. Manager edits in place, regenerates at will.
- **AI generation** uses `claude-sonnet-4-6` (matches existing Pour IQ™ AI features). Voice Profile assembled into system context; cocktail name + recipe + price passed as user message. Same rate-limit pattern as menu-import and invoice-scan.
- **Three UX entry points** on the menu page:
  1. Per-drink "Generate description" button (regenerate at will, edit inline)
  2. Bulk action: "Generate for all drinks without a description"
  3. "Menu copy export" view: name + description + price for every drink, copy-to-clipboard + plain-text / markdown download

## Schema

### Migration: add columns to `pouriq_cocktails`

```sql
ALTER TABLE pouriq_cocktails ADD COLUMN description TEXT NULL;
ALTER TABLE pouriq_cocktails ADD COLUMN description_updated_at TEXT NULL;
```

No backfill — existing cocktails have NULL description; UI disables export for cocktails without one.

### Migration: new `pouriq_voice_profiles` table

```sql
CREATE TABLE pouriq_voice_profiles (
  trade_account_id TEXT PRIMARY KEY REFERENCES pouriq_trade_accounts(id) ON DELETE CASCADE,
  tone TEXT NOT NULL,                 -- 'refined' | 'casual' | 'cheeky' | 'classic' | 'minimal' | 'other'
  tone_other TEXT NULL,               -- populated when tone = 'other'
  person TEXT NOT NULL,               -- 'we' | 'i' | 'you' | 'third'
  length TEXT NOT NULL,               -- 'short' | 'medium' | 'long'
  rules_json TEXT NOT NULL DEFAULT '[]',     -- JSON string[] of selected hard rules + free-text additions
  samples_json TEXT NOT NULL DEFAULT '[]',   -- JSON string[] of 1-3 sample paragraphs
  notes TEXT NOT NULL DEFAULT '',     -- free-text "anything else"
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

One-to-one with `trade_account_id` (PRIMARY KEY enforces it). No history table — edits overwrite in place.

## Voice Profile questionnaire

Six fields on the settings page. All required except `notes` and the sample boxes beyond the first.

| Field | Type | Options |
|---|---|---|
| **Tone** | dropdown + free text | Refined / Casual / Cheeky / Classic / Minimal / Other (free text appears when "Other" chosen) |
| **Person** | dropdown | "We" (first-person plural) / "I" (first-person singular) / "You" (second-person) / Third-person ("the bar", "this drink") |
| **Length** | dropdown | Short (~1 sentence) / Medium (~2-3 sentences) / Long (~paragraph) |
| **Hard rules** | multi-select chips + free text | Default chips: No em-dashes · No exclamation marks · No emojis · No superlatives without proof · No hype words (epic, amazing, smash) · No brand-as-verb (e.g. "Hennessy this"). Plus a free-text "Add your own rule" input that appends to the list. |
| **Sample descriptions** | up to three free-text boxes | "Paste 1-3 example drink descriptions you'd like the AI to imitate. Yours, a competitor's, anything you like the cadence of." First box required. Boxes 2-3 optional. |
| **Anything else** | free-text textarea | "Anything specific to your brand — facts the AI should know, things it must never say, in-jokes, regional references." |

### Settings page

Route: `/trade/pouriq/settings/voice-profile`
Linked from: Pour IQ™ dashboard (new "Voice Profile" tile or settings entry) and from any generation modal's empty-state.

Empty-state copy on the form when no profile exists yet: *"Tell Pour IQ™ how your bar sounds. The AI uses this every time it writes a description, so do it once and forget it."*

## Generation flow

### Per-drink

Each cocktail row on `/trade/pouriq/[menuId]` page gets a new "Generate description" button (or "Regenerate" if one already exists).

Click → opens a modal (`<GenerateDescriptionModal>`):
- Shows the cocktail name + recipe summary
- POSTs to `/api/pouriq/cocktails/[cocktailId]/description/generate`
- Returns the generated text in one chunk (no streaming in v1)
- Manager sees the output in an editable textarea
- Buttons: **Save** (writes to `description`, closes), **Regenerate** (calls API again), **Cancel** (closes without saving)

If the cocktail already has a description, the button label becomes "Regenerate" and the modal pre-fills the textarea with the existing description for reference.

### Bulk

On the menu page header, a new button: **"Generate for drinks without a description"** (disabled when all drinks already have one).

Click → confirm dialog: *"This will generate descriptions for N drinks. Continue?"* (No cost estimate in v1 — keep the UX simple. If managers ask about cost later, surface it then.)

On confirm:
- POSTs to `/api/pouriq/menus/[menuId]/descriptions/generate-bulk`
- Server iterates drinks without a description, generates each in sequence, writes each to `description`
- Returns the list of generated drinks for review
- Page refreshes; manager can edit/regenerate any individual one

Bulk is non-atomic. If one generation fails (rate limit, model error), the rest still complete and the failed one is flagged. Manager can retry the failed one per-drink.

### Export

New tab/button on the menu page: **"Menu copy"** → opens `/trade/pouriq/[menuId]/menu-copy`.

Page shows, for each cocktail with a description:
```
COCKTAIL NAME — £12.00
Description text here, formatted exactly as it will appear on the printed menu.
Two-line break between drinks.
```

Plus copy-to-clipboard and two download buttons:
- **Download .txt** — plain text, designer-friendly
- **Download .md** — markdown with `## Cocktail Name` and price as italic

Cocktails without a description show a placeholder row: *"No description yet — generate one from the menu page."*

## AI flow

### Endpoint shape

- `POST /api/pouriq/cocktails/[cocktailId]/description/generate` → `{ description: string }`
- `POST /api/pouriq/menus/[menuId]/descriptions/generate-bulk` → `{ results: Array<{ cocktail_id, description?, error? }> }`

Both routes:
1. `checkPourIqAccess` → 401 if not ok
2. Verify cocktail/menu belongs to tenant via existing helpers
3. Load Voice Profile for `tradeAccountId` → 400 with link to settings if not set
4. Rate limit: `pouriq-description-gen`, 200 generations per 3600s per tenant (covers bulk runs on large menus)
5. Call Anthropic with assembled prompt
6. Write `description` and `description_updated_at` (per-drink: one UPDATE; bulk: D1 batch)
7. Return generated text(s)

### Prompt assembly

System message (built from Voice Profile):

```
You write drink descriptions for a bar. Match this voice exactly.

Tone: {tone}{tone_other ? " (" + tone_other + ")" : ""}
Person: {person, expanded e.g. "first-person plural: 'we'"}
Length: {length, expanded e.g. "short — one sentence, ideally under 20 words"}

Hard rules:
- {each rule from rules_json, one per line}

Examples of writing in this voice:
1. {sample 1}
2. {sample 2 if present}
3. {sample 3 if present}

Other notes about this bar:
{notes if non-empty}

Output rules:
- Output ONLY the description text. No preamble, no quote marks, no "Here is..."
- Do not invent ingredients not listed.
- Do not state ABV unless asked.
```

User message (per drink):

```
Drink name: {name}
Ingredients: {pretty list of recipe ingredients with pour_ml or "splash"}
Price: £{price}
{if ABV known: ABV: {abv}%}

Write the description.
```

### Output validation (server-side)

After the model returns text:
- Strip leading/trailing whitespace and surrounding quote marks
- Apply hard-rule filters as a soft check (warn-only — don't reject):
  - If "no em-dashes" set and `—` present → log a Sentry breadcrumb (not user-facing)
  - If "no exclamation marks" set and `!` present → log
- These checks are diagnostic for improving the prompt over time, not gates on the output. The manager always gets a chance to edit before saving.

## Edge cases

- **Voice Profile not set**: per-drink and bulk buttons disabled. Tooltip + click handler both link to settings page. Empty-state on settings page explains why.
- **Drink has no ingredients**: AI gets `Ingredients: (none recorded)` — output will be generic but won't fail.
- **Drink has no price**: AI gets price omitted from the user message. No failure.
- **Manager edits description after saving, then regenerates**: regenerate overwrites without warning. (Trust the manager; they clicked "Regenerate".)
- **Bulk run hits rate limit mid-way**: partial results returned; failed drinks shown with error message; manager can resume by hitting bulk again (still-undescribed drinks pick up).
- **Two devices edit a description simultaneously**: last write wins. No locking. Acceptable for single-venue use.
- **Sample descriptions contain forbidden patterns** (e.g. an em-dash in a sample, but "no em-dashes" rule set): no validation at form time. The AI is shown both and will follow the hard rule, but the contradiction is the manager's call.

## What this is NOT

- **Not versioned**: edit Voice Profile in place. No history table. If "what voice was used to write this description" becomes interesting, add `voice_profile_snapshot_json TEXT NULL` on `pouriq_cocktails` later.
- **Not PDF**: v1 outputs plain text and markdown. The designer can flow it into InDesign / Affinity / whatever. PDF export is future work.
- **Not multilingual**: English only in v1.
- **Not for non-cocktail items**: only `pouriq_cocktails` get a `description` column. Food items, snacks, packaged drinks are out of scope.
- **Not for marketing copy** (website, Klaviyo, Instagram): this is for printed bar menus only. Marketing copy is brand-owner work, not bar-manager work, and has different constraints.
- **Not auto-generated on menu creation**: descriptions only exist when a manager explicitly clicks "Generate" or "Generate for all". Default state is NULL.

## Help guide

Per the [help-guide style memory rule](file:///../../../../C:/Users/dan/.claude/projects/C--Users-dan--vscode-jerry-can-spirits/memory/feedback_pouriq_help_guide_style.md), every new Pour IQ™ feature ships with a help-guide section drafted in the same session. Section title: **"Generating menu copy"**. Slots in the help-guide accordion after the variance section.

Section will cover: setting the Voice Profile (one-time), per-drink vs bulk generation, editing after the fact, exporting to plain text or markdown, what to do when generations come back "off" (refine the Voice Profile, especially the sample descriptions).

## Open questions (resolved)

- Q: One-shot Voice Profile or versioned? **A: One-shot.** Edit in place. History deferred.
- Q: Per-drink and bulk write straight to `description` or to a draft state? **A: Straight to `description`.** Manager can edit/regenerate freely.
- Q: PDF export in v1? **A: No.** Plain text + markdown is enough.

## Implementation order (rough)

A single PR is reasonable; the spec is contained.

1. Migration: add columns to `pouriq_cocktails`, create `pouriq_voice_profiles`
2. Pure helpers: `assemblePromptSystem(profile)`, `assemblePromptUser(cocktail)` in `src/lib/pouriq/menu-copy.ts`
3. Server actions / API routes: profile CRUD (server actions are fine), per-drink generate, bulk generate
4. Settings page UI: `/trade/pouriq/settings/voice-profile`
5. Per-drink generation modal + button on menu page
6. Bulk generation button + confirm dialog + result review
7. Menu copy export page: `/trade/pouriq/[menuId]/menu-copy`
8. Help-guide section draft

Estimated PR size: similar to the variance-lite PR (10-ish commits, four to six small new files plus a couple of edits).
