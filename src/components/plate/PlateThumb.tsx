import { useEffect, useRef } from 'react'
import { drawPasses, plateParams } from '../../lib/plate'

interface PlateThumbProps {
  dateKey: string
  label: string
  selected: boolean
  onSelect: () => void
}

const THUMB_SIZE = 96

export default function PlateThumb({ dateKey, label, selected, onSelect }: PlateThumbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    const canvasSize = Math.max(1, Math.round(THUMB_SIZE * pixelRatio))
    canvas.width = canvasSize
    canvas.height = canvasSize
    canvas.style.width = `${THUMB_SIZE}px`
    canvas.style.height = `${THUMB_SIZE}px`

    const q = plateParams(dateKey)
    const colorToken = q.steel ? '--color-steel-dark' : '--color-ink'
    const color = getComputedStyle(canvas).getPropertyValue(colorToken).trim() || '#121212'
    drawPasses(context, canvasSize, q, 0, q.passes, 900, 1.1 * pixelRatio, color)
  }, [dateKey])

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={label}
      aria-pressed={selected}
      className={`border bg-warm-surface p-0 leading-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${selected ? 'border-ink' : 'border-hairline'}`}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="block" />
    </button>
  )
}
