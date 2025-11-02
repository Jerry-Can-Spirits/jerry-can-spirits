'use client'

import { NextStudio } from 'next-sanity/studio'

export function StudioClient({ config }: { config: any }) {
  return <NextStudio config={config} />
}
