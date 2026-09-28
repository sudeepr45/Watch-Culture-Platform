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

export default function HomePage() {
  const { navigate } = useRouter()
  const [watches, setWatches] = useState<Watch[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConfigured, setIsConfigured] = useState(true)

  useEffect(() => {
    let isMounted = true

    fetchPublishedWatches().then((result) => {
      if (!isMounted) return
      setIsConfigured(result.isConfigured)
      if (result.error) {
        setError(result.error.message)
      } else {
        setWatches(result.data)
      }
      setLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [])

  // Derive spotlight specimen and archive preview selection from verified published data
  const spotlightWatch = watches && watches.length > 0 ? watches[0] : null
  const previewWatches = watches && watches.length > 1 ? watches.slice(1, 4) : watches || []

  return (
    <div className="flex flex-col">
      {/* 1. HERO — PRODUCT CLARITY + MONOLITH ARCHIVAL SPECIMEN */}
      <Hero />

      {/* 2. REAL WATCH SPECIMEN — TODAY'S WATCH SPOTLIGHT */}
      <section
        aria-labelledby="spotlight-heading"
        className="border-b border-hairline bg-warm-surface/30 py-16 sm:py-20 lg:py-24"
      >
        <Container>
          <div className="flex items-center justify-between border-b border-hairline pb-4 mb-10 text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
              <span className="text-ink font-semibold">ARCHIVAL SPECIMEN // SPOTLIGHT</span>
            </div>
            <span>VERIFIED RECORD</span>
          </div>

          {loading ? (
            <div className="border border-hairline bg-warm-white p-12 text-center max-w-xl mx-auto">
              <div className="w-8 h-8 mx-auto mb-4 flex items-center justify-center border border-hairline bg-warm-surface">
                <svg
                  className="w-4 h-4 text-steel animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                </svg>
              </div>
              <p className="text-xs font-mono tracking-widest text-ink-muted uppercase">
                LOADING ARCHIVE SPECIMEN...
              </p>
            </div>
          ) : error || !spotlightWatch ? (
            <div className="border border-hairline bg-warm-white p-8 sm:p-12 text-center max-w-xl mx-auto">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted mb-2">
                {isConfigured ? 'DATABASE NOTICE' : 'STANDBY MODE'}
              </div>
              <h3 className="font-display text-xl uppercase tracking-tight text-ink">
                Archive Specimen Standby
              </h3>
              <p className="mt-2 text-xs font-mono text-ink-secondary leading-relaxed">
                {error || 'Connect your Supabase database to stream verified watch records to the front page.'}
              </p>
              <div className="mt-6">
                <Button variant="secondary" size="sm" onClick={() => navigate('/watches')}>
                  EXPLORE ARCHIVE INDEX &rarr;
                </Button>
              </div>
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
                  <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-ink-muted mb-2">
                    TODAY&apos;S WATCH // ARCHIVAL DOSSIER
                  </div>

                  <div className="text-xs font-mono uppercase tracking-[0.2em] text-ink-secondary">
                    {spotlightWatch.brand}
                  </div>

                  <h2
                    id="spotlight-heading"
                    className="mt-1 font-display text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-ink uppercase"
                  >
                    {spotlightWatch.model}
                  </h2>

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

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/case/${spotlightWatch.slug}`)}
                  >
                    EXAMINE IN WORTH IT? &rarr;
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Container>
      </section>

      {/* 3. THREE CORE ACTIONS — DISCOVER → LEARN → DECIDE */}
      <section
        aria-labelledby="core-actions-heading"
        className="border-b border-hairline bg-warm-white py-16 sm:py-20 lg:py-24"
      >
        <Container>
          <div className="border-b border-hairline pb-8 mb-12 sm:mb-16 max-w-4xl">
            <div className="flex items-center gap-2 mb-3 text-[10px] font-mono uppercase tracking-[0.25em] text-ink-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
              <span>THE MOJEAN SYSTEM // CORE ARCHITECTURE</span>
            </div>
            <h2
              id="core-actions-heading"
              className="font-display text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-ink uppercase"
            >
              Discover. Understand. Decide.
            </h2>
            <p className="mt-3 text-base sm:text-lg text-ink-secondary font-light max-w-2xl leading-relaxed">
              Three interconnected pathways designed to take you from initial curiosity to deep mechanical understanding and rigorous buying decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Action 1: FIND */}
            <div className="border border-hairline bg-warm-surface/20 p-8 sm:p-10 flex flex-col justify-between hover:border-ink hover:bg-warm-surface/40 transition-colors">
              <div>
                <div className="text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-4">
                  01 // DISCOVER
                </div>
                <h3 className="font-display text-2xl font-normal uppercase tracking-tight text-ink">
                  Find a Watch
                </h3>
                <p className="mt-3 text-sm text-ink-secondary font-light leading-relaxed">
                  Search and explore the verified archive. Compare case dimensions, calibre lineages, water resistance, and reference history.
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-hairline">
                <Link
                  to="/watches"
                  className="text-xs font-mono uppercase tracking-wider text-ink font-semibold inline-flex items-center gap-1.5 hover:text-neutral-700 transition-colors"
                >
                  <span>EXPLORE ARCHIVE</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            </div>

            {/* Action 2: LEARN */}
            <div className="border border-hairline bg-warm-surface/20 p-8 sm:p-10 flex flex-col justify-between hover:border-ink hover:bg-warm-surface/40 transition-colors">
              <div>
                <div className="text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-4">
                  02 // LEARN
                </div>
                <h3 className="font-display text-2xl font-normal uppercase tracking-tight text-ink">
                  Learn Mechanics
                </h3>
                <p className="mt-3 text-sm text-ink-secondary font-light leading-relaxed">
                  Understand movements, escapements, power reserve, complications, and metallurgy through structured technical notebooks and interactive simulations.
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-hairline">
                <Link
                  to="/watch-101"
                  className="text-xs font-mono uppercase tracking-wider text-ink font-semibold inline-flex items-center gap-1.5 hover:text-neutral-700 transition-colors"
                >
                  <span>STUDY WATCH 101</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            </div>

            {/* Action 3: DECIDE */}
            <div className="border border-hairline bg-warm-surface/20 p-8 sm:p-10 flex flex-col justify-between hover:border-ink hover:bg-warm-surface/40 transition-colors">
              <div>
                <div className="text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-4">
                  03 // DECIDE
                </div>
                <h3 className="font-display text-2xl font-normal uppercase tracking-tight text-ink">
                  Decide with Facts
                </h3>
                <p className="mt-3 text-sm text-ink-secondary font-light leading-relaxed">
                  Evaluate whether a watch is worth it for you. Examine five mechanical and ergonomic pillars scored against your personal wearing priorities.
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-hairline">
                <Link
                  to="/case"
                  className="text-xs font-mono uppercase tracking-wider text-ink font-semibold inline-flex items-center gap-1.5 hover:text-neutral-700 transition-colors"
                >
                  <span>EXAMINE IN WORTH IT?</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 4. VERIFIED ARCHIVE PREVIEW — REAL SUPABASE SPECIMENS */}
      {previewWatches.length > 0 && (
        <section
          aria-labelledby="archive-preview-heading"
          className="border-b border-hairline bg-warm-surface/20 py-16 sm:py-20 lg:py-24"
        >
          <Container>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-hairline pb-8 mb-10 sm:mb-12">
              <div>
                <div className="flex items-center gap-2 mb-3 text-[10px] font-mono uppercase tracking-[0.25em] text-ink-muted">
                  <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
                  <span>CENTRAL REPOSITORY // SELECTION</span>
                </div>
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

      {/* 5. DECISION & KNOWLEDGE INSTRUMENTS — WORTH IT? & WATCH 101 */}
      <section
        aria-labelledby="instruments-heading"
        className="border-b border-hairline bg-warm-white py-16 sm:py-20 lg:py-24"
      >
        <Container>
          <div className="border-b border-hairline pb-8 mb-12 sm:mb-16 max-w-4xl">
            <div className="flex items-center gap-2 mb-3 text-[10px] font-mono uppercase tracking-[0.25em] text-ink-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
              <span>INTERACTIVE INSTRUMENTS // CRITICAL DECONSTRUCTION</span>
            </div>
            <h2
              id="instruments-heading"
              className="font-display text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-ink uppercase"
            >
              Instruments for Critical Evaluation
            </h2>
            <p className="mt-3 text-base sm:text-lg text-ink-secondary font-light max-w-2xl leading-relaxed">
              Move beyond subjective marketing. Examine technical mechanics and evaluate whether a timepiece delivers real substance.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Instrument 1: WORTH IT? */}
            <div className="border border-hairline bg-warm-surface/30 p-8 sm:p-12 flex flex-col justify-between hover:border-ink transition-colors">
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-4">
                  <span>DECISION INSTRUMENT</span>
                  <span>EVALUATION ENGINE</span>
                </div>

                <h3 className="font-display text-2xl sm:text-3xl font-normal uppercase tracking-tight text-ink">
                  WORTH IT?
                </h3>

                <div className="mt-2 text-xs font-mono uppercase tracking-wider text-ink font-medium">
                  See the facts. Decide if it&apos;s worth it for you.
                </div>

                <p className="mt-4 text-sm text-ink-secondary font-light leading-relaxed">
                  An objective decision instrument evaluating mechanical substance, calibre architecture, ergonomics, build materials, and heritage against your personal wearing priorities and budget tolerances.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-hairline flex items-center justify-between">
                <Button variant="primary" size="sm" onClick={() => navigate('/case')}>
                  OPEN WORTH IT? &rarr;
                </Button>
                <span className="text-[10px] font-mono tracking-widest text-ink-muted uppercase">
                  5-PILLAR MODEL
                </span>
              </div>
            </div>

            {/* Instrument 2: WATCH 101 */}
            <div className="border border-hairline bg-warm-surface/30 p-8 sm:p-12 flex flex-col justify-between hover:border-ink transition-colors">
              <div>
                <div className="flex items-center justify-between text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-4">
                  <span>TECHNICAL NOTEBOOK</span>
                  <span>LABORATORY</span>
                </div>

                <h3 className="font-display text-2xl sm:text-3xl font-normal uppercase tracking-tight text-ink">
                  Watch 101
                </h3>

                <div className="mt-2 text-xs font-mono uppercase tracking-wider text-ink font-medium">
                  New to watches? Start here.
                </div>

                <p className="mt-4 text-sm text-ink-secondary font-light leading-relaxed">
                  Learn how mechanical watches function. Explore balance springs, escapements, power reserves, water depth standards, and complications through interactive simulations and ten-second takeaways.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-hairline flex items-center justify-between">
                <Button variant="secondary" size="sm" onClick={() => navigate('/watch-101')}>
                  START WITH WATCH 101 &rarr;
                </Button>
                <span className="text-[10px] font-mono tracking-widest text-ink-muted uppercase">
                  SIMULATION LAB
                </span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 6. LIVING PROVENANCE & COMMUNITY — STORIES + MY WRIST */}
      <section
        aria-labelledby="community-heading"
        className="border-b border-hairline bg-warm-surface/10 py-16 sm:py-20 lg:py-24"
      >
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            {/* Left: Stories */}
            <div className="lg:col-span-6 border border-hairline bg-warm-white p-8 sm:p-10 flex flex-col justify-between hover:border-ink transition-colors">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-ink-muted mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
                  <span>COMMUNITY ARCHIVE // DISPATCHES</span>
                </div>

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
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-ink-muted mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
                  <span>COLLECTOR DOSSIER // CATALOG</span>
                </div>

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

      {/* 7. EDITORIAL MANIFESTO / PHILOSOPHY STRIP */}
      <PhilosophyStrip />
    </div>
  )
}
