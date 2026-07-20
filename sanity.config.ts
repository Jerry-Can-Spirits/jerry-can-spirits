'use client'

/**
 * This configuration is used to for the Sanity Studio that’s mounted on the `\src\app\studio\[[...tool]]\page.tsx` route
 */

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import {apiVersion, dataset, projectId} from './src/sanity/env'
import {schema} from './src/sanity/schemaTypes'
import {structure} from './src/sanity/structure'

// Document types that must exist as exactly one instance. The Studio
// structure pins these as a list item; these config hooks block the
// "Create new" affordance from the global + button and remove the
// duplicate/delete actions so an editor can't accidentally fork them.
const SINGLETON_TYPES = new Set(['tradeHelp', 'cartUpsell'])

export default defineConfig({
  // Served at the root of the hosted Studio subdomain (jerrycanspirits.sanity.studio).
  basePath: '/',
  projectId,
  dataset,
  // Add and edit the content schema in the './sanity/schemaTypes' folder
  schema,
  document: {
    newDocumentOptions: (prev, { creationContext }) =>
      creationContext.type === 'global'
        ? prev.filter((opt) => !SINGLETON_TYPES.has(opt.templateId))
        : prev,
    actions: (prev, { schemaType }) =>
      SINGLETON_TYPES.has(schemaType)
        ? prev.filter((a) => !['duplicate', 'delete'].includes(a.action ?? ''))
        : prev,
  },
  plugins: [
    structureTool({structure}),
    // Enabled in the hosted Studio (internal tool) — the bundle reason for
    // gating it to development no longer applies now Studio is out of the worker.
    visionTool({defaultApiVersion: apiVersion}),
  ],
})
