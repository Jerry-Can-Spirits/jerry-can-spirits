import { defineField, defineType } from 'sanity'

/**
 * A named human the site can attribute work to.
 *
 * This is the canonical, editable source for the people who appear in the
 * site's structured data. The Organization node references these by @id
 * (`/about/team/<slug>/#person`) for `founder`, and guide Articles reference
 * them for `author`, so the same person is one entity across the whole graph
 * rather than a name repeated in a dozen places.
 *
 * The slug MUST match the team page path, because that is what the @id is
 * built from. Changing a slug changes the entity's identity.
 */
export default defineType({
  name: 'person',
  title: 'Person',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Full name',
      type: 'string',
      description: 'As it should appear in a byline, e.g. "Dan Freeman".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description:
        'Must match the team page path: /about/team/<slug>/. The structured-data identity is built from this, so changing it changes who the entity is.',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      description: 'Job title, e.g. "Founder & Director". Emitted as jobTitle.',
    }),
    defineField({
      name: 'credentials',
      title: 'Credentials',
      type: 'array',
      of: [{ type: 'string' }],
      description:
        'Qualifications or experience that establish authority on what this person writes about, one per entry. Emitted as hasCredential. Only verifiable facts.',
    }),
    defineField({
      name: 'knowsAbout',
      title: 'Knows about',
      type: 'array',
      of: [{ type: 'string' }],
      description:
        'Subjects this person can credibly write on, e.g. "Rum", "Cocktail technique". Emitted as knowsAbout.',
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'text',
      rows: 4,
      description:
        'Short third-person biography for the byline and structured data. Emitted as description.',
    }),
    defineField({
      name: 'image',
      title: 'Photograph',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          description: 'Describe the person, not the setting.',
        }),
      ],
    }),
    defineField({
      name: 'sameAs',
      title: 'Same as (profile URLs)',
      type: 'array',
      of: [{ type: 'url' }],
      description:
        'Full URLs to other profiles that are unambiguously this person: LinkedIn, an author page elsewhere, a personal site. These are how a search engine reconciles this entity with the same person on other sites, so only add ones you control or can verify.',
    }),
    defineField({
      name: 'alumniOf',
      title: 'Alumni of',
      type: 'string',
      description:
        'Organisation served with or studied at, e.g. "Royal Corps of Signals, British Army". A separate organisation from Jerry Can Spirits.',
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'role', media: 'image' },
  },
})
