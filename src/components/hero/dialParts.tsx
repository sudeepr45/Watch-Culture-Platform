import type { ReactNode } from 'react'

export const SIZE = 520
export const C = SIZE / 2
export const CASE_R = 232
export const DIAL_R = 188

interface Point {
  x: number
  y: number
}

export function polarPoint(cx: number, cy: number, radius: number, angle: number): Point {
  const radians = ((angle - 90) * Math.PI) / 180
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) }
}

function caseLugs(): ReactNode {
  return (
    <g strokeLinejoin="round" aria-hidden="true">
      <g fill="#57534E" stroke="#121212" strokeWidth="1.5" transform="translate(0 3)">
        <path d="M 207 73 Q 195 65 193 53 L 197 17 Q 198 10 205 10 L 228 10 Q 234 11 238 19 L 255 52 Q 260 63 251 75 L 242 86 Q 225 83 207 73 Z" />
        <path d="M 313 73 Q 325 65 327 53 L 323 17 Q 322 10 315 10 L 292 10 Q 286 11 282 19 L 265 52 Q 260 63 269 75 L 278 86 Q 295 83 313 73 Z" />
        <path d="M 207 447 Q 195 455 193 467 L 197 503 Q 198 510 205 510 L 228 510 Q 234 509 238 501 L 255 468 Q 260 457 251 445 L 242 434 Q 225 437 207 447 Z" />
        <path d="M 313 447 Q 325 455 327 467 L 323 503 Q 322 510 315 510 L 292 510 Q 286 509 282 501 L 265 468 Q 260 457 269 445 L 278 434 Q 295 437 313 447 Z" />
      </g>
      <g fill="#E7E5DF" stroke="#121212" strokeWidth="1.45">
        <path d="M 207 73 Q 195 65 193 53 L 197 17 Q 198 10 205 10 L 228 10 Q 234 11 238 19 L 255 52 Q 260 63 251 75 L 242 86 Q 225 83 207 73 Z" />
        <path d="M 313 73 Q 325 65 327 53 L 323 17 Q 322 10 315 10 L 292 10 Q 286 11 282 19 L 265 52 Q 260 63 269 75 L 278 86 Q 295 83 313 73 Z" />
        <path d="M 207 447 Q 195 455 193 467 L 197 503 Q 198 510 205 510 L 228 510 Q 234 509 238 501 L 255 468 Q 260 457 251 445 L 242 434 Q 225 437 207 447 Z" />
        <path d="M 313 447 Q 325 455 327 467 L 323 503 Q 322 510 315 510 L 292 510 Q 286 509 282 501 L 265 468 Q 260 457 269 445 L 278 434 Q 295 437 313 447 Z" />
      </g>
      <g fill="none" stroke="#FAF9F5" strokeWidth="1.1" opacity="0.9">
        <path d="M 205 55 L 208 19 Q 209 16 213 16 L 228 16 Q 231 16 233 21 L 248 53" />
        <path d="M 315 55 L 312 19 Q 311 16 307 16 L 292 16 Q 289 16 287 21 L 272 53" />
        <path d="M 205 465 L 208 501 Q 209 504 213 504 L 228 504 Q 231 504 233 499 L 248 467" />
        <path d="M 315 465 L 312 501 Q 311 504 307 504 L 292 504 Q 289 504 287 499 L 272 467" />
      </g>
      <g fill="none" stroke="#8C877E" strokeWidth="0.65">
        <path d="M 210 63 Q 224 71 239 74" /><path d="M 310 63 Q 296 71 281 74" />
        <path d="M 210 457 Q 224 449 239 446" /><path d="M 310 457 Q 296 449 281 446" />
      </g>
      <g fill="#8C877E" opacity="0.85">
        <path d="M 239 71 L 251 62 L 247 73 L 240 81 Z" />
        <path d="M 281 71 L 269 62 L 273 73 L 280 81 Z" />
        <path d="M 239 449 L 251 458 L 247 447 L 240 439 Z" />
        <path d="M 281 449 L 269 458 L 273 447 L 280 439 Z" />
      </g>
    </g>
  )
}

