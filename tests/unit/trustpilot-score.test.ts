/**
 * One source for the Trustpilot score. Every surface that states the
 * TrustScore reads getTrustpilotScore(), which prefers the hourly KV figure
 * and falls back to the hand-checked constant. Nothing else in src/ may hold
 * a score, read the constant or read the KV key, so a second figure cannot
 * creep back (on 17 Oct 2026 the product page read 4.6 while Trustpilot said
 * 4.7 and every other surface hid the row).
 */
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state: { value: unknown; context: boolean } = { value: null, context: true }

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: async () => {
    if (!state.context) throw new Error('no Cloudflare context')
    return { env: { SITE_OPS: { get: async () => state.value } } }
  },
}))

const SRC = path.resolve(__dirname, '../../src')
const HELPER = 'lib/trustpilot-score.ts'
const CONSTANT = 'lib/trustpilot-assets.ts'

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(full)
    return /\.tsx?$/.test(entry.name) ? [full] : []
  })
}

const files = sourceFiles(SRC).map((file) => ({
  rel: path.relative(SRC, file).replace(/\\/g, '/'),
  text: readFileSync(file, 'utf8'),
}))

describe('getTrustpilotScore', () => {
  beforeEach(() => {
    state.value = null
    state.context = true
  })

  it('returns the KV figure when the cron has written one', async () => {
    state.value = { rating: 4.8, count: 41, fetchedAt: '2026-10-17T12:00:00Z', source: 'trustpilot' }
    const { getTrustpilotScore } = await import('@/lib/trustpilot-score')
    expect(await getTrustpilotScore()).toEqual({ rating: 4.8, count: 41 })
  })

  it('falls back to the checked constant when KV holds nothing', async () => {
    const { getTrustpilotScore } = await import('@/lib/trustpilot-score')
    const { TRUSTPILOT_PUBLIC } = await import('@/lib/trustpilot-assets')
    expect(await getTrustpilotScore()).toEqual({ rating: TRUSTPILOT_PUBLIC.rating, count: TRUSTPILOT_PUBLIC.reviews })
  })

  it('falls back to the checked constant when there is no Cloudflare context', async () => {
    state.context = false
    const { getTrustpilotScore } = await import('@/lib/trustpilot-score')
    const { TRUSTPILOT_PUBLIC } = await import('@/lib/trustpilot-assets')
    expect(await getTrustpilotScore()).toEqual({ rating: TRUSTPILOT_PUBLIC.rating, count: TRUSTPILOT_PUBLIC.reviews })
  })

  it('keeps the constant a one-decimal score with the date it was checked', async () => {
    const { TRUSTPILOT_PUBLIC } = await import('@/lib/trustpilot-assets')
    expect(TRUSTPILOT_PUBLIC.rating).toBe(Math.round(TRUSTPILOT_PUBLIC.rating * 10) / 10)
    expect(TRUSTPILOT_PUBLIC.rating).toBeGreaterThan(0)
    expect(TRUSTPILOT_PUBLIC.rating).toBeLessThanOrEqual(5)
    expect(TRUSTPILOT_PUBLIC.checked).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('one source for the Trustpilot score', () => {
  it('only the helper reads the constant or the KV key', () => {
    const offenders = files
      .filter(({ rel }) => rel !== HELPER && rel !== CONSTANT)
      .filter(({ text }) => text.includes('TRUSTPILOT_PUBLIC') || /getRating\([^)]*'trustpilot'\)/.test(text))
      .map(({ rel }) => rel)
    expect(offenders).toEqual([])
  })

  it('every surface that states the score imports the helper', () => {
    const surfaces = files.filter(({ text }) => /platform="trustpilot"|on Trustpilot from/.test(text))
    expect(surfaces.map(({ rel }) => rel).sort()).toEqual([
      'app/llms.txt/route.ts',
      'app/offer/page.tsx',
      'app/reviews/page.tsx',
      'app/shop/product/[handle]/page.tsx',
      'components/PullQuoteStrip.tsx',
    ])
    const missing = surfaces.filter(({ text }) => !text.includes("from '@/lib/trustpilot-score'")).map(({ rel }) => rel)
    expect(missing).toEqual([])
  })

  it('no file but the constant holds a Trustpilot score literal', () => {
    const literal = /\b[1-5]\.\d\b[^\n]{0,60}Trustpilot|Trustpilot[^\n]{0,60}\b[1-5]\.\d\b/
    const offenders = files
      .filter(({ rel }) => rel !== CONSTANT)
      .filter(({ text }) => literal.test(text))
      .map(({ rel }) => rel)
    expect(offenders).toEqual([])
  })
})
