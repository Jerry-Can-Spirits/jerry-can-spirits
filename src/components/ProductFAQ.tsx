import { safeJsonLd } from '@/lib/jsonLd'
import FAQAccordion from '@/components/FAQAccordion'

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
    <section className="bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
      {/* FAQ Schema markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqSchema) }}
      />

      <h2 className="text-2xl font-serif font-bold text-white mb-2">
        Frequently Asked Questions
      </h2>
      <p className="text-parchment-400 mb-8">
        Common questions about {productName}
      </p>

      <FAQAccordion items={faqs} />
    </section>
  )
}
