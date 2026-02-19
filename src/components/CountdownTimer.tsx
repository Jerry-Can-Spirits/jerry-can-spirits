'use client'

import { useState, useEffect } from 'react'

export default function CountdownTimer() {
  const [timeToLaunch, setTimeToLaunch] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const launchDate = new Date('2026-04-06T00:00:00').getTime()

    const timer = setInterval(() => {
      const now = new Date().getTime()
      const distance = launchDate - now

      if (distance > 0) {
        setTimeToLaunch({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">
      <div className="bg-jerry-green-700/60 rounded-lg p-2 sm:p-3 border border-gold-500/20">
        <div className="text-lg sm:text-2xl font-bold text-gold-300">{timeToLaunch.days}</div>
        <div className="text-[10px] sm:text-xs text-parchment-400 uppercase">Days</div>
      </div>
      <div className="bg-jerry-green-700/60 rounded-lg p-2 sm:p-3 border border-gold-500/20">
        <div className="text-lg sm:text-2xl font-bold text-gold-300">{timeToLaunch.hours}</div>
        <div className="text-[10px] sm:text-xs text-parchment-400 uppercase">Hours</div>
      </div>
      <div className="bg-jerry-green-700/60 rounded-lg p-2 sm:p-3 border border-gold-500/20">
        <div className="text-lg sm:text-2xl font-bold text-gold-300">{timeToLaunch.minutes}</div>
        <div className="text-[10px] sm:text-xs text-parchment-400 uppercase">Mins</div>
      </div>
      <div className="bg-jerry-green-700/60 rounded-lg p-2 sm:p-3 border border-gold-500/20">
        <div className="text-lg sm:text-2xl font-bold text-gold-300">{timeToLaunch.seconds}</div>
        <div className="text-[10px] sm:text-xs text-parchment-400 uppercase">Secs</div>
      </div>
    </div>
  )
}
