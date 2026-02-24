import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Your Friend Thinks You Need Better Rum',
  description: 'Get £5 off your first order of Jerry Can Spirits premium spiced rum. Veteran-owned, Welsh-distilled, and built for adventure.',
  robots: {
    index: false,
    follow: true,
  },
}

interface ReferralData {
  email: string;
  code: string;
  created_at: string;
}

export default async function ReferralLandingPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params;

  // Validate code against KV
  const { env } = await getCloudflareContext();
  const kv = env.SITE_OPS as KVNamespace;
  const referralData = await kv.get<ReferralData>(`referral:${code}`, 'json');

  if (!referralData) {
    redirect('/shop/drinks/');
  }

  return (
    <main className="min-h-screen py-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-block px-4 py-2 bg-jerry-green-800/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
          <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">
            Referral Reward
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-serif font-bold text-white mb-6">
          Your Friend Thinks You
          <br />
          <span className="text-gold-300">Need Better Rum</span>
        </h1>

        <p className="text-xl text-parchment-300 max-w-xl mx-auto leading-relaxed mb-8">
          And honestly, they&apos;re probably right. Here&apos;s £5 off your first order of
          veteran-owned, Welsh-distilled, properly spiced rum.
        </p>

        {/* Discount Code Display */}
        <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/30 mb-8">
          <p className="text-parchment-400 text-sm uppercase tracking-wider mb-3">
            Your discount code
          </p>
          <ReferralCodeClient code={code} />
          <p className="text-parchment-400 text-sm mt-4">
            £5 off your first order. Single use. No minimum spend.
          </p>
        </div>

        <Link
          href="/shop/drinks/"
          className="inline-flex items-center justify-center space-x-2 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105"
        >
          <span>Browse Our Rum</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>

        <p className="text-parchment-500 text-xs mt-8">
          The code will be saved automatically. It&apos;ll be applied at checkout.
        </p>
      </div>
    </main>
  )
}

/**
 * Client component to store referral code in localStorage and display it.
 */
function ReferralCodeClient({ code }: { code: string }) {
  return (
    <>
      <p className="text-3xl font-mono font-bold text-gold-300 tracking-widest select-all">
        {code}
      </p>
      <script
        dangerouslySetInnerHTML={{
          __html: `try{localStorage.setItem('jcs_referral_code','${code.replace(/'/g, "\\'")}');}catch(e){}`,
        }}
      />
    </>
  )
}
