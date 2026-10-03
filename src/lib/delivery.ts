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

// Christmas. The working-days promise stops meaning anything around the 19th
// of December, and in 2026 the shipping page said nothing about it while two
// scheduled emails pointed at it for "last order dates" (Audit B, 3 Oct
// 2026). The last order date is the fulfilment partner's last dispatch day
// against Royal Mail's last Tracked 48 posting date, and it changes every
// year. It is null until it is known; while null the line renders nowhere.
// Set `lastOrderDate` to the day itself as an ISO date and the line appears
// from `showFrom` and disappears on its own the day after the cut-off.
export const CHRISTMAS_CUTOFF = {
  lastOrderDate: null as string | null, // e.g. '2026-12-19'
  showFrom: '2026-12-01',
}

/** The line to show, or null outside the window or while the date is unset. */
export function christmasCutoffLine(now = new Date()): string | null {
  const { lastOrderDate, showFrom } = CHRISTMAS_CUTOFF
  if (!lastOrderDate) return null
  const today = now.toISOString().slice(0, 10)
  if (today < showFrom || today > lastOrderDate) return null
  const day = new Date(`${lastOrderDate}T12:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/London',
  })
  return `Order by ${DISPATCH_CUTOFF_LABEL} on ${day} for delivery before Christmas`
}
