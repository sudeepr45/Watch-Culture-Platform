import { useState, useEffect, useRef } from 'react'

export default function ChronographWidget() {
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const animationFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const accumulatedTimeRef = useRef(0)

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = performance.now()
      const tick = () => {
        if (startTimeRef.current !== null) {
          const now = performance.now()
          setElapsedMs(accumulatedTimeRef.current + (now - startTimeRef.current))
        }
        animationFrameRef.current = requestAnimationFrame(tick)
      }
      animationFrameRef.current = requestAnimationFrame(tick)
    } else {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (startTimeRef.current !== null) {
        accumulatedTimeRef.current = elapsedMs
      }
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isRunning, elapsedMs])

  const handleStartStop = () => {
    setIsRunning((prev) => !prev)
  }

  const handleReset = () => {
    if (isRunning) return // Cannot reset while running on standard chronograph
    setIsRunning(false)
    setElapsedMs(0)
    accumulatedTimeRef.current = 0
    startTimeRef.current = null
  }

  const totalSeconds = Math.floor(elapsedMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const hundredths = Math.floor((elapsedMs % 1000) / 10)

  return (
    <div className="border border-hairline bg-warm-surface/30 p-6 sm:p-8 my-8">
      <div className="border-b border-hairline pb-4 mb-6">
        <div className="text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-1">
          INTERACTIVE LAB // MECHANICAL STOPWATCH
        </div>
        <h3 className="font-display text-xl sm:text-2xl font-normal text-ink uppercase">
          Chronograph Pusher Simulator
        </h3>
        <p className="mt-1 text-xs font-mono text-ink-secondary">
          Operate the top (Start/Stop) and bottom (Reset) pushers to see how mechanical timing operates independently from regular timekeeping.
        </p>
      </div>

      {/* Main Chronograph Dashboard */}
      <div className="border border-hairline bg-warm-white p-6 sm:p-10 max-w-xl mx-auto text-center">
        {/* Sub-Dial Readouts */}
        <div className="flex justify-center items-center gap-8 mb-6">
          <div className="border border-hairline p-3 w-24 bg-warm-surface/30">
            <div className="text-[9px] font-mono uppercase tracking-widest text-ink-muted">
              MINUTES
            </div>
            <div className="font-display text-2xl font-normal text-ink mt-0.5">
              {minutes.toString().padStart(2, '0')}
            </div>
          </div>

          <div className="border border-hairline p-3 w-24 bg-warm-surface/30">
            <div className="text-[9px] font-mono uppercase tracking-widest text-ink-muted">
              SECONDS
            </div>
            <div className="font-display text-2xl font-normal text-ink mt-0.5">
              {seconds.toString().padStart(2, '0')}
            </div>
          </div>

          <div className="border border-hairline p-3 w-24 bg-warm-surface/30">
            <div className="text-[9px] font-mono uppercase tracking-widest text-ink-muted">
              1/100 SEC
            </div>
            <div className="font-display text-2xl font-normal text-steel mt-0.5">
              {hundredths.toString().padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Central Display */}
        <div className="font-mono text-4xl sm:text-5xl font-normal text-ink tracking-tight mb-8">
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}.
          <span className="text-2xl sm:text-3xl text-ink-secondary">
            {hundredths.toString().padStart(2, '0')}
          </span>
        </div>

        {/* Pusher Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={handleStartStop}
            className={`px-6 py-3.5 border text-xs font-mono uppercase tracking-widest font-semibold transition-all cursor-pointer ${
              isRunning
                ? 'border-rose-900 bg-rose-800 text-warm-white shadow-md'
                : 'border-ink bg-ink text-warm-white hover:bg-neutral-800'
            }`}
          >
            {isRunning ? 'STOP PUSHER (2 O\'CLOCK)' : 'START PUSHER (2 O\'CLOCK)'}
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={isRunning || elapsedMs === 0}
            className="px-6 py-3.5 border border-hairline bg-warm-white text-ink text-xs font-mono uppercase tracking-widest hover:border-ink disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            RESET (4 O\'CLOCK)
          </button>
        </div>

        {/* Status Callout */}
        <div className="mt-8 pt-4 border-t border-hairline text-[10px] font-mono uppercase text-ink-secondary text-left space-y-1">
          <div>
            STATUS:{' '}
            <span className={isRunning ? 'text-emerald-700 font-semibold' : 'text-ink-muted'}>
              {isRunning
                ? 'COLUMN WHEEL ENGAGED // HORIZONTAL CLUTCH TRANSMITTING TORQUE'
                : elapsedMs > 0
                ? 'CLUTCH DISENGAGED // TIME RECORDED'
                : 'HAMMER RESTING ON ZERO HEART CAM'}
            </span>
          </div>
          <div>
            NOTE: STANDARD CHRONOGRAPHS PREVENT RESETTING WHILE RUNNING TO PROTECT MECHANICAL LEVERS.
          </div>
        </div>
      </div>
    </div>
  )
}
