import Link from 'next/link'

// FAQ data with internal linking opportunities
const faqs = [
  {
    question: "What does spiced rum taste like?",
    answer: "Expect vanilla and caramel hitting you first, followed by warm spices like cinnamon and nutmeg through the middle. Our rum finishes smooth - none of that harsh burn you get from cheaper bottles. It's sweet enough to sip neat, but has enough backbone to stand up in cocktails without getting lost."
  },
  {
    question: "Is spiced rum good for beginners?",
    answer: "Honestly, it's one of the best places to start. The spices and vanilla smooth out the harsher edges you'd find in white rum or whisky. If you're new to spirits, try ours with ginger beer and a squeeze of lime - it's forgiving, tasty, and doesn't require any fancy equipment or technique."
  },
  {
    question: "What's the difference between spiced rum and dark rum?",
    answer: "Dark rum gets its colour and flavour from aging in barrels - you'll taste molasses, oak, and dried fruit. Spiced rum like ours is infused with spices after distillation, giving you those vanilla, cinnamon, and caramel notes upfront. Dark rum is typically sipped; spiced rum is more versatile for mixing."
  },
  {
    question: "How should I drink spiced rum?",
    answer: "However you fancy, really. Neat or over ice works well if you want to taste what we've made. For mixing, it's brilliant with ginger beer (a Dark 'n' Stormy), cola, or in a proper rum punch. Check out our Field Manual for cocktail recipes that show off what spiced rum can do.",
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
  { aspect: "Batch Size", massProduced: "100,000+ litres", jerryCan: "700 bottles" },
  { aspect: "Distillation", massProduced: "Column still", jerryCan: "Pot still" },
  { aspect: "Sourcing", massProduced: "Single industrial source", jerryCan: "Caribbean rum + Welsh brewery molasses" },
  { aspect: "Provenance", massProduced: "Unknown", jerryCan: "Spirit of Wales Distillery" },
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
    <section className="py-16 bg-jerry-green-900/50">
      {/* FAQ Schema markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Common Questions
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
            Everything You Need to Know
          </h2>

          <p className="text-xl text-parchment-300 max-w-3xl mx-auto leading-relaxed">
            New to spiced rum or just curious about who we are? Here are the questions we get asked most.
          </p>
        </div>

        {/* FAQ Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20"
            >
              <h3 className="text-lg font-serif font-bold text-gold-300 mb-3">
                {faq.question}
              </h3>
              <p className="text-parchment-200 leading-relaxed">
                {faq.answer}
              </p>
              {faq.link && (
                <Link
                  href={faq.link.href}
                  className="inline-flex items-center gap-2 mt-4 text-gold-400 hover:text-gold-300 transition-colors text-sm font-medium"
                >
                  {faq.link.text}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="bg-gradient-to-br from-parchment-200/10 to-parchment-400/5 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
          <h3 className="text-2xl font-serif font-bold text-white mb-6 text-center">
            Mass-Produced vs Craft Rum
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gold-500/30">
                  <th className="text-left py-4 px-4 text-parchment-300 font-medium">Aspect</th>
                  <th className="text-left py-4 px-4 text-parchment-400 font-medium">Mass-Produced</th>
                  <th className="text-left py-4 px-4 text-gold-300 font-medium">Jerry Can Spirits</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr
                    key={index}
                    className={index !== comparisonData.length - 1 ? "border-b border-gold-500/10" : ""}
                  >
                    <td className="py-4 px-4 text-parchment-200 font-medium">{row.aspect}</td>
                    <td className="py-4 px-4 text-parchment-400">{row.massProduced}</td>
                    <td className="py-4 px-4 text-gold-300">{row.jerryCan}</td>
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
            className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500/20 border border-gold-500/40 text-gold-300 rounded-lg hover:bg-gold-500/30 transition-all duration-300 font-semibold"
          >
            View Full FAQ
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
