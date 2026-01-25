'use client'

import { useState } from 'react'

interface BoilerplateTextProps {
  title: string
  wordCount?: number
  text: string
}

export default function BoilerplateText({ title, wordCount, text }: BoilerplateTextProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-serif font-bold text-parchment-50">{title}</h3>
          {wordCount && (
            <span className="text-parchment-400 text-xs">~{wordCount} words</span>
          )}
        </div>
        <button
          onClick={copyToClipboard}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-jerry-green-700/60 hover:bg-gold-500 text-parchment-200 hover:text-jerry-green-900 text-sm font-semibold rounded transition-all duration-200"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <p className="text-parchment-200 text-sm leading-relaxed">{text}</p>
    </div>
  )
}
