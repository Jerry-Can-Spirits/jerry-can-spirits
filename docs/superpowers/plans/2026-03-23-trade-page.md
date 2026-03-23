# Trade Page Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a `/trade/` landing page for bar, restaurant, and hotel buyers — showing serve economics, pricing tiers, partnership expectations, and a Klaviyo-connected enquiry form.

**Architecture:** Static server component page (`src/app/trade/page.tsx`) renders all content sections. A single client component (`src/components/TradeEnquiryForm.tsx`) handles form state and posts to the existing `/api/contact/` endpoint. The API route is extended to handle `formType: 'trade'` with trade-specific fields passed as Klaviyo event properties.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, existing `/api/contact/` route (Klaviyo), Cloudflare Pages edge runtime.

**Spec:** `docs/superpowers/specs/2026-03-23-trade-page-design.md`

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `src/app/api/contact/route.ts` | Add `'trade'` formType, trade fields, formType-aware validation |
| Create | `src/components/TradeEnquiryForm.tsx` | Client form component — state, validation, API post, success/error |
| Create | `src/app/trade/page.tsx` | Server component — metadata, all six page sections |
| Modify | `src/app/stockists/page.tsx` | Update "Trade Enquiries" CTA href to `/trade/` |
| Modify | `src/components/Footer.tsx` | Add "Trade" link to company nav links array |
| Modify | `src/app/sitemap.ts` | Add `/trade/` entry |

---

## Chunk 1: API Extension

### Task 1: Extend contact API for trade formType

**Files:**
- Modify: `src/app/api/contact/route.ts`

The existing API requires `subject` and `message` for all submissions and only knows `'general' | 'media' | 'complaints'` form types. We need to add `'trade'` and make validation formType-aware.

- [ ] **Step 1: Add trade fields to the ContactFormData interface**

Open `src/app/api/contact/route.ts`. Update the `ContactFormData` interface (currently lines 7–17):

```typescript
interface ContactFormData {
  name: string
  email: string
  subject: string
  message: string
  formType: 'general' | 'media' | 'complaints' | 'trade'
  // trade-specific
  venueName?: string
  venueType?: string
  covers?: string
  // existing optional fields
  orderNumber?: string
  issueType?: string
  priority?: string
  website?: string // honeypot
}
```

- [ ] **Step 2: Add trade fields to the EventProperties interface**

Update the `EventProperties` interface (currently lines 19–29):

```typescript
interface EventProperties {
  subject: string
  message?: string
  form_type: string
  submission_date: string
  source: string
  inquiry_type?: string
  order_number?: string
  issue_type?: string
  priority?: string
  // trade-specific
  venue_name?: string
  venue_type?: string
  covers?: string
}
```

- [ ] **Step 3: Destructure the new fields from formData**

Find the destructuring line (currently line 74):
```typescript
const { name, email, subject, message, formType, orderNumber, issueType, priority, website } = formData
```
Replace with:
```typescript
const { name, email, subject, message, formType, orderNumber, issueType, priority, website, venueName, venueType, covers } = formData
```

- [ ] **Step 4: Make validation formType-aware**

Find the existing validation block (currently line 95):
```typescript
if (!name || !email || !subject || !message) {
  return NextResponse.json({ error: 'Name, email, subject, and message are required' }, { status: 400 })
}
```
Replace with:
```typescript
if (formType === 'trade') {
  if (!name || !email || !venueName || !venueType || !covers) {
    return NextResponse.json({ error: 'Name, email, venue name, venue type, and covers are required' }, { status: 400 })
  }
} else {
  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: 'Name, email, subject, and message are required' }, { status: 400 })
  }
}
```

- [ ] **Step 5: Add the trade case to the switch statement**

Find the switch statement (currently around line 117). Add a `case 'trade':` branch before the `default:`:

```typescript
case 'trade':
  properties.inquiry_type = 'trade'
  properties.subject = 'Trade Enquiry'
  eventName = 'Trade Enquiry'
  if (venueName) properties.venue_name = venueName
  if (venueType) properties.venue_type = venueType
  if (covers) properties.covers = covers
  if (message) properties.message = message
  break
```

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/api/contact/route.ts
git commit -m "feat: extend contact API with trade formType and venue fields"
```

---

## Chunk 2: Form Component

### Task 2: Build the TradeEnquiryForm client component

**Files:**
- Create: `src/components/TradeEnquiryForm.tsx`

This is a `'use client'` component. It manages form state locally, posts to `/api/contact/`, and shows success/error feedback. Pattern matches `src/app/contact/enquiries/page.tsx`.

- [ ] **Step 1: Create the file with form state and submit handler**

```typescript
'use client'

