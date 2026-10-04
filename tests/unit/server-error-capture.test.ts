/**
 * Server-side error capture.
 *
 * The Sentry Node SDK never sent an event from the Worker: the 28 Sep 2026
 * outage produced 2,784 server 500s and no Sentry issue. These pin the
 * replacement, which posts an envelope with fetch: the envelope is the shape
 * Sentry's ingest API accepts, secrets and emails never leave the Worker, and
 * a failure to report can never itself fail the request.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildEvent, captureServerError, captureServerMessage, envelope, parseStack, scrub } from '@/lib/server-error-capture'

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: () => {
    throw new Error('no request context in a unit test')
  },
}))

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('scrub', () => {
  it('removes emails and secret-looking values', () => {
    expect(scrub('Resend rejected dan@example.co.uk with token=abc.def-123')).toBe(
      'Resend rejected [email] with token=[redacted]',
    )
  })
})

describe('parseStack', () => {
  it('turns a V8 stack into frames, oldest first', () => {
    const stack = [
      'Error: boom',
      '    at handler (/worker/route.js:10:5)',
      '    at /worker/index.js:3:1',
    ].join('\n')
    expect(parseStack(stack)).toEqual([
      { function: '<anonymous>', filename: '/worker/index.js', lineno: 3, colno: 1 },
      { function: 'handler', filename: '/worker/route.js', lineno: 10, colno: 5 },
    ])
  })

  it('gives nothing for no stack', () => {
    expect(parseStack(undefined)).toEqual([])
  })
})

describe('buildEvent', () => {
  it('describes an Error with its stack, tags and release', () => {
    const event = buildEvent({ exception: new Error('D1 write failed') }, { tags: { route: 'trade-application', phase: 'd1' } }, 'v123')
    expect(event.level).toBe('error')
    expect(event.release).toBe('v123')
    expect(event.tags).toEqual({ runtime: 'worker', route: 'trade-application', phase: 'd1' })
    expect(event.exception?.values[0]).toMatchObject({ type: 'Error', value: 'D1 write failed' })
    expect(event.exception?.values[0].stacktrace?.frames.length).toBeGreaterThan(0)
    expect(event.event_id).toMatch(/^[0-9a-f]{32}$/)
  })

  it('describes a message at info level unless told otherwise', () => {
    expect(buildEvent({ message: 'KLAVIYO_TRADE_LIST_ID is not set' }, {}).level).toBe('info')
    expect(buildEvent({ message: 'Meta CAPI rejected event' }, { level: 'warning' }).level).toBe('warning')
  })

  it('copes with a thrown string or object', () => {
    expect(buildEvent({ exception: 'plain string' }, {}).exception?.values[0].value).toBe('plain string')
    expect(buildEvent({ exception: { code: 7500 } }, {}).exception?.values[0].value).toBe('{"code":7500}')
  })

  it('scrubs the exception message', () => {
    const event = buildEvent({ exception: new Error('sent to venue@bar.co.uk') }, {})
    expect(event.exception?.values[0].value).toBe('sent to [email]')
  })
})

describe('envelope', () => {
  it('is three JSON lines: header, item header, event', () => {
    const event = buildEvent({ message: 'hello' }, {})
    const lines = envelope(event).trimEnd().split('\n')
    expect(lines).toHaveLength(3)
    expect(JSON.parse(lines[0])).toMatchObject({ event_id: event.event_id, dsn: expect.stringContaining('ingest.de.sentry.io') })
    expect(JSON.parse(lines[1])).toEqual({ type: 'event' })
    expect(JSON.parse(lines[2]).message.formatted).toBe('hello')
  })
})

describe('captureServerError', () => {
  it('posts the envelope to the project ingest URL with the key in the auth header', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await captureServerError(new Error('boom'), { tags: { source: 'test' } })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://o4510169918275584.ingest.de.sentry.io/api/4510169922404432/envelope/')
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>)['X-Sentry-Auth']).toContain('sentry_key=03a3151ad7e64876b650238ef4f31ce8')
    expect(String(init.body)).toContain('"source":"test"')
  })

  it('never rejects when the send fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')))
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(captureServerError(new Error('boom'))).resolves.toBeUndefined()
    await expect(captureServerMessage('still fine')).resolves.toBeUndefined()
    quiet.mockRestore()
  })
})
