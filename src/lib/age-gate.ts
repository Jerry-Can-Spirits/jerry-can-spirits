// Server-enforced age verification — shared rules so middleware, /api/checkout
// and /age-check cannot drift apart. The cookie itself is set client-side by
// AgeGate.tsx (non-HttpOnly, so the browser can set it and the server can read
// it); this module only reads and reasons about it, it does not change how it
// is set.

export const AGE_COOKIE = 'ageVerified'
export const AGE_COOKIE_VALUE = 'true'

// Paths never gated. Getting this list wrong breaks the site, so each entry has
// a reason:
//  - /age-check    the gate route itself — gating it would redirect-loop.
//  - /api/         every API route (Shopify webhook, cart, search, and
//                  /api/checkout, which enforces the gate itself). Data
//                  endpoints, not the gated content.
//  - /_next/       framework data/RSC payloads.
//  - /trade        the trade portal / Pour IQ app — its own PIN auth, B2B, and
//                  a trade buyer does not age-verify as a consumer.
//  - legal pages   a minor may read the privacy policy without verifying.
const EXCLUDED_PREFIXES = [
  '/age-check',
  '/api/',
  '/_next/',
  '/trade/',
  '/terms-of-service',
  '/privacy-policy',
  '/cookie-policy',
]

// Exact paths (no sub-tree): the trade landing itself, and the crawler files
// that search engines must fetch without a gate.
const EXCLUDED_EXACT = ['/trade', '/robots.txt', '/sitemap.xml', '/manifest.webmanifest']

export function isAgeExcludedPath(pathname: string): boolean {
  if (EXCLUDED_EXACT.includes(pathname)) return true
  return EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export function isAgeVerified(cookieValue: string | undefined): boolean {
  return cookieValue === AGE_COOKIE_VALUE
}

// Return targets must be same-origin absolute paths. Reject external URLs and
// protocol-relative //host to close an open-redirect via the ?return param.
export function safeReturnPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/'
  return raw
}

// Known SEO / search / social / validation bot user agents. Bots are allowed to
// browse gated content for indexing (the checkout handoff is separately
// hard-gated in /api/checkout). Single source of truth shared by
// src/middleware.ts AND the edge-cache Worker (cloudflare-worker-entry.mjs), so
// the two age gates can never classify a request differently — a drift here
// would either redirect a crawler (SEO loss) or serve a human cached content
// past the gate.
export const BOT_USER_AGENTS = [
  // Search engines
  'googlebot',
  'bingbot',
  'msnbot', // Microsoft/Bing legacy
  'bingpreview', // Bing link preview
  'adidxbot', // Bing ads
  'microsoftpreview', // Microsoft previews
  'slurp', // Yahoo
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'facebot', // Facebook
  'ia_archiver', // Alexa

  // SEO tools
  'semrushbot',
  'ahrefsbot', // Ahrefs backlink crawler
  'ahrefssiteaudit', // Ahrefs Site Audit — a DISTINCT UA from AhrefsBot; without it the weekly audit is 307'd to the age gate
  'mj12bot', // Majestic
  'dotbot', // Moz
  'rogerbot', // Moz
  'screaming frog',
  'sitebulb',
  'deepcrawl',
  'oncrawl',
  'seobilitybot',
  'serpstatbot',
  'dataforseo',
  'surfer bot', // SurferSEO Site Audit (exact User-Agent)
  'surfer', // SurferSEO fallback

  // Social media
  'twitterbot',
  'linkedinbot',
  'pinterestbot',
  'whatsapp',
  'telegrambot',

  // Validation tools
  'w3c_validator',
  'lighthouse',
  'pagespeed',
  'gtmetrix',

  // Google services
  'mediapartners-google',
  'adsbot-google',
  'apis-google',
  'google-inspectiontool',

  // AI answer engines and assistants. robots.txt has invited these since
  // launch, but until they were listed here the gate 307'd every one of them
  // to /age-check/, so no answer engine had a single page of ours to cite.
  // Same legal posture as the search crawlers above: bots may read gated
  // content for indexing; the checkout handoff stays hard-gated in
  // /api/checkout regardless of UA.
  'oai-searchbot', // ChatGPT search retrieval index
  'chatgpt-user', // ChatGPT fetching a page for a live user question
  'gptbot', // OpenAI training crawler
  'claude-searchbot', // Claude search retrieval index
  'claudebot', // Anthropic training crawler
  'perplexitybot', // Perplexity retrieval
  'ccbot', // Common Crawl — corpus feeding many models
  'meta-externalagent', // Meta / Llama training
  'applebot', // Siri and Apple Intelligence (substring also covers Applebot-Extended)
  'applebot-extended', // robots-only token in practice; listed defensively
]

export function isBot(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false
  const ua = userAgent.toLowerCase()
  return BOT_USER_AGENTS.some((bot) => ua.includes(bot))
}

// A top-level navigation (the browser marks it as a document, or there are no
// fetch-metadata headers at all — a direct hit / curl) as opposed to an RSC/data
// fetch or a prefetch. Only these are gated, so client-side data fetches are
// never redirected. Takes a Headers so it works for both NextRequest
// (middleware) and the plain Request in the Worker.
export function isDocumentNavigation(headers: Headers): boolean {
  const dest = headers.get('sec-fetch-dest')
  if (dest) return dest === 'document'
  return !headers.has('rsc') && !headers.has('next-router-prefetch')
}
