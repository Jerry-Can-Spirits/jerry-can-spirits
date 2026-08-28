/**
 * Cart/note attribute keys that stitch a storefront GA4 session to the Shopify
 * order across the checkout hand-off. Shared by the storefront (which writes
 * them as cart attributes) and the order webhook (which reads them off
 * note_attributes) so the two sides can never drift — a mismatch would silently
 * drop every purchase send.
 *
 * The underscore prefix keeps the attributes private in Shopify (not shown to
 * the customer on the order).
 */
export const STITCH_CLIENT_ID = '_ga_client_id';
export const STITCH_SESSION_ID = '_ga_session_id';
export const STITCH_GCLID = '_gclid';
export const STITCH_CONSENT = '_analytics_consent';

// The value written to STITCH_CONSENT when analytics consent is granted; any
// other value (including the attribute being absent) means no consent.
export const CONSENT_GRANTED = 'granted';

/**
 * Reduce a GA4 session segment to the bare numeric session_id the Measurement
 * Protocol expects, or undefined if no id can be found.
 *
 * The _ga_<container> cookie has two formats in the wild:
 *
 *   GS1.1.1712345678.3.1.1712345900.60.0.0          — dot-delimited; the
 *     session id is the plain-digit third segment.
 *   GS2.1.s1712345678$o3$g1$t1712345900$j60$l0$h0   — the current format:
 *     everything after "GS2.1." is ONE dot-free segment, $-delimited, with the
 *     session id behind an "s" prefix.
 *
 * The storefront originally assumed the GS1 shape and took parts[2], which on a
 * GS2 cookie is the entire "s…$o…$…" blob. Sent to GA4 that way, session_id is
 * unparseable, so every stitched purchase landed in a sourceless new session —
 * measured on this shop as 65% of tracked revenue sitting in "Unassigned".
 *
 * Both sides share this normaliser: the storefront before stamping the cart,
 * and the webhook before sending — the latter so carts stamped with the blob
 * before the fix still attribute when they convert after it.
 */
export function normaliseGaSessionId(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const match = /^s?(\d+)/.exec(raw);
  return match ? match[1] : undefined;
}
