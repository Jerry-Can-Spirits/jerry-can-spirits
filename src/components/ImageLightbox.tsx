'use client'

import { useLayoutEffect, useRef, useState } from 'react'
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

// Full-screen view of a product image with a magnifier. One tap zooms in on
// the point tapped; the enlarged image then scrolls natively under a finger
// (or follows the mouse on a desktop); another tap zooms out. Built for
// garments and labels, where the artwork carries text the gallery cannot
// show. Headless UI's Dialog supplies the focus trap, Escape to close and
// the scroll lock.
//
// touch-action matters here: two taps on an image are also the browser's
// double-tap-to-zoom gesture, which on iOS scales the whole page and leaves
// it that way after the dialog closes. "manipulation" keeps scrolling and
// pinch but drops double-tap zoom; "pan-x pan-y" while zoomed leaves only
// the scrolling of the enlarged image.
export default function ImageLightbox({ images, startIndex, open, onClose, productTitle }: ImageLightboxProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-[100]">
      <div className="fixed inset-0 bg-jerry-green-900/95 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-6 [touch-action:manipulation]">
        {/* Keyed so the index and zoom reset every time the lightbox opens. */}
        <Viewer key={`${open}-${startIndex}`} images={images} startIndex={startIndex} onClose={onClose} productTitle={productTitle} />
      </div>
    </Dialog>
  )
}

function Viewer({ images, startIndex, onClose, productTitle }: Omit<ImageLightboxProps, 'open'>) {
  const [index, setIndex] = useState(startIndex)
  const [zoomed, setZoomed] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  // Where the zoom was asked for, as fractions of the viewer, applied once
  // the enlarged image is in the DOM.
  const focusRef = useRef<{ x: number; y: number } | null>(null)
  const image = images[index]
  const many = images.length > 1

  useLayoutEffect(() => {
    const el = scrollRef.current
    const focus = focusRef.current
    if (!zoomed || !el || !focus) return
    el.scrollLeft = focus.x * el.scrollWidth - el.clientWidth / 2
    el.scrollTop = focus.y * el.scrollHeight - el.clientHeight / 2
    focusRef.current = null
  }, [zoomed])

  const fraction = (e: React.MouseEvent | React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    }
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
        ref={scrollRef}
        className={`absolute inset-0 rounded-xl overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${zoomed ? 'cursor-zoom-out [touch-action:pan-x_pan-y]' : 'cursor-zoom-in [touch-action:manipulation]'}`}
        onClick={(e) => {
          if (zoomed) {
            setZoomed(false)
            return
          }
          focusRef.current = fraction(e)
          setZoomed(true)
        }}
        onPointerMove={(e) => {
          // A mouse pans by position; a finger scrolls the image natively.
          if (!zoomed || e.pointerType !== 'mouse') return
          const el = e.currentTarget
          const { x, y } = fraction(e)
          el.scrollLeft = x * (el.scrollWidth - el.clientWidth)
          el.scrollTop = y * (el.scrollHeight - el.clientHeight)
        }}
      >
        <div
          className="relative"
          style={{ width: zoomed ? `${ZOOM * 100}%` : '100%', height: zoomed ? `${ZOOM * 100}%` : '100%' }}
        >
          <Image
            src={image.url}
            alt={image.altText || productTitle}
            fill
            className="object-contain select-none"
            sizes="100vw"
            draggable={false}
          />
        </div>
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

      <p className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-jerry-green-900/70 border border-gold-500/30 text-parchment-300 text-xs whitespace-nowrap">
        {zoomed ? 'Drag to look around. Tap to zoom out.' : 'Tap to zoom in.'}
        {many ? ` ${index + 1} of ${images.length}.` : ''}
      </p>
    </DialogPanel>
  )
}
