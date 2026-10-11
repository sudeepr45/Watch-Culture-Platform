import { useEffect, useRef, useState } from 'react'
import Container from '../components/common/Container'
import PlateIndexCanvas from '../components/plate/PlateIndexCanvas'
import PlateThumb from '../components/plate/PlateThumb'
import { Link } from '../router'
import { FAMILIES } from '../data/plates'
import { dateKey as getDateKey, longDate, shiftKey } from '../lib/plate'
import { plateForDateKey } from '../lib/plateDaily'
import { saveCuratedPlateImage } from '../lib/plateDailyExport'

const KEPT_PLATES_KEY = 'mj_kept'
const REVEAL_DURATION_MS = 42 * 24

function isDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00`)
  return !Number.isNaN(parsed.getTime()) && getDateKey(parsed) === value
}

function readKeptDates(): string[] {
  try {
    const stored = window.localStorage.getItem(KEPT_PLATES_KEY)
    if (!stored) return []
    const parsed: unknown = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return [...new Set(parsed.filter(isDateKey))].sort((a, b) => b.localeCompare(a))
  } catch {
    return []
  }
}

export default function PlatePage() {
  const [todayKey, setTodayKey] = useState(() => getDateKey(new Date()))
  const [selectedDate, setSelectedDate] = useState(() => getDateKey(new Date()))
  const [replayToken, setReplayToken] = useState(0)
  const [replayReveal, setReplayReveal] = useState(100)
  const [keptDates, setKeptDates] = useState<string[]>(readKeptDates)
  const todayKeyRef = useRef(todayKey)
  const selectedDateRef = useRef(selectedDate)

  const plate = plateForDateKey(selectedDate)
  const family = FAMILIES[plate.family]
  const currentPlateNumber = plate.id
  const isKept = keptDates.includes(selectedDate)
  const isToday = selectedDate === todayKey
  const recentDates = Array.from({ length: 7 }, (_, index) => shiftKey(todayKey, index - 6))

  useEffect(() => {
    let animationFrame = 0
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

    if (reducedMotion) {
      animationFrame = requestAnimationFrame(() => setReplayReveal(100))
    } else {
      animationFrame = requestAnimationFrame(() => {
        setReplayReveal(0)
        const startedAt = performance.now()
        const reveal = (now: number) => {
          const progress = Math.min(100, ((now - startedAt) / REVEAL_DURATION_MS) * 100)
          setReplayReveal(progress)
          if (progress < 100) animationFrame = requestAnimationFrame(reveal)
        }
        animationFrame = requestAnimationFrame(reveal)
      })
    }

    return () => cancelAnimationFrame(animationFrame)
  }, [plate.id, replayToken])

  useEffect(() => {
    try {
      window.localStorage.setItem(KEPT_PLATES_KEY, JSON.stringify(keptDates))
    } catch {
      // Storage can be unavailable in private or restricted browsing contexts.
    }
  }, [keptDates])

  useEffect(() => {
    const updateTodayWhenVisible = () => {
      if (document.visibilityState !== 'visible') return

      const updatedToday = getDateKey(new Date())
      const previousToday = todayKeyRef.current
      todayKeyRef.current = updatedToday
      setTodayKey(updatedToday)

      if (selectedDateRef.current === previousToday || selectedDateRef.current > updatedToday) {
        selectedDateRef.current = updatedToday
        setSelectedDate(updatedToday)
      }
    }

    document.addEventListener('visibilitychange', updateTodayWhenVisible)
    return () => document.removeEventListener('visibilitychange', updateTodayWhenVisible)
  }, [])

  const selectDate = (candidate: string) => {
    if (!isDateKey(candidate)) return
    const nextDate = candidate > todayKeyRef.current ? todayKeyRef.current : candidate
    if (nextDate === selectedDateRef.current) return
    selectedDateRef.current = nextDate
    setSelectedDate(nextDate)
    setReplayToken((token) => token + 1)
  }

  const navigateDays = (days: number) => {
    selectDate(shiftKey(selectedDateRef.current, days))
  }

  const replayCut = () => setReplayToken((token) => token + 1)

  const toggleKept = () => {
    setKeptDates((dates) =>
      dates.includes(selectedDate)
        ? dates.filter((date) => date !== selectedDate)
        : [...dates, selectedDate].sort((a, b) => b.localeCompare(a)),
    )
  }

  const handlePageKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const target = event.target
    if (target instanceof HTMLElement && target.closest('input, textarea, select, button, a, [contenteditable="true"]')) return

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      navigateDays(-1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      navigateDays(1)
    }
  }

  const handlePlateKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      event.stopPropagation()
      replayCut()
    }
  }

  return (
    <main className="py-10 sm:py-14 lg:py-16" onKeyDown={handlePageKeyDown}>
      <Container>
        <header className="mb-8 border-b border-hairline pb-7 sm:mb-10 sm:pb-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs font-mono uppercase tracking-[0.16em] text-ink-secondary">
            <span>Plate of the day</span>
            <span>A new plate at midnight, your time</span>
          </div>
          <h1 className="font-display text-4xl font-normal tracking-tight text-ink sm:text-5xl lg:text-6xl">
            A new plate every day.
          </h1>
          <p className="mt-4 max-w-3xl text-sm font-light leading-relaxed text-ink-secondary sm:text-base">
            Each local date selects a curated plate from the MOJEAN collection. Everyone viewing the same date sees the same design.
          </p>
          <Link
            to="/plates"
            className="mt-4 inline-block text-sm text-ink underline decoration-hairline underline-offset-4 hover:text-ink-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Browse the 100 plate index →
          </Link>
        </header>

        <section
          aria-label="Plate of the day"
          className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] lg:gap-10"
        >
          <div className="w-full">
            <div
              role="button"
              tabIndex={0}
              aria-label={`Plate ${currentPlateNumber}, ${plate.name}, for ${longDate(selectedDate)}. Activate to replay the pattern.`}
              onClick={replayCut}
              onKeyDown={handlePlateKeyDown}
              className="cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
            >
              <div className="w-full overflow-hidden border border-hairline bg-warm-white">
                <div aria-hidden="true" style={{ clipPath: `inset(0 ${100 - replayReveal}% 0 0)` }}>
                  <PlateIndexCanvas plate={plate} size={720} label={`Plate ${currentPlateNumber}, ${plate.name}, ${longDate(selectedDate)}`} />
                </div>
              </div>
            </div>
          </div>

          <div className="min-w-0 lg:pt-1">
            <div className="border-b border-hairline pb-5">
              <p className="text-xs font-mono uppercase tracking-[0.16em] text-ink-muted">
                {currentPlateNumber ? `Plate No. ${currentPlateNumber}` : 'Plate'}
              </p>
              <h2 className="mt-2 font-display text-2xl font-normal tracking-tight text-ink sm:text-3xl">
                {plate.name}
              </h2>
              <p className="mt-2 text-sm text-ink-secondary">{longDate(selectedDate)}</p>
            </div>

            <dl className="grid grid-cols-2 gap-px border border-hairline bg-hairline">
              <div className="bg-warm-white p-4">
                <dt className="text-xs font-mono uppercase tracking-wide text-ink-muted">Family</dt>
                <dd className="mt-2 text-base text-ink">{family?.label ?? plate.family}</dd>
              </div>
              <div className="bg-warm-white p-4">
                <dt className="text-xs font-mono uppercase tracking-wide text-ink-muted">Parameters</dt>
                <dd className="mt-2 text-base text-ink">{Object.keys(plate.params).filter((key) => key !== 'st').length} values</dd>
              </div>
              <div className="bg-warm-white p-4">
                <dt className="text-xs font-mono uppercase tracking-wide text-ink-muted">Linework</dt>
                <dd className="mt-2 text-base text-ink">{plate.params.st ? 'Steel' : 'Ink'}</dd>
              </div>
              <div className="bg-warm-white p-4">
                <dt className="text-xs font-mono uppercase tracking-wide text-ink-muted">Confidence</dt>
                <dd className="mt-2 text-base capitalize text-ink">{family?.confidence ?? 'General'}</dd>
              </div>
            </dl>

            <div className="mt-6 grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
              <button
                type="button"
                onClick={() => navigateDays(-1)}
                className="min-h-11 border border-hairline bg-warm-white px-3 text-sm text-ink transition-colors motion-reduce:transition-none motion-reduce:duration-0 hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                ← Previous day
              </button>
              <input
                id="plate-date"
                type="date"
                value={selectedDate}
                max={todayKey}
                aria-label="Choose a plate date"
                onChange={(event) => selectDate(event.currentTarget.value)}
                className="min-h-11 min-w-0 border border-hairline bg-warm-white px-2 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              />
              <button
                type="button"
                onClick={() => navigateDays(1)}
                disabled={isToday}
                className="min-h-11 border border-hairline bg-warm-white px-3 text-sm text-ink transition-colors motion-reduce:transition-none motion-reduce:duration-0 hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next day →
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => selectDate(todayKey)}
                disabled={isToday}
                className="min-h-11 border border-hairline bg-warm-surface px-4 text-sm text-ink transition-colors motion-reduce:transition-none motion-reduce:duration-0 hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                Today
              </button>
              <button
                type="button"
                onClick={toggleKept}
                aria-pressed={isKept}
                className="min-h-11 border border-ink bg-ink px-4 text-sm text-warm-white transition-colors motion-reduce:transition-none motion-reduce:duration-0 hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                {isKept ? 'Kept' : 'Keep this plate'}
              </button>
              <button
                type="button"
                onClick={() => { void saveCuratedPlateImage(selectedDate) }}
                className="min-h-11 border border-hairline bg-warm-white px-4 text-sm text-ink transition-colors motion-reduce:transition-none motion-reduce:duration-0 hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Save as image
              </button>
            </div>
          </div>
        </section>

        <section aria-labelledby="recent-plates-heading" className="mt-12 border-t border-hairline pt-8 sm:mt-16">
          <h2 id="recent-plates-heading" className="font-display text-2xl font-normal text-ink">
            Last seven days
          </h2>
          <ul className="mt-5 flex flex-wrap gap-3">
            {recentDates.map((date) => {
              const number = plateForDateKey(date).id
              return (
                <li key={date}>
                  <PlateThumb
                    dateKey={date}
                    label={`Plate No. ${number}, ${longDate(date)}`}
                    selected={date === selectedDate}
                    onSelect={() => selectDate(date)}
                  />
                </li>
              )
            })}
          </ul>
        </section>

        <section aria-labelledby="my-plates-heading" className="mt-10 border-t border-hairline pt-8">
          <h2 id="my-plates-heading" className="font-display text-2xl font-normal text-ink">
            My plates
          </h2>
          {keptDates.length > 0 ? (
            <ul className="mt-5 flex flex-wrap gap-3">
              {keptDates.map((date) => {
                const number = plateForDateKey(date).id
                return (
                  <li key={date}>
                    <PlateThumb
                      dateKey={date}
                      label={`Plate No. ${number}, ${longDate(date)}`}
                      selected={date === selectedDate}
                      onSelect={() => selectDate(date)}
                    />
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-ink-secondary">No kept plates yet.</p>
          )}
        </section>

        <section aria-label="About the plate" className="mt-12 grid grid-cols-1 gap-6 border-t border-hairline pt-8 sm:grid-cols-3">
          <article>
            <h2 className="font-display text-lg text-ink">The family</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
              {family?.label ?? plate.family}
            </p>
          </article>
          <article>
            <h2 className="font-display text-lg text-ink">How it is drawn</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
              {family?.how ?? 'The plate is drawn from its fixed parameters using deterministic canvas linework.'}
            </p>
          </article>
          <article>
            <h2 className="font-display text-lg text-ink">Where it is encountered</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
              {family?.met ?? 'This curated visual study is selected consistently for the same local date.'}
            </p>
          </article>
        </section>

        <footer className="mt-10 border-t border-hairline pt-5 text-sm leading-relaxed text-ink-secondary">
          The daily plate is selected consistently from the curated collection. Nothing is uploaded. Kept dates are stored on this device.
        </footer>
      </Container>
    </main>
  )
}
