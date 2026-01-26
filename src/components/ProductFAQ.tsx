interface FAQ {
  question: string
  answer: string
}

interface ProductFAQProps {
  faqs: FAQ[]
  productName: string
}

export default function ProductFAQ({ faqs, productName }: ProductFAQProps) {
  if (!faqs || faqs.length === 0) return null

  // Generate FAQ schema for SEO
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
    <section className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
      {/* FAQ Schema markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <h2 className="text-2xl font-serif font-bold text-white mb-2">
        Frequently Asked Questions
      </h2>
      <p className="text-parchment-400 mb-8">
        Common questions about {productName}
      </p>

      <div className="space-y-6">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border-b border-gold-500/10 pb-6 last:border-0 last:pb-0"
          >
            <h3 className="text-lg font-semibold text-gold-300 mb-3">
              {faq.question}
            </h3>
            <p className="text-parchment-200 leading-relaxed">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
