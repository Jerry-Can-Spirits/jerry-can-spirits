/**
 * Storefront side of GA4 session→order stitching. Reads the GA4 client_id,
 * session_id, gclid and the visitor's analytics-consent state from the browser
 * and stamps them onto the Shopify cart as hidden note attributes, so the order
 * webhook can attribute the purchase server-side after the checkout hand-off.
 *
 * Client-only (guards on window/document). Never throws — attribution must
 * never block a checkout.
 */
import { updateCartAttributes, type Cart, type CartAttribute } from './shopify';
import { getStoredGclid } from './utm';
import {
  STITCH_CLIENT_ID,
  STITCH_SESSION_ID,
  STITCH_GCLID,
  STITCH_CONSENT,
  CONSENT_GRANTED,
} from './analytics-stitch-keys';

// The GA4 session cookie name is _ga_<container>, i.e. the measurement id with
// its "G-" prefix dropped. Measurement id G-6VJL06YBW2 → _ga_6VJL06YBW2. This
// is the same public id used client-side in GoogleTag.tsx.
const GA4_SESSION_COOKIE = '_ga_6VJL06YBW2';

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/**
 * client_id from the _ga cookie. Format GA1.1.XXXXXXXXX.YYYYYYYYY — the
 * client_id GA4 uses is the last two dot-separated segments joined.
 */
export function readGaClientId(): string | undefined {
  const raw = readCookie('_ga');
  if (!raw) return undefined;
  const parts = raw.split('.');
  if (parts.length < 4) return undefined;
  return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
}

/**
 * session_id from the _ga_<container> cookie. Format
 * GS1.1.<session_id>.<session_count>.<...> — session_id is the third segment.
 */
export function readGaSessionId(): string | undefined {
  const raw = readCookie(GA4_SESSION_COOKIE);
  if (!raw) return undefined;
  const parts = raw.split('.');
  return parts[2] || undefined;
}

/**
 * Analytics consent, read at the moment of stamping. Uses the same
 * Cookiebot.consent.statistics gate as every other GA4 event on the site, so
 * the server-side purchase send obeys the same consent decision as the
 * client-side upper-funnel events.
 */
export function readAnalyticsConsent(): typeof CONSENT_GRANTED | 'denied' {
  if (typeof window === 'undefined') return 'denied';
  return window.Cookiebot?.consent?.statistics ? CONSENT_GRANTED : 'denied';
}

export function buildStitchingAttributes(): CartAttribute[] {
  const attrs: CartAttribute[] = [];
  const clientId = readGaClientId();
  if (clientId) attrs.push({ key: STITCH_CLIENT_ID, value: clientId });
  const sessionId = readGaSessionId();
  if (sessionId) attrs.push({ key: STITCH_SESSION_ID, value: sessionId });
  const gclid = getStoredGclid();
  if (gclid) attrs.push({ key: STITCH_GCLID, value: gclid });
  // Always record consent so the server-side send gates on it explicitly,
  // rather than inferring it from the presence or absence of a client_id.
  attrs.push({ key: STITCH_CONSENT, value: readAnalyticsConsent() });
  return attrs;
}

const STITCH_KEYS = new Set([STITCH_CLIENT_ID, STITCH_SESSION_ID, STITCH_GCLID, STITCH_CONSENT]);

/**
 * Stamp the stitching identifiers onto the cart, preserving any existing
 * attributes (e.g. a gift message). Cart attribute updates replace the whole
 * set, so existing non-stitching attributes are merged back in. Never throws.
 */
export async function attachStitchingAttributes(
  cart: Pick<Cart, 'id' | 'attributes'>,
): Promise<void> {
  try {
    const stitching = buildStitchingAttributes();
    const preserved = (cart.attributes ?? []).filter((a) => !STITCH_KEYS.has(a.key));
    await updateCartAttributes(cart.id, [...preserved, ...stitching]);
  } catch (error) {
    console.error('[stitching] failed to attach analytics attributes (non-blocking):', error);
  }
}
