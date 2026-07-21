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

// Meta Conversions API stitching, alongside the GA4 keys above, so the order
// webhook can send a server-side Purchase to Meta after the checkout hand-off.
// _meta_fbp / _meta_fbc carry the Meta browser cookies (_fbp/_fbc, set by the
// Pixel once marketing consent is granted). _marketing_consent gates the Meta
// send on MARKETING consent, which is distinct from the STITCH_CONSENT
// (statistics) gate GA4 uses — Meta advertising cookies are a marketing purpose.
export const STITCH_FBP = '_meta_fbp';
export const STITCH_FBC = '_meta_fbc';
export const STITCH_MARKETING_CONSENT = '_marketing_consent';

// The value written to STITCH_CONSENT / STITCH_MARKETING_CONSENT when consent is
// granted; any other value (including the attribute being absent) means no
// consent.
export const CONSENT_GRANTED = 'granted';
