import TrustpilotWidget from './TrustpilotWidget'
import PressAwards from './PressAwards'

export default function PairedSocialProof() {
  return (
    <section
      aria-label="Customer trust and press coverage"
      className="py-16 bg-jerry-green-900/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              What people are saying
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-gold-500 mb-4">
            Field reports
          </h2>
          <p className="text-parchment-200 text-lg max-w-2xl mx-auto">
            We will let the bottles do the talking.
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-12">
          <TrustpilotWidget
            templateId="56278e9abfbbba0bdcd568bc"
            height="52px"
            token="1b8d76a8-b743-471a-8f16-321500842e93"
            theme="dark"
          />
        </div>
      </div>

      <PressAwards />
    </section>
  )
}
