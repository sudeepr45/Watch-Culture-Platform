import { useEffect, useRef, useState } from 'react'
import { drawPasses, plateParams } from '../../lib/plate'

interface PlateCanvasProps {
  dateKey: string
  label: string
  replayToken?: number
  className?: string
}

const ANIMATION_STEPS = 42
const STEP_INTERVAL_MS = 24

export default function PlateCanvas({
  dateKey,
  label,
  replayToken = 0,
  className,
}: PlateCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lastAnimatedRef = useRef<string | null>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setContainerWidth(entry.contentRect.width)
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || containerWidth <= 0) return

    const context = canvas.getContext('2d')
    if (!context) return

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    const canvasSize = Math.max(1, Math.round(containerWidth * pixelRatio))
    canvas.width = canvasSize
    canvas.height = canvasSize
    canvas.style.width = '100%'
    canvas.style.height = 'auto'

    const q = plateParams(dateKey)
    const colorToken = q.steel ? '--color-steel-dark' : '--color-ink'
    const color = getComputedStyle(canvas).getPropertyValue(colorToken).trim() || '#121212'
    const lineWidth = 1.1 * pixelRatio
    const animationKey = `${dateKey}:${replayToken}`
    const isNewPlate = lastAnimatedRef.current !== animationKey
    lastAnimatedRef.current = animationKey

    context.clearRect(0, 0, canvasSize, canvasSize)

    const drawCompletePlate = () => {
      drawPasses(context, canvasSize, q, 0, q.passes, 900, lineWidth, color)
    }

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    if (!isNewPlate || prefersReducedMotion) {
      drawCompletePlate()
      return
    }

    let cancelled = false
    let animationFrame = 0
    let completedStep = 0
    let completedPasses = 0
    const startedAt = performance.now()

    const animate = (now: number) => {
      if (cancelled) return

      const step = Math.min(
        ANIMATION_STEPS,
        Math.floor((now - startedAt) / STEP_INTERVAL_MS) + 1,
      )
      if (step > completedStep) {
        const nextPass = Math.ceil((q.passes * step) / ANIMATION_STEPS)
        drawPasses(context, canvasSize, q, completedPasses, nextPass, 900, lineWidth, color)
        completedPasses = nextPass
        completedStep = step
      }

      if (completedStep < ANIMATION_STEPS) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => {
      cancelled = true
      cancelAnimationFrame(animationFrame)
    }
  }, [containerWidth, dateKey, replayToken])

  return (
    <div ref={containerRef} className={className}>
      <canvas ref={canvasRef} role="img" aria-label={label} className="block w-full" />
    </div>
  )
}
