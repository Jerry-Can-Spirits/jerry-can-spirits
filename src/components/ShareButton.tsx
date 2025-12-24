'use client'

import { useState } from 'react'

interface ShareButtonProps {
  title: string
  text: string
  url: string
}

export default function ShareButton({ title, text, url }: ShareButtonProps) {
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleNativeShare = async () => {
    // Check if Web Share API is available (mobile devices)
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        })
      } catch (error) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed:', error)
      }
    } else {
      // Fallback to custom share menu
      setShowShareMenu(!showShareMenu)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const shareToFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    window.open(fbUrl, '_blank', 'width=600,height=400')
  }

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    window.open(twitterUrl, '_blank', 'width=600,height=400')
  }

  const shareToWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`
    window.open(whatsappUrl, '_blank')
  }

  const shareToLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    window.open(linkedInUrl, '_blank', 'width=600,height=400')
  }

  return (
    <div className="relative">
      {/* Main Share Button */}
      <button
        onClick={handleNativeShare}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-400 text-jerry-green-900 font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Share This Recipe
      </button>

      {/* Share Menu (Desktop fallback) */}
      {showShareMenu && (
        <div className="absolute top-full mt-2 left-0 bg-jerry-green-800/95 backdrop-blur-sm border border-gold-500/30 rounded-lg p-4 shadow-xl z-50 min-w-[280px]">
          <div className="space-y-2">
            <p className="text-gold-300 text-sm font-semibold mb-3">Share via:</p>

            {/* Copy Link */}
            <button
              onClick={copyToClipboard}
              className="w-full flex items-center gap-3 px-4 py-3 bg-jerry-green-700/60 hover:bg-jerry-green-700 text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span className="flex-1 text-left">
                {copied ? '✓ Copied!' : 'Copy Link'}
              </span>
            </button>

            {/* Facebook */}
            <button
              onClick={shareToFacebook}
              className="w-full flex items-center gap-3 px-4 py-3 bg-jerry-green-700/60 hover:bg-jerry-green-700 text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="flex-1 text-left">Facebook</span>
            </button>

            {/* Twitter / X */}
            <button
              onClick={shareToTwitter}
              className="w-full flex items-center gap-3 px-4 py-3 bg-jerry-green-700/60 hover:bg-jerry-green-700 text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="flex-1 text-left">Twitter / X</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={shareToWhatsApp}
              className="w-full flex items-center gap-3 px-4 py-3 bg-jerry-green-700/60 hover:bg-jerry-green-700 text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              <span className="flex-1 text-left">WhatsApp</span>
            </button>

            {/* LinkedIn */}
            <button
              onClick={shareToLinkedIn}
              className="w-full flex items-center gap-3 px-4 py-3 bg-jerry-green-700/60 hover:bg-jerry-green-700 text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span className="flex-1 text-left">LinkedIn</span>
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={() => setShowShareMenu(false)}
            className="mt-3 w-full px-4 py-2 text-parchment-400 hover:text-gold-300 text-sm transition-colors"
          >
            Close
          </button>
        </div>
      )}

      {/* Backdrop to close menu when clicking outside */}
      {showShareMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowShareMenu(false)}
        />
      )}
    </div>
  )
}
