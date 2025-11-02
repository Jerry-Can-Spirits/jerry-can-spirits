'use client'

import { NextStudio } from 'next-sanity/studio'
import type { Config } from 'sanity'

export function StudioClient({ config }: { config: Config }) {
  return <NextStudio config={config} />
}
