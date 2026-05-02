/**
 * Serialise a JSON-LD payload safely for embedding in
 * `<script type="application/ld+json">` via `dangerouslySetInnerHTML`.
 *
 * Escaping `<` to its unicode form prevents an attacker-controlled string
 * (Shopify product titles, Sanity cocktail content, FAQ metafields, etc.)
 * from breaking out of the script tag with `</script>`, opening `<!--`
 * comments, or injecting fresh `<script>` / `<svg>` blocks.
 *
 * `<` is valid inside a JSON string literal and parses identically
 * to `<` for downstream consumers (Google's structured data parser, etc.),
 * so this is a pure security hardening with no functional change.
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
