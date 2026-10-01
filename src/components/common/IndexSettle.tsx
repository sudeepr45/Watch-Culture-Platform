import { useEffect, useState, useRef } from 'react'

interface IndexSettleProps {
  value: string | number
  duration?: number
  delay?: number
  className?: string
}

const DIGITS = '0123456789'
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

export default function IndexSettle({
  value,
  duration = 500,
  delay = 0,
  className = '',
}: IndexSettleProps) {
  const targetStr = String(value)
  // Initialize immediately to final value — if reduced motion, we never animate
  const [displayStr, setDisplayStr] = useState<string>(targetStr)
  const frameRef = useRef<number | null>(null)
  const timeoutRef = useRef<number | null>(null)
  // Track whether this instance has already settled to avoid re-running on re-render
  const settledRef = useRef(false)

  useEffect(() => {
    // Reset settled flag when target changes
    settledRef.current = false

    if (prefersReducedMotion()) {
      // Reduced motion: already initialized to targetStr, nothing to do
      return
    }

    const startAnimation = () => {
      if (settledRef.current) return
      const startTime = performance.now()

      const tick = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        const lockedCount = Math.floor(progress * targetStr.length)

        const nextStr = targetStr
          .split('')
          .map((char, index) => {
            if (index < lockedCount || progress >= 1) {
              return char
            }
            // Preserve whitespace and common punctuation as-is
            if (' /.,-:×()%—'.includes(char)) {
              return char
            }
            if (/\d/.test(char)) {
              return DIGITS[Math.floor(Math.random() * DIGITS.length)]
            }
            if (/[A-Z]/i.test(char)) {
              return CHARS[Math.floor(Math.random() * CHARS.length)]
            }
            return char
          })
          .join('')

        setDisplayStr(nextStr)

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(tick)
        } else {
          settledRef.current = true
          setDisplayStr(targetStr)
        }
      }

      frameRef.current = requestAnimationFrame(tick)
    }

    if (delay > 0) {
      timeoutRef.current = window.setTimeout(startAnimation, delay)
    } else {
      startAnimation()
    }

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [targetStr, duration, delay])

  return <span className={className}>{displayStr}</span>
}
