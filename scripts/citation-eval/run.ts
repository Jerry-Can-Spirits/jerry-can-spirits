/**
 * AI citation eval — monthly reading of whether the engines cite us, and
 * whether stale claims have cleared out of their indexes.
 *
 * Run: npm run citation-eval
 *
 * Keys come from the environment, never from source:
 *   OPENAI_API_KEY      ChatGPT (Responses API + web_search)
 *   ANTHROPIC_API_KEY   Claude (Messages API + web_search server tool)
 *   PERPLEXITY_API_KEY  Perplexity (chat/completions)
 *
 * Google AI Mode has no public API. It is recorded as a stub with a null
 * result for manual completion rather than scraped.
 */
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const RESULTS_DIR = join(HERE, 'results')
const OUR_DOMAIN = 'jerrycanspirits.co.uk'

// The claims that must not appear. Citation counts say whether the crawler work
// paid off; these say whether the stale claims are clearing out of the indexes
// and training data, which is the thing we cannot otherwise see.
const FACTUAL_FLAGS: Array<{ flag: string; pattern: RegExp }> = [
  { flag: 'pot-distilled', pattern: /pot[\s-]?distill/i },
  { flag: 'distilled-in-wales', pattern: /distilled\s+(in|at)\s+wales|welsh[\s-]?distilled|distilled.{0,30}\bwales\b/i },
  { flag: 'welsh-made', pattern: /welsh[\s-]?made|made\s+in\s+wales|genuinely\s+welsh/i },
  { flag: 'spirit-of-wales', pattern: /spirit\s+of\s+wales/i },
  { flag: 'molasses-claim', pattern: /(expedition|jerry\s*can)[^.]{0,120}molasses|molasses[^.]{0,120}(expedition|jerry\s*can)/i },
  { flag: 'wrong-botanical-count', pattern: /\b(eight|nine|ten|8|9|10)\s+(real\s+)?botanicals/i },
  { flag: 'bare-botanical-count', pattern: /\b(seven|7)\s+(real\s+)?botanicals/i },
  { flag: '700-bottles', pattern: /700\s+(numbered\s+)?bottles/i },
  // Time-dependent: £35 was the correct price until the rise to £45 on
  // 3 August 2026. A reading taken before that date flags a true answer as
  // stale, which is why the first automated run is scheduled after the change.
  { flag: 'price-35', pattern: /£\s?35(\.00)?\b/i },
  { flag: 'named-producer', pattern: /custom\s+spirit\s+co/i },
]

type QuestionSpec = {
  id: string
  band: string
  question: string
  target_url: string | null
  notes?: string
}

type Mode = 'retrieval' | 'training'

