// Single source of truth for the delivery promise. Custom Spirit Co dispatches
// same day for orders placed before 3pm on a working day, and Royal Mail
// Tracked 48 has delivered within two working days of dispatch since launch.
// The site stated 3 to 5 business days in four places (the shipping page, the
// FAQ, the complaints page and the product page); each said something
// different from the others and all of them undersold the service. Ruled
// 24 Sep 2026. Change it here, nowhere else.
export const DISPATCH_CUTOFF_LABEL = '3pm'
export const DELIVERY_WINDOW_LABEL = '1 to 2 working days'

/** Short form for a trust strip or a bullet. */
export const DELIVERY_PROMISE = `Order by ${DISPATCH_CUTOFF_LABEL}, delivered in ${DELIVERY_WINDOW_LABEL}`

/** Full form for policy copy and FAQ answers. */
export const DELIVERY_PROMISE_SENTENCE = `Orders placed before ${DISPATCH_CUTOFF_LABEL} on a working day are dispatched the same day and delivered within ${DELIVERY_WINDOW_LABEL}. Orders placed at the weekend are dispatched on the next working day.`
