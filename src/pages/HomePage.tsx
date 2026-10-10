import { useEffect, useState } from 'react'
import Container from '../components/common/Container'
import Button from '../components/common/Button'
import WatchImage from '../components/common/WatchImage'
import { Link } from '../router'
import { useRouter } from '../router/useRouter'
import Hero from '../components/hero/Hero'
import PhilosophyStrip from '../components/home/PhilosophyStrip'
import { fetchPublishedWatches } from '../services/watchService'
import type { Watch } from '../types/watch'
import { isSafeWatchImageUrl } from '../utils/imageSafety'

function getLocalDayKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function selectWatchOfTheDay(watches: Watch[], dayKey: string): Watch | null {
  if (watches.length === 0) return null

  const [year, month, day] = dayKey.split('-').map(Number)
  const localDayIndex = Math.floor(Date.UTC(year, month - 1, day) / 86_400_000)
  const orderedWatches = [...watches].sort((a, b) => a.id.localeCompare(b.id))
  const watchIndex = ((localDayIndex % orderedWatches.length) + orderedWatches.length) % orderedWatches.length

  return orderedWatches[watchIndex]
}

export default function HomePage() {
  const { navigate } = useRouter()
  const [watches, setWatches] = useState<Watch[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasLoadError, setHasLoadError] = useState(false)
  const [dayKey, setDayKey] = useState(() => getLocalDayKey())

  useEffect(() => {
    let isMounted = true

    fetchPublishedWatches().then((result) => {
      if (!isMounted) return
      setHasLoadError(Boolean(result.error))
      setWatches(result.error ? [] : result.data || [])
      setLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const currentDay = getLocalDayKey()
      setDayKey((previousDay) => (previousDay === currentDay ? previousDay : currentDay))
    }, 60_000)

    return () => window.clearInterval(intervalId)
  }, [])

  const eligibleWatches = (watches || []).filter(
    (watch) => watch.status === 'published' && isSafeWatchImageUrl(watch.image_url),
  )
  const verifiedWatches = eligibleWatches.filter(
    (watch) => watch.image_verification_status === 'verified',
  )
  const spotlightWatch = selectWatchOfTheDay(
    verifiedWatches.length > 0 ? verifiedWatches : eligibleWatches,
    dayKey,
  )
  const previewWatches = (watches || []).filter((watch) => watch.id !== spotlightWatch?.id).slice(0, 3)

  return (
    <div className="flex flex-col">
      {/* 1. HERO — PRODUCT CLARITY + MONOLITH ARCHIVAL SPECIMEN */}
      <Hero />

      {/* 2. REAL WATCH SPECIMEN — TODAY'S WATCH SPOTLIGHT */}
      <section
        aria-labelledby="watch-of-the-day-heading"
        className="border-b border-hairline bg-warm-surface/30 py-16 sm:py-20 lg:py-24"
      >
        <Container>
          <div className="border-b border-hairline pb-6 mb-8 sm:mb-10">
            <h2
              id="watch-of-the-day-heading"
              className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-ink uppercase"
            >
              WATCH OF THE DAY
            </h2>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm font-light text-ink-muted">
              Loading today&apos;s watch…
            </div>
          ) : hasLoadError || !spotlightWatch ? (
            <div className="py-10 text-center text-sm font-light text-ink-secondary">
              {hasLoadError
                ? 'The watch archive is unavailable right now.'
                : 'No published watch with a usable image is available today.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center bg-warm-white border border-hairline p-6 sm:p-10 lg:p-12">
              {/* Left Column: Specimen Photography */}
              <div className="lg:col-span-6">
                <div className="relative border border-hairline bg-warm-surface overflow-hidden group">
                  <WatchImage
                    src={spotlightWatch.image_url}
                    alt={`${spotlightWatch.brand} ${spotlightWatch.model}`}
                    aspectRatio="aspect-[4/3] sm:aspect-[16/11]"
                    loading="eager"
                  />
                  {spotlightWatch.category && (
                    <div className="absolute top-0 left-0 border-b border-r border-hairline bg-warm-white px-3 py-1 text-[9px] font-mono tracking-[0.2em] uppercase text-ink font-semibold z-10">
                      {spotlightWatch.category}
                    </div>
                  )}
                  {spotlightWatch.release_year && (
                    <div className="absolute top-0 right-0 border-b border-l border-hairline bg-warm-white px-3 py-1 text-[9px] font-mono tracking-[0.15em] text-ink-muted z-10">
                      CIRCA {spotlightWatch.release_year}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Technical Dossier & Actions */}
              <div className="lg:col-span-6 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-mono uppercase tracking-[0.2em] text-ink-secondary">
                    {spotlightWatch.brand}
                  </div>

                  <h3
                    className="mt-2 font-display text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight text-ink uppercase"
                  >
                    {spotlightWatch.model}
                  </h3>

                  <div className="mt-1.5 text-xs font-mono text-ink-muted tracking-wider">
                    REF. {spotlightWatch.reference_number}
                  </div>

                  {spotlightWatch.description && (
                    <p className="mt-4 text-sm sm:text-base text-ink-secondary font-light leading-relaxed line-clamp-3">
                      {spotlightWatch.description}
                    </p>
                  )}

                  {/* Verified Specification Telemetry Strip */}
                  <div className="mt-6 pt-5 border-t border-hairline grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-ink-muted block">CALIBRE</span>
                      <span className="text-ink font-medium truncate block" title={spotlightWatch.calibre || spotlightWatch.movement_name || '—'}>
                        {spotlightWatch.calibre || spotlightWatch.movement_name || spotlightWatch.movement_type || '—'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-ink-muted block">DIAMETER</span>
                      <span className="text-ink font-medium block">
                        {spotlightWatch.case_diameter_mm ? `${spotlightWatch.case_diameter_mm} mm` : '—'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-ink-muted block">DEPTH</span>
                      <span className="text-ink font-medium block">
                        {spotlightWatch.water_resistance_m ? `${spotlightWatch.water_resistance_m} m` : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct Specimen Actions */}
                <div className="mt-8 pt-6 border-t border-hairline flex flex-wrap items-center gap-4">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/watches/${spotlightWatch.slug}`)}
                  >
                    VIEW SPECIMEN DOSSIER &rarr;
                  </Button>

                </div>
              </div>
            </div>
          )}
        </Container>
      </section>

      {/* 3. VERIFIED ARCHIVE PREVIEW — REAL SUPABASE SPECIMENS */}
      {previewWatches.length > 0 && (
        <section
          aria-labelledby="archive-preview-heading"
          className="border-b border-hairline bg-warm-surface/20 py-16 sm:py-20 lg:py-24"
        >
          <Container>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-hairline pb-8 mb-10 sm:mb-12">
              <div>
                <h2
                  id="archive-preview-heading"
                  className="font-display text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-ink uppercase"
                >
                  The Reference Archive
                </h2>
                <p className="mt-3 text-sm sm:text-base text-ink-secondary font-light max-w-2xl leading-relaxed">
                  Historically significant and culturally definitive horological specimens, indexed by verified mechanical specifications.
                </p>
              </div>

              <Link
                to="/watches"
                className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-ink font-semibold hover:text-neutral-700 transition-colors pb-1 border-b border-ink/40 hover:border-ink self-start sm:self-auto"
              >
                <span>VIEW ALL SPECIMENS</span>
                <span>&rarr;</span>
              </Link>
            </div>

            {/* 3-Specimen Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {previewWatches.map((watch) => (
                <Link
                  key={watch.id}
                  to={`/watches/${watch.slug}`}
                  className="group relative border border-hairline bg-warm-white flex flex-col justify-between transition-all duration-300 hover:border-ink hover:bg-warm-surface/30 overflow-hidden"
                >
                  {/* Specimen Photography */}
                  <div className="relative aspect-[4/3] w-full bg-warm-surface border-b border-hairline overflow-hidden">
                    <WatchImage
                      src={watch.image_url}
                      alt={`${watch.brand} ${watch.model}`}
                      imageClassName="group-hover:opacity-90"
                    />

                    {watch.category && (
                      <div className="absolute top-0 left-0 border-b border-r border-hairline bg-warm-white px-2.5 py-1 text-[9px] font-mono tracking-[0.2em] uppercase text-ink font-medium z-10">
                        {watch.category}
                      </div>
                    )}

                    {watch.release_year && (
                      <div className="absolute top-0 right-0 border-b border-l border-hairline bg-warm-white px-2.5 py-1 text-[9px] font-mono tracking-[0.15em] text-ink-muted z-10">
                        CIRCA {watch.release_year}
                      </div>
                    )}
                  </div>

                  {/* Specimen Identity & Metadata */}
                  <div className="p-6 flex flex-col justify-between flex-grow">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink-secondary">
                        {watch.brand}
                      </div>

                      <h3 className="mt-1 font-display text-xl sm:text-2xl font-normal tracking-tight text-ink uppercase group-hover:text-neutral-800 transition-colors">
                        {watch.model}
                      </h3>

                      <div className="mt-1 text-xs font-mono text-ink-muted tracking-wider">
                        REF. {watch.reference_number}
                      </div>

                      {/* 3-Spec Telemetry Strip */}
                      <div className="mt-5 pt-4 border-t border-hairline/60 grid grid-cols-3 gap-2 text-[10px] font-mono">
                        <div>
                          <span className="text-ink-muted uppercase block text-[8px] tracking-wider">CALIBRE</span>
                          <span className="text-ink truncate block font-medium" title={watch.calibre || watch.movement_name || watch.movement_type || '—'}>
                            {watch.calibre || watch.movement_name || watch.movement_type || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-ink-muted uppercase block text-[8px] tracking-wider">DIAMETER</span>
                          <span className="text-ink block font-medium">
                            {watch.case_diameter_mm ? `${watch.case_diameter_mm}mm` : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-ink-muted uppercase block text-[8px] tracking-wider">DEPTH</span>
                          <span className="text-ink block font-medium">
                            {watch.water_resistance_m ? `${watch.water_resistance_m}m` : '—'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Specimen Footer */}
                    <div className="mt-5 pt-3 border-t border-hairline flex items-center justify-between text-[10px] font-mono">
                      <div className="text-ink-muted uppercase tracking-wider">
                        {watch.price !== null
                          ? `MSRP $${watch.price.toLocaleString()} ${watch.currency}`
                          : 'MSRP ON REQUEST'}
                      </div>
                      <span className="text-ink font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform uppercase tracking-wider">
                        DOSSIER &rarr;
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* 4. TECHNICAL LEARNING — WATCH 101 */}
      <section
        aria-labelledby="instruments-heading"
        className="border-b border-hairline bg-warm-white py-16 sm:py-20 lg:py-24"
      >
        <Container>
          <div className="border-b border-hairline pb-8 mb-12 sm:mb-16 max-w-4xl">
            <h2
              id="instruments-heading"
              className="font-display text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-ink uppercase"
            >
              Learn the Mechanics
            </h2>
            <p className="mt-3 text-base sm:text-lg text-ink-secondary font-light max-w-2xl leading-relaxed">
              Build a practical understanding of movements, materials, and watchmaking through interactive technical guides.
            </p>
          </div>

          <div className="mx-auto max-w-3xl">
            <div className="border border-hairline bg-warm-surface/30 p-8 sm:p-12 flex flex-col justify-between hover:border-ink transition-colors">
              <div>
                <h3 className="font-display text-2xl sm:text-3xl font-normal uppercase tracking-tight text-ink">
                  Watch 101
                </h3>

                <div className="mt-2 text-xs font-mono uppercase tracking-wider text-ink font-medium">
                  New to watches? Start here.
                </div>

                <p className="mt-4 text-sm text-ink-secondary font-light leading-relaxed">
                  Learn how mechanical watches function through guides to balance springs, escapements, power reserves, water resistance, and complications.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-hairline">
                <Button variant="secondary" size="sm" onClick={() => navigate('/watch-101')}>
                  START WITH WATCH 101 &rarr;
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 5. LIVING PROVENANCE & COMMUNITY — STORIES + MY WRIST */}
      <section
        aria-labelledby="community-heading"
        className="border-b border-hairline bg-warm-surface/10 py-16 sm:py-20 lg:py-24"
      >
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            {/* Left: Stories */}
            <div className="lg:col-span-6 border border-hairline bg-warm-white p-8 sm:p-10 flex flex-col justify-between hover:border-ink transition-colors">
              <div>

                <h3
                  id="community-heading"
                  className="font-display text-2xl sm:text-3xl font-normal uppercase tracking-tight text-ink"
                >
                  Stories
                </h3>

                <blockquote className="mt-3 text-base sm:text-lg font-display uppercase tracking-tight text-ink">
                  &ldquo;Watches are objects. People give them meaning.&rdquo;
                </blockquote>

                <p className="mt-3 text-sm text-ink-secondary font-light leading-relaxed">
                  Unfiltered narratives, personal photography, and living provenance from real collectors documenting the timepieces they wear every day.
                </p>
              </div>

              <div className="mt-8 pt-5 border-t border-hairline">
                <Link
                  to="/stories"
                  className="text-xs font-mono uppercase tracking-wider text-ink font-semibold inline-flex items-center gap-1.5 hover:text-neutral-700 transition-colors"
                >
                  <span>READ COMMUNITY DISPATCHES</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            </div>

            {/* Right: My Wrist */}
            <div className="lg:col-span-6 border border-hairline bg-warm-white p-8 sm:p-10 flex flex-col justify-between hover:border-ink transition-colors">
              <div>

                <h3 className="font-display text-2xl sm:text-3xl font-normal uppercase tracking-tight text-ink">
                  My Wrist
                </h3>

                <blockquote className="mt-3 text-base sm:text-lg font-display uppercase tracking-tight text-ink">
                  &ldquo;Keep track of the watches that matter to you.&rdquo;
                </blockquote>

                <p className="mt-3 text-sm text-ink-secondary font-light leading-relaxed">
                  Build your personal wrist catalog. Document reference numbers, track timepieces in your collection, and bookmark collector stories.
                </p>
              </div>

              <div className="mt-8 pt-5 border-t border-hairline">
                <Link
                  to="/profile"
                  className="text-xs font-mono uppercase tracking-wider text-ink font-semibold inline-flex items-center gap-1.5 hover:text-neutral-700 transition-colors"
                >
                  <span>OPEN YOUR COLLECTOR DOSSIER</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 6. EDITORIAL MANIFESTO / PHILOSOPHY STRIP */}
      <PhilosophyStrip />
    </div>
  )
}
