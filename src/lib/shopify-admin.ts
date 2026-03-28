/**
 * Shopify Admin REST API helpers for the referral scheme.
 *
 * Creates price rules and discount codes for £5-off single-use referral rewards.
 * Uses the same SHOP_DOMAIN and API_VERSION as shopify-webhooks.ts.
 */

const SHOP_DOMAIN = 'shop.jerrycanspirits.co.uk';
const API_VERSION = '2024-10';

// ── Referral Code Generation ────────────────────────────────────────

/**
 * Generate a deterministic referral code from an email address.
 * Format: JCS-{prefix}-{timestamp_hex} e.g. JCS-DAN-1a2b3c
 */
export function generateReferralCode(email: string): string {
  const prefix = email
    .split('@')[0]
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 6)
    .toUpperCase();
  const timestamp = Date.now().toString(16).slice(-6).toUpperCase();
  return `JCS-${prefix}-${timestamp}`;
}

// ── Discount Code Creation ──────────────────────────────────────────

interface PriceRuleResponse {
  price_rule: {
    id: number;
  };
}

interface DiscountCodeResponse {
  discount_code: {
    id: number;
    code: string;
  };
}

/**
 * Create a 10%-off single-use discount code in Shopify for a referred friend.
 * Creates a price rule first, then attaches a discount code to it.
 */
export async function createDiscountCode(
  code: string,
  adminToken: string,
): Promise<{ priceRuleId: number; discountCodeId: number; code: string }> {
  const baseUrl = `https://${SHOP_DOMAIN}/admin/api/${API_VERSION}`;
  const headers = {
    'X-Shopify-Access-Token': adminToken,
    'Content-Type': 'application/json',
  };

  // 1. Create a price rule (10% off, single use, for the referee/friend)
  const priceRuleRes = await fetch(`${baseUrl}/price_rules.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      price_rule: {
        title: `Referral: ${code}`,
        target_type: 'line_item',
        target_selection: 'all',
        allocation_method: 'across',
        value_type: 'percentage',
        value: '-10.0',
        customer_selection: 'all',
        usage_limit: 1,
        once_per_customer: true,
        starts_at: new Date().toISOString(),
      },
    }),
  });

  if (!priceRuleRes.ok) {
    const errText = await priceRuleRes.text();
    throw new Error(`Failed to create price rule: ${priceRuleRes.status} ${errText}`);
  }

  const priceRuleData = (await priceRuleRes.json()) as PriceRuleResponse;
  if (!priceRuleData.price_rule) {
    console.error('[shopify-admin] Unexpected price rule response — status:', priceRuleRes.status, '| body:', JSON.stringify(priceRuleData));
    throw new Error('Price rule response missing price_rule object');
  }
  const priceRuleId = priceRuleData.price_rule.id;

  // 2. Attach the discount code to the price rule
  const discountRes = await fetch(
    `${baseUrl}/price_rules/${priceRuleId}/discount_codes.json`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        discount_code: { code },
      }),
    },
  );

  if (!discountRes.ok) {
    const errText = await discountRes.text();
    throw new Error(`Failed to create discount code: ${discountRes.status} ${errText}`);
  }

  const discountData = (await discountRes.json()) as DiscountCodeResponse;

  return {
    priceRuleId,
    discountCodeId: discountData.discount_code.id,
    code: discountData.discount_code.code,
  };
}

/**
 * Create a £5-off single-use reward code for the referrer.
 * Combinable with other discounts (e.g. BLUELIGHT10) via combines_with.
 */
export async function createReferrerRewardCode(
  code: string,
  adminToken: string,
): Promise<{ priceRuleId: number; discountCodeId: number; code: string }> {
  const baseUrl = `https://${SHOP_DOMAIN}/admin/api/${API_VERSION}`;
  const headers = {
    'X-Shopify-Access-Token': adminToken,
    'Content-Type': 'application/json',
  };

  const priceRuleRes = await fetch(`${baseUrl}/price_rules.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      price_rule: {
        title: `Referral Reward: ${code}`,
        target_type: 'line_item',
        target_selection: 'all',
        allocation_method: 'across',
        value_type: 'fixed_amount',
        value: '-5.00',
        customer_selection: 'all',
        usage_limit: 1,
        once_per_customer: true,
        starts_at: new Date().toISOString(),
        combines_with: {
          order_discounts: true,
          product_discounts: true,
          shipping_discounts: true,
        },
      },
    }),
  });

  if (!priceRuleRes.ok) {
    const errText = await priceRuleRes.text();
    throw new Error(`Failed to create reward price rule: ${priceRuleRes.status} ${errText}`);
  }

  const priceRuleData = (await priceRuleRes.json()) as PriceRuleResponse;
  const priceRuleId = priceRuleData.price_rule.id;

  const discountRes = await fetch(
    `${baseUrl}/price_rules/${priceRuleId}/discount_codes.json`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ discount_code: { code } }),
    },
  );

  if (!discountRes.ok) {
    const errText = await discountRes.text();
    throw new Error(`Failed to create reward discount code: ${discountRes.status} ${errText}`);
  }

  const discountData = (await discountRes.json()) as DiscountCodeResponse;

  return {
    priceRuleId,
    discountCodeId: discountData.discount_code.id,
    code: discountData.discount_code.code,
  };
}
