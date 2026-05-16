# Pour IQ™ Brand-Voiced Menu Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bar manager configures a per-tenant Voice Profile once, then generates brand-voiced drink descriptions (per-drink or bulk) that get saved to `pouriq_cocktails.description` and can be exported as plain text or markdown for handing to a designer.

**Architecture:** One migration (column adds + new `pouriq_voice_profiles` table), one pure module (`menu-copy.ts` with prompt assembly + Anthropic call), one DAO (`voice-profile.ts`), one server action (upsert), two API routes (per-drink generate + bulk generate), one settings page, one form component, one modal, one bulk-trigger component, one export page, plus a small mount edit on the existing menu page.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Cloudflare Workers + D1, Anthropic Messages API (`claude-sonnet-4-6`). No new dependencies.

**Spec:** [docs/superpowers/specs/2026-05-16-pouriq-brand-voiced-menu-copy-design.md](../specs/2026-05-16-pouriq-brand-voiced-menu-copy-design.md)

**Verification path:** `npm run lint`, `npm run build` (runs `tsc`), and manual integration checks against the deploy preview. No unit test framework installed; do not introduce one.

**Branch:** `feat/pouriq-brand-voice` (already created from `origin/main`; the spec is already committed at HEAD).

---

## Phase 1 — Single PR: `feat/pouriq-brand-voice`

### Task 1: Schema migration

**Files:**
- Create: `migrations/0027_pouriq_brand_voice.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- 0027_pouriq_brand_voice.sql
-- Adds brand-voiced description support:
--   1. Two nullable columns on pouriq_cocktails for the saved description.
--   2. New table pouriq_voice_profiles (one row per trade account).

ALTER TABLE pouriq_cocktails ADD COLUMN description TEXT NULL;
ALTER TABLE pouriq_cocktails ADD COLUMN description_updated_at TEXT NULL;

CREATE TABLE pouriq_voice_profiles (
  trade_account_id TEXT PRIMARY KEY REFERENCES pouriq_trade_accounts(id) ON DELETE CASCADE,
  tone TEXT NOT NULL,                              -- 'refined' | 'casual' | 'cheeky' | 'classic' | 'minimal' | 'other'
  tone_other TEXT NULL,                            -- populated when tone = 'other'
  person TEXT NOT NULL,                            -- 'we' | 'i' | 'you' | 'third'
  length TEXT NOT NULL,                            -- 'short' | 'medium' | 'long'
  rules_json TEXT NOT NULL DEFAULT '[]',           -- JSON string[] of selected hard rules + free-text additions
  samples_json TEXT NOT NULL DEFAULT '[]',         -- JSON string[] of 1-3 sample paragraphs
  notes TEXT NOT NULL DEFAULT '',                  -- free-text "anything else"
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

- [ ] **Step 2: Apply locally** (skip if local D1 is broken from prior issues; remote apply later is the real test)

```
npx wrangler d1 migrations apply jerry-can-spirits-db --local
```

- [ ] **Step 3: Commit**

```
git add migrations/0027_pouriq_brand_voice.sql
git commit -m "feat(pouriq): migration 0027 — voice profiles + cocktail description columns"
```

---

### Task 2: Voice Profile DAO + types

**Files:**
- Create: `src/lib/pouriq/voice-profile.ts`

- [ ] **Step 1: Create the file**

```ts
// Voice Profile data access. Tenant scoping is enforced by callers
// (server action verifies access before touching this module).

import 'server-only'

export type VoiceTone = 'refined' | 'casual' | 'cheeky' | 'classic' | 'minimal' | 'other'
export type VoicePerson = 'we' | 'i' | 'you' | 'third'
export type VoiceLength = 'short' | 'medium' | 'long'

export interface VoiceProfile {
  trade_account_id: string
  tone: VoiceTone
  tone_other: string | null
  person: VoicePerson
  length: VoiceLength
  rules: string[]
  samples: string[]
  notes: string
  updated_at: string
}

export interface VoiceProfileInput {
  tone: VoiceTone
  tone_other: string | null
  person: VoicePerson
  length: VoiceLength
  rules: string[]
  samples: string[]
  notes: string
}

interface VoiceProfileRow {
  trade_account_id: string
  tone: string
  tone_other: string | null
  person: string
  length: string
  rules_json: string
  samples_json: string
  notes: string
  updated_at: string
}

function parseStringArray(raw: string, field: string): string[] {
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((s): s is string => typeof s === 'string')
  } catch {
    // Persisted JSON should always be valid; if it isn't, fall back to empty
    // rather than throw — the user can re-save the profile to repair it.
    console.warn(`voice-profile: invalid JSON in ${field}`)
    return []
  }
}

function isVoiceTone(s: string): s is VoiceTone {
  return s === 'refined' || s === 'casual' || s === 'cheeky' || s === 'classic' || s === 'minimal' || s === 'other'
}

function isVoicePerson(s: string): s is VoicePerson {
  return s === 'we' || s === 'i' || s === 'you' || s === 'third'
}

function isVoiceLength(s: string): s is VoiceLength {
  return s === 'short' || s === 'medium' || s === 'long'
}

export async function getVoiceProfile(
  db: D1Database,
  tradeAccountId: string,
): Promise<VoiceProfile | null> {
  const row = await db
    .prepare(`
      SELECT trade_account_id, tone, tone_other, person, length,
             rules_json, samples_json, notes, updated_at
      FROM pouriq_voice_profiles
      WHERE trade_account_id = ?1
    `)
    .bind(tradeAccountId)
    .first<VoiceProfileRow>()
  if (!row) return null
  if (!isVoiceTone(row.tone) || !isVoicePerson(row.person) || !isVoiceLength(row.length)) {
    // Defensive: if the DB ever contains an unknown enum value, treat as missing
    // and let the manager re-create the profile.
    return null
  }
  return {
    trade_account_id: row.trade_account_id,
    tone: row.tone,
    tone_other: row.tone_other,
    person: row.person,
    length: row.length,
    rules: parseStringArray(row.rules_json, 'rules_json'),
    samples: parseStringArray(row.samples_json, 'samples_json'),
    notes: row.notes,
    updated_at: row.updated_at,
  }
}

export async function upsertVoiceProfile(
  db: D1Database,
  tradeAccountId: string,
  input: VoiceProfileInput,
): Promise<void> {
  await db
    .prepare(`
      INSERT INTO pouriq_voice_profiles
        (trade_account_id, tone, tone_other, person, length, rules_json, samples_json, notes, updated_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, datetime('now'))
      ON CONFLICT(trade_account_id) DO UPDATE SET
        tone = excluded.tone,
        tone_other = excluded.tone_other,
        person = excluded.person,
        length = excluded.length,
        rules_json = excluded.rules_json,
        samples_json = excluded.samples_json,
        notes = excluded.notes,
        updated_at = excluded.updated_at
    `)
    .bind(
      tradeAccountId,
      input.tone,
      input.tone_other,
      input.person,
      input.length,
      JSON.stringify(input.rules),
      JSON.stringify(input.samples),
      input.notes,
    )
    .run()
}
```

- [ ] **Step 2: Verify build**

```
npm run build
```

- [ ] **Step 3: Commit**

```
git add src/lib/pouriq/voice-profile.ts
git commit -m "feat(pouriq): voice profile DAO with JSON-encoded rules/samples"
```

---

### Task 3: Prompt assembly + Anthropic generation helper

**Files:**
- Create: `src/lib/pouriq/menu-copy.ts`

This module owns the system + user prompt assembly and the Anthropic call. The HTTP wrapper mirrors `src/lib/pouriq/invoice-extract.ts` but without forced tool use — we want plain text out.

- [ ] **Step 1: Create the file**

```ts
// Brand-voiced menu copy: prompt assembly + Anthropic call.
// Pure prompt assembly is testable; the HTTP call is a thin wrapper.

import type { VoiceProfile } from './voice-profile'

export interface CocktailForCopy {
  name: string
  sale_price_p: number | null
  abv: number | null
  ingredients: Array<{ name: string; pour_ml: number | null; unit_count: number | null }>
}

