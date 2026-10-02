import { useId, type KeyboardEvent } from 'react'
import { useChronograph } from '../../hooks/useChronograph'
import { getChronographAngles, getTachymeterReading, type CalendarReading, type ClockReading } from '../../lib/triComplicationEngine'
import {
  bigDateWindow,
  C,
  centralHand,
  caseAndBezel,
  makeDialParts,
  moonIlluminationPath,
  polarPoint,
  subDial,
} from './dialParts'

const INK = '#121212'
const MUTED = '#8C877E'
const STEEL = '#334155'
const MOON_CY = 111

interface FinalInstrumentProps {
  clock: ClockReading
  moonPhaseName: string
  moonDiscRotation: number
  moonPhase: number
  calendar: CalendarReading
}

interface PusherProps {
  cx: number
  cy: number
  angle: number
  label: string
  active?: boolean
  disabled?: boolean
  onActivate: () => void
}

function Pusher({ cx, cy, angle, label, active = false, disabled = false, onActivate }: PusherProps) {
  const handleKeyDown = (event: KeyboardEvent<SVGGElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (!disabled) onActivate()
    }
  }
  return (
    <g
      role="button"
      aria-label={label}
      aria-disabled={disabled || undefined}
      tabIndex={0}
      focusable="true"
      opacity={disabled ? 0.48 : 1}
      transform={`translate(${cx} ${cy}) rotate(${angle})`}
      onClick={() => { if (!disabled) onActivate() }}
      onKeyDown={handleKeyDown}
      className="group cursor-pointer focus:outline-none"
    >
      <rect x="-18" y="-18" width="36" height="36" fill="transparent" />
      <path d="M -10 13 Q -11 9 -9 5 L -7 -4 L 7 -4 L 9 5 Q 11 9 10 13 Z" fill="#57534E" stroke={INK} strokeWidth="1" />
      <path d="M -7 11 L -5 -2 L 5 -2 L 7 11 Z" fill="#8C877E" stroke="#57534E" strokeWidth="0.6" />
      <ellipse cx="0" cy="-3" rx="10" ry="5.5" fill="#8C877E" stroke={INK} strokeWidth="0.9" />
      <path d="M -8 -5 Q -9 -8 -8 -15 Q -7 -18 -4 -18 L 4 -18 Q 7 -18 8 -15 L 9 -5 Q 8 -2 5 -2 L -5 -2 Q -8 -2 -8 -5 Z" fill={active ? STEEL : '#E7E5DF'} stroke={INK} strokeWidth="1.1" />
      <path d="M -5 -14 L 5 -14 M -5.5 -11 L 5.5 -11" stroke={active ? '#FAF9F5' : MUTED} strokeWidth="0.7" />
      <rect x="-19" y="-19" width="38" height="38" rx="8" fill="none" stroke={STEEL} strokeWidth="1.6" opacity="0" className="pointer-events-none group-focus-visible:opacity-100" />
    </g>
  )
}

function Crown({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g transform={`translate(${cx} ${cy})`} aria-hidden="true">
      <path d="M -22 -9 L -8 -9 L -8 9 L -22 9 Z" fill="#57534E" stroke={INK} strokeWidth="0.9" />
      <rect x="-13" y="-13" width="21" height="26" rx="4" fill="#8C877E" stroke={INK} strokeWidth="1.1" />
      <rect x="-10" y="-10" width="18" height="20" rx="3" fill="#E7E5DF" stroke="#57534E" strokeWidth="0.6" />
      {[-7, -3, 1, 5].map((x) => <line key={x} x1={x} y1="-8" x2={x} y2="8" stroke="#57534E" strokeWidth="0.8" />)}
      <path d="M 8 -11 Q 18 -11 20 -5 L 20 5 Q 18 11 8 11 Z" fill="#E7E5DF" stroke={INK} strokeWidth="1.1" />
      <path d="M 10 -8 L 16 -6 L 16 6 L 10 8 Z" fill="none" stroke="#8C877E" strokeWidth="0.65" />
    </g>
  )
}

