export type AmpersandPhase = 'idle' | 'consuming' | 'inverted' | 'reversing'

export const HIDDEN_AMPERSAND_TIMING = {
  impactPauseSeconds: 0.6,
  desktopSpreadSeconds: 12,
  mobileSpreadSeconds: 10.5,
  stillnessSeconds: 2,
  reverseTextSeconds: 2.5,
  reverseHoldSeconds: 1.5,
  reverseInkSeconds: 5.5,
  lineSeconds: 3.5,
  textLineTraceSeconds: 0.8,
  textLineFillSeconds: 2.25,
  textLineTraceLeadSeconds: 0.55,
  ampersandStartAfterTextSeconds: 14,
  ampersandDevelopmentSeconds: 3.2,
  fieldCellCssPixels: 6,
  defaultSeed: 73129,
} as const

const spreadTimes = [0, 0.15, 0.4, 0.8, 1.4, 2.2, 3.2, 4.4, 5.8, 7.2, 8.6, 9.5] as const
const spreadValues = [0, 0.0001, 0.001, 0.008, 0.04, 0.14, 0.31, 0.53, 0.74, 0.9, 0.985, 1] as const

function createPchipSlopes() {
  const slopes = new Float64Array(spreadTimes.length)
  const intervals = new Float64Array(spreadTimes.length - 1)
  const secants = new Float64Array(spreadTimes.length - 1)

  for (let index = 0; index < intervals.length; index += 1) {
    intervals[index] = spreadTimes[index + 1] - spreadTimes[index]
    secants[index] = (spreadValues[index + 1] - spreadValues[index]) / intervals[index]
  }

  // Zero endpoint slopes keep both the impact and final closure stationary.
  slopes[0] = 0
  slopes[slopes.length - 1] = 0
  for (let index = 1; index < slopes.length - 1; index += 1) {
    const previous = secants[index - 1]
    const next = secants[index]
    if (previous <= 0 || next <= 0) {
      slopes[index] = 0
      continue
    }
    const w1 = 2 * intervals[index] + intervals[index - 1]
    const w2 = intervals[index] + 2 * intervals[index - 1]
    slopes[index] = (w1 + w2) / (w1 / previous + w2 / next)
  }
  return slopes
}

const spreadSlopes = createPchipSlopes()

function spreadCoordinate(elapsedSeconds: number, durationSeconds: number) {
  return elapsedSeconds * spreadTimes[spreadTimes.length - 1] / durationSeconds
}

export function coverageAt(elapsedSeconds: number, durationSeconds: number) {
  if (elapsedSeconds <= 0) return 0
  if (elapsedSeconds >= durationSeconds) return 1
  const time = spreadCoordinate(elapsedSeconds, durationSeconds)
  let segment = 0
  while (segment < spreadTimes.length - 2 && time > spreadTimes[segment + 1]) segment += 1
  const h = spreadTimes[segment + 1] - spreadTimes[segment]
  const t = (time - spreadTimes[segment]) / h
  const t2 = t * t
  const t3 = t2 * t
  const h00 = 2 * t3 - 3 * t2 + 1
  const h10 = t3 - 2 * t2 + t
  const h01 = -2 * t3 + 3 * t2
  const h11 = t3 - t2
  const value = h00 * spreadValues[segment]
    + h10 * h * spreadSlopes[segment]
    + h01 * spreadValues[segment + 1]
    + h11 * h * spreadSlopes[segment + 1]
  return Math.max(spreadValues[segment], Math.min(spreadValues[segment + 1], value))
}

export function coverageVelocityAt(elapsedSeconds: number, durationSeconds: number) {
  if (elapsedSeconds <= 0 || elapsedSeconds >= durationSeconds) return 0
  const time = spreadCoordinate(elapsedSeconds, durationSeconds)
  let segment = 0
  while (segment < spreadTimes.length - 2 && time > spreadTimes[segment + 1]) segment += 1
  const h = spreadTimes[segment + 1] - spreadTimes[segment]
  const t = (time - spreadTimes[segment]) / h
  const t2 = t * t
  const derivative = ((6 * t2 - 6 * t) * spreadValues[segment]
    + (3 * t2 - 4 * t + 1) * h * spreadSlopes[segment]
    + (-6 * t2 + 6 * t) * spreadValues[segment + 1]
    + (3 * t2 - 2 * t) * h * spreadSlopes[segment + 1]) / h
  return Math.max(0, derivative * spreadTimes[spreadTimes.length - 1] / durationSeconds)
}
