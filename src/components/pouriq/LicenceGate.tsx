export function LicenceGate() {
  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-32">
        <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20">
          <div className="inline-block px-4 py-2 bg-jerry-green-700/60 backdrop-blur-sm rounded-full border border-gold-500/30 mb-6">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-widest">Pour IQ™</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-white mb-4">An additional service for trade accounts</h1>
          <p className="text-parchment-300 leading-relaxed mb-4">
            Pour IQ is a margin and complexity analysis tool for drink menus. Trade customers can licence it as an add-on to their existing account.
          </p>
          <p className="text-parchment-300 leading-relaxed mb-8">
            We are running a closed pilot. If you would like access, get in touch.
          </p>
          <a
            href="mailto:trade@jerrycanspirits.co.uk?subject=Pour%20IQ%20licence%20enquiry"
            className="inline-flex items-center px-6 py-3 bg-gold-500 text-jerry-green-900 font-bold rounded-lg hover:bg-gold-400 transition-colors text-sm"
          >
            Enquire about a licence
          </a>
        </div>
      </div>
    </main>
  )
}