type Reading = {
  timestamp: string
  question_id: string
  band: string
  question: string
  target_url: string | null
  engine: string
  mode: Mode
  model: string | null
  cited: boolean | null
  urls: string[]
  our_urls: string[]
  position: number | null
  competitors: string[]
  answer_text: string | null
  factual_flags: string[]
  error: string | null
  stub: boolean
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

// Exact host or a true subdomain. A bare endsWith() would also match
// `evil-jerrycanspirits.co.uk`, which in a measurement tool means a lookalike
// domain silently counts as us being cited.
function isOurs(url: string): boolean {
  const h = hostOf(url)
  return h === OUR_DOMAIN || h.endsWith(`.${OUR_DOMAIN}`)
}

function flagsIn(text: string | null): string[] {
  if (!text) return []
  return FACTUAL_FLAGS.filter((f) => f.pattern.test(text)).map((f) => f.flag)
}

// Position of the first citation of ours among all cited URLs, 1-indexed.
// Null when we are not cited at all.
function analyse(urls: string[], text: string | null, q: QuestionSpec, base: Partial<Reading>): Reading {
  const unique = [...new Set(urls.filter(Boolean))]
  const ours = unique.filter(isOurs)
  const idx = unique.findIndex(isOurs)
  return {
    timestamp: new Date().toISOString(),
    question_id: q.id,
    band: q.band,
    question: q.question,
    target_url: q.target_url,
    engine: base.engine!,
    mode: base.mode!,
    model: base.model ?? null,
    cited: ours.length > 0,
    urls: unique,
    our_urls: ours,
    position: idx >= 0 ? idx + 1 : null,
    competitors: [...new Set(unique.filter((u) => !isOurs(u)).map(hostOf))].filter(Boolean),
    answer_text: text,
    factual_flags: flagsIn(text),
    error: base.error ?? null,
    stub: false,
  }
}

function errored(q: QuestionSpec, engine: string, mode: Mode, message: string): Reading {
  return {
    timestamp: new Date().toISOString(),
    question_id: q.id,
    band: q.band,
    question: q.question,
    target_url: q.target_url,
    engine,
    mode,
    model: null,
    cited: null,
    urls: [],
    our_urls: [],
    position: null,
    competitors: [],
    answer_text: null,
    factual_flags: [],
    error: message,
    stub: false,
  }
}

// --- ChatGPT: Responses API with the hosted web_search tool ----------------
async function askChatGPT(q: QuestionSpec, mode: Mode): Promise<Reading> {
  const key = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_MODEL || 'gpt-5'
  if (!key) return errored(q, 'chatgpt', mode, 'OPENAI_API_KEY not set')
  try {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      // retrieval = hosted web_search; training = no tools, so the model answers
      // from what it learned rather than what it can look up now.
      body: JSON.stringify({
        model,
        input: q.question,
        ...(mode === 'retrieval' ? { tools: [{ type: 'web_search' }] } : {}),
      }),
    })
    if (!res.ok) return errored(q, 'chatgpt', mode, `HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
    const data = (await res.json()) as Record<string, unknown>
    // Citations arrive as url_citation annotations on output_text content parts.
    const urls: string[] = []
    let text = ''
    const walk = (node: unknown): void => {
      if (Array.isArray(node)) return node.forEach(walk)
      if (!node || typeof node !== 'object') return
      const o = node as Record<string, unknown>
      if (o.type === 'output_text' && typeof o.text === 'string') text += o.text
      if (o.type === 'url_citation' && typeof o.url === 'string') urls.push(o.url)
      Object.values(o).forEach(walk)
    }
    walk(data.output)
    return analyse(urls, text || String(data.output_text ?? '') || null, q, { engine: 'chatgpt', mode, model })
  } catch (e) {
    return errored(q, 'chatgpt', mode, String(e).slice(0, 200))
  }
}

// --- Claude: Messages API with the web_search server tool ------------------
// web_search_20260209 is the current variant (dynamic filtering). Do not also
// declare code_execution: a second execution environment confuses the model.
async function askClaude(q: QuestionSpec, mode: Mode): Promise<Reading> {
  const key = process.env.ANTHROPIC_API_KEY
  const model = process.env.ANTHROPIC_MODEL || 'claude-opus-5'
  if (!key) return errored(q, 'claude', mode, 'ANTHROPIC_API_KEY not set')
  try {
    const client = new Anthropic({ apiKey: key })
    let messages: Anthropic.MessageParam[] = [{ role: 'user', content: q.question }]
    let response: Anthropic.Message | null = null
    // A server-tool turn can stop with pause_turn; re-send to resume. Bounded so
    // a pathological loop cannot run away.
    for (let i = 0; i < 5; i++) {
      response = await client.messages.create({
        model,
        max_tokens: 4096,
        ...(mode === 'retrieval'
          ? { tools: [{ type: 'web_search_20260209' as const, name: 'web_search' as const }] }
          : {}),
        messages,
      })
      if (response.stop_reason !== 'pause_turn') break
      messages = [...messages, { role: 'assistant', content: response.content }]
    }
    if (!response) return errored(q, 'claude', mode, 'no response')
    if (response.stop_reason === 'refusal') return errored(q, 'claude', mode, 'refusal')

    const urls: string[] = []
    let text = ''
    for (const block of response.content) {
      if (block.type === 'text') {
        text += block.text
        // Citations on text blocks carry the source URL.
        for (const c of (block as { citations?: Array<{ url?: string }> }).citations ?? []) {
          if (c.url) urls.push(c.url)
        }
      } else if (block.type === 'web_search_tool_result') {
        // Success content is a list of results; an error is a single object.
        const content = (block as { content?: unknown }).content
        if (Array.isArray(content)) {
          for (const r of content as Array<{ url?: string }>) if (r.url) urls.push(r.url)
        }
      }
    }
    return analyse(urls, text || null, q, { engine: 'claude', mode, model })
  } catch (e) {
    return errored(q, 'claude', mode, String(e).slice(0, 200))
  }
}

// --- Perplexity: chat/completions, citations in search_results -------------
// sonar models search by default, so every reading here is retrieval. There is
// no training-only mode to log; pretending otherwise would invent a data point.
async function askPerplexity(q: QuestionSpec): Promise<Reading> {
  const key = process.env.PERPLEXITY_API_KEY
  const model = process.env.PERPLEXITY_MODEL || 'sonar'
  if (!key) return errored(q, 'perplexity', 'retrieval', 'PERPLEXITY_API_KEY not set')
  try {
    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: q.question }] }),
    })
    if (!res.ok) return errored(q, 'perplexity', 'retrieval', `HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
      citations?: string[]
      search_results?: Array<{ url?: string }>
    }
    const urls = [...(data.citations ?? []), ...(data.search_results ?? []).map((r) => r.url ?? '')]
    return analyse(urls, data.choices?.[0]?.message?.content ?? null, q, { engine: 'perplexity', mode: 'retrieval', model })
  } catch (e) {
    return errored(q, 'perplexity', 'retrieval', String(e).slice(0, 200))
  }
}

