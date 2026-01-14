import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Shipping & Returns | Jerry Can Spirits - Delivery Information",
  description: "Jerry Can Spirits shipping information, delivery details, and returns policy for UK orders. Age verification required for all alcohol deliveries.",
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/shipping-returns/',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function ShippingReturns() {
  const lastUpdated = '25 November 2025'

  return (
    <main className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 pb-8 border-b border-gold-500/30">
          <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
              Legal
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-4">
            Shipping & Returns
          </h1>
          <p className="text-parchment-300 text-sm">
            Last updated: {lastUpdated}
          </p>
        </div>

        {/* Content */}
        <div className="max-w-none">
          <div className="space-y-8">
            
            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                UK Shipping
              </h2>
              <p className="text-white mb-4 leading-relaxed">
                We currently ship throughout the United Kingdom. All orders are dispatched within 2-3 
                business days and typically arrive within 5-7 business days.
              </p>

              <h3 className="text-xl font-serif font-semibold text-gold-300 mt-6 mb-3">
                Shipping Rates
              </h3>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
                <ul className="list-disc list-inside text-white space-y-2">
                  <li><strong className="text-gold-300">Standard Shipping</strong> (5-7 business days): £5.95</li>
                  <li><strong className="text-gold-300">Express Shipping</strong> (2-3 business days): £12.95</li>
                  <li><strong className="text-gold-300">Free shipping</strong> on orders over £75</li>
                </ul>
              </div>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Age Verification
              </h2>
              <div className="bg-red-900/40 backdrop-blur-sm rounded-lg p-6 border border-red-600/30 mb-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-200 mb-2">Important: Age Verification Required</h3>
                    <p className="text-red-100">
                      All deliveries require age verification upon receipt. The recipient must be 18 years or 
                      older and present valid ID to the courier. If no one is available to verify age, 
                      the package will be returned and additional delivery charges may apply.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                International Shipping
              </h2>
              <p className="text-white mb-4">
                We currently do not ship internationally. We're working on expanding our delivery network - 
                join our mailing list to be notified when we ship to your country.
              </p>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Damaged or Lost Shipments
              </h2>
              <p className="text-white mb-4">
                If your order arrives damaged or doesn't arrive at all, please contact us immediately at{' '}
                <a href="mailto:support@jerrycanspirits.co.uk" className="text-gold-300 hover:text-gold-200 underline">
                  support@jerrycanspirits.co.uk
                </a>{' '}
                with your order number and photos of any damage.
              </p>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Returns Policy
              </h2>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
                <p className="text-white mb-4">
                  Due to the nature of alcohol products and UK licensing regulations, we have specific return conditions:
                </p>
                
                <h3 className="text-lg font-semibold text-white mb-3">Eligible for Return:</h3>
                <ul className="list-disc list-inside text-white space-y-2 mb-6">
                  <li>Products damaged during shipping (with photographic evidence)</li>
                  <li>Incorrect items sent in error</li>
                  <li>Defective products (manufacturing defects)</li>
                </ul>

                <h3 className="text-lg font-semibold text-white mb-3">Not Eligible for Return:</h3>
                <ul className="list-disc list-inside text-white space-y-2 mb-6">
                  <li>Change of mind or personal preference</li>
                  <li>Products opened or consumed</li>
                  <li>Items damaged by customer mishandling</li>
                </ul>

                <h3 className="text-lg font-semibold text-white mb-3">Return Process:</h3>
                <ol className="list-decimal list-inside text-white space-y-2">
                  <li>Contact us within 14 days of delivery</li>
                  <li>Provide order number and reason for return</li>
                  <li>Await return authorisation and prepaid shipping label</li>
                  <li>Return items in original, unopened condition</li>
                  <li>Refunds processed within 5-7 business days after receipt</li>
                </ol>
              </div>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Refunds
              </h2>
              <div className="space-y-4">
                <p className="text-white">
                  Approved refunds will be processed to the original payment method within 5-7 business days 
                  after we receive the returned items.
                </p>
                <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
                  <h3 className="text-lg font-semibold text-white mb-3">Refund Timeline:</h3>
                  <ul className="list-disc list-inside text-white space-y-1">
                    <li><strong className="text-gold-300">Credit/Debit Cards:</strong> 3-5 business days</li>
                    <li><strong className="text-gold-300">PayPal:</strong> 1-2 business days</li>
                    <li><strong className="text-gold-300">Bank Transfer:</strong> 5-7 business days</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Exchange Policy
              </h2>
              <p className="text-white mb-4">
                We currently do not offer direct exchanges. If you need a different product, please follow 
                the return process for eligible items and place a new order for your preferred product.
              </p>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                Contact Us
              </h2>
              <p className="text-white mb-4">
                Have questions about shipping or returns? We're here to help:
              </p>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
                <div className="space-y-2">
                  <p className="text-white">
                    <strong className="text-gold-300">Email:</strong>{' '}
                    <a href="mailto:support@jerrycanspirits.co.uk" className="text-gold-300 hover:text-gold-200 underline">
                      support@jerrycanspirits.co.uk
                    </a>
                  </p>
                  <p className="text-white">
                    <strong className="text-gold-300">Contact:</strong>{' '}
                    <a href="/contact" className="text-gold-300 hover:text-gold-200 underline">
                      jerrycanspirits.com/contact
                    </a>
                  </p>
                  <p className="text-white">
                    <strong className="text-gold-300">Response Time:</strong> Within 24 hours during business days
                  </p>
                </div>
              </div>
            </section>

          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 p-8 bg-jerry-green-800/40 backdrop-blur-sm rounded-xl border border-gold-500/20 text-center">
          <p className="text-parchment-300 text-sm mb-4">
            <strong className="text-gold-300">
              This shipping and returns policy was last updated on {lastUpdated}.
            </strong>
          </p>
          <p className="text-parchment-400 text-xs">
            This policy is subject to review and will be updated by our legal team as required. 
            Current terms are provisional and may change.
          </p>
        </div>
      </div>
    </main>
  )
}