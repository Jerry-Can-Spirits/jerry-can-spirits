'use client'

import { useEffect, useId, useRef, useState } from 'react'

interface Props {
  onScan: (code: string) => void
  onClose: () => void
}

// html5-qrcode is imported dynamically so the ~70KB bundle only loads
// when a bar manager actually opens the scanner. Camera access requires
// HTTPS (or localhost); in production both conditions are met.

export function BarcodeScanner({ onScan, onClose }: Props) {
  const regionId = useId().replace(/:/g, '')
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(true)

  useEffect(() => {
    let cancelled = false
    type Html5QrcodeInstance = InstanceType<typeof import('html5-qrcode').Html5Qrcode>
    let scanner: Html5QrcodeInstance | null = null

    async function start() {
      try {
        const mod = await import('html5-qrcode')
        if (cancelled) return
        const Html5Qrcode = mod.Html5Qrcode
        const formats = [
          mod.Html5QrcodeSupportedFormats.EAN_13,
          mod.Html5QrcodeSupportedFormats.EAN_8,
          mod.Html5QrcodeSupportedFormats.UPC_A,
          mod.Html5QrcodeSupportedFormats.UPC_E,
          mod.Html5QrcodeSupportedFormats.CODE_128,
          mod.Html5QrcodeSupportedFormats.CODE_39,
          mod.Html5QrcodeSupportedFormats.QR_CODE,
        ]
        scanner = new Html5Qrcode(regionId, { formatsToSupport: formats, verbose: false })
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 260, height: 160 } },
          (decoded: string) => {
            if (cancelled) return
            // Stop the camera before the parent handler reacts so the
            // viewfinder dismisses immediately on success.
            scanner?.stop().catch(() => {})
            onScan(decoded)
          },
          () => { /* per-frame failures are normal until a code is in view */ },
        )
        if (!cancelled) setStarting(false)
      } catch (e) {
        if (cancelled) return
        const msg = (e as Error)?.message || 'Could not start camera'
        if (/permission|denied|notallowed/i.test(msg)) {
          setError('Camera access was blocked. Allow camera access in your browser settings and try again.')
        } else if (/notfound|nodevice/i.test(msg)) {
          setError('No camera was found on this device.')
        } else {
          setError(msg)
        }
        setStarting(false)
      }
    }

    start()

    return () => {
      cancelled = true
      scanner?.stop().catch(() => {})
    }
  }, [onScan, regionId])

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto" role="dialog" aria-label="Scan a barcode">
      <div className="bg-jerry-green-800 border border-gold-500/30 rounded-xl p-4 max-w-md w-full mt-8 sm:mt-0">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-base font-serif font-bold text-white">Scan a barcode</h3>
          <button type="button" onClick={onClose} className="text-sm text-parchment-400 hover:text-parchment-200">Close</button>
        </div>
        <div id={regionId} ref={containerRef} className="w-full aspect-[4/3] bg-black rounded-lg overflow-hidden" />
        {starting && !error && (
          <p className="mt-3 text-xs text-parchment-400">Starting camera… you may be asked to allow access.</p>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>
        )}
        <p className="mt-3 text-xs text-parchment-400">
          Point the camera at the barcode on the back of the bottle. We support EAN-13, UPC, Code 128 and QR.
        </p>
      </div>
    </div>
  )
}
