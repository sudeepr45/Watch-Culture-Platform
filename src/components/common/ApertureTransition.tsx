import { useEffect, useState } from 'react'

interface ApertureTransitionProps {
  duration?: number // ms
}

export default function ApertureTransition({ duration = 900 }: ApertureTransitionProps) {
  const [mounted] = useState(
    () =>
      typeof window !== 'undefined' &&
      !(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false),
  )
  const [isOpen, setIsOpen] = useState(false)
  const [isFinished, setIsFinished] = useState(false)

  useEffect(() => {
    // Respect prefers-reduced-motion
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    // Trigger opening transition immediately after paint
    let openTimer: number | null = null
    let nestedOpenTimer: number | null = null
    openTimer = requestAnimationFrame(() => {
      nestedOpenTimer = requestAnimationFrame(() => {
        setIsOpen(true)
      })
    })

    // Unmount from DOM after transition completes
    const cleanupTimer = window.setTimeout(() => {
      setIsFinished(true)
    }, duration + 50)

    return () => {
      cancelAnimationFrame(openTimer)
      clearTimeout(cleanupTimer)
      if (nestedOpenTimer !== null) cancelAnimationFrame(nestedOpenTimer)
    }
  }, [duration])

  if (!mounted || isFinished) return null

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none flex overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Left Aperture Blade */}
      <div
        className="w-1/2 h-full bg-[#181A1D] border-r border-white/10 transition-transform"
        style={{
          transform: isOpen ? 'translateX(-100%)' : 'translateX(0)',
          transitionDuration: `${duration}ms`,
          transitionTimingFunction: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
        }}
      />

      {/* Right Aperture Blade */}
      <div
        className="w-1/2 h-full bg-[#181A1D] border-l border-white/10 transition-transform"
        style={{
          transform: isOpen ? 'translateX(100%)' : 'translateX(0)',
          transitionDuration: `${duration}ms`,
          transitionTimingFunction: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
        }}
      />
    </div>
  )
}
