# Pour IQ — Test Invoices for the E2E Run

Three ready-to-render invoices that between them exercise every part of the invoice → costing → variance → accounting pipeline. Net (ex-VAT) line prices, UK suppliers, realistic trade pricing.

## How to turn them into PDFs

1. Open an `.html` file in a browser (double-click, or drag into Chrome/Edge).
2. Print (Ctrl/Cmd+P) → **Destination: Save as PDF** → Save.
3. Upload that PDF in Pour IQ: **Suppliers & invoices → Scan invoice**.

(You can also upload the HTML-rendered screenshot as an image if you'd rather test the image path, but the PDF is the primary flow.)

## Suggested order (and why)

1. **Invoice 1 — Highland & Coast (drinks wholesaler).** Scan this FIRST, before finishing menu pricing. Committing it prices a chunk of your spirits/mixers/beers into the library, so the menu import then auto-matches them — less manual pricing on the menu side.
2. **Invoice 2 — Garden Gate (produce & larder).** Adds the fresh-produce, weight, count and food items — and the allergen-bearing lines (eggs, cream).
3. **Invoice 3 — Highland & Coast reorder (a week later).** A partial reorder with **price rises** on vodka, gin, bourbon and tonic. Scanning this AFTER invoice 1 is what triggers the **price-change detection**, the **cost-change ripple / GP impact**, and the **Price Changes** view. Also gives you a second invoice to push to accounting.

## What each line is designed to test

### Invoice 1 — drinks wholesaler (all 20% VAT)
| Line | Tests |
|---|---|
| Smirnoff Red Vodka 70cl, case of 6 | Common spirit → library match; **case → per-bottle** pack maths |
| Gordon's Gin 70cl, case of 6 | Catalogue auto-match |
| **Archers** Peach Schnapps 70cl | **Brand → generic alias** (should resolve/suggest Peach Schnapps) |
| Jack Daniel's Old No.7 70cl | Brand, catalogue |
| Havana Club Spiced 70cl | **Catalogue 0055 item** (findable) |
| **Everleaf Forest** 50cl | **Alcohol-free** commit path; 50cl (non-70cl) size |
| **Thatchers Gold, 50L keg** | **Cider** type + **keg** pack format (draught; pint via serve unit) |
| **Coca-Cola post-mix, 10L bag-in-box** | **Soft drink** + **bag-in-box / post-mix** awkward format |
| Fever-Tree Tonic 200ml, case of 24 | Mixer; **small bottle × case** maths |
| Franklin & Sons Lemonade 275ml, case of 12 | Mixer; another case format |
| Monin Vanilla Syrup 1L × 2 | **Syrup**; qty > 1; 1L bottle |
| Prosecco 75cl, case of 6 | **Wine** |
| Peroni 330ml, case of 24 × 2 | **Beer**; count/case; qty > 1 |
| Red Bull 250ml, case of 24 | Soft drink / energy |

### Invoice 2 — produce & larder (mixed VAT: mostly zero-rated)
| Line | Tests |
|---|---|
| Lemons, case (~100) | **Produce, count (each)** → per-item yield costing (juice/wheel/wedge) |
| Limes, case (~140) | Produce count |
| Oranges, case (~72) | Produce count |
| Fresh Mint 500g | **Weight (g)** herb / garnish |
| Cucumber, box of 12 | Produce count (slices/ribbons) |
| Caster Sugar, 25kg | **Weight**, bulk (feeds in-house syrups) |
| Table Salt, 1kg | Weight; food |
| Fresh Eggs, tray of 60 | Count; **allergen: egg** (for sours) |
| Double Cream, 2L | **2L** format; **allergen: milk** |
| Maraschino Cherries, 1kg tub | **Garnish**; **tub** pack format |
| Green Olives, 2.5kg tub | Garnish/food; tub |
| Tortilla Chips, 1kg | **Food** |

> Mixed-rate note: most of invoice 2 is zero-rated food, so the per-invoice **Inc/Ex VAT toggle** barely moves the numbers — a deliberate contrast with the all-20% drinks invoices, where the toggle clearly changes the net Δ.

### Invoice 3 — drinks reorder (price rises)
| Line | Change | Tests |
|---|---|---|
| Smirnoff Vodka | £66.00 → £70.20 | **Price change** detection + ripple |
| Gordon's Gin | £69.00 → £73.80 | Price change |
| Jack Daniel's | £96.00 → £102.00 | Price change |
| Fever-Tree Tonic | £16.80 → £18.00 | Price change on a high-use mixer (big ripple) |
| Thatchers Gold keg | unchanged | A line with **no** change (should NOT appear in Price Changes) |

## Coverage checklist (tick as you go)

- [ ] Catalogue auto-match · [ ] Brand→generic alias · [ ] Create-new flow
- [ ] Cider · [ ] Alcohol-free · [ ] Soft drink · [ ] Wine · [ ] Beer · [ ] Syrup · [ ] Food · [ ] Garnish
- [ ] Bottle · [ ] Case · [ ] Keg · [ ] Bag-in-box/post-mix · [ ] 2L · [ ] Small bottle · [ ] Weight (g) · [ ] Count (each) · [ ] Tub
- [ ] Per-item produce yield costing (lemon → juice vs garnish)
- [ ] Allergen-bearing ingredients (egg, milk)
- [ ] Inc/Ex VAT toggle on an all-20% invoice AND a mostly-zero-rated invoice
- [ ] Price-change detection · [ ] Cost-change ripple / GP impact · [ ] Price Changes view
- [ ] Invoice image beside the lines · [ ] Download original PDF · [ ] Delete invoice
- [ ] Accounting push: draft bill in Xero AND/OR QuickBooks with correct supplier, net amounts, VAT
- [ ] "in accounts" / "push failed" list badges

## Notes

- Prices are realistic UK trade nets but not exhaustive — adjust any line if you want to force a particular GP.
- To re-run cleanly, delete the invoices in Pour IQ (the cost-change audit is kept by design; applied prices are not rolled back).
- If you want an even nastier extraction test, print the HTML to PDF at a smaller scale or as a photo, or add more lines to force the truncation banner.