export function caseAndBezel(): ReactNode {
  return (
    <g aria-hidden="true">
      {caseLugs()}
      <circle cx={C} cy={C} r="232" fill="#8C877E" stroke="#121212" strokeWidth="2.3" />
      <circle cx={C} cy={C} r="228" fill="none" stroke="#57534E" strokeWidth="1.3" />
      <circle cx={C} cy={C} r="222" fill="#E7E5DF" stroke="#121212" strokeWidth="1.1" />
      <circle cx={C} cy={C} r="218" fill="none" stroke="#FAF9F5" strokeWidth="1.1" />
      <circle cx={C} cy={C} r="210" fill="#F3F1EA" stroke="#8C877E" strokeWidth="0.9" />
      <circle cx={C} cy={C} r="200" fill="#E7E5DF" stroke="#8C877E" strokeWidth="0.7" />
      <circle cx={C} cy={C} r={DIAL_R} fill="#FAF9F5" stroke="#121212" strokeWidth="1.1" />
      <g clipPath="url(#mojean-dial-surface)" aria-hidden="true">
        {Array.from({ length: 180 }, (_, index) => {
          const angle = index * 2
          const inner = polarPoint(C, C, 10, angle)
          const outer = polarPoint(C, C, 160, angle)
          return <line key={index} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#8C877E" strokeWidth="0.42" opacity="0.13" />
        })}
        <circle cx={C} cy={C} r="160" fill="none" stroke="#8C877E" strokeWidth="0.5" opacity="0.16" />
      </g>
      <circle cx={C} cy={C} r="188" fill="none" stroke="#57534E" strokeWidth="0.9" />
    </g>
  )
}

export function tachymeterRing(cx: number, cy: number): ReactNode {
  const labeledValues = [60, 80, 100, 120, 160, 200, 300, 500]
  const values = Array.from({ length: 23 }, (_, index) => 60 + index * 20)
  return (
    <g aria-label="Tachymeter scale">
      {values.map((value) => {
        const angle = (3600 / value) * 6
        const major = labeledValues.includes(value)
        const outer = polarPoint(cx, cy, 209, angle)
        const inner = polarPoint(cx, cy, major ? 198 : 203, angle)
        const label = polarPoint(cx, cy, 193, angle)
        return (
          <g key={value}>
            <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={major ? '#121212' : '#8C877E'} strokeWidth={major ? 0.9 : 0.5} />
            {major && (
              <text x={label.x} y={label.y} fill="#121212" fontSize="8" fontFamily="var(--font-mono)" textAnchor="middle" dominantBaseline="central">
                {value}
              </text>
            )}
          </g>
        )
      })}
    </g>
  )
}

export function chapterRing(cx: number, cy: number): ReactNode {
  return (
    <g aria-label="60-minute chapter ring">
      <circle cx={cx} cy={cy} r="176" fill="none" stroke="#8C877E" strokeWidth="0.9" />
      <circle cx={cx} cy={cy} r="161" fill="none" stroke="#57534E" strokeWidth="0.45" />
      {Array.from({ length: 60 }, (_, index) => {
        const major = index % 5 === 0
        const angle = index * 6
        const outer = polarPoint(cx, cy, 174, angle)
        const inner = polarPoint(cx, cy, major ? 162 : 168, angle)
        return <line key={index} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={major ? '#121212' : '#57534E'} strokeWidth={major ? 1.45 : 0.55} />
      })}
    </g>
  )
}

export function hourMarkers(cx: number, cy: number): ReactNode {
  return (
    <g aria-label="Hour markers">
      {Array.from({ length: 12 }, (_, index) => {
        const hour = index
        if (hour === 0 || hour === 6) return null
        const major = hour === 3 || hour === 9
        const inner = major ? 146 : 151
        const outer = major ? 162 : 160
        return (
          <g key={hour} transform={`translate(${cx} ${cy}) rotate(${hour * 30})`}>
            <path d={`M -3.2 ${-outer + 1} L 3.2 ${-outer + 1} L 3.2 ${-inner + 2} L -3.2 ${-inner + 2} Z`} fill="#57534E" />
            <path d={`M -3 ${-outer} L 2.4 ${-outer} L 1.8 ${-inner} L -2.3 ${-inner} Z`} fill={major ? '#121212' : '#334155'} />
            <path d={`M -2 ${-(outer - 1.4)} L 1.3 ${-(outer - 1.4)} L 0.8 ${-(inner + 1.2)} L -1.3 ${-(inner + 1.2)} Z`} fill="#E7E5DF" opacity="0.9" />
          </g>
        )
      })}
    </g>
  )
}

