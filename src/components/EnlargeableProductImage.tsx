'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface EnlargeableProductImageProps {
  src: string
  alt: string
  productName: string
}

export default function EnlargeableProductImage({ src, alt, productName }: EnlargeableProductImageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile on client-side only
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isModalOpen && isMobile) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [isModalOpen, isMobile])

  const handleMobileClick = () => {
    if (isMobile) {
      setIsModalOpen(true)
    }
  }

  return (
    <>
      {/* Small Image - Mobile: Click to enlarge, Desktop: Hover to enlarge */}
      <div className="relative w-20 h-20 flex-shrink-0 bg-transparent rounded-lg overflow-visible group">
        {/* Mobile: Clickable version, Desktop: Non-interactive */}
        <button
          onClick={handleMobileClick}
          type="button"
          className="relative w-full h-full rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-gold-400 md:cursor-default md:pointer-events-none"
          aria-label={isMobile ? `View larger image of ${productName}` : undefined}
          disabled={!isMobile}
        >
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain mix-blend-multiply p-1"
            sizes="80px"
          />
        </button>

        {/* Desktop: Hover enlargement - Uses green background to match tile */}
        <div className="hidden md:block absolute left-0 top-0 w-20 h-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-jerry-green-800/95 to-jerry-green-900/95 backdrop-blur-sm rounded-xl shadow-2xl border-2 border-gold-400 p-4">
            <div className="relative w-full h-full">
              <Image
                src={src}
                alt={alt}
                fill
                className="object-contain"
                sizes="256px"
              />
            </div>
          </div>
        </div>

        {/* Mobile hint icon */}
        {isMobile && (
          <div className="absolute bottom-1 right-1 w-5 h-5 bg-jerry-green-800/80 rounded-full flex items-center justify-center pointer-events-none">
            <svg className="w-3 h-3 text-gold-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </div>
        )}
      </div>

      {/* Mobile Modal */}
      {isModalOpen && isMobile && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-image-modal"
        >
          <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              type="button"
              className="absolute -top-12 right-0 text-white hover:text-gold-300 transition-colors"
              aria-label="Close enlarged image"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Enlarged image - Matches green theme */}
            <div className="bg-gradient-to-br from-jerry-green-800 to-jerry-green-900 rounded-xl p-6 shadow-2xl border-2 border-gold-400">
              <div className="relative w-full aspect-square">
                <Image
                  src={src}
                  alt={alt}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 90vw, 512px"
                  priority
                />
              </div>
              <p className="text-center text-gold-300 font-semibold mt-4" id="product-image-modal">
                {productName}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