export default function FinalInstrument({ clock, moonPhaseName, moonDiscRotation, moonPhase, calendar }: FinalInstrumentProps) {
  const { elapsedMs, isRunning, start, stop, reset } = useChronograph()
  const { chronoSecondAngle, chronoMinuteAngle, chronoHourAngle } = getChronographAngles(elapsedMs)
  const tachymeterReading = getTachymeterReading(elapsedMs)
  const descriptionId = useId()
  const moonClipId = useId()
  const moonPath = moonIlluminationPath(0, 0, 30, moonPhase)
  const dateString = String(calendar.day).padStart(2, '0')
  const startStopAngle = 60
  const resetAngle = 120
  const startStopPosition = polarPoint(C, C, 229, startStopAngle)
  const resetPosition = polarPoint(C, C, 229, resetAngle)

  return (
    <svg
      className="block h-full w-full"
      viewBox="0 0 520 520"
      role="group"
      aria-labelledby={descriptionId}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title id={descriptionId}>MOJEAN mechanical chronograph and moonphase instrument</title>
      <desc>A circular original watch instrument with live time, a calculated moonphase, calendar date, running seconds and an accessible chronograph.</desc>
      <defs>
        <clipPath id="mojean-dial-surface"><circle cx={C} cy={C} r="160" /></clipPath>
        <clipPath id={moonClipId}><circle cx={C} cy={MOON_CY} r="29.5" /></clipPath>
      </defs>

      {caseAndBezel()}
      {makeDialParts()}

      <g aria-label={`Moon phase: ${moonPhaseName}`}>
        <circle cx={C} cy={MOON_CY} r="34" fill="#57534E" stroke={INK} strokeWidth="0.9" />
        <circle cx={C} cy={MOON_CY} r="31.5" fill="#E7E5DF" stroke="#8C877E" strokeWidth="0.7" />
        <circle cx={C} cy={MOON_CY} r="29.5" fill="#121212" stroke="#57534E" strokeWidth="0.65" />
        <g clipPath={`url(#${moonClipId})`} transform={`rotate(${moonDiscRotation} ${C} ${MOON_CY})`}>
          <circle cx={C} cy={MOON_CY} r="30" fill={STEEL} />
          {moonPath && <path d={moonPath} transform={`translate(${C} ${MOON_CY})`} fill="#FAF9F5" stroke="#FAF9F5" strokeWidth="0.4" />}
          <circle cx={C} cy={MOON_CY} r="30" fill="none" stroke="#57534E" strokeWidth="0.55" />
        </g>
        <text y="153" fill="#121212" fontSize="10.5" fontFamily="var(--font-mono)" letterSpacing="0.3">
          <tspan x={C - 6} textAnchor="end">MOON PHASE</tspan>
          <tspan x={C + 6} textAnchor="start">{moonPhaseName.toUpperCase()}</tspan>
        </text>
      </g>

      <text x={C + 34} y="180" textAnchor="start" fill="#57534E" fontSize="10" fontFamily="var(--font-mono)" letterSpacing="2.2">MOJEAN</text>

      {subDial({ cx: C - 82, cy: C, angle: clock.secondAngle, label: 'RUNNING SEC', kind: 'seconds' })}
      {subDial({ cx: C + 82, cy: C, angle: chronoMinuteAngle, label: 'CHRONO MIN', kind: 'minutes' })}
      {subDial({ cx: C, cy: C + 83, angle: chronoHourAngle, label: 'CHRONO HR', kind: 'hours' })}

      {bigDateWindow(dateString, C, C + 154)}

      <g transform={`translate(${C} ${C}) rotate(${clock.hourAngle})`} aria-hidden="true">
        {centralHand(86, 11, 'hour')}
      </g>
      <g transform={`translate(${C} ${C}) rotate(${clock.minuteAngle})`} aria-hidden="true">
        {centralHand(166, 6, 'minute')}
      </g>
      <g transform={`translate(${C} ${C}) rotate(${chronoSecondAngle})`} aria-hidden="true">
        {centralHand(170, 2.2, 'seconds')}
      </g>
      <circle cx={C} cy={C} r="10" fill="#8C877E" stroke={INK} strokeWidth="0.9" />
      <circle cx={C} cy={C} r="7.2" fill="#E7E5DF" stroke="#57534E" strokeWidth="0.65" />
      <circle cx={C} cy={C} r="2.8" fill="#121212" />

      <text x={C} y="436" textAnchor="middle" fill="#57534E" fontSize="8.5" fontFamily="var(--font-mono)" letterSpacing="0.45">
        {tachymeterReading === null ? 'TACHY · — /HR' : `TACHY · ${tachymeterReading} /HR`}
      </text>

      <Pusher
        cx={startStopPosition.x}
        cy={startStopPosition.y}
        angle={startStopAngle}
        label={isRunning ? 'Stop chronograph' : 'Start chronograph'}
        active={isRunning}
        onActivate={isRunning ? stop : start}
      />
      <Pusher
        cx={resetPosition.x}
        cy={resetPosition.y}
        angle={resetAngle}
        label="Reset chronograph"
        disabled={isRunning}
        onActivate={reset}
      />
      <Crown cx={C + 235} cy={C} />
    </svg>
  )
}
