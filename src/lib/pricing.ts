// Single source of truth for the storefront pricing thresholds. These are
// customer-facing figures that were previously hard-coded (and drifted): the
// free-shipping threshold was stated as £100 in five places while the live
// Shopify shipping rule is £65.
//
// FREE_SHIPPING_THRESHOLD_GBP must match the live Shopify shipping profile.
// REFERRAL_MIN_ORDER_GBP is the minimum order value minted onto every new
// referral code (see shopify-admin.ts). They normally sit aligned at £65 so
// both incentives drive the same basket (a bottle plus an accessory).
//
// TEMPORARY weekend promotion: free-shipping threshold lowered to £40 to match
// the live Shopify shipping rule. Reverts to £65 on Monday 2026-07-27.
export const FREE_SHIPPING_THRESHOLD_GBP = 40;
export const REFERRAL_MIN_ORDER_GBP = 65;

// Formatted for copy, e.g. "£65".
export const FREE_SHIPPING_THRESHOLD_LABEL = `£${FREE_SHIPPING_THRESHOLD_GBP}`;
