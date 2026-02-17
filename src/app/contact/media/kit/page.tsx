import type { Metadata } from 'next'
import Image from 'next/image'
import { PrintButton } from '@/components/media'

export const metadata: Metadata = {
  title: 'Media Kit | Jerry Can Spirits®',
  description: 'Jerry Can Spirits media kit one-pager with brand overview, product specifications, and co-founder bios.',
  robots: { index: false },
}

export default function MediaKitPage() {
  return (
    <>
      {/* Print-specific styles */}
      <style>{`
        @media print {
          /* Hide site chrome */
          header, footer, nav,
          [data-hide-print] {
            display: none !important;
          }
          body {
            background: white !important;
            color: #1a1a1a !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          @page {
            margin: 15mm 20mm;
            size: A4;
          }
          .print-section {
            page-break-inside: avoid;
          }
          .print-page-break {
            page-break-before: always;
          }
        }
      `}</style>

      <main className="min-h-screen bg-parchment-50 print:bg-white">
        {/* Screen-only back link and print button */}
        <div data-hide-print className="max-w-4xl mx-auto px-6 pt-8 pb-4 flex items-center justify-between">
          <a
            href="/contact/media/"
            className="inline-flex items-center gap-2 text-jerry-green-800 hover:text-jerry-green-700 text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Media Centre
          </a>
          <PrintButton />
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8 print:px-0 print:py-0">

          {/* ===== SECTION 1: Brand Overview ===== */}
          <section className="print-section mb-12 print:mb-8">
            {/* Header */}
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 relative flex-shrink-0">
                <Image
                  src="/images/Logo.webp"
                  alt="Jerry Can Spirits® Logo"
                  fill
                  className="object-contain"
                  sizes="96px"
                />
              </div>
              <div>
                <h1 className="text-3xl font-serif font-bold text-jerry-green-900">Jerry Can Spirits®</h1>
                <p className="text-lg text-jerry-green-700 italic font-serif">Engineered for Reliability. Designed for Adventure.</p>
              </div>
            </div>

            {/* Boilerplate */}
            <div className="mb-8">
              <h2 className="text-xl font-serif font-bold text-jerry-green-900 mb-3 border-b-2 border-gold-500 pb-2">About</h2>
              <p className="text-jerry-green-800 leading-relaxed">
                Jerry Can Spirits® is a British veteran-owned spirits company making premium craft rum. Founded by Dan and Rhys, veterans of the Royal Corps of Signals who spent years talking about making their own rum before finally having a go. Our name comes from the classic jerry can — designed in 1937 and still NATO standard today because it just works. That&apos;s the approach we take: function over form, quality without shortcuts.
              </p>
            </div>

            {/* Brand Values */}
            <div className="mb-8">
              <h2 className="text-xl font-serif font-bold text-jerry-green-900 mb-3 border-b-2 border-gold-500 pb-2">Brand Values</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'Reliability', desc: 'We deliver consistently. Colleagues, customers, and partners can count on us.' },
                  { name: 'Authenticity', desc: 'No pretence, no marketing fluff. Two mates who care about making good rum.' },
                  { name: 'Quality', desc: 'Function over form. Genuinely good, not just fancy-looking.' },
                  { name: 'Community', desc: '5% of profits to armed forces charities. This isn\'t marketing — it\'s who we are.' },
                ].map((v) => (
                  <div key={v.name} className="border border-jerry-green-200 rounded-lg p-3">
                    <h3 className="text-sm font-bold text-jerry-green-900">{v.name}</h3>
                    <p className="text-xs text-jerry-green-700 leading-relaxed">{v.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Facts */}
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: 'Founded', value: '2025' },
                { label: 'Location', value: 'United Kingdom' },
                { label: 'Launch Date', value: '6 April 2026' },
                { label: 'Heritage', value: 'Royal Corps of Signals' },
                { label: 'Company No.', value: '1661877' },
                { label: 'Trademark', value: 'UK00004263767' },
              ].map((fact) => (
                <div key={fact.label} className="border border-jerry-green-200 rounded-lg p-2">
                  <p className="text-[10px] uppercase tracking-wider text-jerry-green-500 font-semibold">{fact.label}</p>
                  <p className="text-sm font-medium text-jerry-green-900">{fact.value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ===== SECTION 2: Product Spec ===== */}
          <section className="print-section print-page-break mb-12 print:mb-8">
            <h2 className="text-xl font-serif font-bold text-jerry-green-900 mb-3 border-b-2 border-gold-500 pb-2">Expedition Spiced Rum</h2>

            <div className="grid grid-cols-2 gap-8">
              {/* Specs */}
              <div>
                <div className="space-y-2 mb-6">
                  {[
                    { label: 'ABV', value: '40%' },
                    { label: 'Volume', value: '700ml' },
                    { label: 'RRP', value: '£45.00' },
                    { label: 'Base Spirit', value: 'Caribbean rum' },
                    { label: 'Distillery', value: 'Spirit of Wales, Newport' },
                  ].map((spec) => (
                    <div key={spec.label} className="flex justify-between border-b border-jerry-green-100 pb-1 text-sm">
                      <span className="text-jerry-green-500">{spec.label}</span>
                      <span className="text-jerry-green-900 font-medium">{spec.value}</span>
                    </div>
                  ))}
                </div>

                <h3 className="text-sm font-bold text-jerry-green-900 mb-2">Key Ingredients</h3>
                <p className="text-xs text-jerry-green-700 leading-relaxed">
                  Madagascan vanilla pods, Ceylon cinnamon, ginger, orange peel, cloves, allspice, cassia bark, agave syrup, glucose syrup. Rested on bourbon barrel chips.
                </p>

                <div className="flex gap-2 mt-3 flex-wrap">
                  {['Gluten-free', 'Vegan', 'Dairy-free', 'Nut-free'].map((d) => (
                    <span key={d} className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-green-100 text-green-800 rounded">
                      {d}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tasting Notes */}
              <div>
                <h3 className="text-sm font-bold text-jerry-green-900 mb-3">Tasting Notes</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-gold-600 uppercase tracking-wider">Nose</h4>
                    <p className="text-xs text-jerry-green-700 leading-relaxed">
                      Warm Madagascan vanilla leads with a rich, creamy softness, followed by Ceylon cinnamon and toasted bourbon oak, lifted by bright orange peel with clove and allspice in the background.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gold-600 uppercase tracking-wider">Palate</h4>
                    <p className="text-xs text-jerry-green-700 leading-relaxed">
                      Silky and naturally sweet on entry thanks to agave, with ginger heat and cassia bark developing into layered baking spices.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gold-600 uppercase tracking-wider">Finish</h4>
                    <p className="text-xs text-jerry-green-700 leading-relaxed">
                      Long, warming, and elegantly dry with oak tannins, vanilla, and a flicker of ginger.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ===== SECTION 3: People & Contact ===== */}
          <section className="print-section print-page-break">
            <h2 className="text-xl font-serif font-bold text-jerry-green-900 mb-3 border-b-2 border-gold-500 pb-2">People & Contact</h2>

            {/* Co-Founders */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="flex gap-4">
                <div className="w-20 h-20 relative flex-shrink-0 rounded-lg overflow-hidden">
                  <Image
                    src="/images/team/Dan_Headshot.jpg"
                    alt="Dan Freeman"
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-jerry-green-900">Dan Freeman</h3>
                  <p className="text-xs text-gold-600 font-medium mb-1">Co-Founder & Director</p>
                  <p className="text-xs text-jerry-green-700 leading-relaxed">
                    Royal Corps of Signals veteran. Leads brand strategy and business operations with the same dedication he brought to service.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-20 h-20 relative flex-shrink-0 rounded-lg overflow-hidden">
                  <Image
                    src="https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/bcacb452-4f56-4676-b4c8-ac6afa7c1e00/public"
                    alt="Rhys"
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-jerry-green-900">Rhys</h3>
                  <p className="text-xs text-gold-600 font-medium mb-1">Co-Founder & Director</p>
                  <p className="text-xs text-jerry-green-700 leading-relaxed">
                    Royal Signals veteran (2011–2016), F1 onboard comms, live events telecoms. Leads recipe development and production.
                  </p>
                </div>
              </div>
            </div>

            {/* Social & Contact */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-bold text-jerry-green-900 mb-2">Social Channels</h3>
                <div className="space-y-1 text-xs text-jerry-green-700">
                  <p>Facebook: <span className="font-medium">@jerrycanspirits</span></p>
                  <p>Instagram: <span className="font-medium">@jerrycanspirits</span></p>
                  <p>TikTok: <span className="font-medium">@jerrycanspirits</span></p>
                  <p>X: <span className="font-medium">@jerrycanspirits</span></p>
                  <p>YouTube: <span className="font-medium">@jerrycanspirits</span></p>
                  <p>Bluesky: <span className="font-medium">@jerrycanspirits</span></p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-jerry-green-900 mb-2">Press Contact</h3>
                <div className="space-y-1 text-xs text-jerry-green-700">
                  <p>Email: <span className="font-medium">press@jerrycanspirits.co.uk</span></p>
                  <p>Partnerships: <span className="font-medium">partnerships@jerrycanspirits.co.uk</span></p>
                  <p>Website: <span className="font-medium">jerrycanspirits.co.uk</span></p>
                </div>

                <h3 className="text-sm font-bold text-jerry-green-900 mt-4 mb-2">Accreditations</h3>
                <div className="space-y-1 text-xs text-jerry-green-700">
                  <p>Armed Forces Covenant Signatory</p>
                  <p>ERS Bronze Award</p>
                  <p>British Veteran Owned Certified</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-jerry-green-200 text-center">
              <p className="text-[10px] text-jerry-green-400">
                Jerry Can Spirits® | jerrycanspirits.co.uk | press@jerrycanspirits.co.uk | Company No. 1661877
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