interface SubDialProps {
  cx: number
  cy: number
  angle: number
  label: string
  kind: 'seconds' | 'minutes' | 'hours'
}

export function subDial({ cx, cy, angle, label, kind }: SubDialProps): ReactNode {
  const radius = 39
  const count = kind === 'seconds' ? 60 : kind === 'minutes' ? 30 : 12
  const labelValues = kind === 'seconds' ? [0, 15, 30, 45] : kind === 'minutes' ? [0, 5, 10, 15, 20, 25] : [0, 3, 6, 9]
  return (
    <g aria-label={`${label} register`}>
      <circle cx={cx} cy={cy} r={radius} fill="#8C877E" stroke="#121212" strokeWidth="1.05" />
      <circle cx={cx} cy={cy} r="36.5" fill="#57534E" />
      <circle cx={cx} cy={cy} r="35" fill="#E7E5DF" stroke="#FAF9F5" strokeWidth="0.7" />
      <circle cx={cx} cy={cy} r="31.5" fill="#F3F1EA" stroke="#8C877E" strokeWidth="0.6" />
      <circle cx={cx} cy={cy} r="29" fill="none" stroke="#FAF9F5" strokeWidth="0.45" />
      {Array.from({ length: count }, (_, index) => {
        const majorEvery = kind === 'seconds' ? 5 : kind === 'minutes' ? 5 : 1
        const major = index % majorEvery === 0
        const tickAngle = index * (360 / count)
        const outer = polarPoint(cx, cy, 34, tickAngle)
        const inner = polarPoint(cx, cy, major ? 27 : 30.5, tickAngle)
        return <line key={index} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="#121212" strokeWidth={major ? 0.9 : 0.45} />
      })}
      {labelValues.map((value) => {
        const denominator = kind === 'seconds' ? 60 : kind === 'minutes' ? 30 : 12
        const point = polarPoint(cx, cy, 22, (value / denominator) * 360)
        return <text key={value} x={point.x} y={point.y} fill="#57534E" fontSize="9.5" fontFamily="var(--font-mono)" textAnchor="middle" dominantBaseline="central">{value}</text>
      })}
      <g transform={`translate(${cx} ${cy}) rotate(${angle})`}>
        <path d="M 0 -24 L 1.5 -4 L 0 2 L -1.5 -4 Z" fill="#121212" stroke="#121212" strokeWidth="0.45" strokeLinejoin="round" />
      </g>
      <circle cx={cx} cy={cy} r="3.2" fill="#57534E" stroke="#121212" strokeWidth="0.45" />
      <circle cx={cx} cy={cy} r="1.35" fill="#E7E5DF" />
      <text x={cx} y={cy + 51} textAnchor="middle" fill="#121212" fontSize="9.5" fontFamily="var(--font-mono)" letterSpacing="0.35">{label}</text>
    </g>
  )
}