// --- Google AI Mode: documented stub --------------------------------------
// No public API exists for AI Mode or AI Overviews. Scraping it would breach
// Google's terms and produce unstable data, so the run records the question
// with a null result for manual completion. It has the widest reach of the
// four and gave the most detailed wrong answer pre-deploy, so fill it in by
// hand each month rather than skipping it.
function askGoogleStub(q: QuestionSpec): Reading {
  return {
    timestamp: new Date().toISOString(),
    question_id: q.id,
    band: q.band,
    question: q.question,
    target_url: q.target_url,
    engine: 'google-ai-mode',
    mode: 'retrieval',
    model: null,
    cited: null,
    urls: [],
    our_urls: [],
    position: null,
    competitors: [],
    answer_text: null,
    factual_flags: [],
    error: 'no public API — record manually',
    stub: true,
  }
}

// Must exclude the current run: this is called after the run has already
// written its own file, which sorts last and would otherwise be picked as its
// own predecessor, silently skipping every diff.
function previousRunFile(currentFile: string): string | null {
  try {
    const current = currentFile.split(/[\\/]/).pop()
    const files = readdirSync(RESULTS_DIR)
      .filter(
        (f) => f.endsWith('.jsonl') && !f.startsWith('baseline') && !f.startsWith('partial-') && f !== current
      )
      .sort()
    return files.length ? join(RESULTS_DIR, files[files.length - 1]) : null
  } catch {
    return null
  }
}

function loadReadings(file: string): Reading[] {
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l) as Reading)
}

// Reported per mode, never collapsed. A flag clearing in retrieval while it
// persists in training is the expected and informative pattern: retrieval is
// what the crawler work changed and should move within weeks; training is what
// the model learned and only changes with the next model generation. One
// combined number hides exactly the signal worth having.
function diff(current: Reading[], previous: Reading[]): void {
  const key = (r: Reading) => `${r.question_id}:${r.engine}:${r.mode}`
  const prev = new Map(previous.map((r) => [key(r), r]))

  for (const mode of ['retrieval', 'training'] as Mode[]) {
    const newlyCited: string[] = []
    const newlyLost: string[] = []
    const flagsCleared: string[] = []
    const flagsAppeared: string[] = []

    for (const r of current.filter((x) => x.mode === mode)) {
      const p = prev.get(key(r))
      if (!p) continue
      const label = `${r.question_id}:${r.engine}`
      if (r.cited === true && p.cited === false) newlyCited.push(`${label} → ${r.our_urls[0] ?? ''}`)
      if (r.cited === false && p.cited === true) newlyLost.push(label)
      for (const f of p.factual_flags) if (!r.factual_flags.includes(f)) flagsCleared.push(`${label}: ${f}`)
      for (const f of r.factual_flags) if (!p.factual_flags.includes(f)) flagsAppeared.push(`${label}: ${f}`)
    }

    const section = (title: string, items: string[]) => {
      console.log(`  ${title} (${items.length})`)
      for (const i of items) console.log(`    ${i}`)
    }
    console.log(`\n--- ${mode.toUpperCase()} ---`)
    section('Newly cited', newlyCited)
    section('Newly lost', newlyLost)
    section('Factual flags CLEARED', flagsCleared)
    section('Factual flags NEWLY APPEARING', flagsAppeared)
  }
}

