import type { Metadata } from 'next'
import StructuredData from '@/components/StructuredData'

// WebPage schema for privacy policy
const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Privacy Policy',
  description: 'Learn how Jerry Can Spirits collects, uses, and protects your personal data. GDPR compliant privacy policy covering cookies, marketing, and your data rights.',
  url: 'https://jerrycanspirits.co.uk/privacy-policy/',
  publisher: {
    '@type': 'Organization',
    name: 'Jerry Can Spirits',
    url: 'https://jerrycanspirits.co.uk',
  },
  inLanguage: 'en-GB',
  isPartOf: {
    '@type': 'WebSite',
    name: 'Jerry Can Spirits',
    url: 'https://jerrycanspirits.co.uk',
  },
}

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how Jerry Can Spirits collects, uses, and protects your personal data. GDPR compliant privacy policy covering cookies, marketing, and your data rights.",
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/privacy-policy/',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function PrivacyPolicy() {
  const lastUpdated = new Date('2025-09-04').toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <>
      <StructuredData data={webPageSchema} id="privacy-policy-webpage-schema" />
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
            Privacy Policy
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
                1. Introduction
              </h2>
              <p className="text-white mb-4 leading-relaxed">
                Jerry Can Spirits Ltd ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. This privacy policy explains how we look after your personal data when you visit our website and tells you about your privacy rights and how the law protects you.
              </p>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                2. Data Controller
              </h2>
              <p className="text-gold-300 font-semibold mb-2">Jerry Can Spirits Ltd</p>
              <p className="text-white mb-2">
                Email: <a href="mailto:privacy@jerrycanspirits.co.uk" className="text-gold-300 hover:text-gold-200 underline">privacy@jerrycanspirits.co.uk</a>
              </p>
              <p className="text-white">
                We are the controller and responsible for your personal data (collectively referred to as "Jerry Can Spirits," "we," "us," or "our" in this privacy policy).
              </p>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                3. Information We Collect
              </h2>
              
              <h3 className="text-xl font-serif font-semibold text-white mt-6 mb-3">
                3.1 Information You Give Us
              </h3>
              <ul className="list-disc list-inside text-white space-y-2 mb-6">
                <li><strong className="text-gold-300">Newsletter Signup:</strong> Email address, name (optional), marketing preferences</li>
                <li><strong className="text-gold-300">Contact Forms:</strong> Name, email address, message content</li>
                <li><strong className="text-gold-300">Age Verification:</strong> Date of birth for legal compliance</li>
                <li><strong className="text-gold-300">Account Information:</strong> If you create an account - name, email, password, preferences</li>
              </ul>

              <h3 className="text-xl font-serif font-semibold text-white mt-6 mb-3">
                3.2 Information We Collect Automatically
              </h3>
              <ul className="list-disc list-inside text-white space-y-2">
                <li><strong className="text-gold-300">Technical Data:</strong> IP address, browser type, device information, operating system</li>
                <li><strong className="text-gold-300">Usage Data:</strong> Pages visited, time spent, click patterns, referral sources</li>
                <li><strong className="text-gold-300">Cookies:</strong> Session cookies, preference cookies, analytics cookies (with consent)</li>
              </ul>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                4. How We Use Your Information
              </h2>
              
              <h3 className="text-xl font-serif font-semibold text-white mt-6 mb-3">
                4.1 Legal Basis for Processing
              </h3>
              <ul className="list-disc list-inside text-white space-y-2 mb-6">
                <li><strong className="text-gold-300">Consent:</strong> Marketing communications, analytics cookies, optional data collection</li>
                <li><strong className="text-gold-300">Legitimate Interest:</strong> Website functionality, security, essential analytics</li>
                <li><strong className="text-gold-300">Legal Obligation:</strong> Age verification for alcohol-related content</li>
                <li><strong className="text-gold-300">Contract Performance:</strong> Order processing, account management (future)</li>
              </ul>

              <h3 className="text-xl font-serif font-semibold text-white mt-6 mb-3">
                4.2 Purposes
              </h3>
              <ul className="list-disc list-inside text-white space-y-2">
                <li>Send you marketing communications about our products (with consent)</li>
                <li>Provide and improve our website functionality</li>
                <li>Comply with legal requirements (age verification)</li>
                <li>Analyze website usage to improve user experience</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Detect and prevent fraud and security threats</li>
              </ul>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                5. Cookies and Tracking
              </h2>
              
              <h3 className="text-xl font-serif font-semibold text-white mt-6 mb-3">
                5.1 Cookie Categories
              </h3>
              <ul className="list-disc list-inside text-white space-y-2 mb-6">
                <li><strong className="text-gold-300">Necessary Cookies:</strong> Essential for website functionality, age verification</li>
                <li><strong className="text-gold-300">Analytics Cookies:</strong> Google Analytics for usage statistics (requires consent)</li>
                <li><strong className="text-gold-300">Marketing Cookies:</strong> Klaviyo for email marketing tracking (requires consent)</li>
                <li><strong className="text-gold-300">Third-Party Cookies:</strong> Trustpilot for customer reviews and trust ratings (requires consent)</li>
              </ul>

              <h3 className="text-xl font-serif font-semibold text-white mt-6 mb-3">
                5.2 Cookie Management
              </h3>
              <p className="text-white">
                You can manage your cookie preferences through our cookie banner or by using the "Cookie Preferences" button in the website footer. You can also control cookies through your browser settings. For detailed information, see our{' '}
                <a href="/cookie-policy/" className="text-gold-300 hover:text-gold-200 underline">Cookie Policy</a>.
              </p>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                6. Data Sharing
              </h2>
              
              <h3 className="text-xl font-serif font-semibold text-white mt-6 mb-3">
                6.1 Third-Party Services
              </h3>
              <ul className="list-disc list-inside text-white space-y-2 mb-6">
                <li><strong className="text-gold-300">Klaviyo:</strong> Email marketing platform (USA) - adequate protection via Standard Contractual Clauses</li>
                <li><strong className="text-gold-300">Google Analytics:</strong> Website analytics (Ireland/USA) - Google Ads Data Processing Terms</li>
                <li><strong className="text-gold-300">Cloudflare:</strong> Website hosting and CDN (Global network) - GDPR-compliant with Data Processing Addendum</li>
                <li><strong className="text-gold-300">Trustpilot:</strong> Customer review and ratings platform (Denmark/USA) - GDPR-compliant with Standard Contractual Clauses and Privacy Shield certification</li>
              </ul>

              <h3 className="text-xl font-serif font-semibold text-white mt-6 mb-3">
                6.2 Legal Requirements
              </h3>
              <p className="text-white">
                We may disclose your information if required by law, court order, or to protect our rights and safety.
              </p>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                7. Data Retention
              </h2>
              <ul className="list-disc list-inside text-white space-y-2">
                <li><strong className="text-gold-300">Newsletter Subscribers:</strong> Until you unsubscribe or 3 years of inactivity</li>
                <li><strong className="text-gold-300">Contact Form Data:</strong> 2 years for customer service purposes</li>
                <li><strong className="text-gold-300">Analytics Data:</strong> 14 months (Google Analytics setting)</li>
                <li><strong className="text-gold-300">Age Verification:</strong> 30 days in browser local storage</li>
                <li><strong className="text-gold-300">Cookie Consent:</strong> 12 months or until consent withdrawn</li>
              </ul>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                8. Your Rights (GDPR)
              </h2>
              <p className="text-white mb-4">Under GDPR, you have the following rights:</p>
              <ul className="list-disc list-inside text-white space-y-2 mb-4">
                <li><strong className="text-gold-300">Access:</strong> Request copies of your personal data</li>
                <li><strong className="text-gold-300">Rectification:</strong> Request correction of inaccurate data</li>
                <li><strong className="text-gold-300">Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
                <li><strong className="text-gold-300">Restrict Processing:</strong> Request limitation of how we use your data</li>
                <li><strong className="text-gold-300">Data Portability:</strong> Request transfer of your data</li>
                <li><strong className="text-gold-300">Object:</strong> Object to processing based on legitimate interests</li>
                <li><strong className="text-gold-300">Withdraw Consent:</strong> Withdraw consent at any time</li>
              </ul>
              
              <p className="text-white">
                To exercise any of these rights, email us at{' '}
                <a href="mailto:privacy@jerrycanspirits.co.uk" className="text-gold-300 hover:text-gold-200 underline">privacy@jerrycanspirits.co.uk</a>. 
                We will respond within one month.
              </p>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                9. Data Security
              </h2>
              <p className="text-white mb-4">
                We implement appropriate technical and organizational security measures to protect your personal data, including:
              </p>
              <ul className="list-disc list-inside text-white space-y-2">
                <li>SSL/TLS encryption for data transmission</li>
                <li>Secure hosting with regular security updates</li>
                <li>Access controls and authentication</li>
                <li>Regular security assessments</li>
                <li>Staff training on data protection</li>
              </ul>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                10. International Transfers
              </h2>
              <p className="text-white mb-4">
                Some of our service providers are located outside the European Economic Area (EEA). When we transfer your data internationally, we ensure adequate protection through:
              </p>
              <ul className="list-disc list-inside text-white space-y-2">
                <li>EU Commission adequacy decisions</li>
                <li>Standard Contractual Clauses (SCCs)</li>
                <li>Binding Corporate Rules</li>
                <li>Certification schemes</li>
              </ul>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                11. Age Restrictions
              </h2>
              <p className="text-white">
                Our website is intended for individuals aged 18 and over due to alcohol-related content. We do not knowingly collect personal data from individuals under 18. If we become aware that we have collected such data, we will delete it promptly.
              </p>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                12. Changes to This Policy
              </h2>
              <p className="text-white">
                We may update this privacy policy from time to time. Any changes will be posted on this page with an updated "last modified" date. For significant changes, we may notify you by email or through a prominent notice on our website.
              </p>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                13. Contact & Complaints
              </h2>
              
              <h3 className="text-xl font-serif font-semibold text-white mt-6 mb-3">
                13.1 Contact Us
              </h3>
              <p className="text-white mb-4">
                For any privacy-related questions or to exercise your rights:
              </p>
              <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20 mb-6">
                <ul className="list-disc list-inside text-white space-y-2">
                  <li>Email: <a href="mailto:privacy@jerrycanspirits.co.uk" className="text-gold-300 hover:text-gold-200 underline">privacy@jerrycanspirits.co.uk</a></li>
                  <li>Contact Form: <a href="/contact/" className="text-gold-300 hover:text-gold-200 underline">jerrycanspirits.co.uk/contact</a></li>
                </ul>
              </div>

              <h3 className="text-xl font-serif font-semibold text-white mt-6 mb-3">
                13.2 Supervisory Authority
              </h3>
              <p className="text-white mb-4">
                You have the right to lodge a complaint with the UK Information Commissioner's Office (ICO):
              </p>
              <ul className="list-disc list-inside text-white space-y-2">
                <li>Website: <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="text-gold-300 hover:text-gold-200 underline">ico.org.uk</a></li>
                <li>Phone: 0303 123 1113</li>
                <li>Post: Information Commissioner's Office, Wycliffe House, Water Lane, Wilmslow, Cheshire SK9 5AF</li>
              </ul>
            </section>

          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 p-8 bg-jerry-green-800/40 backdrop-blur-sm rounded-xl border border-gold-500/20 text-center">
          <p className="text-parchment-300 text-sm">
            <strong className="text-gold-300">
              This privacy policy was last updated on {lastUpdated} and is compliant with GDPR, UK GDPR, and applicable data protection laws.
            </strong>
          </p>
        </div>
      </div>
    </main>
    </>
  )
}