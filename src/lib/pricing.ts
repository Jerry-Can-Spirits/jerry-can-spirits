// Single source of truth for the storefront pricing thresholds. These are
// customer-facing figures that were previously hard-coded (and drifted): the
// free-shipping threshold was stated as £100 in five places while the live
// Shopify shipping rule is £65.
//
// FREE_SHIPPING_THRESHOLD_GBP must match the live Shopify shipping profile.
//
// REFERRAL_MIN_ORDER_GBP is gone (ruled 31 Aug 2026): referral codes mint
// with no minimum. WELCOME10 has none, and a referred friend must never get
// a worse deal than a popup visitor. Basket-building belongs to the
// free-shipping threshold alone.
export const FREE_SHIPPING_THRESHOLD_GBP = 65;

// Standard UK shipping, which must match the live Shopify shipping profile for
// the same reason the threshold does. It was stated as a literal "£5.00" in
// three places on the shipping page, including inside the JSON-LD answer text.
export const STANDARD_SHIPPING_GBP = 5;

// Formatted for copy, e.g. "£65".
export const FREE_SHIPPING_THRESHOLD_LABEL = `£${FREE_SHIPPING_THRESHOLD_GBP}`;
// Formatted for copy, e.g. "£5.00".
export const STANDARD_SHIPPING_LABEL = `£${STANDARD_SHIPPING_GBP.toFixed(2)}`;
