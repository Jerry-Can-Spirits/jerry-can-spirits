'use client'

import Image from 'next/image'

interface GalleryImage {
  src: string
  alt: string
  title: string
  downloadUrl?: string
}

interface ImageGalleryProps {
  images: GalleryImage[]
  placeholder?: boolean
}

export default function ImageGallery({ images, placeholder = false }: ImageGalleryProps) {
  if (placeholder || images.length === 0) {
    return (
      <div className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl p-8 border border-gold-500/20 text-center">
        <div className="w-16 h-16 bg-gold-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-gold-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-serif font-bold text-parchment-50 mb-2">
          Product Photography Coming Soon
        </h3>
        <p className="text-parchment-300 text-sm max-w-md mx-auto">
          High-resolution product images and lifestyle photography will be available here
          once our product photography is complete.
        </p>
        <p className="text-parchment-400 text-xs mt-4">
          Need images sooner? Contact{' '}
          <a
            href="mailto:press@jerrycanspirits.co.uk"
            className="text-gold-300 hover:text-gold-200 underline"
          >
            press@jerrycanspirits.co.uk
          </a>
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {images.map((image, index) => (
        <div
          key={index}
          className="bg-jerry-green-800/40 backdrop-blur-sm rounded-xl overflow-hidden border border-gold-500/20 hover:border-gold-400/40 transition-all duration-300"
        >
          <div className="relative w-full h-48">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
          <div className="p-4">
            <h4 className="text-parchment-50 font-medium text-sm mb-2">{image.title}</h4>
            {image.downloadUrl && (
              <a
                href={image.downloadUrl}
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
                Download
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
