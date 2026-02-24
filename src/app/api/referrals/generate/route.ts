import { NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { generateReferralCode, createDiscountCode } from '@/lib/shopify-admin';

export const dynamic = 'force-dynamic';

interface ReferralRow {
  id: number;
  referrer_email: string;
  referrer_code: string;
}

/**
 * POST /api/referrals/generate
 *
 * Accepts { email }, checks D1 for existing referral, generates new code if needed.
 * Creates £5 discount in Shopify, stores in D1 + KV, returns { code, share_url }.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address required' },
        { status: 400 },
      );
    }

    const { env } = await getCloudflareContext();
    const db = env.DB;
    const kv = env.SITE_OPS as KVNamespace;
    const adminToken = env.SHOPIFY_ADMIN_API_TOKEN as string | undefined;

    if (!adminToken) {
      console.error('[referral] SHOPIFY_ADMIN_API_TOKEN not configured');
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 },
      );
    }

    // Check for existing referral
    const existing = await db
      .prepare('SELECT id, referrer_email, referrer_code FROM referrals WHERE referrer_email = ?')
      .bind(email)
      .first<ReferralRow>();

    if (existing) {
      return NextResponse.json({
        code: existing.referrer_code,
        share_url: `https://jerrycanspirits.co.uk/refer/${existing.referrer_code}`,
        existing: true,
      });
    }

    // Generate new referral code
    const code = generateReferralCode(email);

    // Create £5 discount in Shopify (for the referee — friend gets £5 off)
    await createDiscountCode(code, adminToken);

    // Store in D1
    await db
      .prepare(
        'INSERT INTO referrals (referrer_email, referrer_code) VALUES (?, ?)',
      )
      .bind(email, code)
      .run();

    // Store in KV for fast landing page lookups (90-day TTL)
    await kv.put(
      `referral:${code}`,
      JSON.stringify({ email, code, created_at: new Date().toISOString() }),
      { expirationTtl: 60 * 60 * 24 * 90 },
    );

    return NextResponse.json({
      code,
      share_url: `https://jerrycanspirits.co.uk/refer/${code}`,
      existing: false,
    });
  } catch (error) {
    console.error('[referral] Generate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate referral code' },
      { status: 500 },
    );
  }
}
