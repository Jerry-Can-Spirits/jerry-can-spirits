import type { Metadata } from 'next'
import Link from 'next/link'
import StructuredData from '@/components/StructuredData'

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Common questions about Jerry Can Spirits premium British rum, shipping, ingredients, cocktail recipes, and our adventure-ready spirits. Get answers about our expedition rum.",
  alternates: {
    canonical: "https://jerrycanspirits.co.uk/faq/",
  },
  openGraph: {
    title: "Frequently Asked Questions | Jerry Can Spirits®",
    description: "Get answers to common questions about our premium British rum",
  },
}

const faqs = [
  // Product Information
  {
    question: "What makes Jerry Can Spirits rum unique?",
    answer: "Our rum combines British precision with Caribbean soul. We craft small-batch, expedition-ready spirits with a focus on adventure and quality. Each bottle is designed for those who venture beyond the ordinary."
  },
  {
    question: "What type of rum do you produce?",
    answer: "We specialise in premium spiced rum with expedition-ready character. Our rums are perfect for both classic cocktails and sipping neat."
  },
  {
    question: "What is the alcohol content (ABV) of your rum?",
    answer: "Our expedition-ready rum is crafted at 40% ABV - the perfect balance for versatility in cocktails and sipping neat."
  },
  {
    question: "Are your products suitable for vegans?",
    answer: "Yes! Our rum is crafted using traditional methods with no animal products in the production process, making it suitable for vegans and vegetarians."
  },
  {
    question: "How should I store my Jerry Can Spirits rum?",
    answer: "Store your rum upright in a cool, dark place away from direct sunlight and temperature fluctuations. Once opened, it will maintain quality for several years. No refrigeration needed."
  },

  // Ordering & Shipping
  {
    question: "How long does shipping take?",
    answer: "UK orders are typically dispatched within 1-2 business days and arrive within 3-5 business days via Royal Mail. You'll receive tracking information once your order ships."
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
    answer: "Our rum is versatile and works beautifully in classic cocktails like Old Fashioned, Mai Tai, and Rum Punch. Check our Field Manual for exclusive expedition cocktail recipes.",
    hasRichAnswer: true,
  },

  // Reviews & Community
  {
    question: "How can I leave a review?",
    answer: "We use Trustpilot for verified reviews. After your purchase, you'll receive an email invitation to review your experience. Your honest feedback helps fellow adventurers and helps us improve."
  },

  // Company & Brand
  {
    question: "What is your connection to the Armed Forces?",
    answer: "Jerry Can Spirits was founded by a former Royal Corps of Signals serviceman. We're proud supporters of the Armed Forces Covenant and donate a portion of profits to military charities.",
    hasRichAnswer: true,
  },
  {
    question: "Can I visit your distillery?",
    answer: "Jerry Can Spirits contracts the Spirit of Wales Distillery to create our products. Spirit of Wales offer tours - see their website for further information."
  },
  {
    question: "Do you offer corporate gifts or bulk orders?",
    answer: "Yes! We offer corporate gifting and bulk order options. For custom orders, branded packaging, or volume discounts, contact us at hello@jerrycanspirits.co.uk."
  },
]

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
      <main className="min-h-screen py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
              <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
                Frequently Asked Questions
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-gold-500 mb-6">
              Got Questions?
            </h1>
            <p className="text-xl text-parchment-200 max-w-2xl mx-auto">
              Everything you need to know about Jerry Can Spirits premium British rum and our expedition-ready approach to crafting spirits.
            </p>
          </div>

          {/* FAQ List */}
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-jerry-green-800/20 border border-gold-500/20 rounded-lg p-6 hover:border-gold-500/40 transition-colors"
              >
                <h2 className="text-xl font-semibold text-gold-400 mb-3">
                  {faq.question}
                </h2>
                <p className="text-parchment-200 leading-relaxed">
                  {faq.question === "What cocktails work best with Jerry Can Spirits rum?" ? (
                    <>Our rum is versatile and works beautifully in classic cocktails like Old Fashioned, Mai Tai, and Rum Punch. Check our <Link href="/field-manual/cocktails" className="text-gold-300 hover:text-gold-400 underline">Field Manual</Link> for exclusive expedition cocktail recipes.</>
                  ) : faq.question === "What is your connection to the Armed Forces?" ? (
                    <>Jerry Can Spirits was <Link href="/about/team/dan-freeman" className="text-gold-300 hover:text-gold-400 underline">founded by a former Royal Corps of Signals serviceman</Link>. We&apos;re proud supporters of the <Link href="/armed-forces-covenant" className="text-gold-300 hover:text-gold-400 underline">Armed Forces Covenant</Link> and donate a portion of profits to military charities.</>
                  ) : (
                    faq.answer
                  )}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 text-center p-8 bg-jerry-green-800/20 border border-gold-500/20 rounded-lg">
            <h3 className="text-2xl font-playfair font-bold text-gold-500 mb-4">
              Still Have Questions?
            </h3>
            <p className="text-parchment-200 mb-6">
              We're here to help. Reach out to our team for any additional questions about our premium British rum.
            </p>
            <a
              href="/contact"
              className="inline-block px-8 py-3 bg-gold-500 text-jerry-green-900 font-semibold rounded-lg hover:bg-gold-400 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </main>
    </>
  )
}
