import { useEffect, useState, useRef } from 'react'
import Container from '../components/common/Container'
import Button from '../components/common/Button'
import { Link } from '../router'
import { useRouter } from '../router/useRouter'
import { fetchWatches } from '../services/watchService'
import type { Watch } from '../types/watch'

// Curatorial affinity mapping to genuine archive timepieces
const WATCH_AFFINITIES: Record<string, string[]> = {
  'casio-g-shock-ga-2100-1a1': ['quiet', 'character', 'daily'],
  'seiko-5-sports-srpd55': ['quiet', 'character', 'daily'],
  'hamilton-khaki-field-mechanical-h69439931': ['quiet', 'story', 'history', 'character'],
  'tissot-prx-powermatic-80-blue': ['form', 'machine', 'daily', 'quiet'],
  'tudor-black-bay-58-m79030n': ['classic', 'story', 'daily', 'history', 'archive'],
  'rolex-submariner-date-126610ln': ['statement', 'classic', 'story', 'history', 'daily'],
  'omega-speedmaster-professional-moonwatch-sapphire': [
    'statement',
    'classic',
    'story',
    'machine',
    'history',
    'conversation',
  ],
  'cartier-tank-must-large-wsta0041': ['quiet', 'classic', 'form', 'history'],
  'grand-seiko-snowflake-sbga211': ['quiet', 'odd', 'machine', 'conversation', 'daily'],
  'rolex-gmt-master-ii-pepsi-126710blro': ['statement', 'character', 'archive', 'conversation'],
  'jaeger-lecoultre-reverso-classic-monoface': ['classic', 'odd', 'form', 'conversation', 'archive'],
  'audemars-piguet-royal-oak-jumbo-16202st': ['statement', 'machine', 'form', 'archive', 'conversation'],
}

const INQUIRY_QUESTIONS = [
  {
    number: '01',
    title: 'WHAT ARE YOU DRAWN TO?',
    key: 'q1' as const,
    options: [
      { id: 'quiet', label: 'THE QUIET OBJECT' },
      { id: 'statement', label: 'THE STATEMENT' },
      { id: 'classic', label: 'THE CLASSIC' },
      { id: 'odd', label: 'THE ODD ONE' },
    ],
  },
  {
    number: '02',
    title: 'WHAT MAKES A WATCH WORTH YOUR TIME?',
    key: 'q2' as const,
    options: [
      { id: 'story', label: 'THE STORY' },
      { id: 'machine', label: 'THE MACHINE' },
      { id: 'form', label: 'THE FORM' },
      { id: 'character', label: 'THE CHARACTER' },
    ],
  },
  {
    number: '03',
    title: 'WHAT KIND OF WATCH ARE YOU LOOKING FOR?',
    key: 'q3' as const,
    options: [
      { id: 'daily', label: 'A DAILY COMPANION' },
      { id: 'conversation', label: 'A CONVERSATION PIECE' },
      { id: 'history', label: 'A PIECE OF HISTORY' },
      { id: 'archive', label: 'AN ARCHIVE FIND' },
    ],
  },
]

