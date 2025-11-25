'use client'

import { useState } from 'react'
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
      <div className="relative aspect-square sm:aspect-[4/3] lg:aspect-square bg-jerry-green-800/20 rounded-xl overflow-hidden border border-gold-500/20">
        <Image
          src={selectedImage.url}
          alt={selectedImage.altText || productTitle}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority={selectedImageIndex === 0}
        />
      </div>

      {/* Thumbnail Grid */}
      {images.length > 1 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImageIndex(index)}
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
                className="object-cover"
                sizes="(max-width: 768px) 33vw, (max-width: 1024px) 12.5vw, 10vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
