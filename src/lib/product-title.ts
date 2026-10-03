// The Shopify titles of the three drinks carry the brand as a prefix
// ("Jerry Can Spirits - Expedition Spiced Rum"). On the page the brand is the
// logo a few pixels above any heading, so the prefix only truncated the
// product's own name in the sticky bar and the basket line (Audit B, 3 Oct
// 2026). JSON-LD and analytics keep the full Shopify title; this is for what
// people read. The same regex lived inline in the product page and the
// age-check page; it lives here now.
export function displayProductTitle(title: string): string {
  return title.replace(/^Jerry Can Spirits[®]?\s*[-–—]?\s*/i, '')
}
