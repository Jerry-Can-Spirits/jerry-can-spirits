# Mobile UX Audit Report
**Jerry Can Spirits Website**
**Date:** November 25, 2025
**Audit Type:** Comprehensive Site-Wide Mobile Optimization Review

---

## Executive Summary

A systematic review of all pages across the Jerry Can Spirits website revealed **strong mobile foundations** with several opportunities for optimization. The site is generally mobile-friendly, but excessive scrolling and some text sizing issues create friction for mobile users.

### Overall Score: **7.5/10**

**Strengths:**
- ✅ Responsive grid layouts throughout
- ✅ Touch-friendly navigation with mobile menu
- ✅ Product pages now optimized (2-column grids, interactive galleries)
- ✅ Good use of responsive images with Next.js Image component
- ✅ Collapsible footer sections on mobile

**Key Issues Found:**
- ⚠️ Excessive vertical scrolling on content-heavy pages
- ⚠️ Some font sizes too small on mobile (countdown, trust indicators)
- ⚠️ Homepage hero section could be more compact
- ⚠️ Long-form content pages lack mobile-specific formatting

---

## Page-by-Page Analysis

### 1. Homepage (`/`)
**Current State:** Good mobile experience, but hero section is tall

#### Issues:
- **Countdown timer:** Grid uses `grid-cols-4` which makes each cell small on mobile
- **Hero min-height:** `min-h-screen` forces full-screen height, pushing content below fold
- **Trust indicators:** Small icons and text at bottom (line 159-192)

#### Recommendations:
```tsx
// HeroSection.tsx optimizations:

// 1. Reduce countdown padding on mobile (lines 88-104)
<div className="bg-jerry-green-700/60 rounded-lg p-2 sm:p-3 border border-gold-500/20">
  <div className="text-lg sm:text-2xl font-bold text-gold-300">{timeToLaunch.days}</div>
  <div className="text-[10px] sm:text-xs text-parchment-400 uppercase">Days</div>
</div>

// 2. Adjust hero height (line 59)
<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[70vh] sm:min-h-[80vh]">

// 3. Enlarge trust indicators on mobile (lines 160-169)
<Image
  src="/images/hero/premium-quality.png"
  alt="Premium Quality British Rum Badge"
  width={24}  // was 20
  height={24}
  className="w-6 h-6 sm:w-5 sm:h-5"  // Larger on mobile
/>
<span className="text-sm sm:text-sm font-medium">Premium Quality</span>
```

**Priority:** Medium
**Impact:** Reduces initial scroll, improves readability
**Effort:** 15 minutes

---

### 2. About / Story Page (`/about/story`)
**Current State:** Excellent content, but VERY long on mobile

#### Issues:
- **Extremely long scrolling:** 632 lines of dense content
- **Large images:** Multiple full-width hero images (lines 27-36, 94-102)
- **No pagination or sections:** Single continuous scroll

#### Recommendations:
```tsx
// 1. Reduce hero image height on mobile (line 27)
<div className="relative w-full max-w-2xl mx-auto h-48 sm:h-64 md:h-80 lg:h-96 rounded-lg...">

// 2. Make grid more compact on mobile (line 73)
<div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center mb-12 sm:mb-16">

// 3. Reduce padding on mobile (line 183)
<div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">

// 4. Add "Back to top" button for mobile
<button
  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
  className="fixed bottom-6 right-6 lg:hidden bg-gold-500 text-jerry-green-900 p-3 rounded-full shadow-lg"
>
  <ChevronUpIcon className="w-6 h-6" />
</button>
```

**Priority:** High
**Impact:** Major reduction in scrolling fatigue
**Effort:** 30 minutes

---

### 3. Contact Page (`/contact`)
**Current State:** Clean and simple, works well on mobile

#### Issues:
- **Contact method cards:** 3-column grid might be cramped on small tablets
- **Social icons:** Slightly small for easy tapping

#### Recommendations:
```tsx
// Line 100: Improve tablet breakpoint
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">

// Line 170: Enlarge social icons
className="w-14 h-14 sm:w-12 sm:h-12 bg-jerry-green-700/60..." // Larger on mobile
```

**Priority:** Low
**Impact:** Minor UX improvement
**Effort:** 5 minutes

---

### 4. Field Manual Pages (`/field-manual/*`)
**Current State:** Well-structured navigation, cards look good

#### Issues:
- **Hero images:** Full-height on mobile wastes space (line 28)
- **Card grid:** 3-column layout on larger screens could benefit from 2-column on tablets

#### Recommendations:
```tsx
// field-manual/page.tsx line 28
<div className="relative w-full max-w-4xl mx-auto h-48 sm:h-64 md:h-80 lg:h-96 rounded-lg...">

// Line 55: Improve responsive grid
<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:items-stretch">
```

**Priority:** Medium
**Impact:** Reduces scrolling, better tablet experience
**Effort:** 10 minutes

---

### 5. Shop Pages (`/shop/*`)
**Current State:** ✅ **OPTIMIZED** - Already implemented improvements

