import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react'
import type { AmpersandOrigin } from './BrandLogo'
import LiquidInkRenderer, { type LiquidInkRendererHandle } from './LiquidInkRenderer'
import { coverageAt, coverageVelocityAt, HIDDEN_AMPERSAND_TIMING, type AmpersandPhase } from './hiddenAmpersandTiming'

interface Props {
  phase: AmpersandPhase
  origin: AmpersandOrigin
  exitOrigin: AmpersandOrigin | null
  reducedMotion: boolean
  onInverted: () => void
  onReversed: () => void
  onExit: (origin: AmpersandOrigin) => void
}

const burgundy = '#39070D'
const statement = ['The movement will', 'outlive the person', 'who winds it.']

function eventOrigin(event: MouseEvent<HTMLButtonElement>): AmpersandOrigin {
  const rect = event.currentTarget.getBoundingClientRect()
  const pointerActivation = event.detail > 0
  return {
    x: (pointerActivation ? event.clientX : rect.left + rect.width / 2) / window.innerWidth,
    y: (pointerActivation ? event.clientY : rect.top + rect.height / 2) / window.innerHeight,
  }
}

function ease(value: number) {
  const p = Math.max(0, Math.min(1, value))
  return p * p * (3 - 2 * p)
}

function inkPath(progress: number, width: number, height: number, time: number) {
  if (progress <= 0) return `M 0 ${height} L ${width} ${height} L ${width} ${height} L 0 ${height} Z`
  if (progress >= 1) return `M 0 0 L ${width} 0 L ${width} ${height} L 0 ${height} Z`

  const edgeY = height * (1 - progress)
  const points = 96
  let path = `M 0 ${height} L 0 ${edgeY}`
  for (let index = 0; index <= points; index += 1) {
    const x = (width * index) / points
    const broad = Math.sin(index * 0.18 + time * 0.7) * height * 0.012
      + Math.sin(index * 0.047 - time * 0.31) * height * 0.009
    const fibres = Math.sin(index * 1.9 + time * 0.22) * height * 0.0016
    const pooling = Math.max(0, Math.sin(index * 0.083 + 1.2)) * height * 0.006
    path += ` L ${x} ${Math.max(0, Math.min(height, edgeY + broad + fibres - pooling))}`
  }
  return `${path} L ${width} ${height} Z`
}

function inkEdgePath(progress: number, width: number, height: number, time: number) {
  const edgeY = height * (1 - progress)
  const points = 96
  let path = `M 0 ${edgeY}`
  for (let index = 0; index <= points; index += 1) {
    const x = (width * index) / points
    const broad = Math.sin(index * 0.18 + time * 0.7) * height * 0.012
      + Math.sin(index * 0.047 - time * 0.31) * height * 0.009
    const fibres = Math.sin(index * 1.9 + time * 0.22) * height * 0.0016
    const pooling = Math.max(0, Math.sin(index * 0.083 + 1.2)) * height * 0.006
    path += ` L ${x} ${Math.max(0, Math.min(height, edgeY + broad + fibres - pooling))}`
  }
  return path
}

