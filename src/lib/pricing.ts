// Single source of truth for the storefront pricing thresholds. These are
// customer-facing figures that were previously hard-coded (and drifted): the
// free-shipping threshold was stated as £100 in five places while the live
// Shopify shipping rule is £65.
//
// FREE_SHIPPING_THRESHOLD_GBP must match the live Shopify shipping profile.
// REFERRAL_MIN_ORDER_GBP is the minimum order value minted onto every new
// referral code (see shopify-admin.ts). The two are deliberately aligned at £65
// so both incentives drive the same basket (a bottle plus an accessory).
export const FREE_SHIPPING_THRESHOLD_GBP = 65;
export const REFERRAL_MIN_ORDER_GBP = 65;

// Formatted for copy, e.g. "£65".
export const FREE_SHIPPING_THRESHOLD_LABEL = `£${FREE_SHIPPING_THRESHOLD_GBP}`;
