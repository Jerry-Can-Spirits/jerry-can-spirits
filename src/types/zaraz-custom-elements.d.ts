// Type declarations for Cloudflare Zaraz custom HTML elements

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'instagram-post': {
        'post-url': string;
        captions?: string;
      };
    }
  }
}

export {};