#### Completed Optimizations:
- ✅ 2-column product grid on mobile (was 1-column)
- ✅ Interactive thumbnail gallery with click-to-switch
- ✅ Responsive image aspect ratios (`aspect-[4/3]` on mobile)
- ✅ Reduced padding and responsive font sizes
- ✅ Hidden descriptions on mobile to save space

**No further action needed**

---

### 6. Header / Navigation
**Current State:** Good mobile menu, auto-hide on scroll

#### Issues:
- **Logo size:** Could be slightly smaller on mobile to reduce header height
- **Mobile menu:** Opens well, but no indication of current page

#### Recommendations:
```tsx
// Header.tsx - Add current page indicator in mobile menu
<Link
  href={item.href}
  className={`block px-4 py-3 text-base ${
    pathname === item.href
      ? 'bg-gold-500/20 text-gold-300 font-semibold'
      : 'text-parchment-200 hover:bg-jerry-green-700/40'
  }`}
>
```

**Priority:** Low
**Impact:** Better navigation awareness
**Effort:** 10 minutes

---

### 7. Footer
**Current State:** Excellent - collapsible sections work perfectly on mobile

#### Issues:
- **Payment icons:** Could be displayed in 3x2 grid instead of horizontal scroll

#### Recommendations:
```tsx
// Footer.tsx - Payment methods grid
<div className="grid grid-cols-3 sm:grid-cols-6 gap-4 items-center">
  {paymentMethods.map((method) => (
    <Image key={method.name} {...method} />
  ))}
</div>
```

**Priority:** Low
**Impact:** Minor visual improvement
**Effort:** 5 minutes

---

## Priority Recommendations

### 🔴 HIGH PRIORITY (Implement First)
1. **Optimize About/Story page for mobile** - Massive scrolling issue
2. **Reduce hero image heights** across all pages
3. **Countdown timer mobile optimization** on homepage

**Estimated Time:** 1 hour
**Impact:** Significantly reduces mobile scrolling fatigue

### 🟡 MEDIUM PRIORITY (Next Sprint)
1. **Field Manual mobile optimizations**
2. **Homepage hero height adjustments**
3. **Add "Back to top" buttons on long pages**

**Estimated Time:** 45 minutes
**Impact:** Improves navigation and reduces friction

### 🟢 LOW PRIORITY (Polish)
1. **Contact page responsive tweaks**
2. **Header current page indicators**
3. **Footer payment icon grid**

**Estimated Time:** 20 minutes
**Impact:** Minor UX improvements

---

## Mobile-Specific CSS Utilities

### Recommended Global Additions

Add these utility classes to `globals.css`:

```css
/* Mobile-optimized section spacing */
@layer utilities {
  .mobile-section-padding {
    @apply py-12 sm:py-16 lg:py-20;
  }

  .mobile-card-padding {
    @apply p-4 sm:p-6 lg:p-8;
  }

  .mobile-heading {
    @apply text-2xl sm:text-3xl lg:text-4xl;
  }

  .mobile-subheading {
    @apply text-lg sm:text-xl lg:text-2xl;
  }
}
```

---

## Testing Recommendations

### Devices to Test
- iPhone SE (375px) - Smallest common device
- iPhone 12/13/14 (390px) - Most common
- Android (412px) - Google Pixel
- iPad Mini (768px) - Tablet breakpoint
- iPad Pro (1024px) - Large tablet

### Key Metrics to Track
- **Scroll Depth:** Target < 5 screens per page
- **Tap Target Size:** Minimum 44x44px for all interactive elements
- **Font Size:** Body text minimum 16px (currently meets this)
- **Load Time:** < 3s on 4G

---

## Summary of Changes Made This Session

### ✅ Completed
1. **Product Detail Pages** - Interactive thumbnail gallery
2. **Product Listing Pages** - 2-column mobile grid, responsive images
3. **Product Cards** - Reduced padding, responsive fonts, hidden descriptions

### 📋 Recommended (Not Yet Implemented)
1. Homepage hero optimizations
2. About/Story page mobile formatting
3. Hero image height reductions
4. Back-to-top buttons
5. Mobile utility classes

---

## Estimated Total Implementation Time

- **High Priority:** 1 hour
- **Medium Priority:** 45 minutes
- **Low Priority:** 20 minutes

**Total:** ~2 hours to implement all recommendations

---

## Conclusion

The Jerry Can Spirits website has a **solid mobile foundation** with most pages working well on small screens. The primary issue is **excessive scrolling** on content-heavy pages like the About/Story page. Implementing the high-priority recommendations will significantly improve the mobile experience.

The shop pages are now optimized and serve as an excellent example of mobile-first design with 2-column grids, responsive images, and compact layouts.

**Next Steps:**
1. Implement high-priority optimizations (About page, hero heights, countdown)
2. Test on real devices
3. Consider adding mobile analytics to track scroll depth
4. Review and implement medium/low priority items in next sprint
