// Server-side error capture that works on the Worker.
//
// The Sentry Node SDK that @sentry/nextjs initialises for server code never
// sent a single event from this site: it is built on OpenTelemetry hooks that
// workerd does not provide, so every Sentry.captureException in a route
// handler was a silent no-op (docs/SENTRY_SERVER_CAPTURE.md, 20 Jul 2026). The
// 28 Sep 2026 outage, 2,784 server 500s, produced no Sentry issue at all.
//
// This posts an event envelope to Sentry's ingest API with fetch, which the
// Worker does natively. It never throws and never delays the response: the
// send is handed to the request's waitUntil where there is one, and otherwise
// awaited by the caller inside the error path it is already on.
//
// The DSN is public by design (it is in every browser bundle); the key only
// lets a client submit events.

import { getCloudflareContext } from '@opennextjs/cloudflare'

const DSN = 'https://03a3151ad7e64876b650238ef4f31ce8@o4510169918275584.ingest.de.sentry.io/4510169922404432'

export type CaptureLevel = 'error' | 'warning' | 'info'

export interface CaptureContext {
  level?: CaptureLevel
  tags?: Record<string, string | number | boolean | null | undefined>
  extra?: Record<string, unknown>
}

interface Frame {
  function?: string
  filename?: string
  lineno?: number
  colno?: number
}

interface SentryEvent {
  event_id: string
  timestamp: number
  platform: 'javascript'
  level: CaptureLevel
  environment: string
  release?: string
  tags: Record<string, string>
  extra?: Record<string, unknown>
  exception?: { values: Array<{ type: string; value: string; stacktrace?: { frames: Frame[] } }> }
  message?: { formatted: string }
}

// Same scrub as the browser config: an email or a token in an error message
// must not reach Sentry.
// Error text can carry request data, so both scans are linear: no regular
// expression that backtracks over the input (CodeQL js/polynomial-redos).
const MAX_TEXT = 4_000
const secretRegex = /(access_token|api_key|secret|token|password|authorization|bearer)[=:\s]+['"]?[a-zA-Z0-9_\-.]+['"]?/gi

function looksLikeEmail(token: string): boolean {
  const at = token.indexOf('@')
  return at > 0 && token.indexOf('.', at) > at + 1
}

export function scrub(text: string): string {
  const bounded = text.slice(0, MAX_TEXT)
  const words = bounded.split(/(\s+)/).map((t) => (looksLikeEmail(t) ? '[email]' : t))
  return words.join('').replace(secretRegex, '$1=[redacted]')
}

// One V8 stack line: "    at fn (file:line:col)" or "    at file:line:col".
function parseFrame(line: string): Frame | null {
  const s = line.trim()
  if (!s.startsWith('at ')) return null
  let rest = s.slice(3)
  let fn = '<anonymous>'
  if (rest.endsWith(')')) {
    const open = rest.lastIndexOf('(')
    if (open > 0) {
      fn = rest.slice(0, open).trim() || fn
      rest = rest.slice(open + 1, -1)
    }
  }
  const colSep = rest.lastIndexOf(':')
  const lineSep = colSep > 0 ? rest.lastIndexOf(':', colSep - 1) : -1
  if (lineSep <= 0) return null
  const lineno = Number(rest.slice(lineSep + 1, colSep))
  const colno = Number(rest.slice(colSep + 1))
  if (!Number.isInteger(lineno) || !Number.isInteger(colno)) return null
  return { function: fn, filename: rest.slice(0, lineSep), lineno, colno }
}

// V8 stack lines, oldest frame last; Sentry wants oldest first.
export function parseStack(stack: string | undefined): Frame[] {
  if (!stack) return []
  const frames: Frame[] = []
  for (const line of stack.slice(0, MAX_TEXT * 4).split('\n')) {
    const frame = parseFrame(line)
    if (frame) frames.push(frame)
  }
  return frames.reverse()
}

function ingest(dsn: string): { url: string; key: string } {
  const u = new URL(dsn)
  const projectId = u.pathname.replace(/^\//, '')
  return { url: `${u.protocol}//${u.host}/api/${projectId}/envelope/`, key: u.username }
}

function eventId(): string {
  return crypto.randomUUID().replace(/-/g, '')
}

function stringTags(tags: CaptureContext['tags']): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(tags ?? {})) {
    if (v !== undefined && v !== null) out[k] = String(v)
  }
  return out
}

function describe(err: unknown): { type: string; value: string; stack?: string } {
  if (err instanceof Error) return { type: err.name || 'Error', value: err.message, stack: err.stack }
  if (typeof err === 'string') return { type: 'Error', value: err }
  try {
    return { type: 'Error', value: JSON.stringify(err) }
  } catch {
    return { type: 'Error', value: String(err) }
  }
}

function worker(): { waitUntil?: (p: Promise<unknown>) => void; version?: string } {
  try {
    const { ctx, env } = getCloudflareContext()
    const meta = (env as unknown as { CF_VERSION_METADATA?: { id?: string } }).CF_VERSION_METADATA
    return { waitUntil: ctx?.waitUntil ? (p) => ctx.waitUntil(p) : undefined, version: meta?.id }
  } catch {
    return {}
  }
}

export function buildEvent(
  input: { exception?: unknown; message?: string },
  context: CaptureContext,
  version?: string,
): SentryEvent {
  const event: SentryEvent = {
    event_id: eventId(),
    timestamp: Date.now() / 1000,
    platform: 'javascript',
    level: context.level ?? (input.message ? 'info' : 'error'),
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    release: version,
    tags: { runtime: 'worker', ...stringTags(context.tags) },
    extra: context.extra,
  }
  if (input.message !== undefined) {
    event.message = { formatted: scrub(input.message) }
  } else {
    const d = describe(input.exception)
    const frames = parseStack(d.stack)
    event.exception = {
      values: [{ type: d.type, value: scrub(d.value), ...(frames.length ? { stacktrace: { frames } } : {}) }],
    }
  }
  return event
}

export function envelope(event: SentryEvent, dsn = DSN): string {
  const header = JSON.stringify({ event_id: event.event_id, sent_at: new Date().toISOString(), dsn })
  const item = JSON.stringify({ type: 'event' })
  return `${header}\n${item}\n${JSON.stringify(event)}\n`
}

async function send(event: SentryEvent, fetchImpl: typeof fetch = fetch): Promise<void> {
  const { url, key } = ingest(DSN)
  try {
    await fetchImpl(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=jcs-worker/1.0, sentry_key=${key}`,
      },
      body: envelope(event),
    })
  } catch (err) {
    console.error('[sentry] could not send event:', err)
  }
}

function dispatch(event: SentryEvent): Promise<void> {
  const { waitUntil } = worker()
  const p = send(event)
  if (waitUntil) {
    waitUntil(p)
    return Promise.resolve()
  }
  return p
}

/** Report an error. Resolves once the send is handed off; never rejects. */
export function captureServerError(err: unknown, context: CaptureContext = {}): Promise<void> {
  try {
    return dispatch(buildEvent({ exception: err }, context, worker().version))
  } catch (inner) {
    console.error('[sentry] could not build event:', inner)
    return Promise.resolve()
  }
}

/** Report a message, for failures that are not thrown (a rejected API call, a missing secret). */
export function captureServerMessage(message: string, context: CaptureContext = {}): Promise<void> {
  try {
    return dispatch(buildEvent({ message }, context, worker().version))
  } catch (inner) {
    console.error('[sentry] could not build event:', inner)
    return Promise.resolve()
  }
}
