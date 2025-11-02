'use client'

import { NextStudio } from 'next-sanity/studio'
import type { WorkspaceOptions } from 'sanity'

export function StudioClient({ config }: { config: WorkspaceOptions }) {
  return <NextStudio config={config} />
}
