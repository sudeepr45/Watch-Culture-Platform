import { useEffect, useRef } from 'react'
import type { Plate } from '../../data/plates'
import { drawPlate } from '../../lib/plateEngine'

interface PlateIndexCanvasProps {
  plate: Plate
  size: number
  label: string
}

export default function PlateIndexCanvas({ plate, size, label }: PlateIndexCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !Number.isFinite(size) || size <= 0) return

    const context = canvas.getContext('2d')
    if (!context) return

    const redraw = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      const pixelSize = Math.max(1, Math.round(size * pixelRatio))
      canvas.width = pixelSize
      canvas.height = pixelSize
      canvas.style.width = `${size}px`
      canvas.style.height = 'auto'

      const styles = getComputedStyle(canvas)
      const readColor = (token: string, fallback: string) =>
        styles.getPropertyValue(token).trim() || fallback
      const ink = readColor('--color-ink', '#121212')
      const steel = readColor('--color-steel-dark', '#334155')
      const bg = readColor('--color-warm-surface', '#F3F1EA')

      drawPlate(context, pixelSize, plate, { ink, steel, bg })
    }

    redraw()
    window.addEventListener('resize', redraw)
    return () => window.removeEventListener('resize', redraw)
  }, [plate, size])

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      className="block h-auto max-w-full"
      style={{ width: size }}
    />
  )
}
