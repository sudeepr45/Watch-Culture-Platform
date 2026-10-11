import { useEffect, useState, type KeyboardEvent } from 'react'
import { Link } from '../../router'
import { dateKey, longDate } from '../../lib/plate'
import { plateForDateKey } from '../../lib/plateDaily'
import PlateIndexCanvas from './PlateIndexCanvas'

const REVEAL_DURATION_MS = 42 * 24

export default function PlateHero() {
  const todayKey = dateKey(new Date())
  const plate = plateForDateKey(todayKey)
  const number = plate.id
  const date = longDate(todayKey)
  const [replayToken, setReplayToken] = useState(0)
  const [revealed, setRevealed] = useState(100)

  useEffect(() => {
    let animationFrame = 0
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    if (reducedMotion) {
      animationFrame = requestAnimationFrame(() => setRevealed(100))
    } else {
      animationFrame = requestAnimationFrame(() => {
        setRevealed(0)
        const startedAt = performance.now()
        const reveal = (now: number) => {
          const progress = Math.min(100, ((now - startedAt) / REVEAL_DURATION_MS) * 100)
          setRevealed(progress)
          if (progress < 100) animationFrame = requestAnimationFrame(reveal)
        }
        animationFrame = requestAnimationFrame(reveal)
      })
    }

    return () => cancelAnimationFrame(animationFrame)
  }, [replayToken, todayKey])

  const handleSurfaceKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      event.stopPropagation()
      setReplayToken((token) => token + 1)
    }
  }

  return (
    <figure className="mx-auto w-full max-w-[460px] border border-hairline bg-warm-white p-4 sm:p-5 lg:max-w-none">
      <div className="mb-3 border-b border-hairline pb-3">
        <span className="font-display text-base font-semibold uppercase tracking-[0.08em] text-ink sm:text-lg">{`Plate No. ${number}`}</span>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label={`Plate ${number}, ${plate.name}, for ${date}. Activate to replay the pattern.`}
        onClick={() => setReplayToken((token) => token + 1)}
        onKeyDown={handleSurfaceKeyDown}
        className="cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <div className="w-full overflow-hidden border border-hairline bg-warm-white">
          <div
            aria-hidden="true"
            style={{ clipPath: `inset(0 ${100 - revealed}% 0 0)` }}
          >
            <PlateIndexCanvas plate={plate} size={420} label={`Plate ${number}, ${plate.name}, ${date}`} />
          </div>
        </div>
      </div>

      <figcaption className="mt-4">
        <p className="text-sm leading-relaxed text-ink-secondary">
          The kind of pattern cut into watch dials and cases, drawn here by formula. A new one every day.
        </p>
        <nav aria-label="Plate references" className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          <Link
            to="/plate"
            className="text-sm text-ink underline decoration-hairline underline-offset-4 transition-colors hover:text-ink-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            See today&apos;s plate →
          </Link>
          <Link
            to="/watch-101/guilloche"
            className="text-sm text-ink underline decoration-hairline underline-offset-4 transition-colors hover:text-ink-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            What is guilloché? →
          </Link>
        </nav>
      </figcaption>
    </figure>
  )
}
