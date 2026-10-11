import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import Container from '../components/common/Container'
import PlateIndexCanvas from '../components/plate/PlateIndexCanvas'
import Button from '../components/common/Button'
import { FAMILIES, PLATES, type FamilyKey, type Plate } from '../data/plates'
import { dateKey, plateForDateKey } from '../lib/plateDaily'

const THUMB_SIZE = 150
const FAMILY_ENTRIES = Object.entries(FAMILIES) as [FamilyKey, (typeof FAMILIES)[FamilyKey]][]

function todayPlateIndex(): number {
  const today = plateForDateKey(dateKey(new Date()))
  return PLATES.findIndex((plate) => plate.id === today.id)
}

export default function PlateIndexPage() {
  const [familyFilter, setFamilyFilter] = useState<FamilyKey | 'all'>('all')
  const [selectedIndex, setSelectedIndex] = useState(todayPlateIndex)
  const [visibleThumbCount, setVisibleThumbCount] = useState(0)

  const filteredPlates = useMemo(
    () => familyFilter === 'all' ? PLATES : PLATES.filter((plate) => plate.family === familyFilter),
    [familyFilter],
  )
  const selectedPlate = PLATES[selectedIndex]
  const selectedFamily = FAMILIES[selectedPlate.family]

  useEffect(() => {
    let cancelled = false
    let frame = 0
    let renderedCount = 0
    const renderNextBatch = () => {
      if (cancelled) return
      renderedCount = Math.min(renderedCount + 3, filteredPlates.length)
      setVisibleThumbCount(renderedCount)
      if (renderedCount < filteredPlates.length) {
        frame = window.requestAnimationFrame(renderNextBatch)
      }
    }

    frame = window.requestAnimationFrame(renderNextBatch)
    return () => {
      cancelled = true
      window.cancelAnimationFrame(frame)
    }
  }, [filteredPlates])

  const selectFamily = (family: FamilyKey | 'all') => {
    setVisibleThumbCount(0)
    setFamilyFilter(family)
    if (family !== 'all') {
      const firstMatch = PLATES.findIndex((plate) => plate.family === family)
      if (firstMatch >= 0) setSelectedIndex(firstMatch)
    }
  }

  const moveSelection = useCallback((offset: number) => {
    const currentPosition = filteredPlates.findIndex((plate) => plate.id === selectedPlate.id)
    const nextPosition = (currentPosition + offset + filteredPlates.length) % filteredPlates.length
    const nextPlate = filteredPlates[nextPosition]
    const nextIndex = PLATES.findIndex((plate) => plate.id === nextPlate.id)
    if (nextIndex >= 0) setSelectedIndex(nextIndex)
  }, [filteredPlates, selectedPlate.id])

  const selectToday = () => {
    setFamilyFilter('all')
    setSelectedIndex(todayPlateIndex())
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const target = event.target
    if (
      target instanceof HTMLElement &&
      target.closest('input, textarea, select, button, a, [contenteditable="true"], [role="button"], [tabindex]:not([tabindex="-1"])')
    ) return

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      moveSelection(event.key === 'ArrowLeft' ? -1 : 1)
    }
  }

  const selectedLabel = `Plate No. ${selectedPlate.id}, ${selectedPlate.name}`

  return (
    <main className="py-8 sm:py-12 lg:py-16" onKeyDown={handleKeyDown}>
      <Container>
        <header className="mb-8 border-b border-hairline pb-7 sm:mb-10 sm:pb-8">
          <p className="mb-3 text-xs font-mono uppercase tracking-[0.16em] text-ink-muted">MOJEAN / Reference</p>
          <h1 className="font-display text-4xl font-normal tracking-tight text-ink sm:text-5xl lg:text-6xl">
            The plate index
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-secondary sm:text-base">
            One hundred deterministic studies of dial and case patterns, arranged by surface and technique.
          </p>
        </header>

        <section aria-label="Selected plate" className="grid min-w-0 grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] lg:gap-10">
          <figure className="m-0 min-w-0 border border-hairline bg-warm-surface p-3 sm:p-5">
            <figcaption className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono uppercase tracking-[0.12em] text-ink-secondary">
              <span>Plate No. {selectedPlate.id}</span>
              <span>{selectedFamily.label}</span>
            </figcaption>
            <PlateIndexCanvas
              plate={selectedPlate}
              size={560}
              label={selectedLabel}
            />
          </figure>

          <div className="min-w-0 lg:pt-1">
            <p className="text-xs font-mono uppercase tracking-[0.14em] text-ink-muted">{selectedFamily?.label ?? selectedPlate.family}</p>
            <h2 className="mt-2 break-words font-display text-3xl font-normal tracking-tight text-ink sm:text-4xl">
              {selectedPlate.name}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
              Technique: {selectedFamily?.how}
            </p>

            <dl className="mt-6 divide-y divide-hairline border-y border-hairline">
              <div className="py-4">
                <dt className="text-xs font-mono uppercase tracking-[0.12em] text-ink-muted">How it is drawn</dt>
                <dd className="mt-2 text-sm leading-relaxed text-ink-secondary">{selectedFamily?.how}</dd>
              </div>
              <div className="py-4">
                <dt className="text-xs font-mono uppercase tracking-[0.12em] text-ink-muted">Where you have met it</dt>
                <dd className="mt-2 text-sm leading-relaxed text-ink-secondary">{selectedFamily?.met}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 py-4">
                <dt className="text-xs font-mono uppercase tracking-[0.12em] text-ink-muted">Confidence</dt>
                <dd className="text-sm capitalize text-ink-secondary">{selectedFamily?.confidence}</dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => moveSelection(-1)} aria-label="Previous plate" className="motion-reduce:transition-none motion-reduce:duration-0">
                Previous
              </Button>
              <Button variant="secondary" size="sm" onClick={() => moveSelection(1)} aria-label="Next plate" className="motion-reduce:transition-none motion-reduce:duration-0">
                Next
              </Button>
              <Button variant="secondary" size="sm" onClick={selectToday} aria-label="Select today's curated plate" className="motion-reduce:transition-none motion-reduce:duration-0">
                Today
              </Button>
            </div>
          </div>
        </section>

        <section aria-labelledby="plate-families-heading" className="mt-10 border-t border-hairline pt-7 sm:mt-12">
          <h2 id="plate-families-heading" className="font-display text-xl font-normal text-ink">Filter by family</h2>
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Plate family filters">
            <button
              type="button"
              aria-pressed={familyFilter === 'all'}
              onClick={() => selectFamily('all')}
              className={`min-h-10 border px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${familyFilter === 'all' ? 'border-ink bg-ink text-warm-white' : 'border-hairline text-ink hover:border-ink'}`}
            >
              All 100
            </button>
            {FAMILY_ENTRIES.map(([familyKey, family]) => (
              <button
                key={familyKey}
                type="button"
                aria-pressed={familyFilter === familyKey}
                onClick={() => selectFamily(familyKey)}
                className={`min-h-10 border px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${familyFilter === familyKey ? 'border-ink bg-ink text-warm-white' : 'border-hairline text-ink hover:border-ink'}`}
              >
                {family.label}
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="plate-collection-heading" className="mt-9 border-t border-hairline pt-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="plate-collection-heading" className="font-display text-xl font-normal text-ink">The collection</h2>
            <p className="text-xs font-mono uppercase tracking-[0.12em] text-ink-muted">
              {filteredPlates.length} {filteredPlates.length === 1 ? 'plate' : 'plates'}
            </p>
          </div>
          <ul className="mt-5 grid min-w-0 grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filteredPlates.slice(0, visibleThumbCount).map((plate: Plate) => (
              <li key={plate.id} className="min-w-0">
                <button
                  type="button"
                  aria-label={`Select plate No. ${plate.id}, ${plate.name}`}
                  aria-pressed={plate.id === selectedPlate.id}
                  onClick={() => setSelectedIndex(PLATES.findIndex((item) => item.id === plate.id))}
                  className={`group block w-full min-w-0 p-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${plate.id === selectedPlate.id ? 'border border-ink' : 'border border-transparent hover:border-hairline'}`}
                >
                  <PlateIndexCanvas plate={plate} size={THUMB_SIZE} label={`Plate No. ${plate.id}, ${plate.name}`} />
                  <span aria-hidden="true" className="mt-2 block text-xs font-mono uppercase tracking-wide text-ink-muted">
                    No. {plate.id}
                  </span>
                  <span aria-hidden="true" className="mt-1 block truncate text-sm text-ink">{plate.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </Container>
    </main>
  )
}
