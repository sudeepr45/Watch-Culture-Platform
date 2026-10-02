import { useCallback, useEffect, useRef, useState } from 'react'

export function useChronograph() {
  const [elapsedMs, setElapsedMs] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const elapsedRef = useRef(0)
  const startedAtRef = useRef<number | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const intervalRef = useRef<number | null>(null)
  const runningRef = useRef(false)

  const cancelUpdates = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const updateElapsed = useCallback(() => {
    if (startedAtRef.current !== null) {
      const elapsed = elapsedRef.current + performance.now() - startedAtRef.current
      setElapsedMs(elapsed)
    }
  }, [])

  const start = useCallback(() => {
    if (runningRef.current) return
    runningRef.current = true
    startedAtRef.current = performance.now()
    setIsRunning(true)

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      intervalRef.current = window.setInterval(updateElapsed, 100)
    } else {
      const tick = () => {
        updateElapsed()
        animationFrameRef.current = window.requestAnimationFrame(tick)
      }
      animationFrameRef.current = window.requestAnimationFrame(tick)
    }
  }, [updateElapsed])

  const stop = useCallback(() => {
    if (!runningRef.current) return
    const now = performance.now()
    if (startedAtRef.current !== null) {
      elapsedRef.current += now - startedAtRef.current
    }
    startedAtRef.current = null
    runningRef.current = false
    cancelUpdates()
    setElapsedMs(elapsedRef.current)
    setIsRunning(false)
  }, [cancelUpdates])

  const reset = useCallback(() => {
    if (runningRef.current) return
    elapsedRef.current = 0
    startedAtRef.current = null
    setElapsedMs(0)
  }, [])

  useEffect(() => () => cancelUpdates(), [cancelUpdates])

  return { elapsedMs, isRunning, start, stop, reset }
}
