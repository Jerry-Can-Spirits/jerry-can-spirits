'use client'

import { useState, useEffect } from 'react'

interface Section {
  id: string
  title: string
  description?: string
  count?: number
}

interface SectionFilterProps {
  sections: Section[]
  onSectionClick?: (sectionId: string) => void
}

export default function SectionFilter({ sections, onSectionClick }: SectionFilterProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [isSticky, setIsSticky] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 200)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const offset = 120 // Account for header height
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.scrollY - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })

      setActiveSection(sectionId)
      if (onSectionClick) {
        onSectionClick(sectionId)
      }
    }
  }

  return (
    <div
      className={`transition-all duration-300 ${
        isSticky
          ? 'sticky top-20 z-40 bg-jerry-green-900/95 backdrop-blur-md border-b border-gold-500/20 shadow-lg'
          : 'relative'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Desktop: Horizontal scroll */}
        <div className="hidden md:block">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <span className="text-gold-300 text-sm font-semibold uppercase tracking-wider whitespace-nowrap mr-2">
              Jump to:
            </span>
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all duration-200 text-sm font-medium ${
                  activeSection === section.id
                    ? 'bg-gold-500 text-jerry-green-900 shadow-md'
                    : 'bg-jerry-green-800/60 text-parchment-200 hover:bg-jerry-green-700/80 hover:text-gold-300 border border-gold-500/20'
                }`}
              >
                {section.title}
                {section.count !== undefined && (
                  <span className="ml-2 opacity-70">({section.count})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile: Dropdown */}
        <div className="md:hidden">
          <label htmlFor="section-select" className="block text-gold-300 text-sm font-semibold uppercase tracking-wider mb-2">
            Jump to Section:
          </label>
          <select
            id="section-select"
            onChange={(e) => scrollToSection(e.target.value)}
            className="w-full px-4 py-3 bg-jerry-green-800/60 border border-gold-500/20 rounded-lg text-parchment-200 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/50"
            defaultValue=""
          >
            <option value="" disabled>Select a section...</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.title}
                {section.count !== undefined && ` (${section.count})`}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
