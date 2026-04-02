'use client'

import dynamic from 'next/dynamic'
import type { ExpeditionLogEntry } from '@/lib/d1'

const ExpeditionLogMap = dynamic(() => import('./ExpeditionLogMap'), { ssr: false })

export default function ExpeditionLogMapClient({ entries }: { entries: ExpeditionLogEntry[] }) {
  return <ExpeditionLogMap entries={entries} />
}
