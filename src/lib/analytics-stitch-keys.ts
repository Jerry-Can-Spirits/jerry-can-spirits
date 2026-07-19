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
