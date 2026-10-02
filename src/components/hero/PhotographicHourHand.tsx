import { useEffect, useRef } from 'react'

const PHOTO_HOUR_ANGLE = 306.1129852444572
const HOUR_HAND_ORIGIN = '50.05% 42.42%'

function getLocalClockAngle(date: Date) {
  const hours = date.getHours() % 12
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()
  const milliseconds = date.getMilliseconds()

  return (hours + minutes / 60 + seconds / 3600 + milliseconds / 3600000) * 30
}

export default function PhotographicHourHand() {
  const handRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reducedMotion.matches) return

    const initialTime = Date.now()
    const phaseOffset = PHOTO_HOUR_ANGLE - getLocalClockAngle(new Date(initialTime))
    let frameId = 0

    const updateHand = () => {
      const currentAngle = getLocalClockAngle(new Date()) + phaseOffset
      const rotation = currentAngle - PHOTO_HOUR_ANGLE

      if (handRef.current) {
        handRef.current.style.transform = `rotate(${rotation}deg)`
      }

      frameId = window.requestAnimationFrame(updateHand)
    }

    frameId = window.requestAnimationFrame(updateHand)

    return () => window.cancelAnimationFrame(frameId)
  }, [])

  return (
    <div
      role="img"
      aria-label="Breguet Classique Phase de Lune 7787 photograph with a slowly moving hour hand"
      className="absolute inset-0"
    >
      <img
        src="/images/breguet-classique-phase-de-lune-7787.avif"
        alt=""
        className="absolute inset-0 h-full w-full object-contain"
        fetchPriority="high"
      />
      <img
        src="/images/breguet-classique-phase-de-lune-7787-hour-hand-repair.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-contain"
      />
      <img
        ref={handRef}
        src="/images/breguet-classique-phase-de-lune-7787-hour-hand.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-contain"
        style={{
          transformOrigin: HOUR_HAND_ORIGIN,
          transform: 'rotate(0deg)',
        }}
      />
    </div>
  )
}
