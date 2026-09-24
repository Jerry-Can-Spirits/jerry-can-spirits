/**
 * The edge cache key.
 *
 * A deploy on 24 Sep 2026 served the homepage with no styling at all: the
 * cached HTML named a stylesheet the new build had deleted, and the browser
 * got a 404 for it. The cache was keyed on the URL alone, so it survived the
 * deploy that invalidated its contents. These pin the fix: two deploys must
 * never share a key for the same page.
 */
import { describe, expect, it } from 'vitest'
import { buildId, edgeCacheKeyUrl } from '@/lib/edge-cache'

const url = { pathname: '/', search: '', origin: 'https://jerrycanspirits.co.uk' }

describe('edge cache key', () => {
  it('gives two deploys different keys for the same page', () => {
    const a = edgeCacheKeyUrl(url, { CF_VERSION_METADATA: { id: 'deploy-aaa' } })
    const b = edgeCacheKeyUrl(url, { CF_VERSION_METADATA: { id: 'deploy-bbb' } })
    expect(a).not.toBe(b)
  })

  it('gives the same deploy the same key, or it would never cache at all', () => {
    const env = { CF_VERSION_METADATA: { id: 'deploy-aaa' } }
    expect(edgeCacheKeyUrl(url, env)).toBe(edgeCacheKeyUrl(url, env))
  })

  it('keeps the page apart from other pages within one deploy', () => {
    const env = { CF_VERSION_METADATA: { id: 'deploy-aaa' } }
    expect(edgeCacheKeyUrl(url, env)).not.toBe(
      edgeCacheKeyUrl({ ...url, pathname: '/field-manual' }, env),
    )
    expect(edgeCacheKeyUrl(url, env)).not.toBe(edgeCacheKeyUrl({ ...url, search: '?a=1' }, env))
  })

  it('stays on our own origin, because the Cache API will not store anything else', () => {
    const key = edgeCacheKeyUrl(url, { CF_VERSION_METADATA: { id: 'deploy-aaa' } })
    expect(new URL(key).origin).toBe(url.origin)
  })

  it('falls back rather than throwing when the binding is missing', () => {
    expect(buildId(undefined)).toBeTruthy()
    expect(buildId({})).toBeTruthy()
    expect(buildId({ CF_VERSION_METADATA: {} })).toBeTruthy()
    expect(() => edgeCacheKeyUrl(url)).not.toThrow()
  })
})
