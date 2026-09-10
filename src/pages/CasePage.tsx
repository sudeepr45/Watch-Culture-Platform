import { useEffect, useState, useMemo, useRef, useCallback } from 'react'
import Container from '../components/common/Container'
import Button from '../components/common/Button'
import { Link } from '../router'
import { useRouter } from '../router/useRouter'
import { useAuth } from '../context/useAuth'
import { fetchWatches, fetchWatchBySlug, fetchRandomWatch } from '../services/watchService'
import { searchWatches } from '../services/searchService'
import {
  isWatchInCollection,
  addWatchToCollection,
  removeWatchFromCollection,
} from '../services/collectionService'
import { evaluateWatchContender } from '../services/evaluationEngine'
import type { ContenderEvaluation } from '../types/evaluation'
import type { Watch } from '../types/watch'

// User Priority Options
export type UserPriorityKey =
  | 'EVERYDAY WEAR'
  | 'CRAFT & MECHANICS'
  | 'DESIGN'
  | 'HERITAGE'
  | 'VALUE'

export type CompromiseTolerance = 'VERY LITTLE' | 'SOME' | "I'M FLEXIBLE"

export type VerdictResult = 'BUY' | 'CONSIDER' | 'PASS'

const PRIORITY_OPTIONS: { key: UserPriorityKey; label: string; pillarHint: string }[] = [
  { key: 'EVERYDAY WEAR', label: 'EVERYDAY WEAR', pillarHint: 'Ergonomics, thickness, daily versatility' },
  { key: 'CRAFT & MECHANICS', label: 'CRAFT & MECHANICS', pillarHint: 'Calibre pedigree, regulation, power reserve' },
  { key: 'DESIGN', label: 'DESIGN', pillarHint: 'Case architecture, metallurgy, crystal, finishing' },
  { key: 'HERITAGE', label: 'HERITAGE', pillarHint: 'Lineage milestones, provenance, brand standing' },
  { key: 'VALUE', label: 'VALUE', pillarHint: 'Substance-to-price ratio relative to market tier' },
]

const COMPROMISE_OPTIONS: { key: CompromiseTolerance; label: string; desc: string }[] = [
  { key: 'VERY LITTLE', label: 'VERY STRICT', desc: "Don't overlook important weaknesses." },
  { key: 'SOME', label: 'BALANCED', desc: 'Allow some trade-offs.' },
  { key: "I'M FLEXIBLE", label: 'OPEN-MINDED', desc: 'Judge the watch as a whole.' },
]

interface CasePageProps {
  initialSlug?: string
}