async function main() {
  // Load .env.local if present, same as scripts/submit-indexnow.ts. Shell
  // exports still win, so either route works.
  try {
    const dotenv = await import('dotenv')
    dotenv.config({ path: '.env.local' })
  } catch {
    // dotenv not installed: rely on shell-exported vars
  }
  mkdirSync(RESULTS_DIR, { recursive: true })
  const spec = JSON.parse(readFileSync(join(HERE, 'questions.json'), 'utf8')) as { questions: QuestionSpec[] }
  const questions = spec.questions
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const outFile = join(RESULTS_DIR, `${stamp}.jsonl`)

  // Engines that support both modes are asked twice per question: once able to
  // search (retrieval) and once not (training).
  const calls: Array<{ label: string; live: boolean; fn: (q: QuestionSpec) => Promise<Reading> }> = [
    { label: 'chatgpt/retrieval', live: !!process.env.OPENAI_API_KEY, fn: (q) => askChatGPT(q, 'retrieval') },
    { label: 'chatgpt/training', live: !!process.env.OPENAI_API_KEY, fn: (q) => askChatGPT(q, 'training') },
    { label: 'claude/retrieval', live: !!process.env.ANTHROPIC_API_KEY, fn: (q) => askClaude(q, 'retrieval') },
    { label: 'claude/training', live: !!process.env.ANTHROPIC_API_KEY, fn: (q) => askClaude(q, 'training') },
    { label: 'perplexity/retrieval', live: !!process.env.PERPLEXITY_API_KEY, fn: askPerplexity },
  ]
  console.log('Engines:')
  for (const c of calls) console.log(`  ${c.label}: ${c.live ? 'live' : 'SKIPPED (no key)'}`)
  console.log('  perplexity/training: N/A — sonar searches by default, no training-only mode exists')
  console.log('  google-ai-mode: STUB (no public API — record manually)\n')

  const readings: Reading[] = []
  for (const q of questions) {
    const row: Reading[] = []
    // Honour the `live` flag the banner already reports. Without this an engine
    // announced as SKIPPED still ran and wrote one error record per question,
    // so a run with a single configured key emitted three times the rows it had
    // data for — 152 of the 228 rows in the 2 Aug baseline are those stubs, and
    // they read as genuine null results rather than absent engines.
    for (const c of calls) {
      if (!c.live) continue
      row.push(await c.fn(q))
    }
    row.push(askGoogleStub(q))
    for (const r of row) {
      readings.push(r)
      appendFileSync(outFile, JSON.stringify(r) + '\n')
    }
    const cited = row.filter((r) => r.cited).map((r) => `${r.engine}/${r.mode[0]}`)
    const flags = [...new Set(row.flatMap((r) => r.factual_flags))]
    console.log(
      `${q.id} [${q.band}] cited: ${cited.length ? cited.join(',') : 'none'}${flags.length ? `  FLAGS: ${flags.join(',')}` : ''}`
    )
  }

  const live = readings.filter((r) => !r.stub && r.error === null)
  console.log(`\n=== SUMMARY ===`)
  console.log(`readings: ${live.length} live (+${readings.filter((r) => r.stub).length} stubs)`)
  // Split by mode: retrieval measures what the crawler work changed, training
  // measures what the models already learned. Averaging them is meaningless.
  for (const mode of ['retrieval', 'training'] as Mode[]) {
    const rows = live.filter((r) => r.mode === mode)
    if (!rows.length) continue
    const flagged = rows.filter((r) => r.factual_flags.length)
    const byFlag: Record<string, number> = {}
    for (const r of flagged) for (const f of r.factual_flags) byFlag[f] = (byFlag[f] || 0) + 1
    console.log(`\n  ${mode}: cited ${rows.filter((r) => r.cited).length}/${rows.length}, flagged ${flagged.length}`)
    if (Object.keys(byFlag).length) console.log(`  ${mode} flag counts:`, JSON.stringify(byFlag))
  }

  const prevFile = previousRunFile(outFile)
  if (prevFile) {
    diff(readings, loadReadings(prevFile))
    console.log(`\n(compared against ${prevFile.split(/[\\/]/).pop()})`)
  } else {
    console.log('\nNo previous run to diff against. This is the first reading.')
  }
  console.log(`\nWritten: ${outFile}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
