import { useState, type KeyboardEvent } from 'react'
import { Link } from '../../router'
import { dateKey, longDate, plateNumber } from '../../lib/plate'
import PlateCanvas from './PlateCanvas'

export default function PlateHero() {
  const todayKey = dateKey(new Date())
  const number = plateNumber(todayKey)
  const date = longDate(todayKey)
  const [replayToken, setReplayToken] = useState(0)

  const handleSurfaceKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      event.stopPropagation()
      setReplayToken((token) => token + 1)
    }
  }

  return (
    <figure className="mx-auto w-full max-w-[460px] border border-hairline bg-warm-white p-4 sm:p-5 lg:max-w-none">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono uppercase tracking-[0.14em] text-ink-muted">
        <span>{number ? `Plate No. ${number}` : 'Plate'}</span>
        <span>{date}</span>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label={`Plate ${number ?? ''} for ${date}. Activate to replay the pattern.`}
        onClick={() => setReplayToken((token) => token + 1)}
        onKeyDown={handleSurfaceKeyDown}
        className="cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <PlateCanvas
          dateKey={todayKey}
          label={`Plate ${number ?? ''} for ${date}`}
          replayToken={replayToken}
          className="w-full border border-hairline bg-warm-white"
        />
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
