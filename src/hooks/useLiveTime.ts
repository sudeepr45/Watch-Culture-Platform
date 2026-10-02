import { useEffect, useState } from 'react'
import {
  getCalendarReading,
  getClockReading,
  getMoonReading,
} from '../lib/triComplicationEngine'

function getReading(date: Date) {
  return {
    clock: getClockReading(date),
    ...getMoonReading(date),
    calendar: getCalendarReading(date),
  }
}

export function useLiveTime() {
  const [reading, setReading] = useState(() => getReading(new Date()))

  useEffect(() => {
    let intervalId = 0
    const timeoutId = window.setTimeout(() => {
      setReading(getReading(new Date()))
      intervalId = window.setInterval(() => setReading(getReading(new Date())), 1000)
    }, 1000 - (Date.now() % 1000))

    return () => {
      window.clearTimeout(timeoutId)
      window.clearInterval(intervalId)
    }
  }, [])

  return {
    clock: reading.clock,
    moonPhaseName: reading.phaseName,
    moonDiscRotation: reading.discRotation,
    moonPhase: reading.phase,
    calendar: reading.calendar,
  }
}