export default function HiddenAmpersandExperience({
  phase, origin, exitOrigin, reducedMotion, onInverted, onReversed, onExit,
}: Props) {
  const inkRef = useRef<SVGPathElement>(null)
  const wetEdgeRef = useRef<SVGPathElement>(null)
  const islandRefs = useRef<Array<SVGEllipseElement | null>>([])
  const progressRef = useRef(0)
  const edgeTimeRef = useRef(0)
  const velocityRef = useRef(0)
  const frameTimeRef = useRef(0)
  const revealsRef = useRef({ fills: [0, 0, 0, 0, 0], traces: [0, 0, 0, 0, 0], ampersand: 0 })
  const rafRef = useRef(0)
  const phaseRef = useRef(phase)
  const rendererRef = useRef<LiquidInkRendererHandle>(null)
  const webglAvailableRef = useRef(false)
  const [webglAvailable, setWebglAvailable] = useState(false)
  const lineRefs = useRef<Array<HTMLSpanElement | null>>([])
  const traceRefs = useRef<Array<HTMLSpanElement | null>>([])
  const ampRef = useRef<HTMLButtonElement>(null)
  const katanaRef = useRef<SVGSVGElement>(null)

  const handleRendererAvailability = useCallback((available: boolean) => {
    webglAvailableRef.current = available
    setWebglAvailable(available)
  }, [])

  useEffect(() => {
    phaseRef.current = phase
    if (phase === 'idle' || phase === 'inverted') return
    const spreadDuration = window.innerWidth < 700
      ? HIDDEN_AMPERSAND_TIMING.mobileSpreadSeconds
      : HIDDEN_AMPERSAND_TIMING.desktopSpreadSeconds
    const textStartTime = HIDDEN_AMPERSAND_TIMING.impactPauseSeconds + spreadDuration + HIDDEN_AMPERSAND_TIMING.stillnessSeconds
    const ampersandStartTime = textStartTime + HIDDEN_AMPERSAND_TIMING.ampersandStartAfterTextSeconds
    const updateInk = (
      progress: number,
      time: number,
      revealTime: number | null = time,
      edgeTime = time,
      velocity = 0,
      frameTime = performance.now(),
      exitProgress: number | null = null,
    ) => {
      progressRef.current = Math.max(0, Math.min(1, progress))
      edgeTimeRef.current = edgeTime
      velocityRef.current = velocity
      frameTimeRef.current = frameTime
      if (!webglAvailableRef.current) {
        const width = window.innerWidth
        const height = window.innerHeight
        const path = inkPath(progressRef.current, width, height, edgeTime)
        inkRef.current?.setAttribute('d', path)
        wetEdgeRef.current?.setAttribute('d', inkEdgePath(progressRef.current, width, height, edgeTime))
        wetEdgeRef.current?.setAttribute('opacity', progressRef.current >= 0.99999 ? '0' : '0.42')
        const edgeY = height * (1 - progressRef.current)
        for (let index = 0; index < islandRefs.current.length; index += 1) {
          const island = islandRefs.current[index]
          if (!island) continue
          island.setAttribute('cx', String(width * [0.17, 0.43, 0.69, 0.88][index]))
          const lift = height * (0.018 + ((index * 7) % 3) * 0.009)
          island.setAttribute('cy', String(Math.max(0, edgeY - lift)))
          island.setAttribute('rx', String(width * (0.008 + (index % 2) * 0.004)))
          island.setAttribute('ry', String(height * (0.009 + (index % 3) * 0.005)))
          island.setAttribute('opacity', String(Math.max(0, Math.min(0.86, (progressRef.current - 0.04) * 1.8))))
        }
      }
      rendererRef.current?.draw(progressRef.current, velocity, frameTime, exitProgress)
      if (revealTime !== null) {
        const signatureLineTime = revealTime - textStartTime - 3 * HIDDEN_AMPERSAND_TIMING.lineSeconds
        for (let index = 0; index < lineRefs.current.length; index += 1) {
          const line = lineRefs.current[index]
          if (!line) continue
          let lineTime: number
          let traceDuration: number
          let fillDuration: number
          let fillLead = HIDDEN_AMPERSAND_TIMING.textLineTraceSeconds * 0.6875

          if (index < statement.length) {
            lineTime = revealTime - textStartTime - index * HIDDEN_AMPERSAND_TIMING.lineSeconds
            traceDuration = HIDDEN_AMPERSAND_TIMING.textLineTraceSeconds
            fillDuration = HIDDEN_AMPERSAND_TIMING.textLineFillSeconds
          } else if (index === statement.length) {
            lineTime = signatureLineTime
            traceDuration = 0.4
            fillDuration = 0.7
            fillLead = 0
          } else {
            lineTime = signatureLineTime - 0.7
            traceDuration = 0.6
            fillDuration = 1.25
            fillLead = 0
          }

          const fullTraceAmount = ease(lineTime / traceDuration)
          const fillAmount = ease((lineTime - fillLead) / fillDuration)
          const traceAmount = fullTraceAmount * (1 - fillAmount)
          revealsRef.current.fills[index] = fillAmount
          revealsRef.current.traces[index] = fullTraceAmount
          line.style.setProperty('--line-reveal', `${fillAmount * 100}%`)
          traceRefs.current[index]?.style.setProperty('--line-trace', `${traceAmount * 100}%`)
          if (index === 4 && fillAmount >= 1) katanaRef.current?.classList.add('is-drawn')
        }
        const ampAmount = ease((revealTime - ampersandStartTime) / HIDDEN_AMPERSAND_TIMING.ampersandDevelopmentSeconds)
        revealsRef.current.ampersand = ampAmount
        if (ampRef.current) ampRef.current.style.setProperty('--amp-reveal', `${ampAmount * 100}%`)
      }
    }

    if (reducedMotion) {
      updateInk(phase === 'reversing' ? 0 : 1, HIDDEN_AMPERSAND_TIMING.impactPauseSeconds + HIDDEN_AMPERSAND_TIMING.desktopSpreadSeconds + HIDDEN_AMPERSAND_TIMING.stillnessSeconds, phase === 'reversing' ? null : 100, HIDDEN_AMPERSAND_TIMING.desktopSpreadSeconds, 0, performance.now())
      if (phase === 'reversing') onReversed()
      else if (phase === 'consuming') onInverted()
      return
    }

    let startedAt = performance.now()
    let cancelled = false
    let useIvoryExit = phase === 'reversing' && exitOrigin !== null && webglAvailableRef.current && !reducedMotion
    let contextLossFallback = false
    let contextLossStartedAt = 0
    let contextLossCoverage = 1
    let contextLossSnapshot = {
      fills: [...revealsRef.current.fills],
      traces: [...revealsRef.current.traces],
      ampersand: revealsRef.current.ampersand,
    }
    const initialProgress = progressRef.current
    const total = ampersandStartTime + HIDDEN_AMPERSAND_TIMING.ampersandDevelopmentSeconds
    const initialEdgeTime = edgeTimeRef.current
    const revealSnapshot = {
      fills: [...revealsRef.current.fills],
      traces: [...revealsRef.current.traces],
      ampersand: revealsRef.current.ampersand,
    }
    let hiddenAt: number | null = document.hidden ? startedAt : null
    const handleVisibilityChange = () => {
      const now = performance.now()
      if (document.hidden) hiddenAt = now
      else if (hiddenAt !== null) {
        startedAt += now - hiddenAt
        hiddenAt = null
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    const beginContextLossFallback = (time: number) => {
      contextLossFallback = true
      contextLossStartedAt = time
      contextLossCoverage = progressRef.current
      contextLossSnapshot = {
        fills: [...revealsRef.current.fills],
        traces: [...revealsRef.current.traces],
        ampersand: revealsRef.current.ampersand,
      }
      useIvoryExit = false
    }

    const frame = (now: number) => {
      const elapsed = ((hiddenAt ?? now) - startedAt) / 1000
      if (phaseRef.current === 'reversing' && exitOrigin && useIvoryExit && !webglAvailableRef.current) {
        beginContextLossFallback(now)
      }
      if (phaseRef.current === 'consuming') {
        const spreadElapsed = elapsed - HIDDEN_AMPERSAND_TIMING.impactPauseSeconds
        const impactCoverage = HIDDEN_AMPERSAND_TIMING.initialImpactCoverage
        const impactPosition = Math.max(0, Math.min(1, elapsed / HIDDEN_AMPERSAND_TIMING.impactContactSeconds))
        const impactProgress = impactCoverage * ease(impactPosition)
        const progress = spreadElapsed < 0
          ? impactProgress
          : impactCoverage + (1 - impactCoverage) * coverageAt(spreadElapsed, spreadDuration)
        const velocity = spreadElapsed < 0
          ? impactCoverage * 6 * impactPosition * (1 - impactPosition) / HIDDEN_AMPERSAND_TIMING.impactContactSeconds
          : (1 - impactCoverage) * coverageVelocityAt(spreadElapsed, spreadDuration)
        const edgeTime = Math.max(0, Math.min(spreadElapsed, spreadDuration))
        updateInk(progress, elapsed, elapsed, edgeTime, velocity, now)
        if (elapsed >= total) {
          updateInk(1, elapsed, elapsed, spreadDuration, 0, now)
          lineRefs.current.forEach((line) => line?.style.setProperty('--line-reveal', '100%'))
          traceRefs.current.forEach((trace) => trace?.style.setProperty('--line-trace', '0%'))
          revealsRef.current.fills.fill(1)
          ampRef.current?.style.setProperty('--amp-reveal', '100%')
          revealsRef.current.ampersand = 1
          onInverted()
          return
        }
      } else if (phaseRef.current === 'reversing') {
        if (contextLossFallback) {
          const fallbackDuration = 1.5
          const fallbackProgress = ease((now - contextLossStartedAt) / (fallbackDuration * 1000))
          for (let index = 0; index < lineRefs.current.length; index += 1) {
            const fill = contextLossSnapshot.fills[index] * (1 - fallbackProgress)
            const trace = contextLossSnapshot.traces[index] * (1 - fallbackProgress)
            lineRefs.current[index]?.style.setProperty('--line-reveal', `${fill * 100}%`)
            traceRefs.current[index]?.style.setProperty('--line-trace', `${trace * 100}%`)
            revealsRef.current.fills[index] = fill
            revealsRef.current.traces[index] = trace
          }
          const ampReveal = contextLossSnapshot.ampersand * (1 - fallbackProgress)
          revealsRef.current.ampersand = ampReveal
          ampRef.current?.style.setProperty('--amp-reveal', `${ampReveal * 100}%`)
          updateInk(contextLossCoverage * (1 - fallbackProgress), elapsed, null, initialEdgeTime + fallbackProgress * fallbackDuration, 0, now)
          if (fallbackProgress >= 1) {
            updateInk(0, elapsed, 0, 0, 0, now)
            onReversed()
            return
          }
          rafRef.current = requestAnimationFrame(frame)
          return
        }
        const hasDevelopedText = revealSnapshot.fills.some((value) => value > 0)
          || revealSnapshot.traces.some((value) => value > 0)
          || revealSnapshot.ampersand > 0
        const textDuration = hasDevelopedText
          ? (useIvoryExit ? 0.9 : HIDDEN_AMPERSAND_TIMING.reverseTextSeconds)
          : 0
        const holdDuration = initialProgress > 0 && !useIvoryExit ? HIDDEN_AMPERSAND_TIMING.reverseHoldSeconds : 0
        const drainDuration = initialProgress > 0
          ? (useIvoryExit
            ? (window.innerWidth < 700
              ? HIDDEN_AMPERSAND_TIMING.mobileIvoryImpactSeconds
              : HIDDEN_AMPERSAND_TIMING.ivoryImpactSeconds)
            : HIDDEN_AMPERSAND_TIMING.reverseInkSeconds)
          : 0
        const current = initialProgress
        if (drainDuration === 0 && textDuration === 0 && holdDuration === 0) {
          updateInk(0, 0)
          onReversed()
          return
        }
        const reverseProgress = textDuration === 0 ? 1 : ease(elapsed / textDuration)
        for (let index = 0; index < lineRefs.current.length; index += 1) {
          const line = lineRefs.current[index]
          const fill = revealSnapshot.fills[index] * (1 - ease(elapsed / Math.max(0.001, textDuration * 0.78)))
          const trace = revealSnapshot.traces[index] * (1 - reverseProgress) * (1 - fill)
          line?.style.setProperty('--line-reveal', `${fill * 100}%`)
          traceRefs.current[index]?.style.setProperty('--line-trace', `${trace * 100}%`)
          revealsRef.current.fills[index] = fill
          revealsRef.current.traces[index] = trace
        }
        const ampReveal = revealSnapshot.ampersand * (1 - reverseProgress)
        revealsRef.current.ampersand = ampReveal
        ampRef.current?.style.setProperty('--amp-reveal', `${ampReveal * 100}%`)
        if (useIvoryExit) {
          const start = HIDDEN_AMPERSAND_TIMING.initialImpactCoverage
          const contact = HIDDEN_AMPERSAND_TIMING.ivoryImpactCoverage
          const end = 1 + HIDDEN_AMPERSAND_TIMING.ivoryFrontBand
          const contactElapsed = HIDDEN_AMPERSAND_TIMING.ivoryContactSeconds
          const exitProgress = elapsed < contactElapsed
            ? start + (contact - start) * ease(elapsed / contactElapsed)
            : contact + (end - contact) * ease((elapsed - contactElapsed) / Math.max(0.001, drainDuration - contactElapsed))
          updateInk(1, elapsed, null, 0, 0, now, exitProgress)
          if (elapsed >= Math.max(textDuration, drainDuration)) {
            updateInk(0, elapsed, 0, 0, 0, now, end)
            onReversed()
            return
          }
          rafRef.current = requestAnimationFrame(frame)
          return
        }
        const drainElapsed = Math.max(0, elapsed - textDuration - holdDuration)
        const progress = drainElapsed <= 0 ? current : current * (1 - ease(drainElapsed / drainDuration))
        const edgeTime = initialEdgeTime + drainElapsed
        const velocity = drainElapsed <= 0 || drainElapsed >= drainDuration
          ? 0
          : current * 6 * (drainElapsed / drainDuration) * (1 - drainElapsed / drainDuration) / drainDuration
        updateInk(progress, elapsed, null, edgeTime, velocity, now)
        if (drainElapsed >= drainDuration) {
          updateInk(0, elapsed, 0, 0, 0, now)
          onReversed()
          return
        }
      }
      rafRef.current = requestAnimationFrame(frame)
    }

    const startAnimation = () => {
      if (cancelled) return
      startedAt = performance.now()
      hiddenAt = document.hidden ? startedAt : null
      rafRef.current = requestAnimationFrame(frame)
    }
    if (useIvoryExit && exitOrigin) {
      const renderer = rendererRef.current
      if (renderer) {
        renderer.prepareExitField(exitOrigin, (ready) => {
          if (!ready) {
            if (!webglAvailableRef.current) beginContextLossFallback(performance.now())
            else useIvoryExit = false
          }
          startAnimation()
        })
      } else {
        useIvoryExit = false
        startAnimation()
      }
    } else {
      startAnimation()
    }
    return () => {
      cancelled = true
      cancelAnimationFrame(rafRef.current)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [phase, reducedMotion, onInverted, onReversed, exitOrigin])

  useEffect(() => {
    if (phase !== 'inverted') return

    const redrawStaticFrame = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const time = edgeTimeRef.current
      inkRef.current?.setAttribute('d', inkPath(1, width, height, time))
      wetEdgeRef.current?.setAttribute('d', inkEdgePath(1, width, height, time))
      const edgeY = 0
      islandRefs.current.forEach((island, index) => {
        if (!island) return
        island.setAttribute('cx', String(width * [0.17, 0.43, 0.69, 0.88][index]))
        const lift = height * (0.018 + ((index * 7) % 3) * 0.009)
        island.setAttribute('cy', String(Math.max(0, edgeY - lift)))
        island.setAttribute('rx', String(width * (0.008 + (index % 2) * 0.004)))
        island.setAttribute('ry', String(height * (0.009 + (index % 3) * 0.005)))
      })
    }

    redrawStaticFrame()
    window.addEventListener('resize', redrawStaticFrame)
    window.addEventListener('orientationchange', redrawStaticFrame)
    window.visualViewport?.addEventListener('resize', redrawStaticFrame)
    return () => {
      window.removeEventListener('resize', redrawStaticFrame)
      window.removeEventListener('orientationchange', redrawStaticFrame)
      window.visualViewport?.removeEventListener('resize', redrawStaticFrame)
    }
  }, [phase])

  if (phase === 'idle') return null

  const inverted = phase === 'inverted'
  const placement = {
    left: `${origin.x * 100}%`,
    top: `max(${origin.y * 100}%, calc(env(safe-area-inset-bottom, 0px) + 3rem))`,
  }

  return (
    <div className="mojean-amp-overlay" role="presentation">
      <LiquidInkRenderer
        ref={rendererRef}
        originX={origin.x}
        originY={origin.y}
        available={webglAvailable}
        ambientEnabled={phase === 'inverted' && !reducedMotion && webglAvailable}
        onAvailabilityChange={handleRendererAvailability}
        coverageRef={progressRef}
        velocityRef={velocityRef}
        frameTimeRef={frameTimeRef}
      />
      <svg
        className="mojean-amp-ink"
        width="100%"
        height="100%"
        aria-hidden="true"
        preserveAspectRatio="none"
        style={{ visibility: webglAvailable ? 'hidden' : 'visible' }}
      >
        <defs>
          <mask id="mojean-ink-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
            <path ref={inkRef} d="" fill="white" />
          </mask>
          <filter id="mojean-static-grain" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="2" seed="17" stitchTiles="stitch" result="grain" />
            <feColorMatrix in="grain" type="matrix" values="0.063 0 0 0 0.0863 0 0.004 0 0 0.0039 0 0 0.0118 0 0.0078 0 0 0 0 1" />
          </filter>
        </defs>
        <rect width="100%" height="100%" fill={burgundy} mask="url(#mojean-ink-mask)" />
          <rect width="100%" height="100%" fill="#260308" opacity="0.16" filter="url(#mojean-static-grain)" mask="url(#mojean-ink-mask)" style={{ mixBlendMode: 'soft-light' }} />
        {[0, 1, 2, 3].map((island) => (
          <ellipse key={island} ref={(node) => { islandRefs.current[island] = node }} fill={burgundy} opacity="0" />
        ))}
        <path ref={wetEdgeRef} d="" fill="none" stroke="#260308" strokeWidth="2" opacity="0.62" />
      </svg>

      <div className="mojean-amp-composition" aria-hidden={!inverted}>
        <div className="mojean-amp-copy" role="group" aria-label="The movement will outlive the person who winds it. Founder: エス.">
          <div className="mojean-amp-quote">
            {statement.map((line, index) => (
              <span className="mojean-amp-line" key={line}>
                <span className="mojean-amp-trace" aria-hidden="true" ref={(node) => { traceRefs.current[index] = node }}>{line}</span>
                <span className="mojean-amp-fill" ref={(node) => { lineRefs.current[index] = node }}>{line}</span>
              </span>
            ))}
          </div>
          <div className="mojean-amp-signature-column">
            <svg className="mojean-amp-ink-stains" viewBox="0 0 96 42" aria-hidden="true" focusable="false">
              <path d="M9 20c1-4 5-7 9-6 3 1 4 4 2 7l-5 5c-3 3-8-1-6-6z" fill="#4A0F17" />
              <path d="M42 8c2-3 6-4 8-2 2 2 0 4-2 6l-4 2c-3 1-4-3-2-6z" fill="#260308" />
              <path d="M69 23c1-3 5-5 8-3 3 1 3 4 0 6l-5 3c-3 2-5-2-3-6z" fill="#4A0F17" />
              <path d="M29 30c1-2 3-3 5-2 2 1 1 3-1 4l-2 2c-2 1-3-2-2-4z" fill="#260308" />
              <circle cx="31" cy="11" r="1.6" fill="#4A0F17" />
              <circle cx="60" cy="13" r="1.1" fill="#260308" />
              <circle cx="84" cy="12" r="1.5" fill="#4A0F17" />
              <circle cx="56" cy="32" r="1.3" fill="#4A0F17" />
              <circle cx="17" cy="35" r="0.9" fill="#260308" />
            </svg>
            <span className="mojean-amp-line mojean-amp-founder-line">
              <span className="mojean-amp-trace mojean-amp-founder" aria-hidden="true" ref={(node) => { traceRefs.current[3] = node }}>FOUNDER</span>
              <span className="mojean-amp-fill mojean-amp-founder" ref={(node) => { lineRefs.current[3] = node }}>FOUNDER</span>
            </span>
            <span className="mojean-amp-line mojean-amp-signature-line">
              <span className="mojean-amp-trace mojean-amp-signature" aria-hidden="true" ref={(node) => { traceRefs.current[4] = node }}>
                <span className="mojean-amp-signature-mark">スディープ</span>
              </span>
              <span className="mojean-amp-fill mojean-amp-signature" ref={(node) => { lineRefs.current[4] = node }}>
              <span className="mojean-amp-signature-mark">スディープ</span>
              <svg ref={katanaRef} className="mojean-amp-katana" viewBox="0 0 520 90" aria-hidden="true" focusable="false">
                <defs>
                  <clipPath id="mojean-amp-katana-blade-clip" clipPathUnits="userSpaceOnUse">
                    <rect className="mojean-amp-katana-blade-mask" x="207" y="0" width="0" height="90" />
                  </clipPath>
                </defs>
                <g strokeLinecap="round" strokeLinejoin="round">
                  <g clipPath="url(#mojean-amp-katana-blade-clip)">
                    <path d="M207 38C300 38 390 33 466 20Q493 15 512 16L494 30C418 43 316 54 207 56Z" fill="currentColor" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M211 52C300 51 388 43 464 29Q481 26 494 24" fill="none" stroke="currentColor" strokeWidth="1.35" opacity="0.82" />
                    <path d="M211 40C302 40 389 34 466 21Q486 17 502 16.5" fill="none" stroke="currentColor" strokeWidth="1.1" opacity="0.72" />
                    <path d="M228 44C299 44 374 38 442 27" fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.56" />
                    <path d="M472 20Q478 25 478 32" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.72" />
                    <path className="mojean-amp-katana-reflection" d="M211 45C294 45 380 38 482 23" fill="none" stroke="#71695E" strokeWidth="1.35" strokeDasharray="34 320" strokeDashoffset="0" />
                  </g>
                  <path d="M201 35 210 37 209 56 200 59Q196 48 201 35Z" fill="currentColor" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M188 27C182 31 181 39 184 46 180 54 183 63 190 67L199 62C196 53 196 41 200 32Z" fill="currentColor" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M187 31Q192 34 196 32M185 60Q191 57 197 61" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.6" />
                  <path d="M178 36 185 37 184 57 177 58Z" fill="currentColor" stroke="currentColor" strokeWidth="1" />
                  <path d="M43 36 177 34 177 57 43 59Z" fill="currentColor" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M42 35Q34 39 34 47T42 60L49 58 49 37Z" fill="currentColor" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M52 36 70 58 88 35 106 57 124 34 142 56 160 33 176 51M52 58 70 36 88 58 106 35 124 57 142 34 160 56 176 39" fill="none" stroke="currentColor" strokeWidth="2.1" opacity="0.7" />
                  <path d="M52 36 70 58 88 35 106 57 124 34 142 56 160 33 176 51M52 58 70 36 88 58 106 35 124 57 142 34 160 56 176 39" fill="none" stroke="currentColor" strokeWidth="0.85" transform="translate(0 1.4)" opacity="0.42" />
                  <path d="M42 36 48 36 48 59 42 60Z" fill="currentColor" stroke="currentColor" strokeWidth="1" />
                  <path d="M25 37Q19 40 19 47T25 59L35 58 35 38Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M25 40 34 40M24 56 34 56" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.6" />
                </g>
              </svg>
              </span>
            </span>
          </div>
        </div>
        <button
          ref={ampRef}
          type="button"
          className={`mojean-amp-exit${inverted ? ' is-ready' : ''}`}
          style={placement}
          aria-label="Return to MOJEAN homepage"
          tabIndex={inverted ? 0 : -1}
          onClick={(event) => onExit(eventOrigin(event))}
        >
          &amp;
        </button>
      </div>
    </div>
  )
}
