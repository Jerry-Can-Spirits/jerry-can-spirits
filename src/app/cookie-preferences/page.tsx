import type { Metadata } from 'next'
import Link from 'next/link'
import CookiebotRenewButton from '@/components/CookiebotRenewButton'
import { baseOpenGraph } from '@/lib/og'

export const metadata: Metadata = {
  title: 'Cookie Preferences',
  description: 'Manage your cookie preferences for Jerry Can Spirits. Control which cookies are used to enhance your browsing experience and protect your privacy.',
  alternates: {
    canonical: 'https://jerrycanspirits.co.uk/cookie-preferences/',
  },
  openGraph: {
    ...baseOpenGraph,
    title: 'Cookie Preferences | Jerry Can Spirits®',
    description: 'Manage your cookie preferences for Jerry Can Spirits. Control which cookies are used to enhance your browsing experience and protect your privacy.',
    url: 'https://jerrycanspirits.co.uk/cookie-preferences/',
  },
}

export default function CookiePreferencesPage() {
  return (
    <main className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gold-300 hover:text-gold-200 mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>

          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-parchment-50 mb-4">
            Cookie Preferences
          </h1>
          <p className="text-xl text-parchment-200">
            Manage your cookie settings and privacy preferences.
          </p>
        </div>

        <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 space-y-6">
          <p className="text-parchment-200 leading-relaxed">
            Your cookie preferences are managed by Cookiebot. Use the button below to review or change which cookies you allow.
          </p>
          <p className="text-parchment-300 text-sm leading-relaxed">
            You can also click the Cookiebot icon in the bottom left of any page to update your preferences at any time.
          </p>
          <CookiebotRenewButton />
        </div>

        <div className="mt-8 p-6 bg-jerry-green-800/20 backdrop-blur-sm rounded-xl border border-gold-500/10">
          <h3 className="text-lg font-serif font-bold text-parchment-50 mb-3">
            Further Information
          </h3>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/cookie-policy/"
              className="text-gold-300 hover:text-gold-200 underline text-sm transition-colors"
            >
              Cookie Policy
            </Link>
            <Link
              href="/privacy-policy/"
              className="text-gold-300 hover:text-gold-200 underline text-sm transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
