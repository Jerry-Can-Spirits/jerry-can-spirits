/**
 * The October 2026 offer window. The Shopify automatic discount ends itself at
 * 11.59pm on 31 October; these pin the page to the same instant, in London
 * time, and check what each side of it renders: the offer line and a countdown
 * before, the ended line and no countdown after, the headline unchanged.
 */
import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { OfferCountdown, OfferLine } from '@/components/OctoberOffer'
import {
  GUARANTEE_COPY,
  OFFER_ENDED_LINE,
  OFFER_ENDS_AT,
  OFFER_LINE,
  PROOF_LINES,
  formatTimeLeft,
  offerLive,
  timeLeft,
} from '@/lib/october-offer'

const MINUTE = 60_000
const beforeEnd = OFFER_ENDS_AT - 90 * MINUTE
const afterEnd = OFFER_ENDS_AT + MINUTE

describe('the offer window', () => {
  it('ends at 11.59pm on 31 October 2026, London time', () => {
    const london = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(OFFER_ENDS_AT))
    expect(london).toBe('31/10/2026, 23:59')
  })

  it('is live before the end and over from the end', () => {
    expect(offerLive(beforeEnd)).toBe(true)
    expect(offerLive(OFFER_ENDS_AT - 1)).toBe(true)
    expect(offerLive(OFFER_ENDS_AT)).toBe(false)
    expect(offerLive(afterEnd)).toBe(false)
  })

  it('counts down in whole units and stops at nothing', () => {
    expect(timeLeft(OFFER_ENDS_AT - (2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000)).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5 })
    expect(timeLeft(OFFER_ENDS_AT)).toBeNull()
    expect(timeLeft(afterEnd)).toBeNull()
    expect(formatTimeLeft({ days: 1, hours: 0, minutes: 12, seconds: 1 })).toBe('1 day, 0 hours, 12 minutes, 1 second')
    expect(formatTimeLeft({ days: 0, hours: 5, minutes: 30, seconds: 0 })).toBe('5 hours, 30 minutes, 0 seconds')
  })
})

describe('OfferLine', () => {
  it('states the offer while it runs', () => {
    const html = renderToStaticMarkup(createElement(OfferLine, { now: beforeEnd }))
    expect(html).toContain(OFFER_LINE)
    expect(html).not.toContain(OFFER_ENDED_LINE)
  })

  it('says the offer has ended afterwards', () => {
    const html = renderToStaticMarkup(createElement(OfferLine, { now: afterEnd }))
    expect(html).toContain('The October offer has ended.')
    expect(html).not.toContain(OFFER_LINE)
  })
})

describe('OfferCountdown', () => {
  it('counts down while the offer runs', () => {
    const html = renderToStaticMarkup(createElement(OfferCountdown, { now: beforeEnd }))
    expect(html).toContain('Ends in')
    expect(html).toContain('1 hour, 30 minutes, 0 seconds')
    expect(html).not.toMatch(/!/)
  })

  it('renders nothing once the offer has ended', () => {
    expect(renderToStaticMarkup(createElement(OfferCountdown, { now: afterEnd }))).toBe('')
    expect(renderToStaticMarkup(createElement(OfferCountdown, { now: OFFER_ENDS_AT }))).toBe('')
  })
})

describe('the copy', () => {
  it('carries no exclamation marks or em-dashes', () => {
    for (const s of [OFFER_LINE, OFFER_ENDED_LINE, ...PROOF_LINES, GUARANTEE_COPY]) {
      expect(s).not.toMatch(/[—!]/)
    }
  })

  it('keeps the guarantee slot empty until the wording is approved', () => {
    expect(GUARANTEE_COPY).toBe('')
  })
})
