// GA4 site-search measurement.
//
// Nothing in this codebase ever sent a search event. GA4's Enhanced
// Measurement can pick site search up from the ?q= parameter on /search
// without any code, but only if that setting was enabled on the data stream —
// which is a default, not a decision, and cannot be relied on for a question
// worth answering. Sending the event explicitly makes the measurement ours.
//
// It also closes a real gap: most searching happens in the modal, which
// fetches results without navigating, so a search that finds what it wanted in
// the dropdown never produced a /search pageview and was invisible to the
// parameter-based method however it was configured.
//
// search_source separates the two, because a user who submits from the modal
// produces both a modal event and a page event. Filter to search_source =
// 'modal' for the count of distinct searches.
//
// Consent-gated to match every other event on the site. Consent Mode v2
// redacts these server-side anyway, but a pre-config event still reaches
// dataLayer and could leak through a custom trigger added later.

// window.gtag and window.Cookiebot are declared once, in GoogleTag.tsx.
// Redeclaring them here conflicts rather than merges.

export function trackSearch(searchTerm: string, resultCount: number, source: 'modal' | 'page' = 'modal'): void {
  if (!searchTerm) return
  if (typeof window === 'undefined') return
  if (typeof window.gtag !== 'function') return
  if (!window.Cookiebot?.consent?.statistics) return

  window.gtag('event', 'view_search_results', {
    // The GA4 reserved parameter name. Anything else and the built-in search
    // reports stay empty.
    search_term: searchTerm,
    result_count: resultCount,
    search_source: source,
  })
}
