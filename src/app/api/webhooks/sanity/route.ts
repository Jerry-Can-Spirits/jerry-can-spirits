import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic';

// Sanity signs its webhooks differently from Shopify: the `sanity-webhook-
// signature` header is `t=<unix-ms>,v1=<base64url-hmac>`, and the HMAC is taken
// over `${t}.${body}` (not the body alone) and base64url-encoded without
// padding. Same Web Crypto + constant-time-compare shape as the Shopify verify;
// only the signed string and the encoding differ.
async function isValidSanitySignature(
  body: string,
  signatureHeader: string,
  secret: string,
): Promise<boolean> {
  let timestamp: string | undefined;
  let provided: string | undefined;
  for (const part of signatureHeader.split(',')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k === 't') timestamp = v;
    else if (k === 'v1') provided = v;
  }
  if (!timestamp || !provided) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${body}`));
  const computed = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  // Constant-time comparison
  if (computed.length !== provided.length) return false;
  let mismatch = 0;
  for (let i = 0; i < computed.length; i++) {
    mismatch |= computed.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return mismatch === 0;
}

// Map a changed document to the ISR paths that render it. Mirrors the Shopify
// products/update handler: revalidate the specific page plus the listing
// surfaces it can appear on, so a publish in Studio propagates in seconds
// instead of waiting out the hour-long `revalidate = 3600` window.
function pathsForDocument(doc: { _type?: string; slug?: string; shopifyHandle?: string }): string[] {
  switch (doc._type) {
    case 'product':
      // The PDP route param is the Shopify handle, which is the Sanity
      // product's shopifyHandle. Also refresh the listings the card sits on.
      return [
        ...(doc.shopifyHandle ? [`/shop/product/${doc.shopifyHandle}`] : []),
        '/shop/spirits',
        '/shop/barware',
        '/shop/clothing',
      ];
    case 'cocktail':
      return [...(doc.slug ? [`/field-manual/cocktails/${doc.slug}`] : []), '/field-manual/cocktails'];
    case 'ingredient':
      return [...(doc.slug ? [`/field-manual/ingredients/${doc.slug}`] : []), '/field-manual/ingredients'];
    case 'equipment':
      return [...(doc.slug ? [`/field-manual/equipment/${doc.slug}`] : []), '/field-manual/equipment'];
    case 'guide':
      return [...(doc.slug ? [`/guides/${doc.slug}`] : []), '/guides'];
    default:
      return [];
  }
}

export async function POST(request: Request) {
  try {
    const { env } = await getCloudflareContext();
    const secret = env.SANITY_WEBHOOK_SECRET as string | undefined;

    if (!secret) {
      console.error('[sanity-webhook] SANITY_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Not configured' }, { status: 500 });
    }

    const signature = request.headers.get('sanity-webhook-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Read the body once, for both verification and parsing.
    const body = await request.text();

    const valid = await isValidSanitySignature(body, signature, secret);
    if (!valid) {
      console.warn('[sanity-webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let payload: unknown;
    try {
      payload = JSON.parse(body);
    } catch {
      console.error('[sanity-webhook] Invalid JSON body');
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    if (typeof payload !== 'object' || payload === null) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const doc = payload as { _type?: string; slug?: string; shopifyHandle?: string };
    const paths = pathsForDocument(doc);

    if (paths.length === 0) {
      // A type we don't render on a cached page, or a projection missing _type.
      // Not an error — acknowledge so Sanity doesn't retry.
      console.log('[sanity-webhook] nothing to revalidate for _type: %s', doc._type ?? 'unknown');
      return NextResponse.json({ revalidated: false });
    }

    // Best-effort: a revalidation failure must not fail the webhook (Sanity
    // would retry, but the publish already succeeded — this is only cache
    // freshness). Mirrors the Shopify handler's guarded revalidate.
    try {
      for (const path of paths) {
        revalidatePath(path);
      }
      // Dynamic collection route can't be revalidated by a concrete path.
      if (doc._type === 'product') {
        revalidatePath('/shop/[collection]', 'page');
      }
    } catch (err) {
      console.error('[sanity-webhook] revalidate failed for _type %s:', doc._type ?? 'unknown', err);
    }

    console.log('[sanity-webhook] revalidated %s path(s) for _type %s', String(paths.length), doc._type ?? 'unknown');
    return NextResponse.json({ revalidated: true, paths });
  } catch (error) {
    console.error('[sanity-webhook] Handler error:', error);
    Sentry.captureException(error, { tags: { source: 'sanity-webhook' } });
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
