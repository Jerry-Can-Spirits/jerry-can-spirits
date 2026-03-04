# Jerry Can Spirits — Claude Code Instructions

## About the Brand

Jerry Can Spirits is a veteran-owned British craft spirits house. Founded by two Royal Signals veterans. Bootstrapped. No investors. No shortcuts.

First expression: Expedition Spiced. Caribbean rum base. Welsh molasses. Macerated by Spirit of Wales Distillery, Newport, South Wales. Real ingredients. No artificial flavourings.

RRP: £45 | Founding Supporter Price: £35
5% of profits support military charities.
Launch date: April 6, 2026.
Website: jerrycanspirits.co.uk

---

## Technical Stack

- Next.js 15 (App Router) + Sanity CMS + Shopify Storefront API + Cloudflare Pages
- Tailwind CSS, TypeScript, Edge runtime
- Cookiebot for GDPR consent management (auto-blocking mode)
- GA4 + Google Ads via window.gtag() with Consent Mode v2
- Sentry for error tracking
- All third-party trackers are consent-gated via CookiebotOnAccept events

### Key Architecture Decisions
- Checkout is on Shopify's domain (headless) — not Next.js
- Field Manual content (cocktails, ingredients, equipment) lives in Sanity CMS
- Product FAQ is stored in Shopify metafields, not in code
- Cache headers are set in both `public/_headers` (Cloudflare edge) and `next.config.ts`
- `longDescription` portable text is rendered via `src/components/FieldManualPortableText.tsx`

---

## Git Workflow — Non-Negotiable

Always create a feature branch before any work. Never commit directly to main.

```
git checkout -b feat/description-of-work
```

Open a PR when the work is complete. Let CI pass before merging. The CI pipeline runs build and type checks — it must pass before anything touches main.

---

## Coding Standards

- TypeScript throughout. No `any` unless unavoidable, use `unknown` with a cast instead.
- Do not create new files unless genuinely necessary. Prefer editing existing files.
- Do not add comments, docstrings, or type annotations to code that was not changed.
- Do not add error handling for scenarios that cannot happen.
- Do not over-engineer. The minimum complexity that solves the problem is correct.
- Tailwind classes only. No inline styles except where Tailwind cannot reach.
- Server components by default. `'use client'` only when interactivity requires it.

---

## Brand Voice

Measured. Grounded. Disciplined. Direct.

Quiet confidence. Nothing to prove. Not performing. Not chasing.

Write like a founder who means it.

---

## Writing Rules

- No em-dashes in any content.
- No emojis in any content.
- No exclamation marks unless in direct quoted speech.
- No hype language: do not use grab, smash, epic, amazing, incredible, game-changer, or similar.
- No crowd addressing: do not open with "hey guys" or any equivalent.
- No manufactured urgency: never write "limited time offer", "only X left", or "don't miss out".
- No superlatives unless they can be proven.
- One CTA per piece of content. Never more.
- Write to one person. Never a crowd.
- Short sentences. One idea per sentence. White space is not wasted space.
- No padding. No filler. No throat-clearing before the point.
- If a sentence does not add meaning, remove it.

---

## Language to Use

- Founding Supporter
- Founding bottle
- Founding Supporter pricing
- Join the expedition
- For those who hold themselves to a higher standard
- Built properly
- No shortcuts
- Real ingredients
- Every bottle contributes
- Standards are not talked about. They are lived.

## Language to Avoid

- Buy now
- Pre-order discount
- Limited time
- Only X bottles available
- Don't miss out
- Premium (as a standalone claim)
- Craft (without substance behind it)
- Our rum is premium

---

## Messaging Hierarchy

All content connects to one of these layers, in order of priority:

1. Identity: For those who go further.
2. Integrity: Built properly. No shortcuts. No hidden investors.
3. Craft: Real ingredients. Macerated properly. No artificial flavourings.
4. Purpose: 5% of profits support military charities.
5. Experience: Designed for slow sipping. Engineered for reliability.

---

## The Product

- Name: Expedition Spiced
- Base: Caribbean rum
- Molasses: Welsh
- Maceration partner: Spirit of Wales Distillery, Newport, South Wales
- Flavour profile: Vanilla, cinnamon, allspice, clove, orange peel, cassia, ginger, agave, bourbon oak
- ABV: 40% | Volume: 700ml
- Designed for slow sipping. Not shots. Not a mixer to forget.

---

## What Jerry Can Spirits Is Not

Not a party brand. Not a pirate brand. Not a discount brand. Not a charity brand wearing a spirit label. Not a "support the troops" novelty product. Not influencer-backed. Not competing with supermarket spiced rum.

Do not write content that sounds like any of the above.

---

## Field Manual Content (Sanity CMS)

The Field Manual is the brand's cocktail and ingredient education hub. Three content types:

- **Cocktails** — recipe pages with structured data (Recipe schema), ratings, related guides
- **Ingredients** — detail pages with flavour profiles, recommended brands, substitutions
- **Equipment** — bar tool guides with specifications, care instructions, related cocktails

All rich editorial content goes in the `longDescription` portable text field in Sanity Studio. This renders via `FieldManualPortableText` using `next-sanity`'s `PortableText`. Use H2, H3, H4 headings — all are styled. H1 is suppressed (renders as H2 visually).

### Cocktail Keywords (JSON-LD)
The `keywords` field in each cocktail document is a `string[]`. It is fetched and merged into the Recipe structured data. Enter natural search terms, not slugs. The code also appends `name`, `family`, and `baseSpirit` automatically. Do not enter raw tag values.

### "Need the Rum?" CTA
Only renders on cocktails where `baseSpirit === 'spiced-rum'`. Intentional — it is inaccurate on non-Jerry Can cocktails.

---

## SEO Approach

- Meta titles and descriptions come from Sanity CMS fields where populated, with code fallbacks.
- Recipe JSON-LD structured data is generated on each cocktail page for Google rich results.
- Target low-competition, high-intent keywords first. See `memory/seo-keywords.md`.
- The Field Manual is the primary SEO vehicle — educational content, long-tail recipe searches.

---

## Formatting Preferences (Content)

- Short paragraphs. Often a single sentence.
- Headers should be statements, not labels.
- Avoid bullet points for body copy where prose reads better.

## Hook Structure for Web and Short-Form Content

Pattern interrupt first. Challenge or reveal in the opening line.
Follow with why it matters.
Then the identity or experience.
Close with one clear, calm action.

Strong opening lines from the brand:
- Most spiced rum is built to be mixed. This one is built to be sipped.
- We were offered investment. We said no.
- Every shortcut in production ends up in the glass.
- Craft does not automatically mean good.
- This is not for everyone. That is intentional.
- Standards are not talked about. They are lived.
- Most people have not found their spiced rum yet.
- We refused artificial flavourings. Here is what we used instead.