import { useState } from 'react'

interface TradeFormData {
  name: string
  email: string
  venueName: string
  venueType: string
  covers: string
  message: string
}

export default function TradeEnquiryForm() {
  const [formData, setFormData] = useState<TradeFormData>({
    name: '',
    email: '',
    venueName: '',
    venueType: '',
    covers: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [honeypot, setHoneypot] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/contact/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          venueName: formData.venueName,
          venueType: formData.venueType,
          covers: formData.covers,
          message: formData.message,
          subject: 'Trade Enquiry',
          formType: 'trade',
          website: honeypot,
        }),
      })

      if (response.ok) {
        setSubmitStatus('success')
        setFormData({ name: '', email: '', venueName: '', venueType: '', covers: '', message: '' })
      } else {
        setSubmitStatus('error')
      }
    } catch {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass = 'w-full px-4 py-3 bg-jerry-green-900 border border-gold-500/30 rounded-lg text-white placeholder-parchment-500 text-sm focus:outline-none focus:border-gold-400 transition-colors'
  const labelClass = 'block text-sm font-medium text-parchment-200 mb-2'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Honeypot */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="trade-name" className={labelClass}>Your name *</label>
          <input
            type="text"
            id="trade-name"
            name="name"
            required
            autoComplete="name"
            value={formData.name}
            onChange={handleChange}
            className={inputClass}
            placeholder="Your full name"
          />
        </div>
        <div>
          <label htmlFor="trade-email" className={labelClass}>Email address *</label>
          <input
            type="email"
            id="trade-email"
            name="email"
            required
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            className={inputClass}
            placeholder="your@email.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="trade-venue-name" className={labelClass}>Venue name *</label>
        <input
          type="text"
          id="trade-venue-name"
          name="venueName"
          required
          value={formData.venueName}
          onChange={handleChange}
          className={inputClass}
          placeholder="The name of your venue"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="trade-venue-type" className={labelClass}>Venue type *</label>
          <select
            id="trade-venue-type"
            name="venueType"
            required
            value={formData.venueType}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="">Select venue type</option>
            <option value="Bar">Bar</option>
            <option value="Restaurant">Restaurant</option>
            <option value="Hotel">Hotel</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label htmlFor="trade-covers" className={labelClass}>Approximate covers *</label>
          <select
            id="trade-covers"
            name="covers"
            required
            value={formData.covers}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="">Select capacity</option>
            <option value="Under 50">Under 50</option>
            <option value="50–150">50–150</option>
            <option value="150–300">150–300</option>
            <option value="300+">300+</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="trade-message" className={labelClass}>Anything else you want to tell us</label>
        <textarea
          id="trade-message"
          name="message"
          rows={4}
          value={formData.message}
          onChange={handleChange}
          className={inputClass}
          placeholder="Tell us about your venue, what you're looking for, or any questions you have."
        />
      </div>

      {submitStatus === 'success' && (
        <div className="bg-jerry-green-800/60 border border-gold-500/30 rounded-lg p-4">
          <p className="text-parchment-200 text-sm">
            Received. We will be in touch within two working days.
          </p>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-300 text-sm">
            Something went wrong. Email us directly at{' '}
            <a href="mailto:trade@jerrycanspirits.co.uk" className="underline hover:text-red-200">
              trade@jerrycanspirits.co.uk
            </a>
          </p>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-4 bg-gold-500 text-jerry-green-900 font-bold rounded-lg hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wide"
        >
          {isSubmitting ? 'Sending...' : 'Send Enquiry'}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/TradeEnquiryForm.tsx
git commit -m "feat: add TradeEnquiryForm client component"
```

---

## Chunk 3: Trade Page

### Task 3: Build the /trade server component page

**Files:**
- Create: `src/app/trade/page.tsx`

Server component. All six sections from the spec. Brand voice throughout — measured, direct, no hype. Import `TradeEnquiryForm` for the final section.

- [ ] **Step 1: Create the page file**

```typescript
import type { Metadata } from 'next'
import TradeEnquiryForm from '@/components/TradeEnquiryForm'
import StructuredData from '@/components/StructuredData'

export const metadata: Metadata = {
  title: 'Stock Expedition Spiced Rum | Trade Enquiries | Jerry Can Spirits',
  description: 'Trade pricing, serve economics and partnership information for bars, restaurants and hotels. Enquire to stock Expedition Spiced Rum.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/trade/',
  },
}

const tradeSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Trade Enquiries — Jerry Can Spirits',
  description: 'Trade pricing and partnership information for bars, restaurants and hotels stocking Expedition Spiced Rum.',
  url: 'https://jerrycanspirits.co.uk/trade/',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://jerrycanspirits.co.uk/' },
      { '@type': 'ListItem', position: 2, name: 'Trade', item: 'https://jerrycanspirits.co.uk/trade/' },
    ],
  },
}