const PERSON_DESCRIPTIONS: Record<VoiceProfile['person'], string> = {
  we: "first-person plural: 'we'",
  i: "first-person singular: 'I'",
  you: "second-person addressed to the drinker: 'you'",
  third: "third-person: 'the bar', 'this drink', no narrator pronoun",
}

const LENGTH_DESCRIPTIONS: Record<VoiceProfile['length'], string> = {
  short: 'short — one sentence, ideally under 20 words',
  medium: 'medium — two to three sentences',
  long: 'long — one short paragraph (4-6 sentences)',
}

const TONE_DESCRIPTIONS: Record<Exclude<VoiceProfile['tone'], 'other'>, string> = {
  refined: 'refined and measured; understated confidence',
  casual: 'casual and conversational; relaxed pub voice',
  cheeky: 'cheeky and playful; light irreverence, no smugness',
  classic: 'classic cocktail-bar voice; timeless, evocative',
  minimal: 'minimal and direct; nouns and verbs, no flourish',
}

function toneDescription(profile: VoiceProfile): string {
  if (profile.tone === 'other' && profile.tone_other) {
    return profile.tone_other
  }
  if (profile.tone === 'other') {
    return 'as the bar describes (see notes below)'
  }
  return TONE_DESCRIPTIONS[profile.tone]
}

/**
 * Assemble the system prompt that constrains the model's voice and rules.
 * Pure — no IO. Easy to inspect.
 */
export function assemblePromptSystem(profile: VoiceProfile): string {
  const parts: string[] = []
  parts.push('You write drink descriptions for a bar. Match this voice exactly.')
  parts.push('')
  parts.push(`Tone: ${toneDescription(profile)}`)
  parts.push(`Person: ${PERSON_DESCRIPTIONS[profile.person]}`)
  parts.push(`Length: ${LENGTH_DESCRIPTIONS[profile.length]}`)
  parts.push('')
  if (profile.rules.length > 0) {
    parts.push('Hard rules — never break these:')
    for (const r of profile.rules) parts.push(`- ${r}`)
    parts.push('')
  }
  if (profile.samples.length > 0) {
    parts.push("Examples of writing in this voice. Imitate the cadence, vocabulary, and rhythm:")
    profile.samples.forEach((s, idx) => parts.push(`${idx + 1}. ${s.trim()}`))
    parts.push('')
  }
  if (profile.notes.trim()) {
    parts.push('Other notes about this bar:')
    parts.push(profile.notes.trim())
    parts.push('')
  }
  parts.push('Output rules:')
  parts.push('- Output ONLY the description text. No preamble, no quote marks, no "Here is..."')
  parts.push('- Do not invent ingredients not listed.')
  parts.push('- Do not state ABV unless asked.')
  return parts.join('\n')
}

function formatIngredient(i: CocktailForCopy['ingredients'][number]): string {
  if (i.pour_ml !== null && i.pour_ml > 0) return `${i.pour_ml}ml ${i.name}`
  if (i.unit_count !== null && i.unit_count > 0) {
    return i.unit_count === 1 ? `1 × ${i.name}` : `${i.unit_count} × ${i.name}`
  }
  return `splash of ${i.name}`
}

/**
 * Assemble the per-drink user message. Pure.
 */
export function assemblePromptUser(cocktail: CocktailForCopy): string {
  const parts: string[] = []
  parts.push(`Drink name: ${cocktail.name}`)
  if (cocktail.ingredients.length === 0) {
    parts.push('Ingredients: (none recorded)')
  } else {
    parts.push('Ingredients:')
    for (const i of cocktail.ingredients) parts.push(`- ${formatIngredient(i)}`)
  }
  if (cocktail.sale_price_p !== null && cocktail.sale_price_p > 0) {
    parts.push(`Price: £${(cocktail.sale_price_p / 100).toFixed(2)}`)
  }
  if (cocktail.abv !== null) {
    parts.push(`ABV: ${cocktail.abv}%`)
  }
  parts.push('')
  parts.push('Write the description.')
  return parts.join('\n')
}

/**
 * Strip leading/trailing whitespace and surrounding quote marks. Soft-checks
 * the output against any "no X" hard rules and logs to console (server-side)
 * for diagnostic value — does NOT reject the output.
 */
export function sanitiseGeneratedText(raw: string, rules: string[]): string {
  let out = raw.trim()
  // Strip a single pair of wrapping quotes if the entire output is wrapped.
  if (
    (out.startsWith('"') && out.endsWith('"')) ||
    (out.startsWith("'") && out.endsWith("'"))
  ) {
    out = out.slice(1, -1).trim()
  }
  const lower = out.toLowerCase()
  for (const rule of rules) {
    const r = rule.toLowerCase()
    if (r.includes('no em-dash') && out.includes('—')) {
      console.warn('menu-copy: em-dash in output despite rule', { rule })
    }
    if (r.includes('no exclamation') && out.includes('!')) {
      console.warn('menu-copy: exclamation in output despite rule', { rule })
    }
    if (r.includes('no emoji') && /\p{Emoji}/u.test(out)) {
      console.warn('menu-copy: emoji in output despite rule', { rule })
    }
    if (r.includes('no hype') && /(epic|amazing|incredible|game[- ]changer|smash)/i.test(lower)) {
      console.warn('menu-copy: hype word in output despite rule', { rule })
    }
  }
  return out
}

export interface GenerateArgs {
  apiKey: string
  model?: string
  profile: VoiceProfile
  cocktail: CocktailForCopy
}

