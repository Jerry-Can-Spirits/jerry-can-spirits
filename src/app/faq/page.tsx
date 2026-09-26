import type { Metadata } from 'next'
import Link from 'next/link'
import StructuredData from '@/components/StructuredData'
import { baseOpenGraph, OG_IMAGE } from '@/lib/og'
import { DELIVERY_PROMISE_SENTENCE } from '@/lib/delivery'
import FAQAccordion from '@/components/FAQAccordion'
import SectionHeading from '@/components/SectionHeading'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Common questions about Jerry Can Spirits. Ingredients, shipping, age verification, cocktail recipes, and everything in between.",
  alternates: {
    canonical: "https://jerrycanspirits.co.uk/faq/",
  },
  openGraph: {
    ...baseOpenGraph,
    title: "Frequently Asked Questions | Jerry Can Spirits®",
    description: "Common questions about Jerry Can Spirits. Ingredients, shipping, age verification, cocktail recipes, and everything in between.",
    url: "https://jerrycanspirits.co.uk/faq/",
  },
  twitter: {
    card: 'summary_large_image' as const,
    title: "Frequently Asked Questions | Jerry Can Spirits®",
    description: "Common questions about Jerry Can Spirits. Ingredients, shipping, age verification, cocktail recipes, and everything in between.",
    images: OG_IMAGE,
  },
}

const faqs = [
  // Product Information
  {
    question: "What makes Jerry Can Spirits rum unique?",
    answer: "We make one spiced rum. It's macerated by our British partner distillery in limited, numbered batches, using real botanicals and no artificial flavouring. What makes it different is that we actually give a damn about what goes in it."
  },
  {
    question: "What type of rum do you produce?",
    answer: "We make one product: Expedition Spiced Rum. A spiced rum, 40% ABV, macerated with real spices by our British partner distillery. Works neat, over ice, or in cocktails."
  },
  {
    question: "What is the alcohol content (ABV) of your rum?",
    answer: "Our Expedition Spiced Rum is 40% ABV. Enough strength to hold its character in cocktails, smooth enough to drink neat. That was the target, and we hit it."
  },
  {
    question: "Are your products suitable for vegans?",
    answer: "Yes. Our rum has no animal products in the production process, making it suitable for vegans and vegetarians."
  },
  {
    question: "How should I store my Jerry Can Spirits rum?",
    answer: "Store your rum upright in a cool, dark place away from direct sunlight and temperature fluctuations. Once opened, it will maintain quality for several years. No refrigeration needed."
  },

  // Ordering & Shipping
  {
    question: "How long does shipping take?",
    answer: `${DELIVERY_PROMISE_SENTENCE} Delivery is by Royal Mail Tracked 48 and you receive the tracking link once your order ships.`
  },
  {
    question: "Do you ship internationally?",
    answer: "We're currently focused on UK delivery. International shipping plans will be announced to our mailing list subscribers. Sign up to stay informed about expansion to your region."
  },
  {
    question: "What are your shipping costs?",
    answer: "UK standard shipping is calculated at checkout based on your order. We offer free UK shipping on orders over a certain value - check our shop for current promotions."
  },
  {
    question: "How do you verify age for alcohol purchases?",
    answer: "You must be 18+ to purchase. Our delivery partners verify age at the door - valid photo ID is required. If no one 18+ is available to receive the order, it will not be delivered."
  },

  // Returns & Customer Service
  {
    question: "What is your returns policy?",
    answer: "Unopened bottles can be returned within 14 days of delivery for a refund. Due to alcohol licensing laws, we cannot accept returns of opened bottles unless faulty. Contact hello@jerrycanspirits.co.uk to initiate a return."
  },
  {
    question: "What if my bottle arrives damaged?",
    answer: "We take great care in packaging, but if your bottle arrives damaged, please contact us at hello@jerrycanspirits.co.uk within 48 hours with photos. We'll arrange a replacement or refund immediately."
  },

  // Cocktails & Recipes
  {
    question: "What cocktails work best with Jerry Can Spirits rum?",
    answer: "Our rum is versatile and works beautifully in classic cocktails like Old Fashioned, Mai Tai, and Rum Punch. Check our Field Manual for cocktail recipes.",
    hasRichAnswer: true,
  },

  // Reviews & Community
  {
    question: "How can I leave a review?",
    answer: "You can leave a review on Trustpilot, Google, or Yell. After your purchase, you'll receive a Trustpilot invitation by email. Your honest feedback helps other customers and helps us improve."
  },

  // Company & Brand
  {
    question: "What is your connection to the Armed Forces?",
    answer: "Jerry Can Spirits was founded by two Royal Corps of Signals veterans with over 17 years of combined service. We're proud supporters of the Armed Forces Covenant and donate 5% of profits to military charities.",
    hasRichAnswer: true,
  },
  {
    question: "Can I visit your distillery?",
    answer: "Expedition Spiced Rum is macerated by our British partner distillery. Contact us at hello@jerrycanspirits.co.uk for any production enquiries."
  },
  {
    question: "Do you offer corporate gifts or bulk orders?",
    answer: "Yes. We offer corporate gifting and bulk order options. For custom orders, branded packaging, or volume discounts, contact us at hello@jerrycanspirits.co.uk."
  },
]

