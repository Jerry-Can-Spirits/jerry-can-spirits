'use client'

import Image from 'next/image'

interface DownloadFormat {
  label: string
  url: string
  fileSize?: string
}

interface DownloadCardProps {
  title: string
  description?: string
  previewImage: string
  previewAlt: string
  formats: DownloadFormat[]
  darkBackground?: boolean
}

export default function DownloadCard({
  title,
  description,
  previewImage,
  previewAlt,
  formats,
  darkBackground = false,
}: DownloadCardProps) {
  return (
    <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-6 border border-gold-500/20 hover:border-gold-400/40 transition-all duration-300">
      {/* Preview Image */}
      <div
        className={`relative w-full h-32 rounded-lg overflow-hidden mb-4 flex items-center justify-center ${
          darkBackground ? 'bg-jerry-green-900' : 'bg-parchment-50/10'
        }`}
      >
        <Image
          src={previewImage}
          alt={previewAlt}
          fill
          className="object-contain p-4"
          sizes="(max-width: 640px) 100vw, 300px"
        />
      </div>

      {/* Title & Description */}
      <h3 className="text-lg font-serif font-bold text-parchment-50 mb-1">{title}</h3>
      {description && <p className="text-parchment-300 text-sm mb-4">{description}</p>}

      {/* Download Buttons */}
      <div className="flex flex-wrap gap-2">
        {formats.map((format) => (
          <a
            key={format.label}
            href={format.url}
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-jerry-green-700/60 hover:bg-gold-500 text-parchment-200 hover:text-jerry-green-900 text-xs font-semibold rounded transition-all duration-200"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {format.label}
            {format.fileSize && (
              <span className="text-parchment-400 text-xs">({format.fileSize})</span>
            )}
          </a>
        ))}
      </div>
    </div>
  )
}