export async function generateDescriptionWithAnthropic(args: GenerateArgs): Promise<string> {
  const model = args.model ?? 'claude-sonnet-4-6'
  const system = assemblePromptSystem(args.profile)
  const user = assemblePromptUser(args.cocktail)

  const body = {
    model,
    max_tokens: 400,
    system: [{ type: 'text', text: system }],
    messages: [{ role: 'user', content: [{ type: 'text', text: user }] }],
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': args.apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(`Anthropic ${response.status}: ${errorText}`)
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text?: string }>
  }
  const textBlock = data.content.find((c) => c.type === 'text' && typeof c.text === 'string')
  if (!textBlock || !textBlock.text) {
    throw new Error('Anthropic did not return a text content block')
  }
  return sanitiseGeneratedText(textBlock.text, args.profile.rules)
}
```

- [ ] **Step 2: Verify build**

```
npm run build
```

- [ ] **Step 3: Commit**

```
git add src/lib/pouriq/menu-copy.ts
git commit -m "feat(pouriq): prompt assembly + Anthropic generation helper"
```

---

### Task 4: Server action for upserting the Voice Profile

**Files:**
- Modify: `src/lib/pouriq/server-actions.ts`

- [ ] **Step 1: Read the file**

Read `src/lib/pouriq/server-actions.ts`. Confirm the `requireDb()` helper exists at the top. Confirm the file uses `revalidatePath` and Cloudflare context. You will append a new action at the end.

- [ ] **Step 2: Add an import for the DAO + types**

At the top of the file, after the existing imports, add:

```ts
import { upsertVoiceProfile, type VoiceProfileInput } from './voice-profile'
```

- [ ] **Step 3: Append the new action at the end of the file**

```ts
export async function setVoiceProfileAction(input: VoiceProfileInput): Promise<void> {
  const { db, tradeAccountId } = await requireDb()
  // Light validation. The form already constrains the enum dropdowns, but we
  // re-check here since server actions can be called with arbitrary input.
  if (!['refined', 'casual', 'cheeky', 'classic', 'minimal', 'other'].includes(input.tone)) {
    throw new Error('Invalid tone')
  }
  if (input.tone === 'other' && !(input.tone_other && input.tone_other.trim())) {
    throw new Error('Tell us how to describe your tone (free-text required when "Other" is chosen)')
  }
  if (!['we', 'i', 'you', 'third'].includes(input.person)) {
    throw new Error('Invalid person')
  }
  if (!['short', 'medium', 'long'].includes(input.length)) {
    throw new Error('Invalid length')
  }
  if (!Array.isArray(input.rules) || !Array.isArray(input.samples)) {
    throw new Error('Rules and samples must be arrays')
  }
  // At least one sample is required.
  const cleanedSamples = input.samples.map((s) => s.trim()).filter((s) => s.length > 0).slice(0, 3)
  if (cleanedSamples.length === 0) {
    throw new Error('Please paste at least one sample description')
  }
  const cleanedRules = input.rules.map((s) => s.trim()).filter((s) => s.length > 0).slice(0, 30)
  await upsertVoiceProfile(db, tradeAccountId, {
    tone: input.tone,
    tone_other: input.tone === 'other' ? (input.tone_other?.trim() ?? null) : null,
    person: input.person,
    length: input.length,
    rules: cleanedRules,
    samples: cleanedSamples,
    notes: input.notes.trim(),
  })
  revalidatePath('/trade/pouriq/settings/voice-profile')
}
```

- [ ] **Step 4: Verify build**

```
npm run build
```

- [ ] **Step 5: Commit**

```
git add src/lib/pouriq/server-actions.ts
git commit -m "feat(pouriq): setVoiceProfileAction server action"
```

---

### Task 5: Voice Profile form component

**Files:**
- Create: `src/components/pouriq/VoiceProfileForm.tsx`

The form is a client component. It posts via the server action and shows inline success / error.

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { setVoiceProfileAction } from '@/lib/pouriq/server-actions'
import { PRIMARY_BUTTON } from '@/lib/pouriq/button-styles'
import type {
  VoiceLength,
  VoicePerson,
  VoiceProfile,
  VoiceTone,
} from '@/lib/pouriq/voice-profile'

interface Props {
  initial: VoiceProfile | null
}

const DEFAULT_RULES = [
  'No em-dashes',
  'No exclamation marks',
  'No emojis',
  'No superlatives without proof',
  'No hype words (epic, amazing, smash)',
  'No brand-as-verb (e.g. "Hennessy this")',
]

const TONE_OPTIONS: Array<{ value: VoiceTone; label: string }> = [
  { value: 'refined', label: 'Refined' },
  { value: 'casual', label: 'Casual' },
  { value: 'cheeky', label: 'Cheeky' },
  { value: 'classic', label: 'Classic' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'other', label: 'Other (describe below)' },
]

const PERSON_OPTIONS: Array<{ value: VoicePerson; label: string }> = [
  { value: 'we', label: '"We" (first-person plural)' },
  { value: 'i', label: '"I" (first-person singular)' },
  { value: 'you', label: '"You" (addressing the drinker)' },
  { value: 'third', label: 'Third-person ("the bar", "this drink")' },
]

const LENGTH_OPTIONS: Array<{ value: VoiceLength; label: string }> = [
  { value: 'short', label: 'Short (one sentence)' },
  { value: 'medium', label: 'Medium (two to three sentences)' },
  { value: 'long', label: 'Long (a short paragraph)' },
]

const fieldLabel = 'block text-xs uppercase tracking-widest text-parchment-400 mb-1.5'
const inputClass = 'w-full px-3 py-2 bg-jerry-green-700/50 border border-gold-500/30 rounded text-parchment-50 focus:border-gold-400 focus:outline-none'
const textareaClass = `${inputClass} min-h-[100px]`
const selectClass = inputClass

export function VoiceProfileForm({ initial }: Props) {
  const [tone, setTone] = useState<VoiceTone>(initial?.tone ?? 'refined')
  const [toneOther, setToneOther] = useState<string>(initial?.tone_other ?? '')
  const [person, setPerson] = useState<VoicePerson>(initial?.person ?? 'we')
  const [length, setLength] = useState<VoiceLength>(initial?.length ?? 'medium')
  const [defaultRules, setDefaultRules] = useState<Set<string>>(
    new Set(initial ? initial.rules.filter((r) => DEFAULT_RULES.includes(r)) : DEFAULT_RULES),
  )
  const [customRulesText, setCustomRulesText] = useState<string>(
    initial ? initial.rules.filter((r) => !DEFAULT_RULES.includes(r)).join('\n') : '',
  )
  const [samples, setSamples] = useState<[string, string, string]>([
    initial?.samples[0] ?? '',
    initial?.samples[1] ?? '',
    initial?.samples[2] ?? '',
  ])
  const [notes, setNotes] = useState<string>(initial?.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function toggleRule(rule: string) {
    setDefaultRules((s) => {
      const next = new Set(s)
      if (next.has(rule)) next.delete(rule)
      else next.add(rule)
      return next
    })
  }

  function updateSample(idx: 0 | 1 | 2, value: string) {
    setSamples((s) => {
      const next: [string, string, string] = [s[0], s[1], s[2]]
      next[idx] = value
      return next
    })
  }

  function submit() {
    setError(null)
    setInfo(null)
    const customRules = customRulesText
      .split('\n')
      .map((r) => r.trim())
      .filter((r) => r.length > 0)
    const rules = [...defaultRules, ...customRules]
    startTransition(async () => {
      try {
        await setVoiceProfileAction({
          tone,
          tone_other: tone === 'other' ? toneOther : null,
          person,
          length,
          rules,
          samples: samples.filter((s) => s.trim().length > 0),
          notes,
        })
        setInfo('Voice Profile saved.')
      } catch (e) {
        setError((e as Error).message || 'Could not save Voice Profile')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="tone" className={fieldLabel}>Tone</label>
        <select id="tone" className={selectClass} value={tone} onChange={(e) => setTone(e.target.value as VoiceTone)}>
          {TONE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {tone === 'other' && (
          <input
            type="text"
            value={toneOther}
            onChange={(e) => setToneOther(e.target.value)}
            placeholder="Describe the tone in a few words"
            className={`${inputClass} mt-2`}
            aria-label="Custom tone description"
          />
        )}
      </div>

      <div>
        <label htmlFor="person" className={fieldLabel}>Person</label>
        <select id="person" className={selectClass} value={person} onChange={(e) => setPerson(e.target.value as VoicePerson)}>
          {PERSON_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="length" className={fieldLabel}>Length</label>
        <select id="length" className={selectClass} value={length} onChange={(e) => setLength(e.target.value as VoiceLength)}>
          {LENGTH_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div>
        <span className={fieldLabel}>Hard rules</span>
        <div className="grid sm:grid-cols-2 gap-2">
          {DEFAULT_RULES.map((rule) => (
            <label key={rule} className="flex items-center gap-2 text-sm text-parchment-100">
              <input
                type="checkbox"
                checked={defaultRules.has(rule)}
                onChange={() => toggleRule(rule)}
                className="w-4 h-4 accent-gold-500"
              />
              <span>{rule}</span>
            </label>
          ))}
        </div>
        <label htmlFor="custom-rules" className={`${fieldLabel} mt-3`}>Custom rules (one per line)</label>
        <textarea
          id="custom-rules"
          value={customRulesText}
          onChange={(e) => setCustomRulesText(e.target.value)}
          placeholder="e.g. Always mention the country of origin for spirits"
          className={textareaClass}
        />
      </div>

      <div>
        <span className={fieldLabel}>Sample descriptions (paste 1-3)</span>
        <p className="text-xs text-parchment-400 mb-2">Concrete examples are the most powerful input. The AI will imitate the cadence, vocabulary, and rhythm. Yours, a competitor&apos;s, anything you like.</p>
        {[0, 1, 2].map((idx) => (
          <textarea
            key={idx}
            value={samples[idx]}
            onChange={(e) => updateSample(idx as 0 | 1 | 2, e.target.value)}
            placeholder={idx === 0 ? 'Sample 1 (required)' : `Sample ${idx + 1} (optional)`}
            className={`${textareaClass} mb-2`}
            aria-label={`Sample description ${idx + 1}`}
          />
        ))}
      </div>

      <div>
        <label htmlFor="notes" className={fieldLabel}>Anything else</label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything specific to your brand — facts the AI should know, things it must never say, in-jokes, regional references."
          className={textareaClass}
        />
      </div>

      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      {info && <p role="status" className="text-sm text-emerald-300">{info}</p>}

      <div className="flex justify-end">
        <button type="button" onClick={submit} disabled={pending} className={PRIMARY_BUTTON}>
          {pending ? 'Saving…' : 'Save Voice Profile'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```
