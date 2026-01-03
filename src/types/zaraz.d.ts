// Cloudflare Zaraz Custom Element Type Declarations
// https://blog.cloudflare.com/cloudflare-zaraz-supports-instagram-and-x-embeds

import 'react'

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
