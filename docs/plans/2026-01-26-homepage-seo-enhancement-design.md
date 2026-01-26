# Homepage SEO Enhancement Design

**Date:** 2026-01-26
**Status:** Ready for implementation
**Priority Pages:** Homepage (highest traffic)

## Overview

Enhance the homepage with SEO best practices: FAQ section with schema markup, comparison table, and humanised content rewrites. Goal is to increase Google organic traffic (currently only 33 users/month).

---

## 1. New FAQ Section

**Location:** After "Why Jerry Can" section, before "Founder Story Snippet"

**Implementation:** New component `HomepageFAQ.tsx` with FAQPage schema markup

### Questions & Intent

| Question | Search Intent | Internal Link |
|----------|---------------|---------------|
| What does spiced rum taste like? | Informational (6,600 monthly searches) | - |
| Is spiced rum good for beginners? | Informational | - |
| What's the difference between spiced rum and dark rum? | Comparison | Guides (if exists) |
| How should I drink spiced rum? | Practical | Field Manual |
| Is Jerry Can Spirits gluten-free? | Dietary/Product | - |
| Why is it called Jerry Can Spirits? | Brand/Story | About/Story |

### Schema Markup

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Question text",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Answer text"
      }
    }
  ]
}
```

---

## 2. Comparison Table

**Location:** Within the FAQ section or as standalone section

**Implementation:** Semantic HTML table with proper headers

### Content

| Aspect | Mass-Produced | Jerry Can Spirits |
|--------|--------------|-------------------|
| Batch Size | 100,000+ litres | 700 bottles |
| Distillation | Column still | Pot still |
| Sourcing | Single industrial source | Caribbean rum + Welsh brewery molasses |
| Provenance | Unknown | Spirit of Wales Distillery |
| Ownership | Corporate | 100% Veteran-owned |

---

## 3. Humanised Content Block 1

**Location:** Replaces existing "Premium British Craft Rum for Modern Explorers" section

### New Content

> We didn't set out to start a rum company. After 12 years in the Royal Corps of Signals, what we wanted was simple: a proper drink to share with mates - something with character, made by people who give a damn. When we couldn't find it, we decided to make it ourselves.
>
> Working with Spirit of Wales Distillery, we blend Caribbean rum with Welsh brewery molasses and put it through their pot stills. The result? Vanilla and caramel upfront, warm spice through the middle, and a finish smooth enough to sip neat - but bold enough to hold its own in a cocktail.
>
> Whether you're mixing drinks at home or just unwinding after a long week, this is rum that doesn't let you down. We built it that way on purpose.

---

## 4. Humanised Content Block 2

**Location:** Replaces existing "Sustainable Craft Spirits with Purpose" section

### New Title
"Craft Spirits with Purpose" (removed "Sustainable" - unverifiable claim)

### New Content

> We work with what's close to home where we can. Our rum is distilled in Wales using Welsh water, and the molasses comes partly from a local brewery's beer production - good ingredients that would otherwise go to waste. It's not about slapping 'eco-friendly' on the label. It's just how we think things should be done.
>
> We signed the Armed Forces Covenant because supporting veterans isn't a marketing angle for us - it's personal. A portion of every sale goes to forces charities. We guarantee job interviews for veterans. It's baked into how we run the company, not bolted on afterwards.
>
> There's a reason we named ourselves after the jerry can. It wasn't designed to look good on a shelf. It was designed to work - in the desert, in the Arctic, wherever it was needed. That's the standard we hold ourselves to. Rum that does what it's supposed to do, every single time.

---

## Files to Modify

1. **`src/app/page.tsx`** - Add FAQ component, update section order
2. **`src/components/HomepageFAQ.tsx`** - New component (FAQ + comparison table)
3. **`src/app/page.tsx`** - Update SEO content blocks with humanised text

---

## Acceptance Criteria

- [ ] FAQ section renders with 6 questions
- [ ] FAQPage schema validates in Google Rich Results Test
- [ ] Comparison table uses semantic HTML (`<table>`, `<th>`, `<td>`)
- [ ] Content blocks updated with humanised copy
- [ ] Internal links work (Field Manual, About/Story)
- [ ] Mobile responsive
- [ ] Lighthouse SEO score maintained or improved

---

## Notes

- FAQ answers to be written during implementation with same humanised tone
- No sustainability claims without verification
- Ingredients accurate: Caribbean rum + Welsh brewery molasses
- Distillation: Pot still (not copper pot still)
