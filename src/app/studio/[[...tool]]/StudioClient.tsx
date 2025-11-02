'use client'

import { NextStudio } from 'next-sanity/studio'
import type { Config } from 'sanity'

export function StudioClient({ config }: { config: Config }) {
import type { WorkspaceOptions } from 'sanity'

export function StudioClient({ config }: { config: WorkspaceOptions }) {
  return <NextStudio config={config} />
}
