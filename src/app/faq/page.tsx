import type { Metadata } from 'next'
import StructuredData from '@/components/StructuredData'

export const metadata: Metadata = {
  title: "FAQ | Jerry Can Spirits - Frequently Asked Questions About Premium British Rum",
  description: "Common questions about Jerry Can Spirits premium British rum, shipping, ingredients, cocktail recipes, and our adventure-ready spirits. Get answers about our expedition rum.",
  alternates: {
    canonical: "https://jerrycanspirits.co.uk/faq",
  },
  openGraph: {
    title: "FAQ | Jerry Can Spirits",
    description: "Get answers to common questions about our premium British rum",
  },
}

const faqs = [
  {
    question: "What makes Jerry Can Spirits rum unique?",
    answer: "Our rum combines British precision with Caribbean soul. We craft small-batch, expedition-ready spirits with a focus on adventure and quality. Each bottle is designed for those who venture beyond the ordinary."
  },
  {
    question: "When will Jerry Can Spirits rum be available for purchase?",
    answer: "We're currently finalising our first batch for launch. Join our mailing list to get early access notifications and be first in line when we launch."
  },
  {
    question: "What type of rum do you produce?",
    answer: "We specialise in premium spiced rum with expedition-ready character. Our rums are perfect for both classic cocktails and sipping neat."
  },
  {
    question: "Do you ship internationally?",
    answer: "We're launching in the UK first. International shipping plans will be announced to our mailing list subscribers. Sign up to stay informed about expansion to your region."
  },
  {
    question: "What cocktails work best with Jerry Can Spirits rum?",
    answer: "Our rum is versatile and works beautifully in classic cocktails, Old Fashioned, Mai Tai, and Rum Punch. Check our Field Manual for exclusive expedition cocktail recipes."
  },
  {
    question: "What is the alcohol content (ABV) of your rum?",
    answer: "Our expedition-ready rum is crafted at 40% ABV. Join our mailing list for product specifications."
  },
  {
    question: "Are your products suitable for vegans?",
    answer: "Yes! Our rum is crafted using traditional methods with no animal products in the production process, making it suitable for vegans and vegetarians."
  },
  {
    question: "Can I visit your distillery?",
    answer: "Jerry Can Spirits contracts the Spirit of Wales Distillery to create our products. Spirit of Wales offer tours, see their website for further information."
  },
  {
    question: "Do you offer corporate gifts or bulk orders?",
    answer: "We'll be offering corporate gifting and bulk order options. For inquiries, please contact us at hello@jerrycanspirits.co.uk."
  },
  {
    question: "What is your connection to the Armed Forces?",
    answer: "Jerry Can Spirits was founded by a former Royal Corps of Signals serviceman. We're proud supporters of the Armed Forces Covenant and donate a portion of profits to military charities."
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
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
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
                <p className="text-gray-300 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 text-center p-8 bg-jerry-green-800/20 border border-gold-500/20 rounded-lg">
            <h3 className="text-2xl font-playfair font-bold text-gold-500 mb-4">
              Still Have Questions?
            </h3>
            <p className="text-gray-300 mb-6">
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
