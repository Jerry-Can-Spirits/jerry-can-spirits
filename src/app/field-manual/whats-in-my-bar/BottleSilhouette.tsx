import type { VesselType } from '@/lib/bar/types'

// Simple silhouette paths on a 40x110 viewBox. Placeholder art; a designer can
// refine the shapes later without changing this component's contract.
const PATHS: Record<VesselType, string> = {
  spirit: 'M16,4 h8 v8 h1 v7 q7,4 7,15 v65 q0,7 -7,7 h-10 q-7,0 -7,-7 v-65 q0,-11 7,-15 v-7 h1 z',
  wine: 'M17,3 h6 v46 q9,4 9,18 v36 q0,7 -6,7 h-12 q-6,0 -6,-7 v-36 q0,-14 9,-18 v-46 z',
  liqueur: 'M15,10 h10 v12 q8,3 8,13 v57 q0,7 -7,7 h-12 q-7,0 -7,-7 v-57 q0,-10 8,-13 v-12 z',
  carton: 'M8,30 l12,-14 l12,14 v72 q0,4 -4,4 h-16 q-4,0 -4,-4 z',
  can: 'M11,20 h18 q3,0 3,5 v76 q0,5 -5,5 h-14 q-5,0 -5,-5 v-76 q0,-5 3,-5 z',
  dash: 'M17,6 h6 v10 q6,2 6,10 v58 q0,6 -6,6 h-6 q-6,0 -6,-6 v-58 q0,-8 6,-10 z',
}

// Each silhouette bottoms out at a different y in the 0-110 viewBox, so without
// a nudge the shorter-drawn vessels float above the shelf line. These offsets
// (in rendered px, for the h-20 render) drop each vessel's base onto the plank.
const BASELINE: Record<VesselType, number> = {
  spirit: 3,
  wine: 0,
  liqueur: 8,
  carton: 3,
  can: 3,
  dash: 14,
}

export default function BottleSilhouette({ vessel, lit }: { vessel: VesselType; lit: boolean }) {
  return (
    <svg
      viewBox="0 0 40 110"
      className={`h-20 w-auto transition duration-200 ${lit ? 'drop-shadow-[0_0_6px_rgba(255,205,120,0.55)]' : ''}`}
      style={{ transform: `translateY(${BASELINE[vessel]}px)` }}
      aria-hidden="true"
    >
      <path
        d={PATHS[vessel]}
        className={lit ? 'fill-gold-300' : 'fill-jerry-green-900'}
        stroke="rgba(255,255,255,0.10)"
        strokeWidth="0.6"
      />
      <rect x="13.5" y="22" width="3" height="58" rx="1.5" className={lit ? 'fill-white/40' : 'fill-transparent'} />
    </svg>
  )
}
