// Retry for the transient network faults that fail a whole build. The build
// prerenders about 940 pages against Sanity and Shopify, and one connect
// timeout or "fetch failed" on any of them failed the deploy (five builds on
// 12 Oct 2026). Only faults that another attempt can fix are retried: connect
// and socket failures, and HTTP 429/502/503/504. A 4xx or a GraphQL error is
// an answer, not a fault, and is never retried.
//
// The budget differs by phase. At build, three attempts with exponential
// backoff and jitter (about 0.5s, then 1.5s): a page has 60 seconds to
// prerender and a failed connect already costs 10, so more attempts would put
// a page with two fetches at risk of that limit. On the live Worker a customer
// is waiting, so one quick retry only. NEXT_PHASE is set by `next build`
// before it forks the prerender workers, which inherit it; nothing sets it on
// the Worker.

const TRANSIENT_STATUSES = new Set([429, 502, 503, 504])

const TRANSIENT_CODES = new Set([
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_SOCKET',
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'EAI_AGAIN',
  'EPIPE',
])

export const BUILD_POLICY = { attempts: 3, baseDelayMs: 500 }
export const RUNTIME_POLICY = { attempts: 2, baseDelayMs: 200 }
const MAX_DELAY_MS = 4000

export function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === 'phase-production-build'
}

function errorCode(value: unknown): unknown {
  return typeof value === 'object' && value !== null ? (value as { code?: unknown }).code : undefined
}

export function isTransientError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const { status, statusCode } = err as { status?: unknown; statusCode?: unknown }
  const httpStatus = statusCode ?? status
  if (typeof httpStatus === 'number') return TRANSIENT_STATUSES.has(httpStatus)
  const code = errorCode(err) ?? errorCode(err.cause)
  if (typeof code === 'string') return TRANSIENT_CODES.has(code)
  if (err.name === 'AbortError' || err.name === 'TimeoutError') return true
  return err instanceof TypeError && err.message === 'fetch failed'
}

// A transient status as a thrown error, so withRetry treats it like a network
// fault. The body is discarded so the connection is released.
export async function rejectTransientStatus(response: Response): Promise<Response> {
  if (!TRANSIENT_STATUSES.has(response.status)) return response
  await response.body?.cancel()
  throw Object.assign(new Error(`HTTP ${response.status}`), { status: response.status })
}

// A GraphQL request body whose operation is a mutation. Not idempotent, so
// never retried: the request may have landed before the connection failed.
export function isGraphQLMutation(body: string | undefined): boolean {
  if (!body) return false
  const { query } = JSON.parse(body) as { query?: unknown }
  return typeof query === 'string' && /^\s*mutation\b/.test(query)
}

// Exponential (x3 per retry, capped at 4s) with +/-25% jitter, so prerender
// workers that failed together do not retry together.
export function backoffMs(retry: number, baseDelayMs: number, random: () => number = Math.random): number {
  return Math.round(Math.min(baseDelayMs * 3 ** retry, MAX_DELAY_MS) * (0.75 + random() * 0.5))
}

interface RetryOptions {
  attempts?: number
  sleep?: (ms: number) => Promise<void>
  random?: () => number
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const policy = isBuildPhase() ? BUILD_POLICY : RUNTIME_POLICY
  const attempts = options.attempts ?? policy.attempts
  const sleep = options.sleep ?? defaultSleep
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (attempt >= attempts || !isTransientError(err)) throw err
      await sleep(backoffMs(attempt - 1, policy.baseDelayMs, options.random))
    }
  }
}
