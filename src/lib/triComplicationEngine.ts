export const SYNODIC_MONTH = 29.530588
export const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14, 0)
const DAY_MS = 86_400_000

export interface ClockReading {
  hourAngle: number
  minuteAngle: number
  secondAngle: number
}

export interface CalendarReading {
  weekday: string
  day: number
  month: string
}

export interface MoonReading {
  ageDays: number
  phase: number
  phaseName: string
  discRotation: number
}

const MOON_PHASES = [
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
  'Full Moon',
  'Waning Gibbous',
  'Last Quarter',
  'Waning Crescent',
]

export function getClockReading(date: Date): ClockReading {
  const hours = date.getHours() % 12
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()

  return {
    hourAngle: (hours + minutes / 60) * 30,
    minuteAngle: (minutes + seconds / 60) * 6,
    secondAngle: seconds * 6,
  }
}

export function getCalendarReading(date: Date): CalendarReading {
  return {
    weekday: new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(date),
    day: date.getDate(),
    month: new Intl.DateTimeFormat(undefined, { month: 'long' }).format(date),
  }
}

export function getMoonReading(date: Date): MoonReading {
  const diffDays = (date.getTime() - KNOWN_NEW_MOON) / DAY_MS
  const ageDays = ((diffDays % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH
  const phase = ageDays / SYNODIC_MONTH
  const phaseIndex = Math.round(phase * MOON_PHASES.length) % MOON_PHASES.length

  return {
    ageDays,
    phase,
    phaseName: MOON_PHASES[phaseIndex],
    discRotation: phase * 360,
  }
}

export function getTachymeterReading(elapsedMs: number): number | null {
  const seconds = elapsedMs / 1000
  if (seconds <= 0 || seconds > 60) return null
  return Math.round(3600 / seconds)
}

export function getChronographAngles(elapsedMs: number) {
  const totalSeconds = elapsedMs / 1000
  return {
    chronoSecondAngle: (totalSeconds % 60) * 6,
    chronoMinuteAngle: ((totalSeconds / 60) % 30) * 12,
    chronoHourAngle: ((totalSeconds / 3600) % 12) * 30,
  }
}
