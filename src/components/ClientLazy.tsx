'use client'

import dynamic from 'next/dynamic'

const CartographicBackground = dynamic(
  () => import('./CartographicBackground'),
  { ssr: false, loading: () => null }
)
const CartDrawer = dynamic(() => import('./CartDrawer'), { ssr: false })
const SocialProofToast = dynamic(() => import('./SocialProofToast'), { ssr: false })

interface CartographicProps {
  opacity?: number
  showCoordinates?: boolean
  showCompass?: boolean
  className?: string
}

export function LazyCartographicBackground(props: CartographicProps) {
  return <CartographicBackground {...props} />
}

export function LazyCartDrawer() {
  return <CartDrawer />
}

export function LazySocialProofToast() {
  return <SocialProofToast />
}
