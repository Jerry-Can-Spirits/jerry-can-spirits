import Link from 'next/link'
import { safeJsonLd } from '@/lib/jsonLd'
import FAQAccordion from '@/components/FAQAccordion'
import SectionHeading from '@/components/SectionHeading'

// FAQ data with internal linking opportunities
const faqs = [
  {
    question: "What does spiced rum taste like?",
    answer: "Madagascan vanilla hits you first, rich and sweet, then Ceylon cinnamon and ginger warm through the middle with hints of orange peel. The finish is smooth with cassia and clove undertones - none of that harsh burn you get from cheaper bottles. It's sweet enough to sip neat, but has enough backbone to stand up in cocktails without getting lost."
  },
  {
    question: "Is spiced rum good for beginners?",
    answer: "Honestly, it's one of the best places to start. The spices and vanilla smooth out the harsher edges you'd find in white rum or whisky. If you're new to spirits, try ours with ginger beer and a squeeze of lime - it's forgiving, tasty, and doesn't require any fancy equipment or technique."
  },
  {
    question: "What's the difference between spiced rum and dark rum?",
    answer: "Dark rum gets its colour and flavour from aging in barrels - you'll taste molasses, oak, and dried fruit. Spiced rum like ours is macerated with botanicals, giving you Madagascan vanilla, Ceylon cinnamon, and warming ginger upfront. Dark rum is typically sipped; spiced rum is more versatile for mixing."
  },
  {
    question: "How should I drink spiced rum?",
    answer: "However you fancy, really. Neat or over ice works well if you want to taste what we've made. For mixing, it's brilliant with ginger beer (our Storm and Spice), cola, or in a proper rum punch. Check out our Field Manual for cocktail recipes that show off what spiced rum can do.",
    link: { href: "/field-manual/", text: "Browse cocktail recipes" }
  },
  {
    question: "Is Jerry Can Spirits gluten-free?",
    answer: "Yes. Rum is distilled from sugarcane or molasses, not grains, so there's no gluten in the base spirit. We don't add anything containing gluten during the spicing process either. That said, if you've got a severe allergy, it's always worth checking with your doctor first."
  },
  {
    question: "Why is it called Jerry Can Spirits?",
    answer: "The jerry can wasn't designed to win beauty contests. It was engineered by the Germans in the 1930s to be reliable in the worst conditions - deserts, Arctic, wherever. After years in the Royal Signals, we appreciate kit that just works. We named the company after that same philosophy: no fuss, no gimmicks, just quality you can depend on.",
    link: { href: "/about/story/", text: "Read our full story" }
  }
]

// Comparison table data
const comparisonData = [
  { aspect: "Batch Size", massProduced: "100,000+ litres", jerryCan: "Small, numbered batches" },
  // The Distillation comparison row (column still vs pot still) was removed
  // permanently under the provenance rules; do not reintroduce a process row.
  { aspect: "Sourcing", massProduced: "Single industrial source", jerryCan: "Caribbean rum, real botanicals"},
  { aspect: "Provenance", massProduced: "Unknown", jerryCan: "British partner distillery" },
  { aspect: "Ownership", massProduced: "Corporate", jerryCan: "100% Veteran-owned" },
]

export default function HomepageFAQ() {
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
    <section className="py-16 band-dark overflow-x-hidden">
      {/* FAQ Schema markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqSchema) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Common Questions"
          intro="New to spiced rum or just curious about who we are? Here are the questions we get asked most."
        >
          Everything You Need to Know
        </SectionHeading>

        {/* Each question opens on tap. Six full answers stacked on a phone put
            a screen and a half between the serves and the closing ask; the
            schema above still carries every answer for search. */}
        <div className="mb-16">
          <FAQAccordion
            columns={2}
            items={faqs.map((faq) => ({
              question: faq.question,
              answer: (
                <>
                  {faq.answer}
                  {faq.link && (
                    <Link
                      href={faq.link.href}
                      className="block mt-4 text-gold-400 hover:text-gold-300 transition-colors text-sm font-medium underline underline-offset-2"
                    >
                      {faq.link.text}
                    </Link>
                  )}
                </>
              ),
            }))}
          />
        </div>

        {/* Comparison Table */}
        {/* Tighter cells on a phone so all three columns fit inside the
            card instead of the third being clipped at its edge. */}
        <div className="bg-linear-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-4 sm:p-8 border border-gold-500/20">
          <h3 className="text-2xl font-serif font-bold text-white mb-6 text-center">
            Mass-Produced vs Craft Rum
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm sm:text-base">
              <thead>
                <tr className="border-b border-gold-500/30">
                  <th className="text-left py-3 px-2 sm:py-4 sm:px-4 text-parchment-300 font-medium">Aspect</th>
                  <th className="text-left py-3 px-2 sm:py-4 sm:px-4 text-parchment-400 font-medium">Mass-Produced</th>
                  <th className="text-left py-3 px-2 sm:py-4 sm:px-4 text-gold-300 font-medium bg-gold-500/5 border-l border-gold-500/20 rounded-tr-lg">Jerry Can Spirits</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr
                    key={index}
                    className={index !== comparisonData.length - 1 ? "border-b border-gold-500/10" : ""}
                  >
                    <td className="py-3 px-2 sm:py-4 sm:px-4 text-parchment-200 font-medium">{row.aspect}</td>
                    <td className="py-3 px-2 sm:py-4 sm:px-4 text-parchment-400">{row.massProduced}</td>
                    <td className={`py-3 px-2 sm:py-4 sm:px-4 text-gold-300 bg-gold-500/5 border-l border-gold-500/20${index === comparisonData.length - 1 ? ' rounded-br-lg' : ''}`}>{row.jerryCan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-parchment-300 mb-4">
            Got more questions? We're happy to help.
          </p>
          <Link
            href="/faq/"
            className="inline-flex items-center px-6 py-3 bg-gold-500/20 border border-gold-500/40 text-gold-300 rounded-lg hover:bg-gold-500/30 transition-all duration-300 font-semibold"
          >
            View Full FAQ
          </Link>
        </div>
      </div>
    </section>
  )
}
