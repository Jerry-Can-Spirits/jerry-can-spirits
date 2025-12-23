# Component Usage Examples

Quick reference for using the new social proof components on your pages.

## Example: Adding to Homepage

Here's how you might add the Instagram feed and Trustpilot widget to your homepage:

```tsx
import InstagramFeed from '@/components/InstagramFeed'
import TrustpilotWidget from '@/components/TrustpilotWidget'

export default function HomePage() {
  return (
    <main>
      {/* Your existing hero section */}
      <HeroSection />

      {/* Trustpilot Widget - Add after hero */}
      <section className="py-8 bg-jerry-green-800/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-playfair font-bold text-gold-500 mb-4">
            Trusted by Adventurers
          </h2>
          <TrustpilotWidget
            businessUnitId="YOUR_BUSINESS_UNIT_ID"
            templateId="53aa8912dec7e10d38f59f36"
            theme="dark"
          />
        </div>
      </section>

      {/* Your existing content */}

      {/* Instagram Feed Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-playfair font-bold text-gold-500 mb-4">
              Join the Adventure
            </h2>
            <p className="text-gray-300 text-lg">
              Follow our journey on Instagram
            </p>
          </div>
          <InstagramFeed limit={6} showCaptions={false} />
        </div>
      </section>
    </main>
  )
}
```

---

## Example: Testimonials/Reviews Page

Create a dedicated page for social proof:

**File**: `src/app/testimonials/page.tsx`

```tsx
import type { Metadata } from 'next'
import TrustpilotWidget from '@/components/TrustpilotWidget'
import InstagramFeed from '@/components/InstagramFeed'

export const metadata: Metadata = {
  title: "Reviews & Testimonials | Jerry Can Spirits",
  description: "See what adventurers are saying about Jerry Can Spirits premium British rum",
}

export default function TestimonialsPage() {
  return (
    <main className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-gold-500 mb-6">
            Reviews & Testimonials
          </h1>
          <p className="text-xl text-gray-300">
            Hear from fellow adventurers who've experienced Jerry Can Spirits
          </p>
        </div>

        {/* Trustpilot Section */}
        <section className="mb-20">
          <h2 className="text-3xl font-playfair font-bold text-gold-400 mb-8 text-center">
            Customer Reviews
          </h2>

          {/* Large Widget */}
          <div className="max-w-4xl mx-auto">
            <TrustpilotWidget
              businessUnitId="YOUR_BUSINESS_UNIT_ID"
              templateId="539adbd6dec7e10e686debee" // Grid layout
              height="500px"
              theme="dark"
            />
          </div>
        </section>

        {/* Instagram UGC Section */}
        <section>
          <h2 className="text-3xl font-playfair font-bold text-gold-400 mb-4 text-center">
            Community Adventures
          </h2>
          <p className="text-gray-300 text-center mb-8">
            See how our community enjoys Jerry Can Spirits
          </p>
          <InstagramFeed limit={12} showCaptions={true} />
        </section>

      </div>
    </main>
  )
}
```

---

## Example: Product Page Integration

Add social proof to product pages:

```tsx
import TrustpilotWidget from '@/components/TrustpilotWidget'

export default function ProductPage() {
  return (
    <div>
      {/* Product details */}
      <div className="product-info">
        {/* ... */}
      </div>

      {/* Reviews for this product */}
      <div className="mt-12">
        <h3 className="text-2xl font-bold text-gold-500 mb-6">
          Customer Reviews
        </h3>
        <TrustpilotWidget
          businessUnitId="YOUR_BUSINESS_UNIT_ID"
          templateId="54ad5defc6454f065c28af8b" // Carousel
          height="400px"
        />
      </div>
    </div>
  )
}
```

---

## Example: Footer Social Proof

Add a compact widget to your footer:

**File**: `src/components/Footer.tsx`

```tsx
import TrustpilotWidget from './TrustpilotWidget'

export default function Footer() {
  return (
    <footer>
      {/* Your existing footer content */}

      {/* Add before the copyright section */}
      <div className="border-t border-gold-500/20 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <TrustpilotWidget
            businessUnitId="YOUR_BUSINESS_UNIT_ID"
            templateId="53aa8912dec7e10d38f59f36" // Micro - compact
            height="20px"
          />
        </div>
      </div>

      {/* Copyright section */}
    </footer>
  )
}
```

---

## Example: About Page with Instagram

Show behind-the-scenes content:

```tsx
import InstagramFeed from '@/components/InstagramFeed'

export default function AboutPage() {
  return (
    <main>
      {/* Your story content */}

      {/* Instagram section */}
      <section className="py-16 bg-jerry-green-800/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-playfair font-bold text-gold-500 mb-4 text-center">
            Behind the Scenes
          </h2>
          <p className="text-gray-300 text-center mb-8">
            Follow our adventure on Instagram
          </p>
          <InstagramFeed limit={6} />

          <div className="text-center mt-8">
            <a
              href="https://instagram.com/jerrycanspirits"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700"
            >
              Follow @jerrycanspirits
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}
```

---

## Trustpilot Widget Templates Reference

Choose the template that fits your layout:

| Template ID | Name | Best For | Height Recommendation |
|-------------|------|----------|----------------------|
| `53aa8912dec7e10d38f59f36` | Micro | Footer, compact spaces | 20px |
| `539ad0ffdec7e10e686debd7` | Mini | Sidebars, headers | 150px |
| `54ad5defc6454f065c28af8b` | Carousel | Product pages | 400px |
| `539adbd6dec7e10e686debee` | Grid | Dedicated review pages | 500px+ |
| `53aa8807dec7e10d38f59f32` | Mini Carousel | Homepage sections | 300px |

---

## Instagram Feed Props

```tsx
<InstagramFeed
  limit={6}              // Number of posts (default: 6)
  showCaptions={false}   // Show captions on hover (default: false)
/>
```

**Recommended limits by context**:
- Homepage: 6 posts
- Dedicated social page: 12-18 posts
- Sidebar: 3-4 posts
- About page: 6-9 posts

---

## Styling Tips

Both components are styled to match your Jerry Can Spirits theme. They'll automatically use your existing color scheme through Tailwind classes.

### Custom Styling

If you need to adjust spacing or colors:

```tsx
<div className="my-custom-wrapper bg-jerry-green-800/10 p-8 rounded-lg">
  <InstagramFeed limit={6} />
</div>
```

---

## Performance Notes

- **Instagram Feed**: Cached for 1 hour (3600 seconds)
- **Trustpilot Widget**: Loaded asynchronously, won't block page render
- Both components are client-side only (`'use client'` directive)

---

## Mobile Responsiveness

Both components are fully responsive:
- Instagram Feed: 2 columns on mobile, 3 on desktop
- Trustpilot Widget: Automatically adjusts based on container width

Test on different screen sizes to ensure optimal display!

---

## Need More Examples?

Check out:
- `SEO_SETUP.md` for detailed setup instructions
- Component files for prop documentation
- In-code comments for additional guidance