export default function RandomWatchPage() {
  const [allWatches, setAllWatches] = useState<Watch[]>([])
  const [watch, setWatch] = useState<Watch | null>(null)
  const [loading, setLoading] = useState(true)
  const [drawing, setDrawing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEmpty, setIsEmpty] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Inquiry ritual state
  const [step, setStep] = useState<'inquiry' | 'consulting' | 'specimen'>('inquiry')
  const [q1, setQ1] = useState<string | null>(null)
  const [q2, setQ2] = useState<string | null>(null)
  const [q3, setQ3] = useState<string | null>(null)

  const isMountedRef = useRef(true)
  const { navigate } = useRouter()

  // Load verified archive from Supabase upon mount
  useEffect(() => {
    isMountedRef.current = true

    const loadArchive = async () => {
      setLoading(true)
      setError(null)
      const result = await fetchWatches()

      if (!isMountedRef.current) return

      if (result.error) {
        setError(result.error.message)
      } else if (!result.data || result.data.length === 0) {
        setIsEmpty(true)
      } else {
        setAllWatches(result.data)
      }
      setLoading(false)
    }

    loadArchive()

    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Core selection algorithm: selects a real watch from public.watches matching user affinity
  const pickSpecimen = (excludeId?: string): Watch | null => {
    if (allWatches.length === 0) return null

    const activeChoices = [q1, q2, q3].filter(Boolean) as string[]

    let candidatePool: Watch[] = allWatches

    if (activeChoices.length > 0) {
      // Score each watch based on affinity match count
      const scored = allWatches.map((w) => {
        const affinities = WATCH_AFFINITIES[w.slug] || []
        const score = activeChoices.filter((choice) => affinities.includes(choice)).length
        return { watch: w, score }
      })

      // Determine highest score
      scored.sort((a, b) => b.score - a.score)
      const maxScore = scored[0]?.score ?? 0

      // Get all watches in the top affinity tier
      const topTier = scored.filter((s) => s.score === maxScore).map((s) => s.watch)
      if (topTier.length > 0) {
        candidatePool = topTier
      }
    }

    // Filter out the excluded watch if more than one candidate exists
    const filteredPool =
      excludeId && candidatePool.length > 1
        ? candidatePool.filter((w) => w.id !== excludeId)
        : candidatePool

    const finalPool = filteredPool.length > 0 ? filteredPool : allWatches
    const randomIndex = Math.floor(Math.random() * finalPool.length)
    return finalPool[randomIndex]
  }

  // Open the archive with chosen inquiries
  const handleOpenArchive = () => {
    if (allWatches.length === 0) return
    setStep('consulting')

    setTimeout(() => {
      if (!isMountedRef.current) return
      const selected = pickSpecimen()
      setWatch(selected)
      setImageError(false)
      setStep('specimen')
    }, 450)
  }

  // Draw another specimen from archive
  const handleDrawAnother = () => {
    if (drawing || allWatches.length === 0) return
    setDrawing(true)

    setTimeout(() => {
      if (!isMountedRef.current) return
      const nextWatch = pickSpecimen(watch?.id)
      setWatch(nextWatch)
      setImageError(false)
      setDrawing(false)
    }, 250)
  }

  // Return to the 3-question inquiry
  const handleReEnterInquiry = () => {
    setStep('inquiry')
  }

  const allQuestionsAnswered = Boolean(q1 && q2 && q3)

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        {/* Navigation Breadcrumb */}
        <div className="mb-8 sm:mb-12">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-ink-secondary hover:text-ink transition-colors"
          >
            &larr; <span>BACK TO EXPLORE</span>
          </Link>
        </div>

        {/* Editorial Masthead */}
        <div className="border-b border-hairline pb-8 mb-12 sm:mb-16">
          <div className="flex items-center gap-2 mb-3 text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-ink-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
            <span>SPECIMEN VAULT // ARCHIVAL RANDOM ACCESS</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-ink uppercase">
            Random Access
          </h1>
          <p className="mt-3 text-base sm:text-lg text-ink-secondary max-w-2xl font-light leading-relaxed">
            Three questions. One specimen. A timepiece selected without prejudice from the MOERI &amp; JEANNERET central archive.
          </p>
        </div>

        {/* 1. Loading State */}
        {loading && (
          <div className="border border-hairline bg-warm-surface/30 p-12 sm:p-20 text-center max-w-3xl mx-auto">
            <div className="w-10 h-10 mx-auto mb-6 flex items-center justify-center border border-hairline bg-warm-white">
              <svg
                className="w-5 h-5 text-steel animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
              </svg>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-ink uppercase">
              Connecting to Archive...
            </h2>
            <p className="mt-3 text-xs sm:text-sm font-mono tracking-widest text-ink-muted uppercase">
              INITIALIZING SPECIMEN VAULT...
            </p>
          </div>
        )}

        {/* 2. Error State */}
        {!loading && error && (
          <div className="border border-hairline bg-warm-surface/40 p-8 sm:p-14 text-center max-w-2xl mx-auto">
            <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center border border-hairline bg-warm-white text-ink">
              <svg
                className="w-5 h-5 text-ink-secondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-2">
              DISPATCH // NOTICE
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-ink uppercase">
              Archive Query Error
            </h2>
            <p className="mt-3 text-sm text-ink-secondary font-light max-w-md mx-auto">
              {error || 'Unable to retrieve specimens from the central archive.'}
            </p>
            <div className="mt-8">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setLoading(true)
                  fetchWatches().then((res) => {
                    if (res.data) setAllWatches(res.data)
                    if (res.error) setError(res.error.message)
                    setLoading(false)
                  })
                }}
              >
                RETRY ARCHIVE ACCESS &rarr;
              </Button>
            </div>
          </div>
        )}

        {/* 3. Empty State */}
        {!loading && !error && (isEmpty || allWatches.length === 0) && (
          <div className="border border-hairline bg-warm-surface/30 p-12 sm:p-20 text-center max-w-2xl mx-auto">
            <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center border border-hairline bg-warm-white text-ink">
              <svg
                className="w-5 h-5 text-ink-secondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-2">
              INDEX STATUS
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-ink uppercase">
              Archive Empty // No Specimens Cataloged
            </h2>
            <p className="mt-3 text-sm text-ink-secondary font-light max-w-md mx-auto">
              The central watch index currently contains no cataloged records.
            </p>
            <div className="mt-8">
              <Button variant="primary" size="sm" onClick={() => navigate('/watches')}>
                VIEW WATCH INDEX &rarr;
              </Button>
            </div>
          </div>
        )}

        {/* 4. Inquiry Ritual View — Three Questions */}
        {!loading && !error && allWatches.length > 0 && step === 'inquiry' && (
          <div className="max-w-3xl mx-auto">
            <div className="border border-hairline bg-warm-surface/20 p-6 sm:p-10 lg:p-12">
              {INQUIRY_QUESTIONS.map((q, qIndex) => {
                const currentVal = q.key === 'q1' ? q1 : q.key === 'q2' ? q2 : q3
                const setter = q.key === 'q1' ? setQ1 : q.key === 'q2' ? setQ2 : setQ3

                return (
                  <div key={q.key}>
                    {/* Question Header */}
                    <div className="mb-6">
                      <div className="text-[11px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-2">
                        [ {q.number} ]
                      </div>
                      <h2 className="font-display text-xl sm:text-2xl font-normal tracking-tight text-ink uppercase">
                        {q.title}
                      </h2>
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {q.options.map((opt) => {
                        const isSelected = currentVal === opt.id
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setter(opt.id)}
                            className={`group border p-4 text-left font-mono text-xs tracking-[0.16em] uppercase transition-all duration-200 cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'border-ink bg-warm-surface font-semibold text-ink shadow-sm'
                                : 'border-hairline bg-warm-white text-ink-secondary hover:border-ink hover:text-ink hover:bg-warm-surface/40'
                            }`}
                          >
                            <span>{opt.label}</span>
                            <span
                              className={`w-2 h-2 rounded-full transition-colors ${
                                isSelected ? 'bg-steel' : 'border border-hairline bg-transparent'
                              }`}
                              aria-hidden="true"
                            />
                          </button>
                        )
                      })}
                    </div>

                    {/* Connector Arrow between questions */}
                    {qIndex < INQUIRY_QUESTIONS.length - 1 && (
                      <div
                        className="my-8 sm:my-10 flex justify-center text-ink-muted font-mono text-lg select-none"
                        aria-hidden="true"
                      >
                        &darr;
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Final Connector Arrow to Open Archive */}
              <div
                className="my-8 sm:my-10 flex justify-center text-ink-muted font-mono text-lg select-none"
                aria-hidden="true"
              >
                &darr;
              </div>

              {/* Submit / Open Action */}
              <div className="flex flex-col items-center gap-4 text-center">
                <Button
                  variant="primary"
                  size="lg"
                  disabled={!allQuestionsAnswered}
                  onClick={handleOpenArchive}
                  className="w-full sm:w-auto min-w-[280px]"
                >
                  OPEN THE ARCHIVE &rarr;
                </Button>

                {!allQuestionsAnswered && (
                  <p className="text-xs font-mono tracking-widest text-ink-muted uppercase">
                    ANSWER ALL THREE INQUIRIES TO OPEN SPECIMEN
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setQ1(null)
                    setQ2(null)
                    setQ3(null)
                    handleOpenArchive()
                  }}
                  className="text-[11px] font-mono tracking-[0.18em] text-ink-muted hover:text-ink uppercase transition-colors underline cursor-pointer mt-2"
                >
                  OR DRAW WITHOUT INQUIRY &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. Consulting State */}
        {step === 'consulting' && (
          <div className="border border-hairline bg-warm-surface/30 p-12 sm:p-20 text-center max-w-3xl mx-auto">
            <div className="w-10 h-10 mx-auto mb-6 flex items-center justify-center border border-hairline bg-warm-white">
              <svg
                className="w-5 h-5 text-steel animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
              </svg>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-ink uppercase">
              Opening Central Archive...
            </h2>
            <p className="mt-3 text-xs sm:text-sm font-mono tracking-widest text-ink-muted uppercase">
              CONSULTING VERIFIED ARCHIVE SPECIMENS...
            </p>
          </div>
        )}

        {/* 6. Success State — Specimen Selected View */}
        {!loading && !error && watch && step === 'specimen' && (
          <div className="border border-hairline bg-warm-surface/20">
            {/* Specimen Instrument Status Bar */}
            <div className="flex flex-wrap items-center justify-between border-b border-hairline p-4 sm:px-8 text-[10px] font-mono tracking-[0.2em] text-ink-secondary uppercase gap-2 bg-warm-surface/40">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
                <span className="font-semibold text-ink">SPECIMEN SELECTED</span>
                <span>&bull;</span>
                <span>CATALOG SPECIMEN // {watch.slug}</span>
              </div>
              <div className="flex items-center gap-3 text-ink-muted">
                <span>MODE: RANDOM ACCESS</span>
                <span>&bull;</span>
                <span>SOURCE: CENTRAL ARCHIVE</span>
              </div>
            </div>

            {/* Specimen Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 p-6 sm:p-10 lg:p-12 items-start">
              {/* Left Column: Specimen Photography Frame (7 cols) */}
              <div className="lg:col-span-7">
                <div className="relative border border-hairline bg-warm-surface overflow-hidden">
                  <div className="aspect-[4/3] sm:aspect-[16/11] w-full">
                    {watch.image_url && !imageError ? (
                      <img
                        src={watch.image_url}
                        alt={`${watch.brand} ${watch.model}`}
                        className="h-full w-full object-cover object-center transition-opacity duration-300"
                        onError={() => setImageError(true)}
                        loading="eager"
                      />
                    ) : (
                      <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center bg-warm-surface text-ink-muted">
                        <svg
                          className="w-10 h-10 text-ink-muted/50 mb-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.2}
                          aria-hidden="true"
                        >
                          <circle cx="12" cy="12" r="9" />
                          <line x1="12" y1="6" x2="12" y2="12" />
                          <line x1="12" y1="12" x2="16" y2="14" />
                        </svg>
                        <span className="text-xs font-mono tracking-[0.2em] uppercase">
                          SPECIMEN PHOTOGRAPHY PENDING
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footplate Specimen Tag */}
                  <div className="p-3.5 border-t border-hairline bg-warm-white flex items-center justify-between text-[10px] font-mono tracking-[0.18em] uppercase text-ink">
                    <span>SPECIMEN VERIFIED</span>
                    <span className="text-steel font-semibold">REF. {watch.reference_number}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Specimen Dossier & Actions (5 cols) */}
              <div className="lg:col-span-5 flex flex-col justify-between">
                <div>
                  {/* Brand & Release Year Folio */}
                  <div className="flex items-center gap-2.5 text-[11px] font-mono uppercase tracking-[0.24em] text-ink-secondary mb-2">
                    <span>{watch.brand}</span>
                    {watch.release_year && (
                      <>
                        <span className="text-ink-muted">&bull;</span>
                        <span className="text-ink-muted">{watch.release_year}</span>
                      </>
                    )}
                  </div>

                  {/* Model Name */}
                  <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight text-ink uppercase leading-snug">
                    {watch.model}
                  </h2>

                  {/* Reference Number */}
                  <div className="mt-2 text-xs font-mono text-ink-muted tracking-wider uppercase">
                    REFERENCE: {watch.reference_number || '—'}
                  </div>

                  {/* Concise Description */}
                  {watch.description && (
                    <p className="mt-5 text-sm sm:text-base text-ink-secondary font-light leading-relaxed border-t border-hairline pt-4">
                      {watch.description}
                    </p>
                  )}

                  {/* Technical Specimen Matrix */}
                  <div className="mt-6 pt-5 border-t border-hairline">
                    <div className="text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-3">
                      SPECIFICATION DOSSIER
                    </div>
                    <dl className="space-y-2.5 text-xs font-mono">
                      <div className="flex items-baseline justify-between border-b border-hairline/60 pb-1.5">
                        <dt className="text-ink-muted uppercase tracking-wider">Movement</dt>
                        <dd className="text-ink font-medium tracking-wide">
                          {watch.movement_type || '—'}
                        </dd>
                      </div>

                      <div className="flex items-baseline justify-between border-b border-hairline/60 pb-1.5">
                        <dt className="text-ink-muted uppercase tracking-wider">Calibre</dt>
                        <dd className="text-ink font-medium tracking-wide">
                          {watch.calibre || watch.movement_name || '—'}
                        </dd>
                      </div>

                      <div className="flex items-baseline justify-between border-b border-hairline/60 pb-1.5">
                        <dt className="text-ink-muted uppercase tracking-wider">Case Diameter</dt>
                        <dd className="text-ink font-medium tracking-wide">
                          {watch.case_diameter_mm ? `${watch.case_diameter_mm} mm` : '—'}
                        </dd>
                      </div>

                      <div className="flex items-baseline justify-between border-b border-hairline/60 pb-1.5">
                        <dt className="text-ink-muted uppercase tracking-wider">Case Material</dt>
                        <dd className="text-ink font-medium tracking-wide">
                          {watch.case_material || '—'}
                        </dd>
                      </div>

                      <div className="flex items-baseline justify-between border-b border-hairline/60 pb-1.5">
                        <dt className="text-ink-muted uppercase tracking-wider">Water Resistance</dt>
                        <dd className="text-ink font-medium tracking-wide">
                          {watch.water_resistance_m ? `${watch.water_resistance_m} m` : '—'}
                        </dd>
                      </div>

                      <div className="flex items-baseline justify-between border-b border-hairline/60 pb-1.5">
                        <dt className="text-ink-muted uppercase tracking-wider">Estimated Value</dt>
                        <dd className="text-ink font-medium tracking-wide">
                          {watch.price !== null
                            ? `$${watch.price.toLocaleString()} ${watch.currency}`
                            : '—'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-8 pt-6 border-t border-hairline flex flex-col gap-3">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => navigate(`/watches/${watch.slug}`)}
                    className="w-full"
                  >
                    VIEW WATCH DOSSIER &rarr;
                  </Button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      variant="secondary"
                      size="md"
                      disabled={drawing}
                      onClick={handleDrawAnother}
                      className="w-full"
                    >
                      {drawing ? 'DRAWING...' : 'DRAW ANOTHER SPECIMEN &rarr;'}
                    </Button>

                    <button
                      type="button"
                      onClick={handleReEnterInquiry}
                      className="border border-hairline bg-warm-white text-ink-secondary hover:border-ink hover:text-ink text-xs font-mono tracking-[0.16em] uppercase py-3 px-4 transition-colors cursor-pointer text-center"
                    >
                      &larr; RE-ENTER INQUIRY
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  )
}
