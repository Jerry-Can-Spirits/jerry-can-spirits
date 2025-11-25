'use client'

import { useState, useEffect } from 'react'
import { ChevronUpIcon } from '@heroicons/react/24/outline'

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled down 300px
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility, { passive: true })

    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 z-40 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-jerry-green-900 p-3 lg:p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
          aria-label="Back to top"
        >
          <ChevronUpIcon className="w-6 h-6 group-hover:translate-y-[-2px] transition-transform duration-200" />
        </button>
      )}
    </>
  )
}
