'use client'

import Link from 'next/link'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Compass Icon */}
        <div className="flex justify-center">
          <svg
            className="w-24 h-24 text-gold-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-4xl font-playfair font-bold text-gold-500">
            Off the Grid
          </h1>
          <p className="text-lg text-gray-300">
            Looks like you've ventured beyond the map. Check your connection and try again.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-4 pt-4">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-gold-500 text-jerry-green-900 font-semibold rounded-lg hover:bg-gold-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-300 focus:ring-offset-2 focus:ring-offset-jerry-green-900"
          >
            Retry Connection
          </button>

          <Link
            href="/"
            className="block w-full px-6 py-3 border-2 border-gold-500 text-gold-500 font-semibold rounded-lg hover:bg-gold-500 hover:text-jerry-green-900 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-300 focus:ring-offset-2 focus:ring-offset-jerry-green-900"
          >
            Return to Base Camp
          </Link>
        </div>

        {/* Additional Info */}
        <p className="text-sm text-gray-400 pt-4">
          Some cached pages may still be available while offline
        </p>
      </div>
    </div>
  )
}
