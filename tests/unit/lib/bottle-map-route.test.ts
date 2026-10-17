import { describe, expect, it, vi } from 'vitest'

// The public aggregate: points only, no order ids or dates, cached an hour.

const state: { groups: unknown[]; fail: boolean } = { groups: [], fail: false }

vi.mock('@opennextjs/cloudflare', () => ({
  getCloudflareContext: async () => ({
    env: {
      DB: {
        prepare: () => ({
          all: async () => {
            if (state.fail) throw new Error('D1 down')
            return { results: state.groups }
          },
        }),
      },
    },
  }),
}))

import { GET } from '@/app/api/bottle-map/route'

describe('GET /api/bottle-map', () => {
  it('returns totals and aggregated points with an hour of cache', async () => {
    state.groups = [
      { country: 'GB', outward_code: 'FY1', town: 'Blackpool', bottles: 3 },
      { country: 'GB', outward_code: 'SW1A', town: 'London', bottles: 1 },
      { country: 'BE', outward_code: null, town: 'Brussels', bottles: 1 },
    ]
    const res = await GET()
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=300, s-maxage=3600, stale-while-revalidate=86400')
    const body = (await res.json()) as { bottles: number; districts: number; countries: number; points: Record<string, unknown>[] }
    expect(body.bottles).toBe(5)
    expect(body.districts).toBe(2)
    expect(body.countries).toBe(2)
    expect(body.points).toHaveLength(3)
    for (const p of body.points) {
      expect(Object.keys(p).sort()).toEqual(['bottles', 'country', 'label', 'lat', 'lng', 'outward_code', 'town'])
    }
    expect(JSON.stringify(body)).not.toMatch(/order_id|created_at/)
  })

  it('answers 503 rather than an empty map when D1 fails', async () => {
    state.fail = true
    const res = await GET()
    expect(res.status).toBe(503)
    state.fail = false
  })
})
