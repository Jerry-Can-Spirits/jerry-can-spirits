// Cloudflare Zaraz Type Declarations
// https://developers.cloudflare.com/zaraz/

import 'react'

// Extend Window interface for Zaraz
declare global {
  interface Window {
    zaraz?: {
      track: (eventName: string, properties?: Record<string, unknown>) => void
      set: (key: string, value: unknown) => void
      consent?: {
        set: (consent: boolean) => void
        setAll: (consent: boolean) => void
        get: (tool?: string) => boolean | undefined
      }
      q?: unknown[]
    }
  }
}

// JSX Custom Elements for Zaraz embeds
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'instagram-post': {
        'post-url': string
        captions?: 'true' | 'false'
      }
    }
  }
}
