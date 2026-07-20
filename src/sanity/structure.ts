import type { StructureResolver } from 'sanity/structure'

// https://www.sanity.io/docs/structure-builder-cheat-sheet
export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      // Pin Pour IQ™ help guide as a singleton at the top of the list.
      S.listItem()
        .title('Pour IQ™ help guide')
        .id('tradeHelp')
        .child(
          S.editor()
            .id('tradeHelp')
            .schemaType('tradeHelp')
            .documentId('tradeHelp'),
        ),
      // Pin the cart upsell pool as a singleton.
      S.listItem()
        .title('Cart upsell pool')
        .id('cartUpsell')
        .child(
          S.editor()
            .id('cartUpsell')
            .schemaType('cartUpsell')
            .documentId('cartUpsell'),
        ),
      S.divider(),
      // Everything else uses the default document-type listing, except the
      // singletons (already surfaced above).
      ...S.documentTypeListItems().filter(
        (listItem) => listItem.getId() !== 'tradeHelp' && listItem.getId() !== 'cartUpsell',
      ),
    ])
