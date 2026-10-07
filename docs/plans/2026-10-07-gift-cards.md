# Gift cards

Status: site code built (this branch). Shopify product, card page and email to do. 7 October 2026.

The first deep dive from the competitor matrix (StrategicPlanning/Market Research, Oct 2026). Five of eleven competitor sites sell gift cards. Every one is Shopify's default: a code by email, fixed amounts (£10 to £100), stock description. None schedules delivery, carries a message, is designed, or prints. That is the gap.

## What the best version does

1. **Sent on a day the buyer chooses.** Recipient name, email, a message of up to 200 characters, and a send date up to 90 days ahead, timed to the buyer's time zone (`__shopify_offset`).
2. **Or sent to the buyer** to forward or print.
3. **A branded card page.** The page the email links to is the theme's `templates/gift_card.liquid` on shop.jerrycanspirits.co.uk. It escapes the Hydrogen redirect (`{% layout none %}`), so recipients do see it.
4. **A printable card.** The same page prints as A4 landscape, folded once to A5.
5. **No expiry.** Any balance stays on the card.
6. **The Christmas answer.** From the day after the last order date to Christmas Eve, the cut-off line points to the gift card instead.

Amounts: £25, £40, £75, £100 (Dan, 7 Oct 2026). Gift cards count toward free delivery (Shopify's default, unchanged).

## Built in this branch

- `src/lib/gift-card.ts`: Shopify's recipient rules and limits, the cart line attributes, validation, and the basket summary line. Tested in `tests/unit/gift-card.test.ts`.
- `src/lib/shopify.ts`: cart lines now carry `attributes`; `addToCart` takes attributes and surfaces Shopify `userErrors` (for example `GIFT_CARD_RECIPIENT_INVALID`) as `CartUserError`.
- `src/contexts/CartContext.tsx`: `addToCart` passes attributes, resolves true on success, and shows Shopify's own refusal message.
- `src/components/GiftCardForm.tsx`: amount, who it is for, name, email, from, message with a live count, and send date.
- Product page: a product whose Shopify type is `Gift Card` gets the form, and no quick-add bar, cross-sell, features box or shipping line. Its structured data drops shipping and returns and uses the gift card category.
- Basket: a gift card line shows "For Sam, sending 25 December".
- `src/lib/delivery.ts`: `christmasGiftCardLine`, shown by `ChristmasCutoffLine` once the cut-off has passed. It stays silent while `CHRISTMAS_CUTOFF.lastOrderDate` is null.

The code is dormant until the Shopify product is published: a draft product has no page.

## Shopify, to do

1. **Activate gift cards** (Products, Gift cards). Shopify refuses to create a gift card product until this is done.
2. **Create the product** as a draft: title "Jerry Can Spirits Gift Card", handle `jerry-can-spirits-gift-card`, product type `Gift Card`, option Amount with £25, £40, £75 and £100, untracked inventory, the description below. Publish it to the Headless channel only, not Google & YouTube.
3. **Rebuild the card page.** The live `templates/gift_card.liquid` is a Dawn copy whose title and remaining-balance strings were mangled by a theme rewrite (the browser title reads `{{ Here }} gift card for ...`). Replace it with the branded page and print layout. Theme writes to the live theme are blocked for the assistant, so build it in a duplicate theme, preview, then publish or paste.
4. **Restyle the email.** Settings, Notifications, Gift card created (recipient). Paste the branded template.
5. **VAT.** All goods sold are UK standard-rated, so these are likely single-purpose vouchers: VAT is due when the card is sold, not when it is spent. Shopify records gift card sales as untaxed. Confirm the treatment and set up Xero before the first sale.

## Launch checklist

- [ ] Gift cards activated, product created, test card bought with a 100% discount or refunded.
- [ ] Recipient email arrives, scheduled send arrives on the date, card page and print render correctly.
- [ ] Code redeems at checkout, balance shows after part use.
- [ ] Product published to Headless only; listed on the Gift Sets page if Dan wants it there (copy change to the "three ways to give" intro).
- [ ] `CHRISTMAS_CUTOFF.lastOrderDate` set once the date is known; the gift card line then switches on by itself.

## Copy (draft for Dan's approval)

Every line below is new copy. Checked against docs/VOICE.md: no prices, no
em-dashes, no exclamation marks, one call to action per surface, written to
one person. The amounts come from the Shopify variants, never from copy.

### 1. Product (Shopify title and description)

**Title:** Jerry Can Spirits Gift Card

**Description:**

Some people know exactly which bottle they want. This lets them choose it.

Pick the amount. Add their name and a few words of your own. Choose the day it reaches them, up to 90 days ahead, or send it now.

They can spend it on Expedition Spiced Rum, the glassware and bar tools built around its serves, or the Premium Gift Pack.

It never expires. Whatever they do not spend stays on the card.

If you would rather hand it over in person, it prints at home as a folded card with your message inside.

The person you send it to needs to be 18 or over to order.

### 2. Product page form

- Section heading: **Who it is for**
- Choice, first option selected: **Email it to them on a day you choose** / **Send it to me to print or pass on**
- **Their name**
- **Their email**
- **Your name**. Help text: Shown as who it is from.
- **Your message**. Help text: Up to 200 characters. It appears in their email and inside the printed card.
- **Send on**. Help text: Leave it blank to send straight away. Up to 90 days ahead.
- Error, missing email: We need their email address to send it.
- Error, date too far ahead: Choose a date within the next 90 days.
- Basket line, under the item name: For {name}, sending {date} (or: sending now / to you)

### 3. Card page (Shopify, opened from the email)

- Small heading: **Jerry Can Spirits**
- Heading: **{Their name}, this is yours.** (No name: **This gift card is yours.**)
- The message, then: **From {your name}**
- Amount, and remaining balance once part is spent: **{balance} left to spend**
- Code, with **Copy code** and **Print as a card**
- Body: Enter the code at checkout on jerrycanspirits.co.uk. It never expires, and any balance stays on the card.
- The one call to action: **Choose your bottle**
- Footer: For over 18s only. Please enjoy responsibly. drinkaware.co.uk

### 4. Printed card (A4 landscape, folds once to A5)

- **Front:** the logo. Below it: **A gift for {their name}**
- **Inside left:** the message, then **From {your name}**
- **Inside right:** the amount, the code and the QR code. Then: Spend it at jerrycanspirits.co.uk. Enter the code at checkout. It never expires.
- **Back:** Veteran founded. Built properly. Then: For over 18s only. Please enjoy responsibly. drinkaware.co.uk

### 5. Email to the recipient (Shopify notification)

- Subject: **{Your name} has sent you a Jerry Can Spirits gift card**
- Body: Your message, as written. Then: There is {amount} on it to spend at jerrycanspirits.co.uk, on Expedition Spiced Rum or anything built around it. It never expires.
- The one call to action: **Open your gift card**
- Footer: as on the card page

### 6. After the Christmas last order date (banner, switched on by date)

Too late for the post. Not for a gift card. Choose Christmas Day and it arrives that morning.

(Needs the last order date set. Shopify sends a scheduled card within an hour of the start of that day in the recipient's time zone.)