npm run build
```

- [ ] **Step 3: Commit**

```
git add src/components/pouriq/VoiceProfileForm.tsx
git commit -m "feat(pouriq): VoiceProfileForm with 6-field questionnaire"
```

---

### Task 6: Voice Profile settings page

**Files:**
- Create: `src/app/trade/pouriq/settings/voice-profile/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { VoiceProfileForm } from '@/components/pouriq/VoiceProfileForm'
import { getVoiceProfile } from '@/lib/pouriq/voice-profile'

export const dynamic = 'force-dynamic'

export default async function VoiceProfileSettingsPage() {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database
  const profile = await getVoiceProfile(db, access.tradeAccountId)

  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <Link href="/trade/pouriq" className="text-sm text-parchment-400 hover:text-parchment-200">← Pour IQ™</Link>
        <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mt-3 mb-6">
          <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">Pour IQ™ Settings</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">Voice Profile</h1>
        <p className="text-parchment-300 text-base leading-relaxed mb-10">
          {profile
            ? 'Edit how Pour IQ™ writes descriptions for your drinks. Updates apply to every generation from now on; existing descriptions stay as they are until you regenerate them.'
            : 'Tell Pour IQ™ how your bar sounds. The AI uses this every time it writes a description, so do it once and forget it.'}
        </p>
        <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
          <VoiceProfileForm initial={profile} />
        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify build**

```
npm run build
```

Expected: PASS. New route registered as `/trade/pouriq/settings/voice-profile`.

- [ ] **Step 3: Commit**

```
git add src/app/trade/pouriq/settings/voice-profile/page.tsx
git commit -m "feat(pouriq): Voice Profile settings page"
```

---

### Task 7: Per-drink generation API route

**Files:**
- Create: `src/app/api/pouriq/cocktails/[cocktailId]/description/generate/route.ts`

This route generates a description for one cocktail. It does NOT save automatically — the client gets the text, lets the manager edit/accept, then saves via a separate save endpoint added in the same task (POST body with the final description to commit).

- [ ] **Step 1: Create the file**

```ts
// POST /api/pouriq/cocktails/[cocktailId]/description/generate
//   Generates a description using the tenant Voice Profile. Returns { description }.
//
// PUT  /api/pouriq/cocktails/[cocktailId]/description
//   Body: { description: string | null }
//   Saves (or clears) the description on the cocktail.

import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { isAllowedOrigin, isRateLimited } from '@/lib/kv'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { getVoiceProfile } from '@/lib/pouriq/voice-profile'
import { generateDescriptionWithAnthropic, type CocktailForCopy } from '@/lib/pouriq/menu-copy'

export const runtime = 'nodejs'

const GENERATE_RATE_LIMIT = 200 // per hour per tenant; covers single + bulk paths

interface Params {
  params: Promise<{ cocktailId: string }>
}

interface CocktailLookup {
  id: string
  menu_id: string
  trade_account_id: string
  name: string
  sale_price_p: number | null
}

async function loadCocktailForTenant(
  db: D1Database,
  cocktailId: string,
  tradeAccountId: string,
): Promise<CocktailLookup | null> {
  const row = await db
    .prepare(`
      SELECT c.id AS id, c.menu_id AS menu_id, m.trade_account_id AS trade_account_id,
             c.name AS name, c.sale_price_p AS sale_price_p
      FROM pouriq_cocktails c
      JOIN pouriq_menus m ON m.id = c.menu_id
      WHERE c.id = ?1 AND m.trade_account_id = ?2
    `)
    .bind(cocktailId, tradeAccountId)
    .first<CocktailLookup>()
  return row ?? null
}

async function loadCocktailForCopy(
  db: D1Database,
  cocktailId: string,
): Promise<CocktailForCopy> {
  const head = await db
    .prepare(`SELECT name, sale_price_p FROM pouriq_cocktails WHERE id = ?1`)
    .bind(cocktailId)
    .first<{ name: string; sale_price_p: number | null }>()
  const ings = await db
    .prepare(`
      SELECT lib.name AS name, i.pour_ml AS pour_ml, i.unit_count AS unit_count
      FROM pouriq_ingredients i
      JOIN pouriq_ingredients_library lib ON lib.id = i.library_ingredient_id
      WHERE i.cocktail_id = ?1
    `)
    .bind(cocktailId)
    .all<{ name: string; pour_ml: number | null; unit_count: number | null }>()
  return {
    name: head?.name ?? '',
    sale_price_p: head?.sale_price_p ?? null,
    abv: null, // pouriq_cocktails has no ABV column; reserved for future use
    ingredients: ings.results ?? [],
  }
}

export async function POST(request: Request, { params }: Params) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { cocktailId } = await params
  const { env } = await getCloudflareContext()
  const kv = env.SITE_OPS as KVNamespace
  const db = env.DB as D1Database

  if (!env.ANTHROPIC_API_KEY) {
    Sentry.captureMessage('pouriq-description-generate: ANTHROPIC_API_KEY missing', {
      tags: { route: 'pouriq-description-generate', phase: 'config' },
    })
    return NextResponse.json({ error: 'Description generation is temporarily unavailable.' }, { status: 503 })
  }

  if (await isRateLimited(kv, 'pouriq-description-gen', access.tradeAccountId, GENERATE_RATE_LIMIT, 3600)) {
    return NextResponse.json({ error: 'Too many generations. Please try again later.' }, { status: 429 })
  }

  const cocktail = await loadCocktailForTenant(db, cocktailId, access.tradeAccountId)
  if (!cocktail) return NextResponse.json({ error: 'Cocktail not found' }, { status: 404 })

  const profile = await getVoiceProfile(db, access.tradeAccountId)
  if (!profile) {
    return NextResponse.json(
      { error: 'Set your Voice Profile first.', settings_url: '/trade/pouriq/settings/voice-profile' },
      { status: 400 },
    )
  }

  const cocktailForCopy = await loadCocktailForCopy(db, cocktailId)

  try {
    const description = await generateDescriptionWithAnthropic({
      apiKey: env.ANTHROPIC_API_KEY,
      profile,
      cocktail: cocktailForCopy,
    })
    return NextResponse.json({ description })
  } catch (err) {
    Sentry.captureException(err, { tags: { route: 'pouriq-description-generate', phase: 'anthropic' } })
    return NextResponse.json({ error: 'Could not generate a description. Try again.' }, { status: 502 })
  }
}

export async function PUT(request: Request, { params }: Params) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { cocktailId } = await params
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database

  const cocktail = await loadCocktailForTenant(db, cocktailId, access.tradeAccountId)
  if (!cocktail) return NextResponse.json({ error: 'Cocktail not found' }, { status: 404 })

  let body: { description: string | null }
  try {
    body = (await request.json()) as { description: string | null }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const description = body.description === null ? null : String(body.description).trim()
  if (description !== null && description.length > 2000) {
    return NextResponse.json({ error: 'Description is too long (max 2000 chars).' }, { status: 400 })
  }

  await db
    .prepare(`
      UPDATE pouriq_cocktails
      SET description = ?1, description_updated_at = CASE WHEN ?1 IS NULL THEN NULL ELSE datetime('now') END
      WHERE id = ?2
    `)
    .bind(description, cocktailId)
    .run()

  return NextResponse.json({ description })
}
```

- [ ] **Step 2: Verify build**

```
npm run build
```

- [ ] **Step 3: Commit**

```
git add src/app/api/pouriq/cocktails/[cocktailId]/description/generate/route.ts
git commit -m "feat(pouriq): per-drink description generate + save route"
```

---

### Task 8: Bulk generation API route

**Files:**
- Create: `src/app/api/pouriq/menus/[menuId]/descriptions/generate-bulk/route.ts`

Iterates over drinks on the menu that have no description yet (or all drinks if `force=true` in body), calls the Anthropic helper for each in sequence, writes results, returns the per-drink outcome.

- [ ] **Step 1: Create the file**

```ts
// POST /api/pouriq/menus/[menuId]/descriptions/generate-bulk
//   Body: { force?: boolean }
//   If force is true, regenerates every drink. Otherwise only drinks without
//   an existing description. Returns per-drink result list (description or error).

import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { isAllowedOrigin, isRateLimited } from '@/lib/kv'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { getMenu } from '@/lib/pouriq/menus'
import { getVoiceProfile } from '@/lib/pouriq/voice-profile'
import { generateDescriptionWithAnthropic, type CocktailForCopy } from '@/lib/pouriq/menu-copy'

export const runtime = 'nodejs'

const BULK_RATE_LIMIT = 30 // bulk runs per hour per tenant

interface Params {
  params: Promise<{ menuId: string }>
}

interface DrinkRow {
  id: string
  name: string
  sale_price_p: number | null
  description: string | null
}

interface IngredientRow {
  cocktail_id: string
  name: string
  pour_ml: number | null
  unit_count: number | null
}

export interface BulkResult {
  cocktail_id: string
  name: string
  description?: string
  error?: string
}

export async function POST(request: Request, { params }: Params) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const access = await checkPourIqAccess()
  if (access.kind !== 'ok') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { menuId } = await params
  const { env } = await getCloudflareContext()
  const kv = env.SITE_OPS as KVNamespace
  const db = env.DB as D1Database

  if (!env.ANTHROPIC_API_KEY) {
    Sentry.captureMessage('pouriq-description-bulk: ANTHROPIC_API_KEY missing', {
      tags: { route: 'pouriq-description-bulk', phase: 'config' },
    })
    return NextResponse.json({ error: 'Description generation is temporarily unavailable.' }, { status: 503 })
  }

  if (await isRateLimited(kv, 'pouriq-description-bulk', access.tradeAccountId, BULK_RATE_LIMIT, 3600)) {
    return NextResponse.json({ error: 'Too many bulk runs. Please try again later.' }, { status: 429 })
  }

  const menu = await getMenu(db, menuId, access.tradeAccountId)
  if (!menu) return NextResponse.json({ error: 'Menu not found' }, { status: 404 })

  const profile = await getVoiceProfile(db, access.tradeAccountId)
  if (!profile) {
    return NextResponse.json(
      { error: 'Set your Voice Profile first.', settings_url: '/trade/pouriq/settings/voice-profile' },
      { status: 400 },
    )
  }

  let body: { force?: boolean } = {}
  try {
    body = (await request.json()) as { force?: boolean }
  } catch {
    // empty body is fine; default to non-force
  }
  const force = body.force === true

  const drinks = (
    await db
      .prepare(`SELECT id, name, sale_price_p, description FROM pouriq_cocktails WHERE menu_id = ?1 ORDER BY position ASC, name ASC`)
      .bind(menuId)
      .all<DrinkRow>()
  ).results ?? []
  const targetDrinks = force ? drinks : drinks.filter((d) => d.description === null || d.description.trim() === '')
  if (targetDrinks.length === 0) {
    return NextResponse.json({ results: [], note: 'No drinks need a description.' })
  }

  const ingsAll = (
    await db
      .prepare(`
        SELECT i.cocktail_id AS cocktail_id, lib.name AS name, i.pour_ml AS pour_ml, i.unit_count AS unit_count
        FROM pouriq_ingredients i
        JOIN pouriq_ingredients_library lib ON lib.id = i.library_ingredient_id
        WHERE i.cocktail_id IN (SELECT id FROM pouriq_cocktails WHERE menu_id = ?1)
      `)
      .bind(menuId)
      .all<IngredientRow>()
  ).results ?? []
  const ingsByCocktail = new Map<string, IngredientRow[]>()
  for (const ing of ingsAll) {
    const list = ingsByCocktail.get(ing.cocktail_id) ?? []
    list.push(ing)
    ingsByCocktail.set(ing.cocktail_id, list)
  }

  const results: BulkResult[] = []
  for (const drink of targetDrinks) {
    const cocktail: CocktailForCopy = {
      name: drink.name,
      sale_price_p: drink.sale_price_p,
      abv: null,
      ingredients: (ingsByCocktail.get(drink.id) ?? []).map((i) => ({
        name: i.name,
        pour_ml: i.pour_ml,
        unit_count: i.unit_count,
      })),
    }
    try {
      const description = await generateDescriptionWithAnthropic({
        apiKey: env.ANTHROPIC_API_KEY,
        profile,
        cocktail,
      })
      await db
        .prepare(`UPDATE pouriq_cocktails SET description = ?1, description_updated_at = datetime('now') WHERE id = ?2`)
        .bind(description, drink.id)
        .run()
      results.push({ cocktail_id: drink.id, name: drink.name, description })
    } catch (err) {
      Sentry.captureException(err, {
        tags: { route: 'pouriq-description-bulk', phase: 'anthropic' },
        extra: { cocktail_id: drink.id },
      })
      results.push({
        cocktail_id: drink.id,
        name: drink.name,
        error: (err as Error).message || 'Generation failed',
      })
    }
  }
  return NextResponse.json({ results })
}
```

- [ ] **Step 2: Verify build**

```
npm run build
```

- [ ] **Step 3: Commit**

```
git add src/app/api/pouriq/menus/[menuId]/descriptions/generate-bulk/route.ts
git commit -m "feat(pouriq): bulk description generation route"
```

---

### Task 9: GenerateDescriptionModal client component

**Files:**
- Create: `src/components/pouriq/GenerateDescriptionModal.tsx`

A trigger button that opens a modal, calls the per-drink generate endpoint, lets the manager edit, then saves via PUT.

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from '@/lib/pouriq/button-styles'

interface Props {
  cocktailId: string
  cocktailName: string
  existingDescription: string | null
}

export function GenerateDescriptionModal({ cocktailId, cocktailName, existingDescription }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(existingDescription ?? '')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settingsUrl, setSettingsUrl] = useState<string | null>(null)
  const [saving, startSave] = useTransition()

  async function generate() {
    setGenerating(true)
    setError(null)
    setSettingsUrl(null)
    try {
      const res = await fetch(`/api/pouriq/cocktails/${encodeURIComponent(cocktailId)}/description/generate`, {
        method: 'POST',
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({ error: 'Generation failed' }))) as { error?: string; settings_url?: string }
        setError(err.error ?? 'Generation failed')
        if (err.settings_url) setSettingsUrl(err.settings_url)
        return
      }
      const data = (await res.json()) as { description: string }
      setText(data.description)
    } finally {
      setGenerating(false)
    }
  }

  function save() {
    setError(null)
    startSave(async () => {
      const res = await fetch(`/api/pouriq/cocktails/${encodeURIComponent(cocktailId)}/description/generate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: text.trim() || null }),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({ error: 'Save failed' }))) as { error?: string }
        setError(err.error ?? 'Save failed')
        return
      }
      setOpen(false)
      router.refresh()
    })
  }

  const buttonLabel = existingDescription ? 'Regenerate description' : 'Generate description'

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setText(existingDescription ?? '')
          setError(null)
          setSettingsUrl(null)
          setOpen(true)
        }}
        className="text-xs text-gold-300 hover:text-gold-200 underline"
      >
        {buttonLabel}
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="mx-auto w-full max-w-xl rounded-xl bg-jerry-green-900 border border-gold-500/30 p-6 max-h-[90vh] overflow-y-auto">
            <DialogTitle className="text-lg font-serif font-bold text-white mb-1">Description for {cocktailName}</DialogTitle>
            <p className="text-xs text-parchment-400 mb-4">Edit before saving. Regenerate as many times as you like.</p>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Click Generate to start, or write your own description."
              className="w-full min-h-[160px] px-3 py-2 bg-jerry-green-700/50 border border-gold-500/30 rounded text-parchment-50 focus:border-gold-400 focus:outline-none"
              aria-label="Description text"
            />

            {error && (
              <p role="alert" className="text-sm text-red-300 mt-3">
                {error}
                {settingsUrl && (
                  <>
                    {' '}
                    <a href={settingsUrl} className="underline text-gold-300">Set Voice Profile</a>
                  </>
                )}
              </p>
            )}

            <div className="flex flex-wrap justify-end gap-2 mt-5">
              <button type="button" onClick={() => setOpen(false)} className={SECONDARY_BUTTON}>Cancel</button>
              <button
                type="button"
                onClick={generate}
                disabled={generating || saving}
                className={SECONDARY_BUTTON}
              >
                {generating ? 'Generating…' : existingDescription || text.trim() ? 'Regenerate' : 'Generate'}
              </button>
              <button type="button" onClick={save} disabled={saving || generating} className={PRIMARY_BUTTON}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}
```

- [ ] **Step 2: Verify build**

```
npm run build
```

- [ ] **Step 3: Commit**

```
git add src/components/pouriq/GenerateDescriptionModal.tsx
git commit -m "feat(pouriq): GenerateDescriptionModal with edit + save"
```

---

### Task 10: BulkGenerateDescriptionsButton component

**Files:**
- Create: `src/components/pouriq/BulkGenerateDescriptionsButton.tsx`

A trigger button + confirm dialog + result review modal.

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from '@/lib/pouriq/button-styles'

interface Props {
  menuId: string
  missingCount: number   // number of drinks currently without a description
}

interface BulkResult {
  cocktail_id: string
  name: string
  description?: string
  error?: string
}

export function BulkGenerateDescriptionsButton({ menuId, missingCount }: Props) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [resultsOpen, setResultsOpen] = useState(false)
  const [results, setResults] = useState<BulkResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [settingsUrl, setSettingsUrl] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function run() {
    setConfirmOpen(false)
    setError(null)
    setSettingsUrl(null)
    startTransition(async () => {
      const res = await fetch(`/api/pouriq/menus/${encodeURIComponent(menuId)}/descriptions/generate-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({ error: 'Bulk run failed' }))) as { error?: string; settings_url?: string }
        setError(err.error ?? 'Bulk run failed')
        if (err.settings_url) setSettingsUrl(err.settings_url)
        return
      }
      const data = (await res.json()) as { results: BulkResult[] }
      setResults(data.results)
      setResultsOpen(true)
      router.refresh()
    })
  }

  const disabled = pending || missingCount === 0

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={disabled}
        className={SECONDARY_BUTTON}
        title={missingCount === 0 ? 'All drinks already have a description.' : undefined}
      >
        {pending ? 'Generating…' : `Generate for ${missingCount} drink${missingCount === 1 ? '' : 's'}`}
      </button>

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="mx-auto w-full max-w-md rounded-xl bg-jerry-green-900 border border-gold-500/30 p-6">
            <DialogTitle className="text-lg font-serif font-bold text-white mb-2">Generate descriptions?</DialogTitle>
            <p className="text-sm text-parchment-300 mb-5">
              This will generate descriptions for {missingCount} drink{missingCount === 1 ? '' : 's'} using your Voice Profile. You can edit each one afterwards.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmOpen(false)} className={SECONDARY_BUTTON}>Cancel</button>
              <button type="button" onClick={run} className={PRIMARY_BUTTON}>Generate</button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Results dialog */}
      <Dialog open={resultsOpen} onClose={() => setResultsOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="mx-auto w-full max-w-xl rounded-xl bg-jerry-green-900 border border-gold-500/30 p-6 max-h-[90vh] overflow-y-auto">
            <DialogTitle className="text-lg font-serif font-bold text-white mb-3">Bulk generation complete</DialogTitle>
            <ul className="space-y-3">
              {results.map((r) => (
                <li key={r.cocktail_id} className="border-b border-gold-500/10 pb-3 last:border-0">
                  <p className="text-sm font-semibold text-parchment-100">{r.name}</p>
                  {r.description ? (
                    <p className="text-sm text-parchment-300 mt-1">{r.description}</p>
                  ) : (
                    <p role="alert" className="text-sm text-red-300 mt-1">{r.error ?? 'Failed'}</p>
                  )}
                </li>
              ))}
            </ul>
            <div className="flex justify-end mt-5">
              <button type="button" onClick={() => setResultsOpen(false)} className={PRIMARY_BUTTON}>Done</button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {error && (
        <p role="alert" className="text-sm text-red-300 mt-2">
          {error}
          {settingsUrl && (
            <>
              {' '}
              <a href={settingsUrl} className="underline text-gold-300">Set Voice Profile</a>
            </>
          )}
        </p>
      )}
    </>
  )
}
```

- [ ] **Step 2: Verify build**

```
npm run build
```

- [ ] **Step 3: Commit**

```
git add src/components/pouriq/BulkGenerateDescriptionsButton.tsx
git commit -m "feat(pouriq): BulkGenerateDescriptionsButton with confirm + results review"
```

---

### Task 11: Mount buttons on the menu page

**Files:**
- Modify: `src/app/trade/pouriq/[menuId]/page.tsx`

The per-drink GenerateDescriptionModal goes on each cocktail row (or wherever drinks are rendered). The BulkGenerateDescriptionsButton goes in the menu page header alongside other actions. The Menu copy export link also gets added to the header.

- [ ] **Step 1: Read the file**

Open `src/app/trade/pouriq/[menuId]/page.tsx` to identify (a) where existing header action buttons live (Compare / Library / Integrations / New menu pattern from sibling pages), and (b) where each cocktail row is rendered — likely via `<CocktailsList>` or directly inside the page.

If cocktails are rendered via a child component (e.g. `CocktailsList`), the per-drink modal mount belongs in THAT child, and you'll need a follow-up edit to that file. Surface the file name in your report if so.

- [ ] **Step 2: Add the imports at the top of the page**

Add (next to existing pouriq component imports):

```tsx
import { BulkGenerateDescriptionsButton } from '@/components/pouriq/BulkGenerateDescriptionsButton'
```

- [ ] **Step 3: Compute missingCount in the page body**

Inside the default-exported async function, after the page fetches the list of cocktails for the menu, compute:

```tsx
const missingCount = cocktails.filter((c) => !c.description || c.description.trim() === '').length
```

If the page's cocktail row type doesn't already include `description`, also add `description` to the query / type that loads them. The base table now has the column from Task 1; the loader needs to SELECT it. Locate the cocktail fetch (most likely in `src/lib/pouriq/menus.ts` → `listCocktailsForMenu`) and extend the SELECT list + the row type to include `description: string | null`. Do this as part of this task.

- [ ] **Step 4: Add the bulk button + menu-copy link to the page header**

Wherever the page renders top-of-page action buttons for the menu (the "Edit menu / Import drinks / Compare versions / etc." cluster), append:

```tsx
<BulkGenerateDescriptionsButton menuId={menuId} missingCount={missingCount} />
<Link href={`/trade/pouriq/${menuId}/menu-copy`} className={SECONDARY_BUTTON}>Menu copy</Link>
```

Use the file's existing `SECONDARY_BUTTON` import (or import from `@/lib/pouriq/button-styles` if not already imported). Match the visual rhythm of sibling buttons.

- [ ] **Step 5: Mount the per-drink modal on each cocktail row**

In the component that renders each cocktail row (the page itself or `CocktailsList`), import:

```tsx
import { GenerateDescriptionModal } from '@/components/pouriq/GenerateDescriptionModal'
```

For each cocktail row, add a `no-print` section beneath the existing per-cocktail content:

```tsx
<div className="no-print mt-1">
  <GenerateDescriptionModal
    cocktailId={cocktail.id}
    cocktailName={cocktail.name}
    existingDescription={cocktail.description ?? null}
  />
</div>
```

If the saved description exists, render it visibly above the modal trigger so the manager sees it without opening the modal:

```tsx
{cocktail.description && (
  <p className="text-sm text-parchment-300 italic mt-2">{cocktail.description}</p>
)}
```

If the cocktail row layout makes a one-line mount impossible (e.g. it's a print-only table with no editable area), STOP and surface — don't shoehorn it in. Report BLOCKED with the actual structure.

- [ ] **Step 6: Verify build**

```
npm run build
```

- [ ] **Step 7: Commit**

```
git add src/app/trade/pouriq/[menuId]/page.tsx src/lib/pouriq/menus.ts
git commit -m "feat(pouriq): mount generation buttons on menu page; include description in cocktail loader"
```

(Adjust the git-add file list to match the actual files you changed — at minimum the menu page, plus the loader if you extended it, plus any cocktail-row child component you modified.)

---

### Task 12: Menu copy export page

**Files:**
- Create: `src/app/trade/pouriq/[menuId]/menu-copy/page.tsx`
- Create: `src/components/pouriq/MenuCopyExport.tsx`

The page is a server component that loads the menu + cocktails + descriptions. The client component handles copy-to-clipboard and download.

- [ ] **Step 1: Create the export client component**

```tsx
'use client'

import { useState } from 'react'
import { SECONDARY_BUTTON } from '@/lib/pouriq/button-styles'

interface Drink {
  name: string
  description: string | null
  sale_price_p: number | null
}

interface Props {
  menuName: string
  drinks: Drink[]
}

function formatPlainText(menuName: string, drinks: Drink[]): string {
  const lines: string[] = []
  lines.push(menuName.toUpperCase())
  lines.push('')
  for (const d of drinks) {
    const price = d.sale_price_p ? ` — £${(d.sale_price_p / 100).toFixed(2)}` : ''
    lines.push(`${d.name.toUpperCase()}${price}`)
    if (d.description) lines.push(d.description)
    else lines.push('(no description)')
    lines.push('')
  }
  return lines.join('\n').trimEnd() + '\n'
}

function formatMarkdown(menuName: string, drinks: Drink[]): string {
  const lines: string[] = []
  lines.push(`# ${menuName}`)
  lines.push('')
  for (const d of drinks) {
    const price = d.sale_price_p ? ` *£${(d.sale_price_p / 100).toFixed(2)}*` : ''
    lines.push(`## ${d.name}${price}`)
    if (d.description) lines.push(d.description)
    else lines.push('*(no description)*')
    lines.push('')
  }
  return lines.join('\n').trimEnd() + '\n'
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function MenuCopyExport({ menuName, drinks }: Props) {
  const [copied, setCopied] = useState<'txt' | 'md' | null>(null)

  async function copyTo(format: 'txt' | 'md') {
    const content = format === 'txt' ? formatPlainText(menuName, drinks) : formatMarkdown(menuName, drinks)
    try {
      await navigator.clipboard.writeText(content)
      setCopied(format)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // Clipboard may not be available; fall back to download.
      download(`menu-copy.${format}`, content, format === 'txt' ? 'text/plain' : 'text/markdown')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => copyTo('txt')} className={SECONDARY_BUTTON}>
          {copied === 'txt' ? 'Copied' : 'Copy as plain text'}
        </button>
        <button type="button" onClick={() => copyTo('md')} className={SECONDARY_BUTTON}>
          {copied === 'md' ? 'Copied' : 'Copy as markdown'}
        </button>
        <button
          type="button"
          onClick={() => download('menu-copy.txt', formatPlainText(menuName, drinks), 'text/plain')}
          className={SECONDARY_BUTTON}
        >
          Download .txt
        </button>
        <button
          type="button"
          onClick={() => download('menu-copy.md', formatMarkdown(menuName, drinks), 'text/markdown')}
          className={SECONDARY_BUTTON}
        >
          Download .md
        </button>
      </div>

      <div className="bg-jerry-green-800/40 border border-gold-500/20 rounded-xl p-6">
        <pre className="whitespace-pre-wrap text-sm text-parchment-100 font-sans">
{formatPlainText(menuName, drinks)}
        </pre>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create the page**

```tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { checkPourIqAccess } from '@/lib/pouriq/access'
import { LicenceGate } from '@/components/pouriq/LicenceGate'
import { getMenu } from '@/lib/pouriq/menus'
import { MenuCopyExport } from '@/components/pouriq/MenuCopyExport'

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ menuId: string }>
}

interface DrinkRow {
  name: string
  description: string | null
  sale_price_p: number | null
}

export default async function MenuCopyPage({ params }: Params) {
  const access = await checkPourIqAccess()
  if (access.kind === 'no-session') redirect('/trade/login')
  if (access.kind === 'no-licence') return <LicenceGate />

  const { menuId } = await params
  const { env } = await getCloudflareContext()
  const db = env.DB as D1Database

  const menu = await getMenu(db, menuId, access.tradeAccountId)
  if (!menu) redirect('/trade/pouriq')

  const drinks = (
    await db
      .prepare(`SELECT name, description, sale_price_p FROM pouriq_cocktails WHERE menu_id = ?1 ORDER BY position ASC, name ASC`)
      .bind(menuId)
      .all<DrinkRow>()
  ).results ?? []

  return (
    <main className="min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        <Link href={`/trade/pouriq/${menuId}`} className="text-sm text-parchment-400 hover:text-parchment-200">← {menu.name}</Link>
        <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mt-3 mb-6">
          <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">Pour IQ™</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-3">Menu copy</h1>
        <p className="text-parchment-300 text-base leading-relaxed mb-8">
          Every drink on this menu with its saved description. Copy to clipboard or download to hand to your designer.
        </p>
        {drinks.length === 0 ? (
          <p className="text-parchment-300">No drinks on this menu yet.</p>
        ) : (
          <MenuCopyExport menuName={menu.name} drinks={drinks} />
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Verify build**

```
npm run build
```

Expected: PASS. New route `/trade/pouriq/[menuId]/menu-copy`.

- [ ] **Step 4: Commit**

```
git add src/app/trade/pouriq/[menuId]/menu-copy/page.tsx src/components/pouriq/MenuCopyExport.tsx
git commit -m "feat(pouriq): menu copy export page (.txt / .md / clipboard)"
```

---

### Task 13: Add Voice Profile link to Pour IQ™ dashboard

**Files:**
- Modify: `src/app/trade/pouriq/page.tsx`

The dashboard's existing action cluster (Compare / Library / Integrations / New menu) should gain a "Voice Profile" entry under settings. Currently the dashboard has a single "Integrations" settings link. Add a parallel one.

- [ ] **Step 1: Read the file**

Open `src/app/trade/pouriq/page.tsx`. Confirm the action cluster shape.

- [ ] **Step 2: Add the link**

Inside the action cluster, add (alphabetical-adjacent or grouped with the other settings link):

```tsx
<Link href="/trade/pouriq/settings/voice-profile" className={SECONDARY_BUTTON}>Voice Profile</Link>
```

- [ ] **Step 3: Verify build + commit**

```
npm run build
git add src/app/trade/pouriq/page.tsx
git commit -m "feat(pouriq): link Voice Profile from dashboard"
```

---

### Task 14: Apply migration to production D1

- [ ] **Step 1: Apply remote migration**

```
npx wrangler d1 migrations apply jerry-can-spirits-db --remote
```

Expected: `0027_pouriq_brand_voice.sql` shown as applied.

- [ ] **Step 2: Verify the new table and columns**

```
npx wrangler d1 execute jerry-can-spirits-db --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name = 'pouriq_voice_profiles'"
```

Expected: one row.

```
npx wrangler d1 execute jerry-can-spirits-db --remote --command "PRAGMA table_info(pouriq_cocktails)"
```

Expected: list includes `description` and `description_updated_at`.

---

### Task 15: Final build + scoped lint

- [ ] **Step 1: Build**

```
npm run build
```

Expected: PASS. Build manifest now includes:
- `/api/pouriq/cocktails/[cocktailId]/description/generate` route
- `/api/pouriq/menus/[menuId]/descriptions/generate-bulk` route
- `/trade/pouriq/settings/voice-profile` page
- `/trade/pouriq/[menuId]/menu-copy` page

- [ ] **Step 2: Scoped lint**

```
npx eslint migrations/0027_pouriq_brand_voice.sql src/lib/pouriq/voice-profile.ts src/lib/pouriq/menu-copy.ts src/lib/pouriq/server-actions.ts src/components/pouriq/VoiceProfileForm.tsx src/components/pouriq/GenerateDescriptionModal.tsx src/components/pouriq/BulkGenerateDescriptionsButton.tsx src/components/pouriq/MenuCopyExport.tsx src/app/trade/pouriq/settings/voice-profile/page.tsx src/app/trade/pouriq/[menuId]/menu-copy/page.tsx src/app/api/pouriq/cocktails/[cocktailId]/description/generate/route.ts src/app/api/pouriq/menus/[menuId]/descriptions/generate-bulk/route.ts src/app/trade/pouriq/[menuId]/page.tsx src/app/trade/pouriq/page.tsx 2>&1 || true
```

The `.sql` file is skipped by ESLint; all the others should pass clean.

No commit — verification only.

---

### Task 16: Push branch and open PR

- [ ] **Step 1: Push**

```
git push -u origin feat/pouriq-brand-voice
```

- [ ] **Step 2: Open the PR**

```
gh pr create --title "feat(pouriq): brand-voiced menu copy" --body "$(cat <<'EOF'
## Summary

Bar manager configures a per-tenant Voice Profile (tone, person, length, hard rules, 1-3 sample descriptions, free-text notes) once. Pour IQ™ then generates brand-voiced drink descriptions per-drink or in bulk, saved to \`pouriq_cocktails.description\`. The full menu can be exported as plain text or markdown for handing to a designer.

UK-only moat — no Pour IQ™ competitor produces brand-voiced copy.

## What ships

- **Schema** \`pouriq_voice_profiles\` table + \`description\` / \`description_updated_at\` columns on \`pouriq_cocktails\` (migration 0027). Already applied to production D1.
- **DAO** \`src/lib/pouriq/voice-profile.ts\` — typed read + UPSERT with JSON-encoded rules/samples.
- **Prompt assembly + Anthropic call** \`src/lib/pouriq/menu-copy.ts\` — pure helpers \`assemblePromptSystem\`, \`assemblePromptUser\`, \`sanitiseGeneratedText\` plus the HTTP wrapper around Claude Sonnet 4.6.
- **Server action** \`setVoiceProfileAction\` for upsert (with validation).
- **API routes:**
  - \`POST /api/pouriq/cocktails/[cocktailId]/description/generate\` — generate one
  - \`PUT  /api/pouriq/cocktails/[cocktailId]/description/generate\` — save the edited text
  - \`POST /api/pouriq/menus/[menuId]/descriptions/generate-bulk\` — generate for all drinks without one (or \`force\` to regenerate)
- **UI:**
  - \`/trade/pouriq/settings/voice-profile\` — 6-field questionnaire
  - Per-drink \`GenerateDescriptionModal\` on each cocktail row
  - \`BulkGenerateDescriptionsButton\` on the menu page header
  - \`/trade/pouriq/[menuId]/menu-copy\` — export page with copy-to-clipboard + .txt / .md download
- **Dashboard link** to Voice Profile under settings.

## What this is NOT (deferred)

- **Versioning** of profiles or descriptions. Edits overwrite in place.
- **PDF export** in v1. Plain text + markdown is enough for a designer.
- **Multilingual.** English only.
- **Auto-generation** on menu creation. Always explicit.
- **Cost estimates** in the bulk confirm dialog. Kept simple.

## Spec

[\`docs/superpowers/specs/2026-05-16-pouriq-brand-voiced-menu-copy-design.md\`](../blob/main/docs/superpowers/specs/2026-05-16-pouriq-brand-voiced-menu-copy-design.md)

## Help guide

A new section \"Generating menu copy\" is drafted in the same session that ships this PR (per the help-guide style memory rule). To be pasted into Sanity Studio post-merge by the brand-voice owner.

## Test plan

- [x] \`npm run build\` clean
- [x] Scoped lint on touched files clean
- [x] Migration applied to production D1; new table + columns confirmed
- [ ] **Deploy-preview walkthrough:**
  - Visit \`/trade/pouriq/settings/voice-profile\` — empty form, friendly empty-state copy.
  - Fill out form, save → success message.
  - Re-visit page → form pre-filled.
  - On a menu page with no Voice Profile cleared first: per-drink \"Generate\" returns 400 with \"Set your Voice Profile\" link.
  - With profile set: per-drink modal opens, generates description, edit, save → row updates without reload.
  - Bulk button: confirm dialog, run, results dialog shows N descriptions with per-drink success/error breakdown.
  - Switch tone from refined → cheeky in profile, regenerate a drink → output character clearly different.
  - Export page: shows preview, Copy as plain text works, Download .md downloads correctly.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Confirm PR URL printed**

---

### Task 17: Draft the help-guide section

Per the help-guide workflow rule, draft section title **"Generating menu copy"** for the bar-help accordion. Slots after the variance section.

This task produces a markdown blob to hand to the user. No code or commits.

- [ ] **Step 1: Read the just-built UI labels to confirm shipped copy**

Open `src/components/pouriq/VoiceProfileForm.tsx`, `GenerateDescriptionModal.tsx`, `BulkGenerateDescriptionsButton.tsx`, and `MenuCopyExport.tsx`. Confirm exact labels:
- Form heading: "Voice Profile"
- Buttons: "Save Voice Profile", "Generate description", "Regenerate description", "Generate for N drink(s)", "Copy as plain text", "Copy as markdown", "Download .txt", "Download .md"
- Modal headings: "Description for {name}", "Generate descriptions?", "Bulk generation complete"
- Empty-state copy: "Tell Pour IQ™ how your bar sounds. The AI uses this every time it writes a description, so do it once and forget it."

- [ ] **Step 2: Produce the section body**

Section title: `Generating menu copy`

Body (paste into Sanity Studio body field; subheading lines become their own paragraphs with H3 styling applied):

```
Pour IQ™ writes drink descriptions in your bar's voice. You configure the voice once, then generate descriptions per drink or for a whole menu. Export the result for your menu designer.

Where it lives

Voice Profile lives under Pour IQ™ → Voice Profile. The per-drink Generate button is on every cocktail row on a menu page. The bulk button and Menu copy export link are in the menu page header.

Setting your Voice Profile

The questionnaire has six fields. Tone (refined, casual, cheeky, classic, minimal, or your own description), Person ("we", "I", "you", or third-person), Length (short, medium, long), Hard rules (check the ones that apply — no em-dashes, no exclamations, no emojis, no superlatives, no hype words, no brand-as-verb — plus any of your own), Sample descriptions (paste 1-3 examples — yours, a competitor's, anything you like the cadence of), and Anything else (free text for facts the AI should know or avoid).

The samples do the heaviest lifting. Concrete examples beat abstract descriptors every time. Paste real writing you wish your menu sounded like.

Generating per drink

On a menu page, each drink shows a Generate description button. Click it → modal opens → click Generate → AI writes a description using your Voice Profile → edit if needed → Save. Re-open later to Regenerate. The saved description is shown on the row in italics.

Bulk generation

On the menu page header, the button reads "Generate for N drinks" where N is the count of drinks without a description. Click → confirm → AI generates each in sequence → review the results dialog. Any individual drink can be regenerated afterwards.

Exporting menu copy

Click Menu copy on the menu page header. The export page shows every drink with its description, ready to copy or download. Plain text is good for designers who want clean copy to flow into InDesign. Markdown is good if your designer wants headings preserved.

Common reasons output comes back "off"

Your samples don't reflect the voice you actually want. Replace them with stronger examples.
You picked Length: Short but want more atmosphere. Switch to Medium.
You forgot to tick "No exclamation marks" and the AI added some. Tick the rule and regenerate.

Editing after generation

Save writes the AI's output to the cocktail. You can always re-open the modal and rewrite the description by hand. Once saved, that text is what shows in the export and on the menu page.
```

- [ ] **Step 3: Hand to the user**

Surface the section body verbatim in your final report so the controller can present it to the user for pasting into Sanity Studio.

---

## Self-review checklist (engineer)

Before requesting review on the PR:

- [ ] Branch was cut from up-to-date `origin/main` (already done at plan-write time)
- [ ] No `console.log` left behind (the `console.warn` in `sanitiseGeneratedText` is intentional diagnostic logging on the server)
- [ ] No `any` types introduced (use `unknown` with a cast if forced)
- [ ] No em-dashes, emojis, or exclamation marks in user-visible copy (heading copy, banner text, button labels)
- [ ] The menu page still renders correctly when (a) Voice Profile is unset, (b) Voice Profile is set, (c) all drinks have descriptions, (d) no drinks at all
- [ ] Per-drink generate endpoint returns the `settings_url` field when profile is missing — and the modal surfaces the link
- [ ] Bulk endpoint stops at the rate limit per tenant; partial results are still useful
- [ ] Pour IQ™ on first mention per visible string; ™ convention matches PR #678
