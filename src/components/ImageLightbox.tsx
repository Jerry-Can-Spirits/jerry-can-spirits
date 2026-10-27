'use client'

import { useRef, useState } from 'react'
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

// One tap zooms to this; a pinch goes anywhere between fit and MAX_ZOOM.
const ZOOM = 2.5
const MAX_ZOOM = 4
// A press that moves less than this and ends within this is a tap.
const TAP_SLOP = 10
const TAP_MS = 350

// Where the image sits: its scale, and its top-left corner relative to the
// stage, in CSS pixels. Fit is scale 1 at the origin.
type View = { scale: number; x: number; y: number }
type Point = { x: number; y: number }
const FIT: View = { scale: 1, x: 0, y: 0 }

// Keep the image covering the stage: never smaller than fit, never dragged so
// far that stage shows through at an edge.
function clampView(v: View, w: number, h: number): View {
  const scale = Math.min(MAX_ZOOM, Math.max(1, v.scale))
  return {
    scale,
    x: Math.min(0, Math.max(w - w * scale, v.x)),
    y: Math.min(0, Math.max(h - h * scale, v.y)),
  }
}

// Rescale about a stage point so whatever is under it stays under it.
function zoomAt(v: View, p: Point, scale: number, w: number, h: number): View {
  const k = scale / v.scale
  return clampView({ scale, x: p.x - (p.x - v.x) * k, y: p.y - (p.y - v.y) * k }, w, h)
}

// Full-screen view of a product image with a magnifier. One tap zooms in on
// the point tapped and another tap zooms out; a pinch zooms by any amount; a
// finger or a held mouse drags the enlarged image about, and a mouse also
// pans it by position. Built for garments and labels, where the artwork
// carries text the gallery cannot show. Headless UI's Dialog supplies the
// focus trap, Escape to close and the scroll lock.
//
// Every gesture is handled here, from pointer events, and the stage carries
// touch-action: none. The earlier version let the browser scroll the
// enlarged image natively, which meant leaving pinch to the browser too, and
// a pinch on the image then zoomed the whole page (measured on an emulated
// Pixel: visual viewport scale 1 to 2) and left it that way after the dialog
// closed. The browser never sees a page gesture while this is open.
export default function ImageLightbox({ images, startIndex, open, onClose, productTitle }: ImageLightboxProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-[100]">
      <div className="fixed inset-0 bg-jerry-green-900/95 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-3 sm:p-6 touch-none">
        {/* Keyed so the index and zoom reset every time the lightbox opens. */}
        <Viewer key={`${open}-${startIndex}`} images={images} startIndex={startIndex} onClose={onClose} productTitle={productTitle} />
      </div>
    </Dialog>
  )
}

interface Gesture {
  // The view when the second finger landed, and the distance and midpoint
  // between the fingers then; the pinch is computed against these.
  view: View
  dist: number
  mid: Point
}

interface Press {
  id: number
  at: Point
  time: number
  // False once it moved past the slop or a second pointer joined.
  tap: boolean
}

function Viewer({ images, startIndex, onClose, productTitle }: Omit<ImageLightboxProps, 'open'>) {
  const [index, setIndex] = useState(startIndex)
  const [view, setView] = useState<View>(FIT)
  const stageRef = useRef<HTMLDivElement>(null)
  const pointers = useRef(new Map<number, Point>())
  const pinch = useRef<Gesture | null>(null)
  const press = useRef<Press | null>(null)
  const image = images[index]
  const many = images.length > 1
  const zoomed = view.scale > 1

  const stageSize = () => {
    const rect = stageRef.current?.getBoundingClientRect()
    return { w: rect?.width ?? 1, h: rect?.height ?? 1 }
  }

  // A pointer's position in stage coordinates.
  const local = (e: React.PointerEvent): Point => {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startPinch = () => {
    const [a, b] = [...pointers.current.values()]
    pinch.current = {
      view,
      dist: Math.hypot(b.x - a.x, b.y - a.y) || 1,
      mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    }
  }

  const step = (delta: number) => {
    setView(FIT)
    setIndex(prev => (prev + delta + images.length) % images.length)
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Keeps a mouse drag alive outside the stage and stops a mouse press
    // selecting or dragging the image. Focus stays with the panel.
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = local(e)
    pointers.current.set(e.pointerId, p)
    if (pointers.current.size === 1) {
      press.current = { id: e.pointerId, at: p, time: Date.now(), tap: true }
    } else {
      if (press.current) press.current.tap = false
      if (pointers.current.size === 2) startPinch()
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = local(e)
    const { w, h } = stageSize()
    const last = pointers.current.get(e.pointerId)

    if (!last) {
      // A mouse passing over, nothing pressed: pan by position while zoomed.
      if (e.pointerType !== 'mouse' || !zoomed) return
      setView(v => clampView({ ...v, x: -(p.x / w) * (w * v.scale - w), y: -(p.y / h) * (h * v.scale - h) }, w, h))
      return
    }
    pointers.current.set(e.pointerId, p)

    const pr = press.current
    if (pr && pr.id === e.pointerId && pr.tap && Math.hypot(p.x - pr.at.x, p.y - pr.at.y) > TAP_SLOP) {
      pr.tap = false
    }

    if (pointers.current.size >= 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()]
      const dist = Math.hypot(b.x - a.x, b.y - a.y)
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const start = pinch.current
      const scaled = zoomAt(start.view, start.mid, start.view.scale * (dist / start.dist), w, h)
      setView(clampView({ ...scaled, x: scaled.x + mid.x - start.mid.x, y: scaled.y + mid.y - start.mid.y }, w, h))
      return
    }

    if (zoomed) {
      const dx = p.x - last.x
      const dy = p.y - last.y
      setView(v => clampView({ ...v, x: v.x + dx, y: v.y + dy }, w, h))
    }
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = local(e)
    pointers.current.delete(e.pointerId)
    pinch.current = null
    // Two fingers down to one: the remaining finger drags from where it is.
    if (pointers.current.size === 2) startPinch()

    const pr = press.current
    if (pr && pr.id === e.pointerId) {
      press.current = null
      if (pr.tap && Date.now() - pr.time < TAP_MS) {
        const { w, h } = stageSize()
        setView(v => (v.scale > 1 ? FIT : zoomAt(FIT, p, ZOOM, w, h)))
      }
    }
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
        ref={stageRef}
        data-stage=""
        className={`absolute inset-0 rounded-xl overflow-hidden touch-none select-none ${zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="absolute inset-0 origin-top-left"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}
        >
          <Image
            src={image.url}
            alt={image.altText || productTitle}
            fill
            className="object-contain pointer-events-none"
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
        {zoomed ? 'Drag to look around. Tap to zoom out.' : 'Tap or pinch to zoom in.'}
        {many ? ` ${index + 1} of ${images.length}.` : ''}
      </p>
    </DialogPanel>
  )
}
