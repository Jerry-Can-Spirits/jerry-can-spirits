/**
 * The PIN generator in src/app/api/trade/accounts/route.ts, tested in isolation.
 *
 * The generator is duplicated here rather than exported from the route, because
 * importing a Next.js route handler drags in getCloudflareContext and the whole
 * OpenNext runtime. That duplication is a real cost and the reason these tests
 * matter: if the route's version changes and this one does not, the assertions
 * below stop describing the shipped code. The route carries a comment saying so.
 *
 * What is being guarded: a credential generator that looks correct and is
 * subtly biased. `byte % 10` over a uniform 0-255 makes the digits 0-5 appear
 * 26 times in 256 and 6-9 only 25, because 256 is not a multiple of 10. It is a
 * small skew, it is free to avoid by rejection sampling, and nobody ever spots
 * it by reading the output.
 */
import { describe, it, expect } from 'vitest'

const PIN_DIGITS = 8

function generatePin(): string {
  let pin = ''
  while (pin.length < PIN_DIGITS) {
    const bytes = crypto.getRandomValues(new Uint8Array(PIN_DIGITS))
    for (const b of bytes) {
      if (b < 250 && pin.length < PIN_DIGITS) pin += String(b % 10)
    }
  }
  return pin
}

describe('trade account PIN generation', () => {
  it('produces exactly the requested number of digits', () => {
    for (let i = 0; i < 200; i++) {
      const pin = generatePin()
      expect(pin).toHaveLength(PIN_DIGITS)
      expect(pin).toMatch(/^[0-9]+$/)
    }
  })

  it('clears the login route floor of six characters', () => {
    // src/app/api/trade/login/route.ts rejects anything under 6 or over 32.
    expect(PIN_DIGITS).toBeGreaterThanOrEqual(6)
    expect(PIN_DIGITS).toBeLessThanOrEqual(32)
  })

  it('does not repeat itself', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 2000; i++) seen.add(generatePin())
    // 2000 draws from 10^8 should collide essentially never. One repeat is
    // luck; a handful means the generator is not what it claims to be.
    expect(seen.size).toBeGreaterThan(1995)
  })

  // DO NOT LOWER `draws` TO SPEED THIS UP. It costs about 30ms of real work —
  // the seconds you see on the clock are vitest starting, not this loop — and
  // the sample size is what gives the assertion any power at all. Measured
  // against both generators, worst case over six runs each:
  //
  //     draws    fair worst   biased best   separates?
  //      2000        2.76%         1.38%    no
  //      4000        2.96%         2.32%    no
  //      6000        1.26%         3.18%    yes
  //      8000        0.99%         3.33%    yes
  //
  // At 2000 the fair generator fails its own assertion and the biased one
  // passes it — the test inverts. 20,000 sits far enough above the 6000 floor
  // to stay honest on a loaded CI box.
  it('distributes digits evenly, which byte % 10 alone would not', () => {
    const counts = new Array(10).fill(0)
    const draws = 20_000
    for (let i = 0; i < draws; i++) {
      for (const c of generatePin()) counts[Number(c)]++
    }
    const total = draws * PIN_DIGITS
    const expected = total / 10
    // The rejection sampler should land every digit within 5% of even. The
    // biased version drifts to roughly +2%/-2% between the 0-5 and 6-9 groups,
    // which this tolerance would still pass — so the assertion below is the one
    // that actually discriminates.
    for (let d = 0; d < 10; d++) {
      expect(Math.abs(counts[d] - expected) / expected).toBeLessThan(0.05)
    }

    // The specific signature of `byte % 10` over 0-255: digits 0-5 get 26/256
    // of the mass and 6-9 get 25/256, so the low group runs about 4% ahead of
    // the high group. Rejection sampling removes that gap entirely.
    const low = counts.slice(0, 6).reduce((a, b) => a + b, 0) / 6
    const high = counts.slice(6).reduce((a, b) => a + b, 0) / 4
    expect(Math.abs(low - high) / expected).toBeLessThan(0.02)
  })
})
