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
// No minimum order value, deliberately (ruled 31 Aug 2026). Referral codes
// carried a £65 minimum from #918, which the £40 price broke twice over: a
// bottle plus a glass no longer cleared it, and WELCOME10 — handed to any
// popup visitor — has no minimum, so a referred friend got a worse deal than
// a stranger. The reward is a thank-you and carries no conditions. Driving
// bigger baskets is the free-shipping threshold's job alone.
const REFERRAL_CODE_EXPIRY_DAYS = 90;

// Shopify DiscountCodeBasicInput.endsAt — a fixed window from mint time.
function referralEndsAt(): string {
  return new Date(Date.now() + REFERRAL_CODE_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();
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

// ── Generic Admin GraphQL call ──────────────────────────────────────

/**
 * One Admin GraphQL request. Throws on transport failure and on top-level
 * GraphQL errors; userErrors inside a mutation payload are the caller's to
 * read, because what counts as an error differs by mutation.
 */
export async function adminGraphql<T>(
  adminToken: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'X-Shopify-Access-Token': adminToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    throw new Error(`Shopify GraphQL request failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
  }
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) {
    throw new Error(`Shopify GraphQL error: ${json.errors.map((e) => e.message).join(', ')}`);
  }
  if (!json.data) throw new Error('Shopify GraphQL returned no data');
  return json.data;
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

// ── What a referral code discounts ──────────────────────────────────

// The UK Tree Fund line is a donation, not a purchase. A code on the whole
// order took 10% off it (found 17 Nov 2026, when ARRSE10 turned a £1 donation
// into 90p). Shopify has no "all products except" setting, so a code is scoped
// to every product bar the donation, read at mint time.
const DONATION_HANDLE = 'uk-tree-fund';

interface DiscountableProducts {
  products: { nodes: { id: string; handle: string; isGiftCard: boolean }[] };
}

async function discountableProductIds(adminToken: string): Promise<string[]> {
  const data = await adminGraphql<DiscountableProducts>(
    adminToken,
    `query DiscountableProducts { products(first: 250) { nodes { id handle isGiftCard } } }`,
    {},
  );
  const ids = data.products.nodes
    .filter((p) => p.handle !== DONATION_HANDLE && !p.isGiftCard)
    .map((p) => p.id);
  if (ids.length === 0) throw new Error('No products to scope the referral discount to');
  return ids;
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

  const productIds = await discountableProductIds(adminToken);

  const variables = {
    input: {
      title: `Referral: ${code}`,
      code,
      appliesOncePerCustomer: true,
      startsAt: new Date().toISOString(),
      endsAt: referralEndsAt(),
      customerGets: {
        value: { percentage: 0.10 },
        items: { products: { productsToAdd: productIds } },
      },
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

  const productIds = await discountableProductIds(adminToken);

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
        items: { products: { productsToAdd: productIds } },
      },
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
