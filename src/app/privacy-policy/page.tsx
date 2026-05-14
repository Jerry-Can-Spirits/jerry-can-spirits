import type { Metadata } from 'next'
import StructuredData from '@/components/StructuredData'
import { baseOpenGraph } from '@/lib/og'

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
  openGraph: {
    ...baseOpenGraph,
    title: 'Privacy Policy | Jerry Can Spirits®',
    description: 'Learn how Jerry Can Spirits collects, uses, and protects your personal data. GDPR compliant privacy policy covering cookies, marketing, and your data rights.',
    url: 'https://jerrycanspirits.co.uk/privacy-policy/',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function PrivacyPolicy() {
  const lastUpdated = new Date('2026-05-12').toLocaleDateString('en-GB', {
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
                Email: <a href="mailto:support@jerrycanspirits.co.uk" className="text-gold-300 hover:text-gold-200 underline">support@jerrycanspirits.co.uk</a>
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
                <li><strong className="text-gold-300">Age Verification:</strong> Confirmation that you are of legal drinking age in your region</li>
              </ul>

              <h3 className="text-xl font-serif font-semibold text-white mt-6 mb-3">
                3.2 The Expedition Log
              </h3>
              <p className="text-white mb-3 leading-relaxed">
                The Expedition Log is an opt-in public registry for founding supporters. When you submit an entry, we collect your name, approximate location (town or city level), bottle type, and bottle number. This information is displayed publicly on our website.
              </p>
              <p className="text-white mb-3 leading-relaxed">
                The legal basis for processing this data is your consent, given when you submit the form.
              </p>
              <p className="text-white mb-3 leading-relaxed">
                Your location is passed to Mapbox to place your entry on the map. Mapbox&apos;s privacy policy is available at{' '}
                <a href="https://www.mapbox.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-gold-300 hover:text-gold-200 underline">mapbox.com/legal/privacy</a>.
              </p>
              <p className="text-white leading-relaxed">
                To have your entry removed, email{' '}
                <a href="mailto:support@jerrycanspirits.co.uk" className="text-gold-300 hover:text-gold-200 underline">support@jerrycanspirits.co.uk</a>. We will remove it within 7 days.
              </p>

              <h3 className="text-xl font-serif font-semibold text-white mt-6 mb-3">
                3.3 Information We Collect Automatically
              </h3>
              <ul className="list-disc list-inside text-white space-y-2">
                <li><strong className="text-gold-300">Technical Data:</strong> IP address, browser type, device information, operating system</li>
                <li><strong className="text-gold-300">Usage Data:</strong> Pages visited, time spent, click patterns, referral sources</li>
                <li><strong className="text-gold-300">Cookies:</strong> Session cookies, preference cookies, analytics cookies (with consent)</li>
              </ul>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                3.4 Trade account applications
              </h2>
              <p className="text-white mb-4 leading-relaxed">
                If you apply for a trade account, we collect information about your business, premises licensing, primary contact, and one director or owner. This includes a copy of your premises licence and photo identification of a director or owner.
              </p>
              <p className="text-white mb-4 leading-relaxed">
                <strong className="text-gold-300">Lawful basis.</strong> We process this data to meet our legal obligations under HMRC&rsquo;s Alcohol Wholesaler Registration Scheme (AWRS) due diligence requirements, and our legitimate interest in verifying the businesses we trade with.
              </p>
              <p className="text-white mb-4 leading-relaxed">
                <strong className="text-gold-300">Retention.</strong> Photo identification and premises licence copies are deleted from our systems 30 days after submission. Application details and verification records are retained for the life of the trade account and for six years after closure, in line with HMRC record-keeping requirements.
              </p>
              <p className="text-white mb-4 leading-relaxed">
                <strong className="text-gold-300">Recipients.</strong> This data is accessible only to Jerry Can Spirits directors. It is stored in Cloudflare R2 (United Kingdom and European Union regions) and Cloudflare D1.
              </p>
              <p className="text-white leading-relaxed">
                <strong className="text-gold-300">Your rights.</strong> You can request access, correction, or deletion of your data by emailing <a href="mailto:hello@jerrycanspirits.co.uk" className="text-gold-300 underline hover:text-gold-200">hello@jerrycanspirits.co.uk</a>. Deletion requests for active trade accounts will close the account.
              </p>
            </section>

            <section className="bg-jerry-green-800/40 backdrop-blur-sm rounded-lg p-6 border border-gold-500/20">
              <h2 className="text-2xl font-serif font-bold text-white mb-4 pb-2 border-b border-gold-500/20">
                3.5 Pour IQ™
              </h2>
              <p className="text-white mb-4 leading-relaxed">
                If you hold a Pour IQ licence, we process the cocktail menu data you enter, including cocktail names, recipes, ingredient costs, sale prices, and the resulting analyses.
              </p>
              <p className="text-white mb-4 leading-relaxed">
                <strong className="text-gold-300">Lawful basis.</strong> Contract performance &mdash; providing the menu analysis service your licence entitles you to.
              </p>
              <p className="text-white mb-4 leading-relaxed">
                <strong className="text-gold-300">Recipients.</strong> Cocktail menu data is sent to Anthropic PBC (United States) for AI-powered analysis. Anthropic does not train its models on API data per their commercial terms. Menus and analyses are stored in Cloudflare D1 (United Kingdom and European Union regions). Pour IQ data is strictly per-tenant &mdash; never shared between trade customers.
              </p>
              <p className="text-white mb-4 leading-relaxed">
                <strong className="text-gold-300">Retention.</strong> Menu and analysis data is retained for the lifetime of your Pour IQ™ licence and for two years after cancellation, then deleted. Individual menus can be deleted at any time from within Pour IQ™. Scanned supplier invoice PDFs and their extracted line-item data are retained on the same schedule — this aligns with HMRC&rsquo;s six-year VAT-records requirement.
              </p>
              <p className="text-white mb-4 leading-relaxed">
                <strong className="text-gold-300">International transfers.</strong> Data sent to Anthropic in the United States is protected under the UK Extension to the EU-US Data Privacy Framework (the UK-US Data Bridge). Anthropic is self-certified under that framework.
              </p>
              <p className="text-white leading-relaxed">
                <strong className="text-gold-300">Your rights.</strong> You can request access, correction, or deletion of your Pour IQ data by emailing <a href="mailto:hello@jerrycanspirits.co.uk" className="text-gold-300 underline hover:text-gold-200">hello@jerrycanspirits.co.uk</a>.
              </p>
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
                <li><strong className="text-gold-300">Necessary Cookies:</strong> Essential for website functionality and age verification (no consent required)</li>
                <li><strong className="text-gold-300">Analytics Cookies:</strong> Google Analytics and Google Ads for usage statistics and conversion tracking (requires consent)</li>
                <li><strong className="text-gold-300">Marketing Cookies:</strong> Meta Pixel, Klaviyo, and Metricool for advertising, email marketing, and content analytics (requires consent)</li>
                <li><strong className="text-gold-300">Third-Party Cookies:</strong> Trustpilot for customer reviews (requires consent), Cookiebot for consent management</li>
              </ul>

              <h3 className="text-xl font-serif font-semibold text-white mt-6 mb-3">
                5.2 Cookie Management
              </h3>
              <p className="text-white">
                Your cookie preferences are managed through Cookiebot. You can review or change your preferences at any time using the Cookiebot icon on any page or the "Cookie Preferences" link in the website footer. You can also control cookies through your browser settings. For detailed information, see our{' '}
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
                <li><strong className="text-gold-300">Shopify:</strong> Checkout, order processing, and customer accounts (Canada with global infrastructure) &mdash; Standard Contractual Clauses and UK-US Data Bridge</li>
                <li><strong className="text-gold-300">Klaviyo:</strong> Email marketing platform (United Kingdom and United States regions) &mdash; UK adequacy regulations and Standard Contractual Clauses</li>
                <li><strong className="text-gold-300">Resend:</strong> Transactional email delivery for trade application notifications (United States, with EU sending region) &mdash; Standard Contractual Clauses</li>
                <li><strong className="text-gold-300">Anthropic PBC:</strong> AI analysis provider for Pour IQ (United States) &mdash; UK-US Data Bridge. Does not train models on API data.</li>
                <li><strong className="text-gold-300">Sanity:</strong> Headless CMS hosting Field Manual content (United States with EU regions) &mdash; Standard Contractual Clauses</li>
                <li><strong className="text-gold-300">Google Analytics / Google Ads:</strong> Website analytics and conversion tracking (USA) &mdash; UK-US Data Bridge and Google Ads Data Processing Terms</li>
                <li><strong className="text-gold-300">Meta (Facebook) Pixel and Conversions API:</strong> Advertising and conversion tracking (USA) &mdash; UK-US Data Bridge and Standard Contractual Clauses</li>
                <li><strong className="text-gold-300">Metricool:</strong> Social media and content analytics (Spain/EU) &mdash; GDPR-compliant</li>
                <li><strong className="text-gold-300">Mapbox:</strong> Map rendering and location geocoding for the Expedition Log (USA) &mdash; Standard Contractual Clauses</li>
                <li><strong className="text-gold-300">Cloudflare:</strong> Website hosting, CDN, R2 file storage, D1 database, Turnstile bot protection (United Kingdom and European Union edge regions for our services) &mdash; GDPR-compliant with Data Processing Addendum</li>
                <li><strong className="text-gold-300">Trustpilot:</strong> Customer review platform (Denmark/USA) &mdash; Standard Contractual Clauses</li>
                <li><strong className="text-gold-300">Sentry:</strong> Error monitoring and performance tracking (USA) &mdash; Standard Contractual Clauses</li>
                <li><strong className="text-gold-300">Cookiebot (Cybot A/S):</strong> Consent management platform (Denmark) &mdash; GDPR-compliant, data processed within the EU</li>
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
                <li><strong className="text-gold-300">Expedition Log Entries:</strong> Until you request removal by emailing support@jerrycanspirits.co.uk</li>
                <li><strong className="text-gold-300">Newsletter Subscribers:</strong> Until you unsubscribe or 3 years of inactivity</li>
                <li><strong className="text-gold-300">Contact Form Data:</strong> 2 years for customer service purposes</li>
                <li><strong className="text-gold-300">Analytics Data:</strong> 14 months (Google Analytics setting)</li>
                <li><strong className="text-gold-300">Age Verification:</strong> 12 months via browser cookie</li>
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
                <a href="mailto:support@jerrycanspirits.co.uk" className="text-gold-300 hover:text-gold-200 underline">support@jerrycanspirits.co.uk</a>. 
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
                Some of our service providers are located outside the United Kingdom and the European Economic Area. We rely on the following transfer mechanisms depending on the provider:
              </p>

              <h3 className="text-xl font-serif font-semibold text-white mt-6 mb-3">
                10.1 UK or EU adequacy
              </h3>
              <p className="text-white mb-4 leading-relaxed">
                Data processed by providers in the UK or EU (or in regions covered by a UK or EU adequacy decision) does not require additional safeguards. This applies to Klaviyo&apos;s UK infrastructure, Cloudflare&apos;s UK and EU edge regions, Cookiebot (Denmark), Metricool (Spain), and Sanity&apos;s EU regions.
              </p>

              <h3 className="text-xl font-serif font-semibold text-white mt-6 mb-3">
                10.2 UK-US Data Bridge
              </h3>
              <p className="text-white mb-4 leading-relaxed">
                For US providers self-certified under the UK Extension to the EU-US Data Privacy Framework, we rely on the UK-US Data Bridge. This currently applies to Anthropic (Pour IQ AI analysis), Google (Analytics and Ads), and Meta (Pixel and Conversions API).
              </p>

              <h3 className="text-xl font-serif font-semibold text-white mt-6 mb-3">
                10.3 Standard Contractual Clauses
              </h3>
              <p className="text-white mb-4 leading-relaxed">
                For US and other non-adequate destinations not covered by the UK-US Data Bridge, we rely on the UK International Data Transfer Agreement (IDTA) or the EU Standard Contractual Clauses with UK Addendum. This applies to Shopify, Resend, Mapbox, Trustpilot, and Sentry.
              </p>

              <p className="text-white leading-relaxed">
                For each transfer, we have assessed the destination&apos;s legal regime under the UK GDPR and concluded the safeguards provide protection equivalent to UK standards. You can request a copy of our transfer impact assessment by emailing <a href="mailto:support@jerrycanspirits.co.uk" className="text-gold-300 hover:text-gold-200 underline">support@jerrycanspirits.co.uk</a>.
              </p>
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
                  <li>Email: <a href="mailto:support@jerrycanspirits.co.uk" className="text-gold-300 hover:text-gold-200 underline">support@jerrycanspirits.co.uk</a></li>
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