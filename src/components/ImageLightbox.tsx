'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogPanel } from '@headlessui/react'

export interface LightboxImage {
  url: string
  altText: string | null
}

interface ImageLightboxProps {
  images: LightboxImage[]
  startIndex: number
  open: boolean
  onClose: () => void
  productTitle: string
}

const ZOOM = 2.5

// Full-screen view of a product image with a magnifier. One tap zooms in at
// the point tapped; moving the pointer (mouse or finger) pans; another tap
// zooms out. Built for garments and labels, where the artwork carries text
// the gallery thumbnail cannot show. Headless UI's Dialog supplies the focus
// trap, Escape to close and the scroll lock.
export default function ImageLightbox({ images, startIndex, open, onClose, productTitle }: ImageLightboxProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-[100]">
      <div className="fixed inset-0 bg-jerry-green-900/95 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-6">
        {/* Keyed so the index and zoom reset every time the lightbox opens. */}
        <Viewer key={`${open}-${startIndex}`} images={images} startIndex={startIndex} onClose={onClose} productTitle={productTitle} />
      </div>
    </Dialog>
  )
}

function Viewer({ images, startIndex, onClose, productTitle }: Omit<ImageLightboxProps, 'open'>) {
  const [index, setIndex] = useState(startIndex)
  const [zoomed, setZoomed] = useState(false)
  const [origin, setOrigin] = useState({ x: 50, y: 50 })
  const image = images[index]
  const many = images.length > 1

  const pointToOrigin = (e: React.PointerEvent | React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100))
    setOrigin({ x, y })
  }

  const step = (delta: number) => {
    setZoomed(false)
    setIndex(prev => (prev + delta + images.length) % images.length)
  }

  return (
    <DialogPanel
      className="relative w-full h-full max-w-6xl outline-none"
      onKeyDown={(e) => {
        if (!many) return
        if (e.key === 'ArrowRight') step(1)
        if (e.key === 'ArrowLeft') step(-1)
      }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-0 right-0 z-20 p-2 rounded-full bg-jerry-green-900/70 border border-gold-500/30 text-parchment-200 hover:text-white"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div
        className={`absolute inset-0 overflow-hidden rounded-xl ${zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
        style={{ touchAction: zoomed ? 'none' : 'auto' }}
        onClick={(e) => {
          pointToOrigin(e)
          setZoomed(z => !z)
        }}
        onPointerMove={(e) => {
          if (zoomed) pointToOrigin(e)
        }}
      >
        <Image
          src={image.url}
          alt={image.altText || productTitle}
          fill
          className="object-contain transition-transform duration-150 ease-out select-none"
          style={{ transform: `scale(${zoomed ? ZOOM : 1})`, transformOrigin: `${origin.x}% ${origin.y}%` }}
          sizes="100vw"
          draggable={false}
        />
      </div>

      {many && (
        <>
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous image"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-jerry-green-900/70 border border-gold-500/30 text-parchment-200 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next image"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-jerry-green-900/70 border border-gold-500/30 text-parchment-200 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      <p className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-jerry-green-900/70 border border-gold-500/30 text-parchment-300 text-xs">
        {zoomed ? 'Move to look around. Tap to zoom out.' : 'Tap to zoom in.'}
        {many ? ` ${index + 1} of ${images.length}.` : ''}
      </p>
    </DialogPanel>
  )
}