export default function TradePage() {
  return (
    <main className="min-h-screen">
      <StructuredData data={tradeSchema} />

      {/* ── Section 1: Hero ── */}
      <section className="py-24 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-8">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Trade
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-6 leading-tight">
            For Venues That Hold Themselves to a Higher Standard
          </h1>
          <p className="text-xl text-parchment-300 max-w-2xl leading-relaxed">
            Expedition Spiced is a British craft rum built on real ingredients and no shortcuts. This page is for bars, restaurants, and hotels who want to know what stocking it looks like in practice.
          </p>
        </div>
      </section>

      {/* ── Section 2: Why It Works Behind the Bar ── */}
      <section className="py-16 border-t border-gold-500/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-serif font-bold text-white mb-12">
            Why it works behind the bar
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            <div>
              <h3 className="text-gold-400 text-sm font-semibold uppercase tracking-widest mb-3">
                A story worth telling
              </h3>
              <p className="text-parchment-300 text-sm leading-relaxed">
                Veteran-founded. British. No artificial flavourings, no shortcuts, no hidden investors. Customers ask questions about what they are drinking. This is a conversation your staff can have.
              </p>
            </div>
            <div>
              <h3 className="text-gold-400 text-sm font-semibold uppercase tracking-widest mb-3">
                Built for mixing and sipping
              </h3>
              <p className="text-parchment-300 text-sm leading-relaxed">
                Vanilla, cinnamon, allspice, orange peel, ginger, cassia, agave, bourbon oak. Complex enough to stand alone. Structured enough to anchor a cocktail menu. Forty percent ABV.
              </p>
            </div>
            <div>
              <h3 className="text-gold-400 text-sm font-semibold uppercase tracking-widest mb-3">
                5% to military charities
              </h3>
              <p className="text-parchment-300 text-sm leading-relaxed">
                Every bottle sold contributes to veterans&apos; causes. Something your customers can feel good about ordering, and something worth putting on a menu card.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: What You're Working With ── */}
      <section className="py-16 border-t border-gold-500/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-serif font-bold text-white mb-4">
            What you are working with
          </h2>
          <p className="text-parchment-400 text-sm mb-10">
            Here is the honest maths. Not a sales case — just the numbers.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Bottle size', value: '700ml', note: '40% ABV' },
              { label: 'Serves per bottle', value: '~28', note: 'at 25ml standard measure' },
              { label: 'Serves per case', value: '~168', note: '6 bottles per case' },
              { label: 'Revenue potential', value: '£1,344–£2,016', note: 'at £8–£12 per serve' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-jerry-green-800/20 border border-gold-500/20 rounded-xl p-6"
              >
                <p className="text-parchment-500 text-xs uppercase tracking-widest mb-2">{stat.label}</p>
                <p className="text-white text-2xl font-serif font-bold mb-1">{stat.value}</p>
                <p className="text-parchment-500 text-xs">{stat.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 4: Pricing ── */}
      <section className="py-16 border-t border-gold-500/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-serif font-bold text-white mb-4">
            Pricing
          </h2>
          <p className="text-parchment-400 text-sm mb-10">
            We price to reward relationships, not just transactions. All prices are per case of 6 bottles.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gold-500/20">
                  <th className="text-left text-parchment-500 text-xs uppercase tracking-widest py-3 pr-6">Tier</th>
                  <th className="text-left text-parchment-500 text-xs uppercase tracking-widest py-3 pr-6">Per bottle (ex VAT)</th>
                  <th className="text-left text-parchment-500 text-xs uppercase tracking-widest py-3 pr-6">Per case (ex VAT)</th>
                  <th className="text-left text-parchment-500 text-xs uppercase tracking-widest py-3 pr-6">Inc VAT</th>
                  <th className="text-left text-parchment-500 text-xs uppercase tracking-widest py-3">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-500/10">
                {[
                  { tier: 'Intro', perBottle: '~£25', perCase: '£150', incVat: '£180', when: 'First order' },
                  { tier: 'Standard', perBottle: '~£29', perCase: '£175', incVat: '£210', when: 'Ongoing orders' },
                  { tier: 'Partner', perBottle: '~£25–£27', perCase: '£150–£160', incVat: '£180–£192', when: 'High-volume, earned' },
                ].map((row) => (
                  <tr key={row.tier}>
                    <td className="py-4 pr-6 font-semibold text-white">{row.tier}</td>
                    <td className="py-4 pr-6 text-parchment-300">{row.perBottle}</td>
                    <td className="py-4 pr-6 text-parchment-300">{row.perCase}</td>
                    <td className="py-4 pr-6 text-parchment-400">{row.incVat}</td>
                    <td className="py-4 text-parchment-500 text-xs">{row.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-parchment-500 text-xs mt-6">
            Partner pricing is not applied automatically. It reflects a track record of sell-through and active placement. Delivery terms confirmed on enquiry.
          </p>
        </div>
      </section>

      {/* ── Section 5: What Works Well for Both Sides ── */}
      <section className="py-16 border-t border-gold-500/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-serif font-bold text-white mb-6">
              What works well for both sides
            </h2>
            <p className="text-parchment-300 text-sm leading-relaxed mb-4">
              We do not send bottles out to sit on a back shelf. When it works, it works because both sides are invested in it.
            </p>
            <p className="text-parchment-300 text-sm leading-relaxed mb-4">
              What we have found helps: listing Expedition Spiced by name on your menu, building one serve around it, and letting us know honestly how it lands. We are not looking for a checklist — we are looking for venues that back what they stock.
            </p>
            <p className="text-parchment-300 text-sm leading-relaxed">
              We are happy to help with serve suggestions, menu wording, or a visit from the founders if you are local. The people who built this are reachable. That is not something you get from a distributor.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 6: Enquiry Form ── */}
      <section className="py-16 border-t border-gold-500/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-serif font-bold text-white mb-3">
              Start the conversation
            </h2>
            <p className="text-parchment-400 text-sm mb-10">
              Fill in the form and we will come back to you within two working days. No pressure, no sales call — just a straightforward conversation about whether this is a good fit.
            </p>
            <TradeEnquiryForm />
          </div>
        </div>
      </section>

    </main>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/trade/page.tsx
git commit -m "feat: add /trade landing page with six sections"
```

---

## Chunk 4: Wiring and Sitemap

### Task 4: Update stockists CTA, footer link, and sitemap

**Files:**
- Modify: `src/app/stockists/page.tsx`
- Modify: `src/components/Footer.tsx`
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: Update stockists page CTA**

In `src/app/stockists/page.tsx`, find the "Trade Enquiries" anchor (around line 140):
```tsx
href="/contact/enquiries/"
```
Change to:
```tsx
href="/trade/"
```

- [ ] **Step 2: Add Trade link to footer**

In `src/components/Footer.tsx`, find the `footerSections.quickLinks` array (around line 36–51). Add after the `Stockists` entry (line 46):
```typescript
{ name: 'Trade', href: '/trade' },
```

- [ ] **Step 3: Add /trade/ to sitemap**

In `src/app/sitemap.ts`, find the Stockists entry (around line 288). Add after it:
```typescript
// Trade page
{
  url: `${baseUrl}/trade/`,
  lastModified: currentDate,
  changeFrequency: 'monthly' as const,
  priority: 0.7,
},
```

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/stockists/page.tsx src/components/Footer.tsx src/app/sitemap.ts
git commit -m "feat: wire /trade page into footer, stockists CTA, and sitemap"
```

---

## Final Step: PR

- [ ] **Push branch and open PR**

```bash
git push -u origin <branch-name>
gh pr create --title "feat: add /trade landing page" --body "Adds the /trade landing page per spec docs/superpowers/specs/2026-03-23-trade-page-design.md. Six sections: hero, why it works, serve economics, pricing table, partnership, enquiry form. Extends contact API with trade formType feeding Klaviyo. Updates stockists CTA and footer."
```

- [ ] **Verify CI passes** — build, type check, lint must all be green before merging