export function bigDateWindow(day: string, cx: number, cy: number): ReactNode {
  const digits = day.padStart(2, '0').slice(-2)
  const aperture = `M ${cx - 25} ${cy - 12} L ${cx + 25} ${cy - 12} L ${cx + 28} ${cy - 9} L ${cx + 28} ${cy + 9} L ${cx + 25} ${cy + 12} L ${cx - 25} ${cy + 12} L ${cx - 28} ${cy + 9} L ${cx - 28} ${cy - 9} Z`
  return (
    <g aria-label={`Date ${digits}`}>
      <path d={aperture} transform="translate(0 1.4)" fill="#57534E" stroke="#121212" strokeWidth="1" />
      <path d={aperture} fill="#E7E5DF" stroke="#121212" strokeWidth="0.8" />
      <path d={`M ${cx - 23} ${cy - 8.5} L ${cx - 2} ${cy - 8.5} L ${cx - 2} ${cy + 8.5} L ${cx - 23} ${cy + 8.5} Z`} fill="#F3F1EA" stroke="#8C877E" strokeWidth="0.5" />
      <path d={`M ${cx + 2} ${cy - 8.5} L ${cx + 23} ${cy - 8.5} L ${cx + 23} ${cy + 8.5} L ${cx + 2} ${cy + 8.5} Z`} fill="#F3F1EA" stroke="#8C877E" strokeWidth="0.5" />
      <line x1={cx} y1={cy - 9} x2={cx} y2={cy + 9} stroke="#57534E" strokeWidth="0.7" />
      <text x={cx - 12.5} y={cy + 5.5} textAnchor="middle" fill="#121212" fontSize="15" fontFamily="var(--font-sans)" fontWeight="500">{digits[0]}</text>
      <text x={cx + 12.5} y={cy + 5.5} textAnchor="middle" fill="#121212" fontSize="15" fontFamily="var(--font-sans)" fontWeight="500">{digits[1]}</text>
    </g>
  )
}

export function centralHand(length: number, width: number, kind: 'hour' | 'minute' | 'seconds'): ReactNode {
  if (kind === 'seconds') {
    return (
      <g>
        <path d={`M 0 ${-length} L ${width * 0.72} ${-length + 11} L ${width * 0.58} -7 L 0 -4 L ${-width * 0.58} -7 L ${-width * 0.72} ${-length + 11} Z`} fill="#121212" stroke="#121212" strokeWidth="0.42" strokeLinejoin="round" />
        <path d="M 0 5 L 1.2 13 L 0 19 L -1.2 13 Z" fill="#121212" stroke="#121212" strokeWidth="0.4" />
      </g>
    )
  }
  const shoulder = kind === 'hour' ? length * 0.62 : length * 0.77
  const tipWidth = kind === 'hour' ? width * 0.3 : width * 0.16
  const handPath = `M 0 ${-length} L ${tipWidth} ${-length + 12} L ${width * 0.5} ${-shoulder} L ${width * 0.62} -13 L ${width * 0.72} -5 L ${width * 0.82} 0 L ${-width * 0.82} 0 L ${-width * 0.72} -5 L ${-width * 0.62} -13 L ${-width * 0.5} ${-shoulder} L ${-tipWidth} ${-length + 12} Z`
  return (
    <g>
      <path d={handPath} transform="translate(1.2 1.5)" fill="#57534E" />
      <path d={handPath} fill="#121212" stroke="#121212" strokeWidth="0.5" strokeLinejoin="round" />
    </g>
  )
}

export function moonIlluminationPath(cx: number, cy: number, radius: number, phase: number): string {
  const fraction = ((phase % 1) + 1) % 1
  if (fraction < 0.015 || fraction > 0.985) return ''
  if (Math.abs(fraction - 0.5) < 0.015) {
    return `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy + radius} A ${radius} ${radius} 0 1 1 ${cx} ${cy - radius} Z`
  }
  const waxing = fraction < 0.5
  const terminator = waxing ? Math.cos(fraction * Math.PI * 2) : -Math.cos(fraction * Math.PI * 2)
  const points: Point[] = []
  for (let index = 0; index <= 40; index += 1) {
    const angle = waxing ? -Math.PI / 2 + (index / 40) * Math.PI : -Math.PI / 2 - (index / 40) * Math.PI
    points.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius })
  }
  for (let index = 40; index >= 0; index -= 1) {
    const angle = (index / 40) * Math.PI
    points.push({ x: cx + terminator * Math.sin(angle) * radius, y: cy - Math.cos(angle) * radius })
  }
  return `${points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ')} Z`
}

export function makeDialParts(): ReactNode {
  return (
    <>
      {tachymeterRing(C, C)}
      {chapterRing(C, C)}
      {hourMarkers(C, C)}
    </>
  )
}
