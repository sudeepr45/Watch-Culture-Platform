import { useEffect, useRef, useState } from 'react'
import Container from '../components/common/Container'
import PlateCanvas from '../components/plate/PlateCanvas'
import PlateThumb from '../components/plate/PlateThumb'
import {
  dateKey as getDateKey,
  longDate,
  plateNumber,
  plateParams,
  savePlateImage,
  shiftKey,
} from '../lib/plate'

const KEPT_PLATES_KEY = 'mj_kept'

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
  const [keptDates, setKeptDates] = useState<string[]>(readKeptDates)
  const todayKeyRef = useRef(todayKey)
  const selectedDateRef = useRef(selectedDate)

  const params = plateParams(selectedDate)
  const currentPlateNumber = plateNumber(selectedDate)
  const isKept = keptDates.includes(selectedDate)
  const isToday = selectedDate === todayKey
  const recentDates = Array.from({ length: 7 }, (_, index) => shiftKey(todayKey, index - 6))

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
            Each date seeds the plate formula. Everyone viewing the same date sees the same cut, wherever they are.
          </p>
        </header>

        <section
          aria-label="Plate of the day"
          className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] lg:gap-10"
        >
          <div className="w-full">
            <div
              role="button"
              tabIndex={0}
              aria-label={`Plate ${currentPlateNumber ?? ''} for ${longDate(selectedDate)}. Activate to replay the cut.`}
              onClick={replayCut}
              onKeyDown={handlePlateKeyDown}
              className="cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
            >
              <PlateCanvas
                dateKey={selectedDate}
                label={`Plate ${currentPlateNumber ?? ''} for ${longDate(selectedDate)}`}
                replayToken={replayToken}
                className="w-full border border-hairline bg-warm-white"
              />
            </div>
          </div>

          <div className="min-w-0 lg:pt-1">
            <div className="border-b border-hairline pb-5">
              <p className="text-xs font-mono uppercase tracking-[0.16em] text-ink-muted">
                {currentPlateNumber ? `Plate No. ${currentPlateNumber}` : 'Plate'}
              </p>
              <h2 className="mt-2 font-display text-2xl font-normal tracking-tight text-ink sm:text-3xl">
                {longDate(selectedDate)}
              </h2>
            </div>

            <dl className="grid grid-cols-2 gap-px border border-hairline bg-hairline">
              <div className="bg-warm-white p-4">
                <dt className="text-xs font-mono uppercase tracking-wide text-ink-muted">Waves</dt>
                <dd className="mt-2 text-base text-ink">{params.waves}</dd>
              </div>
              <div className="bg-warm-white p-4">
                <dt className="text-xs font-mono uppercase tracking-wide text-ink-muted">Second wave</dt>
                <dd className="mt-2 text-base text-ink">{params.secondWave}</dd>
              </div>
              <div className="bg-warm-white p-4">
                <dt className="text-xs font-mono uppercase tracking-wide text-ink-muted">Passes</dt>
                <dd className="mt-2 text-base text-ink">{params.passes}</dd>
              </div>
              <div className="bg-warm-white p-4">
                <dt className="text-xs font-mono uppercase tracking-wide text-ink-muted">Offset</dt>
                <dd className="mt-2 text-base text-ink">{params.offset.toFixed(3)}</dd>
              </div>
            </dl>

            <div className="mt-6 grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
              <button
                type="button"
                onClick={() => navigateDays(-1)}
                className="min-h-11 border border-hairline bg-warm-white px-3 text-sm text-ink transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
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
                className="min-h-11 border border-hairline bg-warm-white px-3 text-sm text-ink transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next day →
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => selectDate(todayKey)}
                disabled={isToday}
                className="min-h-11 border border-hairline bg-warm-surface px-4 text-sm text-ink transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                Today
              </button>
              <button
                type="button"
                onClick={toggleKept}
                aria-pressed={isKept}
                className="min-h-11 border border-ink bg-ink px-4 text-sm text-warm-white transition-colors hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                {isKept ? 'Kept' : 'Keep this plate'}
              </button>
              <button
                type="button"
                onClick={() => { void savePlateImage(selectedDate) }}
                className="min-h-11 border border-hairline bg-warm-white px-4 text-sm text-ink transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
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
              const number = plateNumber(date)
              return (
                <li key={date}>
                  <PlateThumb
                    dateKey={date}
                    label={`${number ? `Plate No. ${number}` : 'Plate'}, ${longDate(date)}`}
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
                const number = plateNumber(date)
                return (
                  <li key={date}>
                    <PlateThumb
                      dateKey={date}
                      label={`${number ? `Plate No. ${number}` : 'Plate'}, ${longDate(date)}`}
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
            <h2 className="font-display text-lg text-ink">The curve</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
              A single wavy circle is drawn again and again, revealing a new line where each pass meets the next.
            </p>
          </article>
          <article>
            <h2 className="font-display text-lg text-ink">Engine turning</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
              The repeated cut recalls engine-turned surfaces, where precise ornamental patterns are worked into metal.
            </p>
          </article>
          <article>
            <h2 className="font-display text-lg text-ink">The date seed</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
              The date alone seeds the formula, so a given date always resolves to the same plate for everyone.
            </p>
          </article>
        </section>

        <footer className="mt-10 border-t border-hairline pt-5 text-sm leading-relaxed text-ink-secondary">
          Computed in your browser from the date alone. Nothing is uploaded. Kept plates are stored on this device.
        </footer>
      </Container>
    </main>
  )
}
