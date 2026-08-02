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

type Reading = {
  timestamp: string
  question_id: string
  band: string
  question: string
  target_url: string | null
  engine: string
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

function flagsIn(text: string | null): string[] {
  if (!text) return []
  return FACTUAL_FLAGS.filter((f) => f.pattern.test(text)).map((f) => f.flag)
}

// Position of the first citation of ours among all cited URLs, 1-indexed.
// Null when we are not cited at all.
function analyse(urls: string[], text: string | null, q: QuestionSpec, base: Partial<Reading>): Reading {
  const unique = [...new Set(urls.filter(Boolean))]
  const ours = unique.filter((u) => hostOf(u).endsWith(OUR_DOMAIN))
  const idx = unique.findIndex((u) => hostOf(u).endsWith(OUR_DOMAIN))
  return {
    timestamp: new Date().toISOString(),
    question_id: q.id,
    band: q.band,
    question: q.question,
    target_url: q.target_url,
    engine: base.engine!,
    model: base.model ?? null,
    cited: ours.length > 0,
    urls: unique,
    our_urls: ours,
    position: idx >= 0 ? idx + 1 : null,
    competitors: [...new Set(unique.filter((u) => !hostOf(u).endsWith(OUR_DOMAIN)).map(hostOf))].filter(Boolean),
    answer_text: text,
    factual_flags: flagsIn(text),
    error: base.error ?? null,
    stub: false,
  }
}

function errored(q: QuestionSpec, engine: string, message: string): Reading {
  return {
    timestamp: new Date().toISOString(),
    question_id: q.id,
    band: q.band,
    question: q.question,
    target_url: q.target_url,
    engine,
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
async function askChatGPT(q: QuestionSpec): Promise<Reading> {
  const key = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_MODEL || 'gpt-5'
  if (!key) return errored(q, 'chatgpt', 'OPENAI_API_KEY not set')
  try {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model, input: q.question, tools: [{ type: 'web_search' }] }),
    })
    if (!res.ok) return errored(q, 'chatgpt', `HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
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
    return analyse(urls, text || String(data.output_text ?? '') || null, q, { engine: 'chatgpt', model })
  } catch (e) {
    return errored(q, 'chatgpt', String(e).slice(0, 200))
  }
}

// --- Claude: Messages API with the web_search server tool ------------------
// web_search_20260209 is the current variant (dynamic filtering). Do not also
// declare code_execution: a second execution environment confuses the model.
async function askClaude(q: QuestionSpec): Promise<Reading> {
  const key = process.env.ANTHROPIC_API_KEY
  const model = process.env.ANTHROPIC_MODEL || 'claude-opus-5'
  if (!key) return errored(q, 'claude', 'ANTHROPIC_API_KEY not set')
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
        tools: [{ type: 'web_search_20260209', name: 'web_search' }],
        messages,
      })
      if (response.stop_reason !== 'pause_turn') break
      messages = [...messages, { role: 'assistant', content: response.content }]
    }
    if (!response) return errored(q, 'claude', 'no response')
    if (response.stop_reason === 'refusal') return errored(q, 'claude', 'refusal')

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
    return analyse(urls, text || null, q, { engine: 'claude', model })
  } catch (e) {
    return errored(q, 'claude', String(e).slice(0, 200))
  }
}

// --- Perplexity: chat/completions, citations in search_results -------------
async function askPerplexity(q: QuestionSpec): Promise<Reading> {
  const key = process.env.PERPLEXITY_API_KEY
  const model = process.env.PERPLEXITY_MODEL || 'sonar'
  if (!key) return errored(q, 'perplexity', 'PERPLEXITY_API_KEY not set')
  try {
    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: q.question }] }),
    })
    if (!res.ok) return errored(q, 'perplexity', `HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>
      citations?: string[]
      search_results?: Array<{ url?: string }>
    }
    const urls = [...(data.citations ?? []), ...(data.search_results ?? []).map((r) => r.url ?? '')]
    return analyse(urls, data.choices?.[0]?.message?.content ?? null, q, { engine: 'perplexity', model })
  } catch (e) {
    return errored(q, 'perplexity', String(e).slice(0, 200))
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
      .filter((f) => f.endsWith('.jsonl') && !f.startsWith('baseline') && f !== current)
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

function diff(current: Reading[], previous: Reading[]): void {
  const key = (r: Reading) => `${r.question_id}:${r.engine}`
  const prev = new Map(previous.map((r) => [key(r), r]))
  const newlyCited: string[] = []
  const newlyLost: string[] = []
  const flagsCleared: string[] = []
  const flagsAppeared: string[] = []

  for (const r of current) {
    const p = prev.get(key(r))
    if (!p) continue
    if (r.cited === true && p.cited === false) newlyCited.push(`${key(r)} → ${r.our_urls[0] ?? ''}`)
    if (r.cited === false && p.cited === true) newlyLost.push(key(r))
    for (const f of p.factual_flags) if (!r.factual_flags.includes(f)) flagsCleared.push(`${key(r)}: ${f}`)
    for (const f of r.factual_flags) if (!p.factual_flags.includes(f)) flagsAppeared.push(`${key(r)}: ${f}`)
  }

  const section = (title: string, items: string[]) => {
    console.log(`\n${title} (${items.length})`)
    for (const i of items) console.log(`  ${i}`)
  }
  console.log('\n=== DIFF vs previous run ===')
  section('Newly cited', newlyCited)
  section('Newly lost', newlyLost)
  section('Factual flags CLEARED', flagsCleared)
  section('Factual flags NEWLY APPEARING', flagsAppeared)
}

async function main() {
  mkdirSync(RESULTS_DIR, { recursive: true })
  const spec = JSON.parse(readFileSync(join(HERE, 'questions.json'), 'utf8')) as { questions: QuestionSpec[] }
  const questions = spec.questions
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const outFile = join(RESULTS_DIR, `${stamp}.jsonl`)

  const engines = [
    { name: 'chatgpt', fn: askChatGPT, live: !!process.env.OPENAI_API_KEY },
    { name: 'claude', fn: askClaude, live: !!process.env.ANTHROPIC_API_KEY },
    { name: 'perplexity', fn: askPerplexity, live: !!process.env.PERPLEXITY_API_KEY },
  ]
  console.log('Engines:')
  for (const e of engines) console.log(`  ${e.name}: ${e.live ? 'live' : 'SKIPPED (no key)'}`)
  console.log('  google-ai-mode: STUB (no public API — record manually)\n')

  const readings: Reading[] = []
  for (const q of questions) {
    const row: Reading[] = []
    for (const e of engines) row.push(await e.fn(q))
    row.push(askGoogleStub(q))
    for (const r of row) {
      readings.push(r)
      appendFileSync(outFile, JSON.stringify(r) + '\n')
    }
    const cited = row.filter((r) => r.cited).map((r) => r.engine)
    const flags = [...new Set(row.flatMap((r) => r.factual_flags))]
    console.log(
      `${q.id} [${q.band}] cited: ${cited.length ? cited.join(',') : 'none'}${flags.length ? `  FLAGS: ${flags.join(',')}` : ''}`
    )
  }

  const live = readings.filter((r) => !r.stub && r.error === null)
  const citedCount = live.filter((r) => r.cited).length
  const flagged = live.filter((r) => r.factual_flags.length)
  console.log(`\n=== SUMMARY ===`)
  console.log(`readings: ${live.length} live (+${readings.filter((r) => r.stub).length} stubs)`)
  console.log(`cited: ${citedCount}/${live.length}`)
  console.log(`readings carrying a factual flag: ${flagged.length}`)
  const byFlag: Record<string, number> = {}
  for (const r of flagged) for (const f of r.factual_flags) byFlag[f] = (byFlag[f] || 0) + 1
  if (Object.keys(byFlag).length) console.log('flag counts:', JSON.stringify(byFlag))

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
