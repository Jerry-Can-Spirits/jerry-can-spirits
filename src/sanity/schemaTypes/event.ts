import { defineField, defineType } from 'sanity'

// Somewhere we will be: a market stall, a fair, a festival, a tasting evening
// at a venue. One document per event; /events/ lists the upcoming ones and
// keeps the recent past underneath. Most are open-entry, so ticketing is off
// by default and only a ticketed event shows a ticket link.
export default defineType({
  name: 'event',
  title: 'Event',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Event name',
      type: 'string',
      description: 'The organiser\'s name for it, e.g. "Hereford Christmas Market".',
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: 'kind',
      title: 'Kind',
      type: 'string',
      options: {
        list: [
          { title: 'Market', value: 'market' },
          { title: 'Fair or show', value: 'fair' },
          { title: 'Festival', value: 'festival' },
          { title: 'Tasting evening', value: 'tasting' },
          { title: 'Other', value: 'other' },
        ],
        layout: 'radio',
      },
      initialValue: 'market',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'startDate',
      title: 'Starts',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'endDate',
      title: 'Ends',
      type: 'datetime',
      description: 'Optional. Set it for a multi-day event or to show a finish time.',
      validation: (Rule) =>
        Rule.custom((end, ctx) => {
          const start = (ctx.document as { startDate?: string } | undefined)?.startDate
          return !end || !start || end >= start ? true : 'Ends before it starts'
        }),
    }),
    defineField({
      name: 'venueName',
      title: 'Venue',
      type: 'string',
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: 'town',
      title: 'Town or city',
      type: 'string',
      validation: (Rule) => Rule.required().max(60),
    }),
    defineField({
      name: 'postcode',
      title: 'Postcode',
      type: 'string',
      description: 'Optional. Used for the map link.',
      validation: (Rule) => Rule.max(10),
    }),
    defineField({
      name: 'summary',
      title: 'What we are doing there',
      type: 'text',
      rows: 3,
      description: 'One or two sentences, e.g. "Our stall is by the cathedral gate. Tastings of Expedition Spiced and bottles to take home."',
      validation: (Rule) => Rule.required().max(300),
    }),
    defineField({
      name: 'eventUrl',
      title: 'Organiser\'s page',
      type: 'url',
      description: 'Optional. The event\'s own website.',
      validation: (Rule) => Rule.uri({ scheme: ['https'] }),
    }),
    defineField({
      name: 'ticketed',
      title: 'Ticketed',
      type: 'boolean',
      description: 'Leave off for open-entry markets and fairs. Turn on for a tasting evening or anything that needs a ticket.',
      initialValue: false,
    }),
    defineField({
      name: 'ticketUrl',
      title: 'Ticket link',
      type: 'url',
      hidden: ({ document }) => !document?.ticketed,
      validation: (Rule) =>
        Rule.uri({ scheme: ['https'] }).custom((url, ctx) =>
          (ctx.document as { ticketed?: boolean } | undefined)?.ticketed && !url ? 'A ticketed event needs a ticket link' : true,
        ),
    }),
    defineField({
      name: 'priceNote',
      title: 'Ticket price',
      type: 'string',
      description: 'As the ticket page states it, e.g. "£25". Leave out anything about how much is poured.',
      hidden: ({ document }) => !document?.ticketed,
      validation: (Rule) => Rule.max(60),
    }),
  ],
  orderings: [{ title: 'Date', name: 'startDate', by: [{ field: 'startDate', direction: 'desc' }] }],
  preview: {
    select: { title: 'title', startDate: 'startDate', town: 'town' },
    prepare: ({ title, startDate, town }) => ({
      title,
      subtitle: [startDate ? new Date(startDate).toLocaleDateString('en-GB') : '', town].filter(Boolean).join(', '),
    }),
  },
})
