import { afterEach, describe, expect, it } from 'vitest'
import {
  giftCardLineAttributes,
  giftCardLineSummary,
  isGiftCardProductType,
  latestSendDate,
  validateGiftCardDelivery,
  type GiftCardDelivery,
} from '@/lib/gift-card'
import { CHRISTMAS_CUTOFF, christmasGiftCardLine } from '@/lib/delivery'

const today = new Date(2026, 9, 7) // 7 October 2026, local time

const valid: GiftCardDelivery = {
  mode: 'recipient',
  recipientName: 'Sam',
  recipientEmail: 'sam@example.com',
  fromName: 'Dan',
  message: 'Happy birthday.',
  sendOn: '2026-12-25',
}

describe('isGiftCardProductType', () => {
  it('matches the Shopify product type, ignoring case and spacing', () => {
    expect(isGiftCardProductType('Gift Card')).toBe(true)
    expect(isGiftCardProductType(' gift card ')).toBe(true)
    expect(isGiftCardProductType('Spirits')).toBe(false)
    expect(isGiftCardProductType(undefined)).toBe(false)
  })
})

describe('validateGiftCardDelivery', () => {
  it('accepts a complete recipient and a card sent to the buyer', () => {
    expect(validateGiftCardDelivery(valid, today)).toEqual({})
    expect(validateGiftCardDelivery({ mode: 'self' }, today)).toEqual({})
  })

  it('needs a name and a usable email for a recipient', () => {
    const errors = validateGiftCardDelivery({ ...valid, recipientName: ' ', recipientEmail: 'sam@' }, today)
    expect(errors.recipientName).toBeDefined()
    expect(errors.recipientEmail).toBe('That email address does not look right.')
  })

  it('holds the message to Shopify\'s 200 characters', () => {
    expect(validateGiftCardDelivery({ ...valid, message: 'x'.repeat(200) }, today)).toEqual({})
    expect(validateGiftCardDelivery({ ...valid, message: 'x'.repeat(201) }, today).message).toBeDefined()
  })

  it('accepts today to 90 days ahead, and a blank date for now', () => {
    expect(latestSendDate(today)).toBe('2027-01-05')
    expect(validateGiftCardDelivery({ ...valid, sendOn: '2026-10-07' }, today)).toEqual({})
    expect(validateGiftCardDelivery({ ...valid, sendOn: '2027-01-05' }, today)).toEqual({})
    expect(validateGiftCardDelivery({ ...valid, sendOn: '' }, today)).toEqual({})
    expect(validateGiftCardDelivery({ ...valid, sendOn: '2026-10-06' }, today).sendOn).toBeDefined()
    expect(validateGiftCardDelivery({ ...valid, sendOn: '2027-01-06' }, today).sendOn).toBeDefined()
  })
})

describe('giftCardLineAttributes', () => {
  it('writes the keys Shopify reads, with the offset only for a scheduled send', () => {
    expect(giftCardLineAttributes(valid, -60)).toEqual([
      { key: '__shopify_send_gift_card_to_recipient', value: 'true' },
      { key: 'Recipient email', value: 'sam@example.com' },
      { key: 'Recipient name', value: 'Sam' },
      { key: 'Message', value: 'Happy birthday.' },
      { key: 'Send on', value: '2026-12-25' },
      { key: '__shopify_offset', value: '-60' },
      { key: 'From', value: 'Dan' },
    ])
    const now = giftCardLineAttributes({ ...valid, sendOn: '', message: '', fromName: '' }, 0)
    expect(now.map((a) => a.key)).toEqual(['__shopify_send_gift_card_to_recipient', 'Recipient email', 'Recipient name'])
  })

  it('sends no attributes when the card goes to the buyer', () => {
    expect(giftCardLineAttributes({ mode: 'self' }, 0)).toEqual([])
  })
})

describe('giftCardLineSummary', () => {
  it('says who and when, and nothing for an ordinary line', () => {
    expect(giftCardLineSummary(giftCardLineAttributes(valid, 0), today)).toBe('For Sam, sending 25 December')
    expect(giftCardLineSummary(giftCardLineAttributes({ ...valid, sendOn: '' }, 0), today)).toBe('For Sam, sending now')
    expect(giftCardLineSummary([{ key: '_gift', value: 'true' }], today)).toBeNull()
    expect(giftCardLineSummary(undefined, today)).toBeNull()
  })
})

describe('christmasGiftCardLine', () => {
  const original = CHRISTMAS_CUTOFF.lastOrderDate
  afterEach(() => {
    CHRISTMAS_CUTOFF.lastOrderDate = original
  })

  it('stays silent while the last order date is unset', () => {
    CHRISTMAS_CUTOFF.lastOrderDate = null
    expect(christmasGiftCardLine(new Date('2026-12-21T10:00:00Z'))).toBeNull()
  })

  it('shows from the day after the last order date to Christmas Eve', () => {
    CHRISTMAS_CUTOFF.lastOrderDate = '2026-12-19'
    expect(christmasGiftCardLine(new Date('2026-12-19T10:00:00Z'))).toBeNull()
    expect(christmasGiftCardLine(new Date('2026-12-20T10:00:00Z'))).toMatch(/^Too late for the post/)
    expect(christmasGiftCardLine(new Date('2026-12-24T10:00:00Z'))).not.toBeNull()
    expect(christmasGiftCardLine(new Date('2026-12-25T10:00:00Z'))).toBeNull()
  })
})
