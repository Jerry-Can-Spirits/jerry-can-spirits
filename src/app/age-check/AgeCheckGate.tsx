'use client'

import { useEffect, useState } from 'react'
import AgeGate from '@/components/AgeGate'
import { AGE_COOKIE, AGE_COOKIE_VALUE } from '@/lib/age-gate'

// Renders the existing full-screen AgeGate (copy and design unchanged) on the
// gate route. Two client concerns the server page cannot handle:
//  - Auto-bounce: an already-verified visitor arriving via an external link has
//    the SameSite=Strict cookie withheld from the server request, but JS can
//    still read it — so send them straight on with no re-prompt.
//  - On verification, AgeGate sets the cookie, then we navigate to the original
//    destination (a full navigation so the new cookie is sent).
export default function AgeCheckGate({ returnPath }: { returnPath: string }) {
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (document.cookie.includes(`${AGE_COOKIE}=${AGE_COOKIE_VALUE}`)) {
      window.location.replace(returnPath)
      return
    }
    setChecking(false)
  }, [returnPath])

  if (checking) return null

  return <AgeGate onVerified={() => window.location.assign(returnPath)} />
}
