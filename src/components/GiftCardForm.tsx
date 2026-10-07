'use client'

import { useMemo, useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { trackAddToCart } from '@/components/GoogleTag'
import { trackEventDual } from '@/lib/meta-capi'
import { formatPrice } from '@/lib/format-price'
import type { ShopifyProductVariant } from '@/lib/shopify'
import {
  GIFT_CARD_MESSAGE_MAX,
  GIFT_CARD_SEND_DAYS_MAX,
  giftCardLineAttributes,
  isoLocalDate,
  latestSendDate,
  validateGiftCardDelivery,
  type GiftCardDelivery,
  type GiftCardErrors,
} from '@/lib/gift-card'

interface GiftCardFormProps {
  variants: ShopifyProductVariant[]
  productTitle: string
  productId: string
  currencyCode: string
}

const inputClass =
  'w-full px-4 py-3 bg-jerry-green-900 border border-gold-500/30 rounded-lg text-white placeholder-parchment-400 focus:outline-hidden focus:border-gold-400 focus:ring-1 focus:ring-gold-400/50'
const labelClass = 'block text-sm font-semibold text-gold-300 mb-2'

export default function GiftCardForm({ variants, productTitle, productId, currencyCode }: GiftCardFormProps) {
  const { addToCart, isLoading } = useCart()
  const available = variants.filter((v) => v.availableForSale)
  const [variantId, setVariantId] = useState(available[0]?.id ?? '')
  const [mode, setMode] = useState<'recipient' | 'self'>('recipient')
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [fromName, setFromName] = useState('')
  const [message, setMessage] = useState('')
  const [sendOn, setSendOn] = useState('')
  const [errors, setErrors] = useState<GiftCardErrors>({})

  const today = useMemo(() => new Date(), [])
  const selected = variants.find((v) => v.id === variantId)

  const delivery: GiftCardDelivery =
    mode === 'self' ? { mode } : { mode, recipientName, recipientEmail, fromName, message, sendOn }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected) return
    const found = validateGiftCardDelivery(delivery, new Date())
    setErrors(found)
    if (Object.keys(found).length > 0) return

    const price = parseFloat(selected.price.amount)
    trackEventDual('AddToCart', {
      content_name: productTitle,
      content_ids: [variantId.split('/').pop() ?? variantId],
      content_type: 'product',
      value: price,
      currency: currencyCode,
    })
    trackAddToCart(productId, productTitle, price, currencyCode, 1)

    const added = await addToCart(variantId, 1, giftCardLineAttributes(delivery, new Date().getTimezoneOffset()))
    if (added && mode === 'recipient') {
      setRecipientName('')
      setRecipientEmail('')
      setMessage('')
      setSendOn('')
    }
  }

  if (!selected) {
    return (
      <button
        disabled
        className="w-full px-8 py-4 bg-jerry-green-800/30 text-parchment-400 font-bold rounded-lg cursor-not-allowed"
      >
        Currently Unavailable
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <fieldset>
        <legend className={labelClass}>Amount</legend>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {variants.map((v) => (
            <label
              key={v.id}
              className={`min-h-11 flex items-center justify-center rounded-lg border px-3 py-3 text-center font-semibold transition-colors ${
                v.id === variantId
                  ? 'border-gold-400 bg-gold-500 text-jerry-green-900'
                  : 'border-gold-500/30 bg-jerry-green-900 text-white hover:border-gold-400'
              } ${v.availableForSale ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
            >
              <input
                type="radio"
                name="gift-card-amount"
                value={v.id}
                checked={v.id === variantId}
                disabled={!v.availableForSale}
                onChange={() => setVariantId(v.id)}
                className="sr-only"
              />
              {formatPrice(v.price.amount, v.price.currencyCode)}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={labelClass}>Who it is for</legend>
        <div className="space-y-2">
          {([
            ['recipient', 'Email it to them on a day you choose'],
            ['self', 'Send it to me to print or pass on'],
          ] as const).map(([value, label]) => (
            <label key={value} className="flex items-center gap-3 min-h-11 cursor-pointer text-parchment-100">
              <input
                type="radio"
                name="gift-card-mode"
                value={value}
                checked={mode === value}
                onChange={() => {
                  setMode(value)
                  setErrors({})
                }}
                className="h-4 w-4 accent-gold-500"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {mode === 'recipient' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="gc-recipient-name" className={labelClass}>Their name</label>
              <input
                id="gc-recipient-name"
                type="text"
                autoComplete="off"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                aria-invalid={!!errors.recipientName}
                aria-describedby={errors.recipientName ? 'gc-recipient-name-error' : undefined}
                className={inputClass}
              />
              {errors.recipientName && (
                <p id="gc-recipient-name-error" className="mt-1 text-sm text-red-300">{errors.recipientName}</p>
              )}
            </div>
            <div>
              <label htmlFor="gc-recipient-email" className={labelClass}>Their email</label>
              <input
                id="gc-recipient-email"
                type="email"
                autoComplete="off"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                aria-invalid={!!errors.recipientEmail}
                aria-describedby={errors.recipientEmail ? 'gc-recipient-email-error' : undefined}
                className={inputClass}
              />
              {errors.recipientEmail && (
                <p id="gc-recipient-email-error" className="mt-1 text-sm text-red-300">{errors.recipientEmail}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="gc-from-name" className={labelClass}>Your name</label>
            <input
              id="gc-from-name"
              type="text"
              autoComplete="name"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              aria-describedby="gc-from-name-help"
              className={inputClass}
            />
            <p id="gc-from-name-help" className="mt-1 text-sm text-parchment-400">Shown as who it is from.</p>
          </div>

          <div>
            <label htmlFor="gc-message" className={labelClass}>Your message</label>
            <textarea
              id="gc-message"
              rows={3}
              maxLength={GIFT_CARD_MESSAGE_MAX}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              aria-describedby="gc-message-help"
              className={inputClass}
            />
            <p id="gc-message-help" className="mt-1 text-sm text-parchment-400">
              Up to {GIFT_CARD_MESSAGE_MAX} characters. It appears in their email and inside the printed card.{' '}
              <span aria-live="polite">{GIFT_CARD_MESSAGE_MAX - message.length} left.</span>
            </p>
          </div>

          <div>
            <label htmlFor="gc-send-on" className={labelClass}>Send on</label>
            <input
              id="gc-send-on"
              type="date"
              min={isoLocalDate(today)}
              max={latestSendDate(today)}
              value={sendOn}
              onChange={(e) => setSendOn(e.target.value)}
              aria-invalid={!!errors.sendOn}
              aria-describedby={errors.sendOn ? 'gc-send-on-error gc-send-on-help' : 'gc-send-on-help'}
              className={inputClass}
            />
            <p id="gc-send-on-help" className="mt-1 text-sm text-parchment-400">
              Leave it blank to send straight away. Up to {GIFT_CARD_SEND_DAYS_MAX} days ahead.
            </p>
            {errors.sendOn && <p id="gc-send-on-error" className="mt-1 text-sm text-red-300">{errors.sendOn}</p>}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-8 py-4 bg-gold-500 text-jerry-green-900 font-bold rounded-lg hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Adding...' : 'Add to basket'}
      </button>
    </form>
  )
}
