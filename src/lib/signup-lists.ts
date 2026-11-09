/**
 * The consented Klaviyo lists a visitor can join from the site. The client
 * names one by key; the id is only ever read by the signup route.
 */
export const SIGNUP_LISTS = {
  'first-pour': { id: 'Uu9vFn', source: 'website_newsletter' },
  'advance-party': { id: 'Vz29wp', source: 'website_advance_party' },
} as const
export type SignupList = keyof typeof SIGNUP_LISTS
