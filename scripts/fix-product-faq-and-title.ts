/**
 * One-off, item 6 rulings.
 *
 *  1. improved-whiskey-cocktail metaTitle was 65 characters against a 60
 *     ceiling. Shortened while keeping both keyword-bearing terms.
 *  2. The Expedition Spiced Rum product FAQ asked "Where is it made?", which
 *     invites a production-location answer we do not give. Same ruling as the
 *     /shop/spirits/ FAQ: the question is replaced, not just the answer.
 *  3. A leading space on the first question of the same FAQ array.
 *
 * Run: npx sanity exec scripts/fix-product-faq-and-title.ts --with-user-token
 */
import { getCliClient } from 'sanity/cli'

const client = getCliClient()

const NEW_TITLE = 'Improved Whiskey Cocktail: How It Named the Old Fashioned'
const NEW_Q = 'What goes into Expedition Spiced Rum?'
const NEW_A =
  'A Caribbean white rum base, macerated in small batches by our British partner distillery with seven real spices, two natural sweeteners, and bourbon oak for maturation.'

type Faq = { _key: string; question?: string; answer?: string }

async function main() {
  // 1 — the over-long title
  const cocktails: Array<{ _id: string; metaTitle?: string }> = await client.fetch(
    `*[slug.current == "improved-whiskey-cocktail"]{ _id, metaTitle }`
  )
  for (const doc of cocktails) {
    await client.patch(doc._id).set({ metaTitle: NEW_TITLE }).commit()
    console.log(`title: ${doc._id} -> ${NEW_TITLE.length} chars`)
  }

  // 2 and 3 — the product FAQ
  const products: Array<{ _id: string; faqs?: Faq[] }> = await client.fetch(
    `*[_type == "product" && slug.current == "expedition-spiced-rum"]{ _id, faqs }`
  )
  for (const doc of products) {
    for (const faq of doc.faqs ?? []) {
      if (faq.question === 'Where is it made?') {
        await client
          .patch(doc._id)
          .set({
            [`faqs[_key=="${faq._key}"].question`]: NEW_Q,
            [`faqs[_key=="${faq._key}"].answer`]: NEW_A,
          })
          .commit()
        console.log(`faq: ${doc._id} ${faq._key} question and answer replaced`)
      } else if (faq.question && faq.question !== faq.question.trim()) {
        await client
          .patch(doc._id)
          .set({ [`faqs[_key=="${faq._key}"].question`]: faq.question.trim() })
          .commit()
        console.log(`faq: ${doc._id} ${faq._key} whitespace trimmed`)
      }
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
