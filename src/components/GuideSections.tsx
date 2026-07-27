'use client'

import { useState } from 'react'
import type { PortableTextBlock } from 'next-sanity'
import GuidePortableText from './GuidePortableText'

interface Subsection {
  subheading: string
  content?: string
  contentRich?: PortableTextBlock[]
}

interface Section {
  heading: string
  content?: string
  contentRich?: PortableTextBlock[]
  subsections?: Subsection[]
}

// Rich content when migrated, plain-text fallback otherwise (the portable-text
// migration's zero-downtime contract).
function SectionBody({ content, contentRich }: { content?: string; contentRich?: PortableTextBlock[] }) {
  if (contentRich && contentRich.length > 0) {
    return <GuidePortableText value={contentRich} />
  }
  return (
    <p className="text-parchment-300 leading-relaxed whitespace-pre-line">
      {content}
    </p>
  )
}

interface GuideSectionsProps {
  sections: Section[]
  initialVisibleCount?: number
}

// Convert heading to URL-friendly slug for anchor links
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function GuideSections({ sections, initialVisibleCount = 4 }: GuideSectionsProps) {
  const [showAll, setShowAll] = useState(false)

  const shouldPaginate = sections.length > initialVisibleCount
  const visibleSections = showAll ? sections : sections.slice(0, initialVisibleCount)
  const hiddenCount = sections.length - initialVisibleCount

  return (
    <div className="space-y-12">
      {visibleSections.filter(s => s.heading?.trim()).map((section, index) => (
        <section key={index} id={slugify(section.heading)} className="scroll-mt-24">
          <h2 className="text-3xl font-serif font-bold text-white mb-6">
            {section.heading}
          </h2>
          <div className="prose prose-invert max-w-none">
            <SectionBody content={section.content} contentRich={section.contentRich} />
          </div>

          {section.subsections && section.subsections.length > 0 && (
            <div className="mt-8 space-y-8">
              {section.subsections.map((subsection, subIndex) => (
                <div key={subIndex} className="pl-6 border-l-2 border-gold-500/30">
                  <h3 className="text-xl font-serif font-bold text-gold-300 mb-4">
                    {subsection.subheading}
                  </h3>
                  <SectionBody content={subsection.content} contentRich={subsection.contentRich} />
                </div>
              ))}
            </div>
          )}
        </section>
      ))}

      {/* Show More Button */}
      {shouldPaginate && !showAll && (
        <div className="text-center pt-4">
          <button
            onClick={() => setShowAll(true)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-jerry-green-800/60 border border-gold-500/30 text-gold-300 rounded-lg hover:bg-jerry-green-800/80 hover:border-gold-400/40 transition-all group"
          >
            <span>Show {hiddenCount} More Section{hiddenCount > 1 ? 's' : ''}</span>
            <svg
              className="w-5 h-5 group-hover:translate-y-0.5 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}

      {/* Collapse Button (when expanded) */}
      {shouldPaginate && showAll && (
        <div className="text-center pt-4">
          <button
            onClick={() => {
              setShowAll(false)
              // Scroll to top of article
              document.getElementById(slugify(sections[0].heading))?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="inline-flex items-center gap-2 px-6 py-3 text-parchment-400 hover:text-gold-300 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            <span>Collapse Sections</span>
          </button>
        </div>
      )}
    </div>
  )
}