// The two answers that carry links. Everything else in `faqs` is plain text.
const RICH_ANSWERS: Record<string, ReactNode> = {
  "What cocktails work best with Jerry Can Spirits rum?": (
    <>Our rum is versatile and works beautifully in classic cocktails like Old Fashioned, Mai Tai, and Rum Punch. Check our <Link href="/field-manual/cocktails/" className="text-gold-300 hover:text-gold-400 underline">Field Manual</Link> for cocktail recipes.</>
  ),
  "What is your connection to the Armed Forces?": (
    <>Jerry Can Spirits was <Link href="/about/team/" className="text-gold-300 hover:text-gold-400 underline">founded by two Royal Corps of Signals veterans</Link> with over 17 years of combined service. We&apos;re proud supporters of the <Link href="/armed-forces-covenant/" className="text-gold-300 hover:text-gold-400 underline">Armed Forces Covenant</Link> and donate 5% of profits to military charities.</>
  ),
}

export default function FAQPage() {
  // FAQ Schema for SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }

  return (
    <>
      <StructuredData data={faqSchema} />
      <main>
        {/* The one page the band rollout missed (Jade, 25 Sep 2026: the
            questions looked a different green). Header on dark, the questions
            on light, the contact panel on dark, like every other page. */}
        <section className="band-dark pt-20 pb-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading
              as="h1"
              eyebrow="Frequently Asked Questions"
              intro="Everything you need to know about Jerry Can Spirits, how we make our spirits, and how to buy."
            >
              Questions About Jerry Can Spirits, Answered
            </SectionHeading>
          </div>
        </section>

        <section className="band-light py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* FAQ List */}
          <FAQAccordion
            headingLevel="h2"
            items={faqs.map((faq) => ({
              question: faq.question,
              answer: RICH_ANSWERS[faq.question] ?? faq.answer,
            }))}
          />

          </div>
        </section>

        <section className="band-dark py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* CTA */}
          <div className="text-center p-8 bg-jerry-green-800/20 border border-gold-500/20 rounded-lg">
            <h3 className="text-2xl font-serif font-bold text-gold-300 mb-4">
              Still Have Questions?
            </h3>
            <p className="text-parchment-200 mb-6">
              We're here to help. Reach out to our team for any additional questions.
            </p>
            <a
              href="/contact/"
              className="inline-block px-8 py-3 bg-gold-500 text-jerry-green-900 font-semibold rounded-lg hover:bg-gold-400 transition-colors"
            >
              Contact Us
            </a>
          </div>
          </div>
        </section>
      </main>
    </>
  )
}
