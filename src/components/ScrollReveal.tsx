'use client'

import { useScrollReveal } from '@/hooks/useScrollReveal'

interface ScrollRevealProps {
  children: React.ReactNode
  delay?: 0 | 1 | 2 | 3 | 4
  direction?: 'up' | 'left' | 'right'
  className?: string
}

export default function ScrollReveal({
  children,
  delay = 0,
  direction = 'up',
  className = '',
}: ScrollRevealProps) {
  const { ref, isRevealed } = useScrollReveal()

  const baseClass =
    direction === 'left'
      ? 'reveal-left'
      : direction === 'right'
        ? 'reveal-right'
        : 'reveal'

  const delayClass = delay > 0 ? `reveal-delay-${delay}` : ''

  return (
    <div
      ref={ref}
      className={`${baseClass} ${delayClass} ${className}`.trim()}
      data-revealed={isRevealed}
    >
      {children}
    </div>
  )
}
