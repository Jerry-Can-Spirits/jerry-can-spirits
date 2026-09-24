// The rum is one liquid sold four ways. The product pages for those four were
// siblings that never mentioned each other except through an algorithmic
// "worth looking at" grid at the bottom, so a visitor on the bottle page had
// no way to see the six-pack existed without leaving. This is the family and
// the order the formats are shown in, from the entry price up. The
// presentation box is not a format: it is an add-on the cart offers once the
// bottle is in it (PresentationBoxUpsell), and it stays there.
export interface ProductFormat {
  handle: string
  /** Short label for the format chip. Never the full product title. */
  label: string
  /** One line under the label. What this format is for. */
  note: string
}

export const RUM_FORMATS: ProductFormat[] = [
  {
    handle: 'jerry-can-spirits-expedition-spiced-rum',
    label: 'Bottle',
    note: '700ml, 40% ABV',
  },
  {
    handle: 'jerry-can-spirits-expedition-pack-spiced-rum-6-bottles',
    label: 'Six-pack',
    note: 'Six bottles, one case',
  },
  {
    handle: 'jerry-can-spirits-premium-gift-pack',
    label: 'Gift pack',
    note: 'Bottle, hiball, jigger and coaster, boxed',
  },
]

/** The formats to show on a product page, or an empty list for products outside the family. */
export function formatsForHandle(handle: string): ProductFormat[] {
  return RUM_FORMATS.some((f) => f.handle === handle) ? RUM_FORMATS : []
}
