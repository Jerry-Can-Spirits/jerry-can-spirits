'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

interface ProductImage {
  url: string
  altText: string | null
}

interface ProductImageGalleryProps {
  images: ProductImage[]
  productTitle: string
}

export default function ProductImageGallery({
  images,
  productTitle,
}: ProductImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const touchStartXRef = useRef<number | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return
    const delta = e.changedTouches[0].clientX - touchStartXRef.current
    touchStartXRef.current = null
    if (Math.abs(delta) < 40) return
    if (delta < 0) {
      setSelectedImageIndex(prev => (prev + 1) % images.length)
    } else {
      setSelectedImageIndex(prev => (prev - 1 + images.length) % images.length)
    }
  }

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square sm:aspect-[4/3] lg:aspect-square bg-jerry-green-800/20 rounded-xl flex items-center justify-center border border-gold-500/20">
        <svg
          className="w-24 h-24 text-gold-500/30"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </div>
    )
  }

  const selectedImage = images[selectedImageIndex]

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Main Image */}
      <div
        className="relative aspect-square sm:aspect-[4/3] lg:aspect-square bg-jerry-green-800/20 rounded-xl overflow-hidden border border-gold-500/20"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={selectedImage.url}
          alt={selectedImage.altText || productTitle}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={selectedImageIndex === 0}
        />

        {images.length > 1 && (
          <>
            <button
              onClick={() => setSelectedImageIndex(prev => (prev - 1 + images.length) % images.length)}
              aria-label="Previous image"
              className="sm:hidden absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-jerry-green-900/60 backdrop-blur-sm rounded-full border border-gold-500/20 text-parchment-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setSelectedImageIndex(prev => (prev + 1) % images.length)}
              aria-label="Next image"
              className="sm:hidden absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-jerry-green-900/60 backdrop-blur-sm rounded-full border border-gold-500/20 text-parchment-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Grid */}
      {images.length > 1 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImageIndex(index)}
              aria-label={`View image ${index + 1} of ${images.length}${image.altText ? `: ${image.altText}` : ''}`}
              aria-pressed={index === selectedImageIndex}
              className={`relative aspect-square bg-jerry-green-800/20 rounded-lg overflow-hidden border-2 transition-all ${
                index === selectedImageIndex
                  ? 'border-gold-400 ring-2 ring-gold-400/50 scale-95'
                  : 'border-gold-500/20 hover:border-gold-400/40 hover:scale-105'
              }`}
            >
              <Image
                src={image.url}
                alt={image.altText || `${productTitle} - Image ${index + 1}`}
                fill
                loading="lazy"
                className="object-contain"
                sizes="(max-width: 768px) 33vw, (max-width: 1024px) 12.5vw, 10vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
