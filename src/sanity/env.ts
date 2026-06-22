// Sanity project identifiers. These are PUBLIC, non-secret values (they appear
// in every cdn.sanity.io image URL and API request).
//
// Resolution order, so both runtimes work:
//   1. NEXT_PUBLIC_* — inlined by the Next build (the public site / worker).
//   2. SANITY_STUDIO_* — inlined by the Sanity Studio build (`sanity deploy`).
//   3. Hardcoded public default — guarantees the standalone hosted Studio
//      resolves them even when neither prefix is provided at build time.
// Without (3) the hosted Studio threw "Missing environment variable:
// NEXT_PUBLIC_SANITY_DATASET" because the Studio build does not inline the
// NEXT_PUBLIC_* prefix.

export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION ||
  process.env.SANITY_STUDIO_API_VERSION ||
  '2025-09-08'

export const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  process.env.SANITY_STUDIO_DATASET ||
  'production'

export const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
  process.env.SANITY_STUDIO_PROJECT_ID ||
  '5mtjmb0t'
