'use client'

import { QRCodeSVG } from 'qrcode.react'

interface ProductQRCodeProps {
  url: string
  size?: number
}

export default function ProductQRCode({ url, size = 150 }: ProductQRCodeProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="p-4 bg-white rounded-lg border-2 border-gold-500 shadow-lg">
        <QRCodeSVG
          value={url}
          size={size}
          level="H"
          includeMargin={false}
          fgColor="#1a1f16"
          bgColor="#ffffff"
        />
      </div>
      <p className="text-sm font-semibold text-gold-300 uppercase tracking-wide text-center">
        Scan for Product Details
      </p>
    </div>
  )
}
