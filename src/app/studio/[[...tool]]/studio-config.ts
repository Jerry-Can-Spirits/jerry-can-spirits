'use client'

/**
 * Isolated Sanity Studio configuration - only loaded when studio is accessed
 * This prevents studio dependencies from leaking into the main bundle
 */

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'

// Local imports for studio only
import {apiVersion, dataset, projectId} from '../../../sanity/env'
import {schema} from '../../../sanity/schemaTypes'
import {structure} from '../../../sanity/structure'

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  // Add and edit the content schema in the './sanity/schemaTypes' folder
  schema,
  plugins: [
    structureTool({structure}),
    // Vision is for querying with GROQ from inside the Studio
    // https://www.sanity.io/docs/the-vision-plugin
    visionTool({defaultApiVersion: apiVersion}),
  ],
})