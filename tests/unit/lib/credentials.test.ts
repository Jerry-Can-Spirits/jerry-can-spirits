import { describe, it, expect } from 'vitest'
import {
  hashPin,
  verifyPin,
  isHashedPin,
  pinLookupKey,
  pinRateKey,
  PBKDF2_ITERATIONS,
} from '../../../src/lib/trade-portal/credentials'

const PEPPER = 'test-pepper-value-32-bytes-long!'

describe('hashPin / verifyPin', () => {
  it('round-trips a PIN', async () => {
    const stored = await hashPin(PEPPER, '123456')
    expect(isHashedPin(stored)).toBe(true)
    expect(await verifyPin(PEPPER, '123456', stored)).toBe(true)
  })

  it('embeds the iteration count and a fresh salt', async () => {
    const a = await hashPin(PEPPER, '123456')
    const b = await hashPin(PEPPER, '123456')
    expect(a).not.toEqual(b) // random salt
    expect(a.split(':')[2]).toBe(String(PBKDF2_ITERATIONS))
  })

  it('rejects the wrong PIN', async () => {
    const stored = await hashPin(PEPPER, '123456')
    expect(await verifyPin(PEPPER, '123457', stored)).toBe(false)
  })

  it('rejects the right PIN under the wrong pepper', async () => {
    const stored = await hashPin(PEPPER, '123456')
    expect(await verifyPin('another-pepper', '123456', stored)).toBe(false)
  })

  it('rejects malformed and legacy plaintext values', async () => {
    expect(await verifyPin(PEPPER, '123456', '123456')).toBe(false)
    expect(await verifyPin(PEPPER, '123456', 'pin:v1:garbage')).toBe(false)
    expect(isHashedPin('123456')).toBe(false)
    expect(isHashedPin('purged-abc')).toBe(false)
  })
})

describe('pinLookupKey', () => {
  it('is deterministic for the same pepper and PIN', async () => {
    expect(await pinLookupKey(PEPPER, '123456')).toEqual(await pinLookupKey(PEPPER, '123456'))
  })

  it('differs across PINs and across peppers', async () => {
    const base = await pinLookupKey(PEPPER, '123456')
    expect(await pinLookupKey(PEPPER, '654321')).not.toEqual(base)
    expect(await pinLookupKey('another-pepper', '123456')).not.toEqual(base)
  })

  it('is domain-separated from the stored hash', async () => {
    const stored = await hashPin(PEPPER, '123456')
    expect(stored).not.toContain(await pinLookupKey(PEPPER, '123456'))
  })
})

describe('pinRateKey', () => {
  it('is a stable pepper-free hex id that is not the raw PIN', async () => {
    const key = await pinRateKey('123456')
    expect(key).toEqual(await pinRateKey('123456'))
    expect(key).toMatch(/^[0-9a-f]{64}$/)
    expect(key).not.toContain('123456')
  })
})
