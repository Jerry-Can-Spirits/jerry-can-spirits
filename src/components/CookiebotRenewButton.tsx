'use client'

export default function CookiebotRenewButton() {
  const openCookiebot = () => {
    if (typeof window !== 'undefined' && window.Cookiebot) {
      window.Cookiebot.renew()
    }
  }

  return (
    <button
      onClick={openCookiebot}
      className="px-8 py-4 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-jerry-green-900 rounded-lg font-semibold uppercase tracking-wide transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
    >
      Review Cookie Settings
    </button>
  )
}