export default function CasePage({ initialSlug }: CasePageProps) {
  const { navigate } = useRouter()
  const { user, isAuthenticated } = useAuth()

  // Selected Specimen State
  const [selectedWatch, setSelectedWatch] = useState<Watch | null>(null)
  const [loadingSpecimen, setLoadingSpecimen] = useState(false)
  const [specimenError, setSpecimenError] = useState<string | null>(null)

  // Catalog Specimen Pool & Search State
  const [allWatches, setAllWatches] = useState<Watch[]>([])
  const [loadingPool, setLoadingPool] = useState(true)
  const [poolError, setPoolError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Watch[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [drawingRandom, setDrawingRandom] = useState(false)

  // User Priorities State
  const [selectedPriorities, setSelectedPriorities] = useState<UserPriorityKey[]>([
    'EVERYDAY WEAR',
    'VALUE',
  ])
  const [compromiseTolerance, setCompromiseTolerance] = useState<CompromiseTolerance>('SOME')

  // Collection State
  const [inCollection, setInCollection] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const isMountedRef = useRef(true)

  // 1. Initial Load: Pre-load complete central archive pool
  useEffect(() => {
    isMountedRef.current = true

    fetchWatches().then((result) => {
      if (!isMountedRef.current) return
      if (result.error) {
        setPoolError(result.error.message)
      } else if (result.data) {
        setAllWatches(result.data)
      }
      setLoadingPool(false)
    })

    return () => {
      isMountedRef.current = false
    }
  }, [])

  // 2. Resolve URL Slug (from prop or query string ?slug=...)
  useEffect(() => {
    let isMounted = true
    const activeSlug =
      initialSlug ||
      (typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('slug') || undefined
        : undefined)

    if (!activeSlug) {
      return
    }

    const loadSpecimen = async () => {
      setLoadingSpecimen(true)
      setSpecimenError(null)

      const result = await fetchWatchBySlug(activeSlug)
      if (!isMounted) return

      if (result.error) {
        setSpecimenError(result.error.message)
        setSelectedWatch(null)
      } else if (!result.data) {
        setSpecimenError(`No verified record found for specimen reference "${activeSlug}".`)
        setSelectedWatch(null)
      } else {
        setSelectedWatch(result.data)
      }
      setLoadingSpecimen(false)
    }

    loadSpecimen()

    return () => {
      isMounted = false
    }
  }, [initialSlug])

  // 3. Debounced Archive Search
  useEffect(() => {
    const trimmed = searchQuery.trim()
    if (!trimmed) {
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true)
      const result = await searchWatches(trimmed)
      if (!isMountedRef.current) return
      setSearchResults(result.data || [])
      setIsSearching(false)
    }, 200)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  // 4. Collection Status Synchronization
  useEffect(() => {
    let isMounted = true

    if (selectedWatch?.id && user?.id) {
      isWatchInCollection(user.id, selectedWatch.id).then((result) => {
        if (!isMounted) return
        setInCollection(result.inCollection)
      })
    }

    return () => {
      isMounted = false
    }
  }, [selectedWatch?.id, user?.id])

  // 5. Deterministic 5-Pillar Evaluation (Untouched Phase 2H Engine)
  const evaluation: ContenderEvaluation | null = useMemo(() => {
    if (!selectedWatch) return null
    return evaluateWatchContender(selectedWatch)
  }, [selectedWatch])

  // 6. Buying Dimensions Translation & Case Evidence Derivation
  const caseEvidence = useMemo(() => {
    if (!selectedWatch || !evaluation) return null

    const watch = selectedWatch
    const scores = evaluation.scores

    // Evidence FOR (short, positive facts grounded in real data)
    const positivePoints: string[] = []

    // Evidence AGAINST (short, factual compromises grounded in real data)
    const compromisePoints: string[] = []

    // 1. Calibre / Movement & Autonomy
    if (watch.movement_type?.toLowerCase().includes('quartz') || watch.movement_name?.toLowerCase().includes('quartz')) {
      positivePoints.push('High-accuracy quartz movement with multi-year battery autonomy')
    } else if (watch.power_reserve_hours && watch.power_reserve_hours >= 60) {
      positivePoints.push(`${watch.power_reserve_hours}-hour power reserve (weekend-proof autonomy)`)
    } else if (scores.engineering >= 75) {
      positivePoints.push(`${watch.calibre || watch.movement_type || 'In-house'} calibre with proven mechanical precision`)
    }

    if (watch.power_reserve_hours && watch.power_reserve_hours <= 42) {
      compromisePoints.push(`${watch.power_reserve_hours}-hour power reserve requires regular winding if rotated off-wrist.`)
    } else if (scores.engineering < 55) {
      compromisePoints.push('Basic movement architecture without advanced regulation or silicon components.')
    }

    // 2. Case Materials & Crystal
    if (watch.crystal?.toLowerCase().includes('sapphire')) {
      positivePoints.push('Synthetic sapphire crystal provides premium scratch resistance')
    } else if (watch.crystal) {
      compromisePoints.push(`${watch.crystal} scratches more easily than synthetic sapphire.`)
    }

    if (watch.case_material) {
      positivePoints.push(`${watch.case_material} case construction`)
    }

    // 3. Water Resistance
    const wr = watch.water_resistance_m
    if (wr !== null && wr >= 100) {
      positivePoints.push(`${wr} m water resistance for confident aquatic resilience`)
    } else if (wr !== null && wr < 50) {
      compromisePoints.push(`${wr} m water resistance requires caution around water and heavy rain.`)
    }

    // 4. Case Dimensions & Ergonomics
    if (watch.case_diameter_mm && watch.case_diameter_mm >= 43.0) {
      compromisePoints.push(`${watch.case_diameter_mm} mm case diameter wears prominently on smaller wrists.`)
    }
    if (watch.case_thickness_mm && watch.case_thickness_mm >= 13.5) {
      compromisePoints.push(`${watch.case_thickness_mm} mm thickness has noticeable height under shirt cuffs.`)
    }
    if (watch.lug_to_lug_mm && watch.lug_to_lug_mm >= 50.0) {
      compromisePoints.push(`${watch.lug_to_lug_mm} mm lug span may create slight overhang on wrists under 6.75".`)
    }

    if (watch.case_thickness_mm && watch.case_thickness_mm <= 12.0) {
      positivePoints.push(`Slim ${watch.case_thickness_mm} mm case profile offers comfortable everyday wear`)
    } else if (scores.wearability >= 75) {
      positivePoints.push('Balanced case ergonomics suited for everyday wear')
    }

    // 5. Value & Price
    if (watch.price !== null && watch.price <= 200) {
      positivePoints.push(`Accessible $${watch.price.toLocaleString()} ${watch.currency} entry price`)
    } else if (scores.value >= 75 && watch.price !== null) {
      positivePoints.push(`High substance-to-price ratio at $${watch.price.toLocaleString()} ${watch.currency}`)
    } else if (scores.value < 55 && watch.price !== null) {
      compromisePoints.push(`$${watch.price.toLocaleString()} ${watch.currency} price reflects brand demand and prestige over pure component yield.`)
    }

    // 6. Heritage & Lineage
    if (scores.heritage >= 75) {
      positivePoints.push(`Distinguished horological lineage and recognized standing from ${watch.brand}`)
    } else if (scores.heritage < 55) {
      compromisePoints.push('Heritage depth is limited compared with historic manufacture watchmakers.')
    }

    // Fallbacks if lists are empty
    if (positivePoints.length === 0) {
      positivePoints.push(`Proven ${watch.brand} manufacturing standards and reliable daily execution`)
    }
    if (compromisePoints.length === 0) {
      compromisePoints.push('Requires standard mechanical service intervals to maintain factory tolerances.')
    }

    return {
      positivePoints,
      compromisePoints,
    }
  }, [selectedWatch, evaluation])

  // 7. Deterministic Personalized Verdict Engine
  const verdictData = useMemo<{
    verdict: VerdictResult
    why: string
    thinkTwiceIf: string
    alignmentScore: number
    priorityLabels: string
    strictnessLabel: string
  } | null>(() => {
    if (!selectedWatch || !evaluation) return null

    const scores = evaluation.scores
    const watch = selectedWatch

    // Map user priorities to scores
    const priorityScoreMap: Record<UserPriorityKey, number> = {
      'EVERYDAY WEAR': scores.wearability,
      'CRAFT & MECHANICS': scores.engineering,
      'DESIGN': Math.round((scores.materials * 0.55 + scores.wearability * 0.45) * 10) / 10,
      'HERITAGE': scores.heritage,
      'VALUE': scores.value,
    }

    // Compute Alignment Index
    let alignmentScore = evaluation.overallScore
    if (selectedPriorities.length > 0) {
      const sum = selectedPriorities.reduce((acc, p) => acc + priorityScoreMap[p], 0)
      alignmentScore = Math.round((sum / selectedPriorities.length) * 10) / 10
    }

    // Evaluate against compromise tolerance
    let verdict: VerdictResult

    if (compromiseTolerance === 'VERY LITTLE') {
      // Strict standard: alignment must be high, overall must be solid
      if (alignmentScore >= 76 && evaluation.overallScore >= 70) {
        verdict = 'BUY'
      } else if (alignmentScore < 60 || evaluation.overallScore < 55) {
        verdict = 'PASS'
      } else {
        verdict = 'CONSIDER'
      }
    } else if (compromiseTolerance === 'SOME') {
      // Balanced standard
      if (alignmentScore >= 68 && evaluation.overallScore >= 62) {
        verdict = 'BUY'
      } else if (alignmentScore < 52 || evaluation.overallScore < 48) {
        verdict = 'PASS'
      } else {
        verdict = 'CONSIDER'
      }
    } else {
      // "I'M FLEXIBLE": Forgiving standard
      if (alignmentScore >= 60 && evaluation.overallScore >= 58) {
        verdict = 'BUY'
      } else if (alignmentScore < 45 && evaluation.overallScore < 45) {
        verdict = 'PASS'
      } else {
        verdict = 'CONSIDER'
      }
    }

    // Tension overrides based on explicit priority choices
    const hasValuePriority = selectedPriorities.includes('VALUE')
    const hasEverydayPriority = selectedPriorities.includes('EVERYDAY WEAR')

    if (hasValuePriority && scores.value < 52 && compromiseTolerance === 'VERY LITTLE') {
      verdict = 'CONSIDER'
    }
    if (hasEverydayPriority && scores.wearability < 55 && compromiseTolerance === 'VERY LITTLE') {
      verdict = 'CONSIDER'
    }

    // Construct Contextual Editorial Rationale
    const priorityLabels =
      selectedPriorities.length > 0
        ? selectedPriorities.join(' and ').toLowerCase()
        : 'overall horological merit'

    const strictnessLabel =
      compromiseTolerance === 'VERY LITTLE'
        ? 'VERY STRICT'
        : compromiseTolerance === 'SOME'
        ? 'BALANCED'
        : 'OPEN-MINDED'

    let why: string
    let thinkTwiceIf: string

    if (verdict === 'BUY') {
      why = `The ${watch.brand} ${watch.model} aligns strongly with your focus on ${priorityLabels}. Its core specifications deliver genuine substance where you prioritize it most, with no disqualifying compromises under a ${strictnessLabel.toLowerCase()} evaluation.`
      thinkTwiceIf =
        scores.value < 65
          ? 'You expect maximum dollar-for-spec yields; market pricing reflects luxury cachet over sheer feature count.'
          : watch.case_diameter_mm && watch.case_diameter_mm >= 43.0
          ? `You have slender wrists; the ${watch.case_diameter_mm} mm case has substantial physical presence.`
          : 'Your aesthetic leans toward unconventional silhouettes rather than established genre archetypes.'
    } else if (verdict === 'CONSIDER') {
      why = `A compelling timepiece with genuine merit, but one that presents noticeable trade-offs for a ${priorityLabels}-focused decision. It warrants buying only if you are comfortable balancing its specific compromises against your priorities under a ${strictnessLabel.toLowerCase()} standard.`
      thinkTwiceIf =
        selectedPriorities.length > 0
          ? `You are unwilling to compromise on ${priorityLabels}. There are more focused references if you demand absolute optimization.`
          : 'You are looking for an uncompromising specialist rather than an all-around contender.'
    } else {
      why = `The ${watch.brand} ${watch.model} struggles to make a convincing case when evaluated specifically for ${priorityLabels}. Friction between its specifications and your priorities outweighs its overall appeal under a ${strictnessLabel.toLowerCase()} standard.`
      thinkTwiceIf =
        'You have a strong personal or emotional connection to this reference that outweighs analytical specification matching.'
    }

    return {
      verdict,
      why,
      thinkTwiceIf,
      alignmentScore,
      priorityLabels,
      strictnessLabel,
    }
  }, [selectedWatch, evaluation, selectedPriorities, compromiseTolerance])

  // Handlers
  const handleSelectSpecimen = useCallback(
    (watch: Watch) => {
      setSelectedWatch(watch)
      setSpecimenError(null)
      setSearchQuery('')
      setSearchResults([])
      setInCollection(false)
      navigate(`/case?slug=${watch.slug}`)
    },
    [navigate]
  )

  const handleSearchQueryChange = (val: string) => {
    setSearchQuery(val)
    if (!val.trim()) {
      setSearchResults([])
      setIsSearching(false)
    }
  }

  const handleDrawRandomSpecimen = async () => {
    if (drawingRandom) return
    setDrawingRandom(true)

    const result = await fetchRandomWatch(selectedWatch?.id)
    if (!isMountedRef.current) return
    setDrawingRandom(false)

    if (result.data) {
      handleSelectSpecimen(result.data)
    }
  }

  const handleClearSelection = () => {
    setSelectedWatch(null)
    setSpecimenError(null)
    setInCollection(false)
    navigate('/case')
  }

  const handleTogglePriority = (priority: UserPriorityKey) => {
    setSelectedPriorities((prev) => {
      if (prev.includes(priority)) {
        return prev.filter((p) => p !== priority)
      }
      if (prev.length >= 2) {
        // Replace oldest
        return [prev[1], priority]
      }
      return [...prev, priority]
    })
  }

  const handleAddToCollection = async () => {
    if (!isAuthenticated || !user) {
      navigate('/login')
      return
    }
    if (!selectedWatch || inCollection || actionLoading) return

    setActionLoading(true)
    setActionError(null)

    const result = await addWatchToCollection(user.id, selectedWatch.id)
    if (!isMountedRef.current) return
    setActionLoading(false)

    if (result.success) {
      setInCollection(true)
    } else {
      setActionError(result.error || 'Failed to add watch to your wrist.')
    }
  }

  const handleRemoveFromCollection = async () => {
    if (!user || !selectedWatch || actionLoading) return

    setActionLoading(true)
    setActionError(null)

    const result = await removeWatchFromCollection(user.id, selectedWatch.id)
    if (!isMountedRef.current) return
    setActionLoading(false)

    if (result.success) {
      setInCollection(false)
    } else {
      setActionError(result.error || 'Failed to remove watch from your wrist.')
    }
  }

  // Active specimen search display pool
  const displayedPool = searchQuery.trim() ? searchResults : allWatches

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        {/* ================================================================== */}
        {/* EDITORIAL MASTHEAD                                                 */}
        {/* ================================================================== */}
        <div className="border-b border-hairline pb-8 mb-10 sm:mb-12">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2 text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-ink-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
              <span>WORTH IT? // DISCOVER • EXAMINE • DECIDE</span>
            </div>

            {selectedWatch && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-xs font-mono tracking-[0.16em] uppercase text-ink-secondary hover:text-ink transition-colors cursor-pointer"
              >
                &larr; SELECT ANOTHER WATCH
              </button>
            )}
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-ink uppercase">
            Worth It?
          </h1>
          <p className="mt-2 text-base sm:text-lg font-light text-ink">
            See the facts. Decide if it's worth it for you.
          </p>

          {/* Simple "HOW IT WORKS" Intro */}
          <div className="mt-6 pt-5 border-t border-hairline/80 max-w-3xl">
            <div className="text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-3 font-semibold">
              HOW IT WORKS
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono text-ink">
              <div className="flex items-baseline gap-2">
                <span className="text-steel font-bold">1.</span>
                <span>Choose what matters to you.</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-steel font-bold">2.</span>
                <span>Tell us how strict you are.</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-steel font-bold">3.</span>
                <span>See the important facts.</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-steel font-bold">4.</span>
                <span>Get your verdict.</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* VIEW A: OPENING SCREEN (DISCOVER / SEARCH / DRAW)                   */}
        {/* ================================================================== */}
        {!selectedWatch && (
          <div className="space-y-10">
            {/* Search & Draw Action Strip */}
            <div className="border border-hairline bg-warm-surface/20 p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                {/* Search Input */}
                <div className="w-full lg:max-w-xl">
                  <div className="text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-2">
                    WHAT ARE WE LOOKING AT?
                  </div>
                  <label htmlFor="case-search-input" className="sr-only">
                    Search the central archive by brand, model, or reference
                  </label>
                  <div className="relative">
                    <input
                      id="case-search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchQueryChange(e.target.value)}
                      placeholder="SEARCH THE CENTRAL ARCHIVE (e.g. Submariner, Speedmaster, 126610)..."
                      className="w-full bg-warm-white border border-hairline py-3 px-4 text-xs font-mono text-ink placeholder:text-ink-muted/70 focus:outline-none focus:border-ink transition-colors"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => handleSearchQueryChange('')}
                        aria-label="Clear search query"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-ink-muted hover:text-ink px-1.5 py-0.5"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] font-mono text-ink-secondary">
                    Search the central archive by brand, model, or reference number.
                  </p>
                </div>

                {/* Secondary Route: Draw from the Archive */}
                <div className="border-t lg:border-t-0 lg:border-l border-hairline pt-6 lg:pt-0 lg:pl-8 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-1">
                      OR
                    </div>
                    <div className="text-xs font-mono text-ink font-semibold uppercase">
                      Spontaneous Archival Draw
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button
                      variant="secondary"
                      size="md"
                      disabled={drawingRandom || loadingPool}
                      onClick={handleDrawRandomSpecimen}
                      className="w-full sm:w-auto"
                    >
                      {drawingRandom ? 'CONSULTING ARCHIVE...' : 'DRAW FROM THE ARCHIVE →'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Loading / Error States */}
            {loadingPool && (
              <div className="border border-hairline bg-warm-surface/20 p-12 text-center">
                <span className="font-mono text-xs text-ink-muted uppercase tracking-[0.2em] animate-pulse">
                  CONNECTING TO VERIFIED ARCHIVE RECORDS...
                </span>
              </div>
            )}

            {poolError && (
              <div className="border border-hairline bg-warm-surface/30 p-8 text-center text-xs font-mono text-ink-secondary">
                ARCHIVE ERROR: {poolError}
              </div>
            )}

            {specimenError && (
              <div className="border border-hairline bg-warm-surface/30 p-8 text-center text-xs font-mono text-ink-secondary">
                {specimenError}
              </div>
            )}

            {/* Verified Specimen Grid */}
            {!loadingPool && !poolError && (
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-6 pb-2 border-b border-hairline">
                  <span>
                    {searchQuery.trim()
                      ? `QUERY RESULTS // ${displayedPool.length} MATCHES`
                      : `CATALOGED TIMEPIECES // ${allWatches.length} RECORDS`}
                  </span>
                  <span>{isSearching ? 'FILTERING...' : 'VERIFIED PUBLIC ARCHIVE'}</span>
                </div>

                {displayedPool.length === 0 ? (
                  <div className="border border-hairline bg-warm-surface/10 p-12 text-center">
                    <div className="font-mono text-[10px] tracking-[0.2em] text-ink-muted uppercase mb-2">
                      SPECIMEN NOT FOUND
                    </div>
                    <p className="text-sm font-mono text-ink-secondary mb-6">
                      No verified records found matching &ldquo;{searchQuery}&rdquo;.
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSearchQueryChange('')}
                    >
                      VIEW ALL SPECIMENS &rarr;
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedPool.map((watch) => (
                      <button
                        key={watch.id}
                        type="button"
                        onClick={() => handleSelectSpecimen(watch)}
                        className="group text-left border border-hairline bg-warm-surface/20 hover:border-ink hover:bg-warm-surface/50 transition-colors flex flex-col justify-between overflow-hidden cursor-pointer"
                      >
                        {/* Specimen Photography */}
                        <div className="relative aspect-[16/10] w-full bg-warm-surface border-b border-hairline overflow-hidden">
                          {watch.image_url ? (
                            <img
                              src={watch.image_url}
                              alt={`${watch.brand} ${watch.model}`}
                              loading="lazy"
                              className="h-full w-full object-cover object-center grayscale contrast-125 group-hover:grayscale-0 transition-all duration-500"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-[10px] font-mono text-ink-muted uppercase tracking-widest">
                              SPECIMEN PHOTO PENDING
                            </div>
                          )}

                          {watch.category && (
                            <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-warm-white/90 border border-hairline text-[9px] font-mono tracking-widest uppercase text-ink">
                              {watch.category}
                            </div>
                          )}
                        </div>

                        {/* Specimen Metadata */}
                        <div className="p-5 flex-grow flex flex-col justify-between">
                          <div>
                            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-secondary mb-1">
                              {watch.brand}
                            </div>
                            <h3 className="font-display text-lg uppercase tracking-tight text-ink group-hover:text-ink transition-colors leading-snug">
                              {watch.model}
                            </h3>
                            <div className="mt-2 text-xs font-mono text-ink-muted">
                              REF. {watch.reference_number}
                              {watch.release_year && ` • ${watch.release_year}`}
                            </div>
                          </div>

                          <div className="mt-6 pt-3 border-t border-hairline/60 flex items-center justify-between text-[11px] font-mono">
                            <span className="text-ink font-medium">
                              {watch.price !== null
                                ? `$${watch.price.toLocaleString()} ${watch.currency}`
                                : '—'}
                            </span>
                            <span className="text-ink font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                              EXAMINE &rarr;
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================================================================== */}
        {/* VIEW B: THE EXAMINATION & VERDICT                                  */}
        {/* ================================================================== */}
        {selectedWatch && evaluation && caseEvidence && verdictData && (
          <div className="space-y-12 sm:space-y-16">
            {/* Loading Specimen Overlay */}
            {loadingSpecimen && (
              <div className="p-8 border border-hairline bg-warm-surface/20 text-center font-mono text-xs text-ink-muted uppercase tracking-widest">
                UPDATING CASE FILE...
              </div>
            )}

            {/* 1. Selected Watch: Editorial Identification Plate */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border border-hairline bg-warm-surface/20 p-6 sm:p-8 lg:p-10">
              {/* Specimen Photography (5 cols) */}
              <div className="lg:col-span-5">
                <div className="border border-hairline bg-warm-white overflow-hidden">
                  <div className="aspect-[4/3] w-full bg-warm-surface">
                    {selectedWatch.image_url ? (
                      <img
                        src={selectedWatch.image_url}
                        alt={`${selectedWatch.brand} ${selectedWatch.model}`}
                        className="h-full w-full object-cover object-center"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs font-mono text-ink-muted uppercase tracking-widest">
                        SPECIMEN PHOTO PENDING
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-hairline bg-warm-surface/40 flex items-center justify-between text-[10px] font-mono tracking-widest uppercase text-ink-muted">
                    <span>SPECIMEN ID // {selectedWatch.slug}</span>
                    <span>SOURCE RECORD</span>
                  </div>
                </div>
              </div>

              {/* Specimen Identification Telemetry (7 cols) */}
              <div className="lg:col-span-7 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
                    <span>CATALOG SPECIMEN</span>
                    <span>&bull;</span>
                    <span>REF. {selectedWatch.reference_number}</span>
                    {selectedWatch.release_year && (
                      <>
                        <span>&bull;</span>
                        <span>{selectedWatch.release_year}</span>
                      </>
                    )}
                  </div>

                  <div className="text-sm font-mono tracking-[0.2em] text-ink-secondary uppercase mb-1">
                    {selectedWatch.brand}
                  </div>

                  <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-ink uppercase">
                    {selectedWatch.model}
                  </h2>

                  {selectedWatch.category && (
                    <div className="mt-4 inline-flex items-center gap-2 px-2.5 py-1 border border-hairline bg-warm-white text-[10px] font-mono tracking-widest uppercase text-ink-muted">
                      <span>CATEGORY // {selectedWatch.category}</span>
                      {selectedWatch.style && <span>&bull; {selectedWatch.style}</span>}
                    </div>
                  )}

                  {/* Editorial Description if available */}
                  {selectedWatch.description && (
                    <p className="mt-6 pt-4 border-t border-hairline/60 text-xs sm:text-sm font-mono text-ink-secondary leading-relaxed">
                      {selectedWatch.description}
                    </p>
                  )}
                </div>

                {/* Specimen Controls */}
                <div className="mt-8 pt-6 border-t border-hairline flex flex-wrap items-center gap-3">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/watches/${selectedWatch.slug}`)}
                  >
                    VIEW WATCH DOSSIER &rarr;
                  </Button>

                  {/* Collection Action */}
                  {!isAuthenticated ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate('/login')}
                    >
                      ADD TO MY WRIST &rarr;
                    </Button>
                  ) : inCollection ? (
                    <div className="inline-flex items-center gap-3">
                      <span className="py-2 px-3 border border-hairline bg-warm-white text-xs font-mono text-ink font-semibold">
                        ✓ IN MY WRIST
                      </span>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={handleRemoveFromCollection}
                        className="text-[11px] font-mono text-ink-muted hover:text-ink uppercase underline cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading ? 'UPDATING...' : 'REMOVE'}
                      </button>
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={actionLoading}
                      onClick={handleAddToCollection}
                    >
                      {actionLoading ? 'ADDING...' : 'ADD TO MY WRIST &rarr;'}
                    </Button>
                  )}

                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={drawingRandom}
                    onClick={handleDrawRandomSpecimen}
                  >
                    {drawingRandom ? 'DRAWING...' : 'DRAW ANOTHER SPECIMEN →'}
                  </Button>
                </div>

                {actionError && (
                  <div className="mt-3 text-[11px] font-mono text-rose-800 bg-rose-50 border border-rose-200 p-2 text-center">
                    {actionError}
                  </div>
                )}
              </div>
            </div>

            {/* 2. User Priorities Consultation */}
            <div className="border border-hairline bg-warm-surface/30 p-6 sm:p-8 lg:p-10">
              <div className="border-b border-hairline pb-4 mb-6">
                <div className="text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-1">
                  CALIBRATE THE CALL // USER PRIORITIES
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-normal text-ink uppercase tracking-tight">
                  What Drives Your Decision?
                </h3>
                <p className="mt-1 text-xs font-mono text-ink-secondary">
                  A watch can be horologically exceptional but wrong for you. Configure your priorities to evaluate how this case performs against your expectations.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Question 1: What Matters Most (Select up to 2) */}
                <div className="lg:col-span-7">
                  <div className="text-xs font-mono font-semibold text-ink uppercase mb-3 flex items-center justify-between">
                    <span>1. What matters most to you?</span>
                    <span className="text-[10px] font-normal text-ink-muted">
                      [SELECT UP TO TWO • {selectedPriorities.length}/2]
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {PRIORITY_OPTIONS.map((opt) => {
                      const isSelected = selectedPriorities.includes(opt.key)
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => handleTogglePriority(opt.key)}
                          className={`text-left p-3.5 border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-ink bg-warm-white text-ink shadow-sm'
                              : 'border-hairline bg-warm-surface/20 text-ink-secondary hover:border-ink/60'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-mono font-semibold uppercase">
                            <span>{opt.label}</span>
                            <span>{isSelected ? '●' : '○'}</span>
                          </div>
                          <div className="mt-1 text-[10px] font-mono text-ink-muted">
                            {opt.pillarHint}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Question 2: Compromise Tolerance */}
                <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-hairline pt-6 lg:pt-0 lg:pl-8">
                  <div className="text-xs font-mono font-semibold text-ink uppercase mb-3">
                    2. HOW STRICT SHOULD WE BE?
                  </div>

                  <div className="space-y-2.5">
                    {COMPROMISE_OPTIONS.map((comp) => {
                      const isSelected = compromiseTolerance === comp.key
                      return (
                        <button
                          key={comp.key}
                          type="button"
                          onClick={() => setCompromiseTolerance(comp.key)}
                          className={`w-full text-left p-3.5 border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-ink bg-warm-white text-ink shadow-sm'
                              : 'border-hairline bg-warm-surface/20 text-ink-secondary hover:border-ink/60'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs font-mono font-semibold uppercase">
                            <span>{comp.label}</span>
                            <span>{isSelected ? '●' : '○'}</span>
                          </div>
                          <div className="mt-1 text-[10px] font-mono text-ink-muted">
                            {comp.desc}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. THE FACTS */}
            <div>
              <div className="border-b border-hairline pb-4 mb-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div>
                  <div className="text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-1">
                    VERIFIED SPECIFICATIONS
                  </div>
                  <h3 className="font-display text-2xl sm:text-3xl font-normal text-ink uppercase tracking-tight">
                    The Facts
                  </h3>
                </div>
                <div className="text-xs font-mono text-ink-muted uppercase">
                  ARCHIVE DATA RECORD
                </div>
              </div>

              {/* 6 High-Density Factual Blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Movement */}
                <div className="border border-hairline bg-warm-surface/20 p-5">
                  <div className="text-[10px] font-mono tracking-widest text-ink-muted uppercase mb-2">
                    MOVEMENT
                  </div>
                  <div className="font-mono text-sm font-semibold text-ink uppercase">
                    {selectedWatch.movement_type || 'Mechanical'}
                  </div>
                  <dl className="mt-3 text-xs font-mono text-ink-secondary space-y-1">
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Calibre</span>
                      <span className="text-ink font-medium truncate max-w-[60%]">{selectedWatch.calibre || selectedWatch.movement_name || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Autonomy</span>
                      <span className="text-ink font-medium">
                        {selectedWatch.movement_type?.toLowerCase().includes('quartz') || selectedWatch.movement_name?.toLowerCase().includes('quartz')
                          ? 'Multi-year battery'
                          : selectedWatch.power_reserve_hours
                          ? `${selectedWatch.power_reserve_hours} hours`
                          : 'Standard mechanical'}
                      </span>
                    </div>
                  </dl>
                </div>

                {/* Case */}
                <div className="border border-hairline bg-warm-surface/20 p-5">
                  <div className="text-[10px] font-mono tracking-widest text-ink-muted uppercase mb-2">
                    CASE
                  </div>
                  <div className="font-mono text-sm font-semibold text-ink uppercase">
                    {selectedWatch.case_material || 'Stainless Steel'}
                  </div>
                  <dl className="mt-3 text-xs font-mono text-ink-secondary space-y-1">
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Diameter</span>
                      <span className="text-ink font-medium">{selectedWatch.case_diameter_mm ? `${selectedWatch.case_diameter_mm} mm` : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Thickness</span>
                      <span className="text-ink font-medium">{selectedWatch.case_thickness_mm ? `${selectedWatch.case_thickness_mm} mm` : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Lug-to-Lug</span>
                      <span className="text-ink font-medium">{selectedWatch.lug_to_lug_mm ? `${selectedWatch.lug_to_lug_mm} mm` : '—'}</span>
                    </div>
                  </dl>
                </div>

                {/* Crystal */}
                <div className="border border-hairline bg-warm-surface/20 p-5">
                  <div className="text-[10px] font-mono tracking-widest text-ink-muted uppercase mb-2">
                    CRYSTAL
                  </div>
                  <div className="font-mono text-sm font-semibold text-ink uppercase">
                    {selectedWatch.crystal || 'Mineral Glass'}
                  </div>
                  <p className="mt-3 text-xs font-mono text-ink-secondary leading-relaxed">
                    {selectedWatch.crystal?.toLowerCase().includes('sapphire')
                      ? 'Synthetic sapphire offering maximum scratch resistance.'
                      : selectedWatch.crystal
                      ? `${selectedWatch.crystal} with authentic period optical clarity.`
                      : 'Protective crystal glass facing.'}
                  </p>
                </div>

                {/* Water Resistance */}
                <div className="border border-hairline bg-warm-surface/20 p-5">
                  <div className="text-[10px] font-mono tracking-widest text-ink-muted uppercase mb-2">
                    WATER RESISTANCE
                  </div>
                  <div className="font-mono text-sm font-semibold text-ink uppercase">
                    {selectedWatch.water_resistance_m !== null ? `${selectedWatch.water_resistance_m} m / ${Math.round(selectedWatch.water_resistance_m / 10)} bar` : '—'}
                  </div>
                  <p className="mt-3 text-xs font-mono text-ink-secondary leading-relaxed">
                    {selectedWatch.water_resistance_m && selectedWatch.water_resistance_m >= 100
                      ? 'Suitable for swimming, surface water sports, and daily exposure.'
                      : selectedWatch.water_resistance_m && selectedWatch.water_resistance_m >= 30
                      ? 'Splash resistant; avoid prolonged submersion or swimming.'
                      : 'Vintage or dress specification; avoid water contact.'}
                  </p>
                </div>

                {/* Heritage */}
                <div className="border border-hairline bg-warm-surface/20 p-5">
                  <div className="text-[10px] font-mono tracking-widest text-ink-muted uppercase mb-2">
                    HERITAGE
                  </div>
                  <div className="font-mono text-sm font-semibold text-ink uppercase">
                    {selectedWatch.brand}
                  </div>
                  <dl className="mt-3 text-xs font-mono text-ink-secondary space-y-1">
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Origin / Release</span>
                      <span className="text-ink font-medium">{selectedWatch.release_year || 'Modern'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Category</span>
                      <span className="text-ink font-medium">{selectedWatch.category || 'Horology'}</span>
                    </div>
                  </dl>
                </div>

                {/* Price */}
                <div className="border border-hairline bg-warm-surface/20 p-5">
                  <div className="text-[10px] font-mono tracking-widest text-ink-muted uppercase mb-2">
                    PRICE
                  </div>
                  <div className="font-mono text-sm font-semibold text-ink uppercase">
                    {selectedWatch.price !== null ? `$${selectedWatch.price.toLocaleString()} ${selectedWatch.currency}` : 'Contact brand'}
                  </div>
                  <p className="mt-3 text-xs font-mono text-ink-secondary leading-relaxed">
                    {selectedWatch.price !== null
                      ? 'Published manufacturer retail price / verified market estimate.'
                      : 'Price on request from official brand boutique or retailer.'}
                  </p>
                </div>
              </div>
            </div>

            {/* 4. WHAT'S GOOD & WHAT TO KNOW */}
            {caseEvidence && (
              <div className="border border-hairline bg-warm-surface/20 p-6 sm:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* WHAT'S GOOD */}
                  <div>
                    <div className="flex items-center gap-2 pb-3 border-b border-hairline text-xs font-mono uppercase tracking-widest text-ink font-semibold">
                      <span className="text-ink">＋</span>
                      <span>WHAT'S GOOD</span>
                    </div>
                    <ul className="mt-4 space-y-2.5">
                      {caseEvidence.positivePoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs font-mono text-ink leading-relaxed">
                          <span className="text-ink-muted mt-0.5">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* WHAT TO KNOW */}
                  <div>
                    <div className="flex items-center gap-2 pb-3 border-b border-hairline text-xs font-mono uppercase tracking-widest text-ink font-semibold">
                      <span className="text-ink">－</span>
                      <span>WHAT TO KNOW</span>
                    </div>
                    <ul className="mt-4 space-y-2.5">
                      {caseEvidence.compromisePoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs font-mono text-ink-secondary leading-relaxed">
                          <span className="text-ink-muted mt-0.5">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 5. THE VERDICT */}
            <div className="border border-hairline bg-warm-surface/40 p-8 sm:p-10 lg:p-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-hairline pb-8 mb-8">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-ink-muted mb-2">
                    THE VERDICT
                  </div>
                  <h3 className="font-display text-3xl sm:text-4xl font-normal text-ink uppercase tracking-tight">
                    The Decision
                  </h3>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-ink-secondary">
                    <span>
                      <strong className="text-ink-muted uppercase">Evaluated for:</strong> {verdictData.priorityLabels}
                    </span>
                    <span className="text-hairline">•</span>
                    <span>
                      <strong className="text-ink-muted uppercase">Strictness:</strong> {verdictData.strictnessLabel}
                    </span>
                    <span className="text-hairline">•</span>
                    <span>
                      <strong className="text-ink-muted uppercase">Alignment:</strong> {verdictData.alignmentScore.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Restrained Verdict Decision Badge */}
                <div>
                  <span
                    className={`inline-block border px-6 py-2.5 font-mono text-base sm:text-lg font-bold tracking-[0.25em] uppercase ${
                      verdictData.verdict === 'BUY'
                        ? 'border-ink bg-ink text-warm-white'
                        : verdictData.verdict === 'CONSIDER'
                        ? 'border-steel bg-warm-white text-ink'
                        : 'border-hairline bg-warm-surface text-ink-muted'
                    }`}
                  >
                    [ {verdictData.verdict} ]
                  </span>
                </div>
              </div>

              {/* WHY & THINK TWICE IF Explanation */}
              <div className="space-y-6 max-w-4xl">
                <div>
                  <div className="text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-2">
                    WHY:
                  </div>
                  <p className="text-sm sm:text-base font-mono text-ink leading-relaxed">
                    {verdictData.why}
                  </p>
                </div>

                <div className="pt-6 border-t border-hairline/60">
                  <div className="text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-2">
                    THINK TWICE IF:
                  </div>
                  <p className="text-xs sm:text-sm font-mono text-ink-secondary leading-relaxed">
                    {verdictData.thinkTwiceIf}
                  </p>
                </div>
              </div>

              {/* Action Bar */}
              <div className="mt-10 pt-8 border-t border-hairline flex flex-wrap items-center gap-4">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate(`/watches/${selectedWatch.slug}`)}
                >
                  VIEW WATCH DOSSIER &rarr;
                </Button>

                {!isAuthenticated ? (
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => navigate('/login')}
                  >
                    ADD TO MY WRIST &rarr;
                  </Button>
                ) : inCollection ? (
                  <div className="inline-flex items-center gap-3">
                    <span className="py-2.5 px-4 border border-hairline bg-warm-white text-xs font-mono text-ink font-semibold">
                      ✓ IN MY WRIST
                    </span>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleRemoveFromCollection}
                      className="text-xs font-mono text-ink-muted hover:text-ink uppercase underline cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading ? 'UPDATING...' : 'REMOVE'}
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="secondary"
                    size="md"
                    disabled={actionLoading}
                    onClick={handleAddToCollection}
                  >
                    {actionLoading ? 'ADDING...' : 'ADD TO MY WRIST &rarr;'}
                  </Button>
                )}

                <Button
                  variant="secondary"
                  size="md"
                  disabled={drawingRandom}
                  onClick={handleDrawRandomSpecimen}
                >
                  {drawingRandom ? 'DRAWING...' : 'DRAW ANOTHER SPECIMEN →'}
                </Button>

                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="py-2.5 px-4 border border-hairline bg-warm-surface/20 hover:border-ink text-xs font-mono text-ink-secondary hover:text-ink tracking-wider uppercase transition-colors cursor-pointer"
                >
                  SELECT ANOTHER WATCH &rarr;
                </button>
              </div>
            </div>

            {/* Restrained Methodology Colophon */}
            <div className="border-t border-hairline pt-8">
              <div className="border border-hairline bg-warm-surface/10 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-mono text-ink-muted">
                <div>
                  <div className="text-ink font-semibold uppercase tracking-wider mb-1">
                    EDITORIAL POSITIONING &amp; METHODOLOGY NOTE
                  </div>
                  <p className="text-ink-secondary leading-relaxed max-w-3xl">
                    An independent editorial evaluation generated from the verified archive using MOERI &amp; JEANNERET's published deterministic methodology. This instrument evaluates mechanical substance, metallurgy, case ergonomics, and historical lineage against user priorities—it does not constitute financial advice, commercial solicitation, or an automated buying recommendation.
                  </p>
                </div>
                <div className="whitespace-nowrap pt-2 sm:pt-0">
                  <Link
                    to="/watches"
                    className="text-ink hover:text-ink-secondary uppercase tracking-widest text-[11px] font-semibold underline underline-offset-4"
                  >
                    INDEX ARCHIVE &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  )
}
