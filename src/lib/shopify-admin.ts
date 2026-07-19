/**
 * Shopify Admin GraphQL API helpers for the referral scheme.
 *
 * Creates discount codes using the GraphQL Discounts API (2025-10).
 * The REST Price Rules API was removed in Shopify API 2025-01.
 */

const SHOP_DOMAIN = 'zaeiaw-5z.myshopify.com';
const API_VERSION = '2025-10';

const GRAPHQL_URL = `https://${SHOP_DOMAIN}/admin/api/${API_VERSION}/graphql.json`;

// ── Referral code terms (single source of truth — tune here) ────────
// The referral minimum order value and the free-shipping threshold are
// deliberately aligned at the same value (£65) so both incentives drive the
// same basket size (bottle plus accessory) rather than competing: a £45
// Expedition Spiced bottle plus a ~£19 accessory clears both. The free-shipping
// threshold is configured separately and must NOT be changed here — keep this
// value in step with it. Both terms below are applied to every code minted.
const REFERRAL_MIN_ORDER_GBP = 65;
const REFERRAL_CODE_EXPIRY_DAYS = 90;

// Shopify DiscountCodeBasicInput.endsAt — a fixed window from mint time.
function referralEndsAt(): string {
  return new Date(Date.now() + REFERRAL_CODE_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

// Shopify DiscountCodeBasicInput.minimumRequirement — order subtotal floor.
function referralMinimumRequirement() {
  return { subtotal: { greaterThanOrEqualToSubtotal: REFERRAL_MIN_ORDER_GBP.toFixed(2) } };
}

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
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();
  return `JCS-${prefix}-${random}`;
}

// ── GraphQL response types ──────────────────────────────────────────

interface DiscountUserError {
  field: string[];
  message: string;
}

interface CreateDiscountResult {
  codeDiscountNode: { id: string } | null;
  userErrors: DiscountUserError[];
}

// ── Discount Code Creation ──────────────────────────────────────────

/**
 * Create a 10%-off single-use discount code in Shopify for a referred friend.
 * Uses GraphQL discountCodeBasicCreate mutation (REST Price Rules removed in 2025-01).
 */
export async function createDiscountCode(
  code: string,
  adminToken: string,
): Promise<{ id: string; code: string }> {
  const headers = {
    'X-Shopify-Access-Token': adminToken,
    'Content-Type': 'application/json',
  };

  const mutation = `
    mutation CreateReferralDiscount($input: DiscountCodeBasicInput!) {
      discountCodeBasicCreate(basicCodeDiscount: $input) {
        codeDiscountNode {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      title: `Referral: ${code}`,
      code,
      appliesOncePerCustomer: true,
      startsAt: new Date().toISOString(),
      endsAt: referralEndsAt(),
      customerGets: {
        value: { percentage: 0.10 },
        items: { all: true },
      },
      minimumRequirement: referralMinimumRequirement(),
      customerSelection: { all: true },
    },
  };

  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: mutation, variables }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Shopify GraphQL request failed: ${res.status} ${errText}`);
  }

  const json = await res.json() as {
    data?: { discountCodeBasicCreate?: CreateDiscountResult };
    errors?: { message: string }[];
  };

  if (json.errors?.length) {
    throw new Error(`GraphQL error creating referral discount: ${json.errors.map(e => e.message).join(', ')}`);
  }

  const result = json.data?.discountCodeBasicCreate;
  if (result?.userErrors?.length) {
    throw new Error(`Failed to create referral discount: ${result.userErrors.map(e => e.message).join(', ')}`);
  }

  if (!result?.codeDiscountNode) {
    throw new Error('Discount creation returned no node — unknown error');
  }

  return { id: result.codeDiscountNode.id, code };
}

/**
 * Create a 10%-off single-use reward code for the referrer.
 * Combinable with order, product, and shipping discounts.
 */
export async function createReferrerRewardCode(
  code: string,
  adminToken: string,
): Promise<{ id: string; code: string }> {
  const headers = {
    'X-Shopify-Access-Token': adminToken,
    'Content-Type': 'application/json',
  };

  const mutation = `
    mutation CreateReferrerReward($input: DiscountCodeBasicInput!) {
      discountCodeBasicCreate(basicCodeDiscount: $input) {
        codeDiscountNode {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      title: `Referral Reward: ${code}`,
      code,
      usageLimit: 1,
      appliesOncePerCustomer: true,
      startsAt: new Date().toISOString(),
      endsAt: referralEndsAt(),
      customerGets: {
        value: { percentage: 0.10 },
        items: { all: true },
      },
      minimumRequirement: referralMinimumRequirement(),
      customerSelection: { all: true },
      combinesWith: {
        orderDiscounts: true,
        productDiscounts: true,
        shippingDiscounts: true,
      },
    },
  };

  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: mutation, variables }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Shopify GraphQL request failed: ${res.status} ${errText}`);
  }

  const json = await res.json() as {
    data?: { discountCodeBasicCreate?: CreateDiscountResult };
    errors?: { message: string }[];
  };

  if (json.errors?.length) {
    throw new Error(`GraphQL error creating reward discount: ${json.errors.map(e => e.message).join(', ')}`);
  }

  const result = json.data?.discountCodeBasicCreate;
  if (result?.userErrors?.length) {
    throw new Error(`Failed to create reward discount: ${result.userErrors.map(e => e.message).join(', ')}`);
  }

  if (!result?.codeDiscountNode) {
    throw new Error('Reward discount creation returned no node — unknown error');
  }

  return { id: result.codeDiscountNode.id, code };
}
