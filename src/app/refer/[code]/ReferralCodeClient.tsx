'use client'

import { useEffect } from 'react'

export default function ReferralCodeClient({ code }: { code: string }) {
  useEffect(() => {
    try {
      localStorage.setItem('jcs_referral_code', code)
    } catch {
      // localStorage unavailable — non-blocking
    }
  }, [code])

  return (
    <p className="text-3xl font-mono font-bold text-gold-300 tracking-widest select-all">
      {code}
    </p>
  )
}
