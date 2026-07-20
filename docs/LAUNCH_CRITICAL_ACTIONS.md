# Launch Critical Actions - Priority Order

Based on your meeting notes. Since you're working day shifts, this is organized by priority and time needed.

---

## 🚨 MUST FIX BEFORE LAUNCH (Critical Bugs)

### 1. **Klaviyo Signup Not Working** ⏱️ 30 mins
**Issue:** Rhys's signup didn't appear in Klaviyo

**Likely Causes:**
- Dev environment may not have `KLAVIYO_PRIVATE_KEY` set
- Or it's pointing to a test/sandbox Klaviyo account

**Fix:**
1. Check `.env.local` has `KLAVIYO_PRIVATE_KEY=your_key_here`
2. Test signup on production site (not dev) after launch
3. If still broken, I'll help debug the API calls

**Action:** Test after turning off Cloudflare wall. If broken, ping me immediately.

---

### 2. **Add "Check Junk Mail" Warning** ⏱️ 5 mins
**Where:** Success message after newsletter signup

**Current:** "Check your email for exclusive content"
**Update to:** "Check your email (and junk folder) for exclusive content"

**File:** `src/components/KlaviyoSignup.tsx` line 155

---

## 🎯 QUICK WINS (Before Launch - 1-2 hours total)

### 3. **Update Footer Payment Icons** ⏱️ 10 mins
**Action:**
- Remove American Express (high fees)
- Verify Shopify/PayPal are shown
- Currently at: `src/components/Footer.tsx`

**Your meeting note:** "Remove Amex due to 5% fees vs 1% Visa/MC"

---

### 4. **Fix "Stay Connected" Link** ⏱️ 2 mins
**Issue:** Link doesn't go to signup section
**Fix:** Update link to point to `#newsletter-signup`

---

### 5. **Fix "Flavour" Spelling** ⏱️ 2 mins
**Action:** Search and replace "flavor" → "flavour" (UK spelling)
**Affected:** About pages, product descriptions

---

## 📝 COPY UPDATES (Can do after launch - 2-3 hours)

### 6. **Our Story Page** ⏱️ 30 mins
- Remove AI-sounding hyphens
- Proofread for authentic voice
- File: `src/app/about/story/page.tsx`

### 7. **The Journey Page Updates** ⏱️ 1 hour
**Updates needed:**
- **Sourcing:** Change "UK sourced" → "prioritise British products"
- **Distillation:** No production-process claims until the new producer has produced a batch
- **Aging:** Update copy - spiced rum ages in weeks, not years
- **Add:** Next page button at bottom

**Action Required FIRST:** Do not make production-process claims until the new producer has produced a batch

---

### 8. **5-Year Vision Update** ⏱️ 5 mins
**Current:** (unknown)
**Update to:** "range of exceptional spirits"

---

## 🤝 PARTNERS & RELATIONSHIPS (Post-Launch)

### 9. **Add Partners to Friends Page** ⏱️ 20 mins
**Partners to add:**
- Harlequin Printing
- Croxon's (packaging)
- Add "get in touch" CTA for potential partners

**File:** `src/app/friends/page.tsx`

---

### 10. **Armed Forces Covenant Page** ⏱️ 15 mins
**Action:** Add pledge text + signing date
**File:** `src/app/armed-forces-covenant/page.tsx`

---

## 🛒 SHOPIFY PRICING SETUP (When Ready)

**Pricing Structure:**
- RRP: £40
- Trade (6-pack): £32 (20% off)
- Armed Forces: £36 (10% off)
- Free shipping over £50

**Action:** Set in Shopify admin (not code changes)

---

## 🎨 DESIGN UPDATES (Nice-to-Have)

### 11. **Hero Image Update** ⏱️ 15 mins
**Action:** Replace placeholder with Jerry Can bottle (Cubic style)
**File:** `src/components/HeroSection.tsx`
**Waiting on:** Cubic to provide final bottle image

---

### 12. **Field Manual Landing Image** ⏱️ 10 mins
**Action:** Add image to Field Manual landing page
**File:** `src/app/field-manual/page.tsx`

---

### 13. **Member Discounts → Loyalty Program** ⏱️ 30 mins
**Change:** Replace generic "member discounts" with specific loyalty program
**Suggestion:** "Earn 10p back per £1 spent"
**File:** `src/components/KlaviyoSignup.tsx` line 315

---

## ❌ NOT CODING TASKS (For Rhys)

These are business tasks, not website changes:

- ✅ Email Rob re: Letter of Intent + offer free bottle
- ✅ Email Milton Keynes pub contact re: LOI
- ✅ Schedule Birmingham tasting when samples arrive
- ✅ Email producer re: next samples (base + 2 variants)
- ✅ Order boxes: 1,000 standard + 500 trade 6-packs
- ✅ Call producer about distillation process

---

## 🚀 MY RECOMMENDATION FOR LAUNCH

### Do TODAY (30 mins total):
1. ✅ Fix "junk mail" warning (5 mins) - I can do this now
2. ✅ Remove Amex from footer (10 mins) - I can do this now
3. ✅ Fix "flavor" → "flavour" (2 mins) - I can do this now
4. ✅ Fix Stay Connected link (2 mins) - I can do this now
5. ⏸️ Test Klaviyo signup after launch (10 mins) - Do AFTER launch

### Do THIS WEEK (After Launch):
6. Update "The Journey" copy (remove former producer's process claims; make none until a batch is produced)
7. Add Harlequin + Croxon's to Partners page
8. Update Armed Forces Covenant page

### Do LATER (When You Have Time):
9. Hero image update (when Cubic provides it)
10. Our Story proofreading
11. Loyalty program copy

---

## 🎯 LAUNCH SEQUENCE

**Right Now:**
1. I'll make the 4 quick fixes (junk mail, Amex, flavour, link)
2. We commit and push
3. You turn off Cloudflare wall
4. Site is LIVE! 🚀

**After Launch:**
5. Test Klaviyo signup on production
6. If broken, we debug together
7. Everything else can wait

---

## Want Me To Fix The Quick Wins Now?

I can fix these 4 things in the next 10 minutes:
1. ✅ "Check junk mail" warning
2. ✅ Remove Amex
3. ✅ Fix UK spelling (flavor → flavour)
4. ✅ Fix Stay Connected link

Then commit, push, and you're ready to launch?

**Say the word and I'll do it!** 🚀
