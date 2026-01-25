'use client'

import { useState } from 'react'

interface ColorSwatchProps {
  name: string
  hex: string
  className?: string
}

export default function ColorSwatch({ name, hex, className = '' }: ColorSwatchProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(hex)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <button
      onClick={copyToClipboard}
      className={`group relative flex flex-col items-center transition-all duration-200 hover:scale-105 ${className}`}
      title={`Click to copy ${hex}`}
    >
      <div
        className="w-16 h-16 rounded-lg border-2 border-gold-500/30 shadow-lg group-hover:border-gold-400 transition-colors duration-200"
        style={{ backgroundColor: hex }}
      />
      <p className="text-parchment-200 text-xs mt-2 font-medium">{name}</p>
      <p className="text-parchment-400 text-xs font-mono">{hex}</p>

      {copied && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gold-500 text-jerry-green-900 text-xs px-2 py-1 rounded font-semibold whitespace-nowrap">
          Copied!
        </span>
      )}
    </button>
  )
}
