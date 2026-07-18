import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { AGE_COOKIE, isAgeVerified, safeReturnPath } from '@/lib/age-gate'
import AgeCheckGate from './AgeCheckGate'

// The gate is a redirect target, not a destination — keep it out of the index.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function AgeCheckPage({
  searchParams,
}: {
  searchParams: Promise<{ return?: string }>
}) {
  const returnPath = safeReturnPath((await searchParams).return)

  // Same-site fast path: the cookie is on the request, so verification already
  // happened — go straight through with no gate render. (Middleware would
  // normally not send a verified request here at all; this covers direct hits.)
  if (isAgeVerified((await cookies()).get(AGE_COOKIE)?.value)) {
    redirect(returnPath)
  }

  return <AgeCheckGate returnPath={returnPath} />
}
