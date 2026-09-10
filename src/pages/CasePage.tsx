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
import { EVALUATION_PILLARS, type ContenderEvaluation } from '../types/evaluation'
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
  { key: 'VERY LITTLE', label: 'VERY LITTLE', desc: 'Strict standards. Key priorities must excel with zero material compromises.' },
  { key: 'SOME', label: 'SOME', desc: 'Balanced view. Strong core strengths can offset minor trade-offs.' },
  { key: "I'M FLEXIBLE", label: "I'M FLEXIBLE", desc: 'Open-minded. Character, history, or singular strengths outweigh spec deficiencies.' },
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
    const breakdowns = evaluation.breakdowns

    // Evidence FOR (positive facts grounded in data)
    const positivePoints: { label: string; text: string }[] = []

    // Evidence AGAINST (meaningful compromises grounded in data)
    const compromisePoints: { label: string; text: string }[] = []

    // Dimensional Analysis
    // 1. The Machine
    if (scores.engineering >= 75) {
      positivePoints.push({
        label: 'CALIBRE INTEGRITY',
        text: breakdowns.engineering.summary,
      })
    } else if (scores.engineering < 60) {
      compromisePoints.push({
        label: 'MODEST CALIBRE SPEC',
        text: breakdowns.engineering.summary,
      })
    }

    // Check reserve specifically
    if (watch.power_reserve_hours && watch.power_reserve_hours >= 70) {
      positivePoints.push({
        label: 'EXTENDED AUTONOMY',
        text: `${watch.power_reserve_hours}-hour power reserve provides weekend-proof convenience without resetting.`,
      })
    } else if (watch.power_reserve_hours && watch.power_reserve_hours <= 42) {
      compromisePoints.push({
        label: 'STANDARD AUTONOMY',
        text: `${watch.power_reserve_hours}-hour reserve requires regular winding if rotated among multiple watches.`,
      })
    }

    // 2. The Object (Materials & Build)
    if (scores.materials >= 75) {
      positivePoints.push({
        label: 'MATERIAL & FINISHING',
        text: breakdowns.materials.summary,
      })
    } else if (scores.materials < 60) {
      compromisePoints.push({
        label: 'MATERIAL COMPROMISE',
        text: breakdowns.materials.summary,
      })
    }

    // Specific crystal check
    const crystalLower = (watch.crystal || '').toLowerCase()
    if (!crystalLower.includes('sapphire') && !crystalLower.includes('hesalite')) {
      compromisePoints.push({
        label: 'OPTICAL DEFENSE',
        text: `${watch.crystal || 'Mineral glass'} offers lower scratch defense compared to synthetic sapphire.`,
      })
    }

    // Water resistance check
    const wr = watch.water_resistance_m
    if (wr !== null && wr >= 100) {
      positivePoints.push({
        label: 'AQUATIC VERSATILITY',
        text: `${wr}m water resistance guarantees everyday aquatic resilience.`,
      })
    } else if (wr !== null && wr < 50) {
      compromisePoints.push({
        label: 'SPLASH-ONLY RESISTANCE',
        text: `${wr}m water resistance requires conscious care around water and rain.`,
      })
    }

    // 3. The Wrist (Wearability)
    if (scores.wearability >= 75) {
      positivePoints.push({
        label: 'WRIST HARMONY',
        text: breakdowns.wearability.summary,
      })
    } else {
      if (watch.case_thickness_mm && watch.case_thickness_mm > 13.0) {
        compromisePoints.push({
          label: 'VERTICAL WRIST HEIGHT',
          text: `${watch.case_thickness_mm}mm thickness has noticeable height that will not slip under tight shirt cuffs.`,
        })
      }
      if (watch.lug_to_lug_mm && watch.lug_to_lug_mm > 49.0) {
        compromisePoints.push({
          label: 'EXTENDED LUG SPAN',
          text: `${watch.lug_to_lug_mm}mm lug-to-lug stance may create slight overhang on slender wrists under 6.75 inches.`,
        })
      }
    }

    // 4. The Story (Heritage)
    if (scores.heritage >= 75) {
      positivePoints.push({
        label: 'LINEAGE PROVENANCE',
        text: breakdowns.heritage.summary,
      })
    } else if (scores.heritage < 55) {
      compromisePoints.push({
        label: 'MODERN ARCHIVAL FOOTPRINT',
        text: 'More contemporary lineage without the deep historical pedigree of centenarian horological icons.',
      })
    }

    // 5. The Money (Value)
    if (scores.value >= 75) {
      positivePoints.push({
        label: 'VALUE EFFICIENCY',
        text: breakdowns.value.summary,
      })
    } else if (scores.value < 55) {
      compromisePoints.push({
        label: 'LUXURY BRAND PREMIUM',
        text: `At $${watch.price?.toLocaleString()} ${watch.currency}, the price reflects high brand prestige and market demand over raw component yields.`,
      })
    }

    // Guarantee minimum of 1 for and against for balanced case file
    if (positivePoints.length === 0) {
      positivePoints.push({
        label: 'HOROLOGICAL COHESION',
        text: `${watch.brand} executes this model with established production quality aligned with its category.`,
      })
    }
    if (compromisePoints.length === 0) {
      compromisePoints.push({
        label: 'PRESERVATION & CARE',
        text: 'Demands standard mechanical maintenance and service intervals to preserve timekeeping tolerances.',
      })
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

    let why: string
    let thinkTwiceIf: string

    if (verdict === 'BUY') {
      why = `The ${watch.brand} ${watch.model} makes an authoritative buying case for your focus on ${priorityLabels}. It registers an alignment rating of ${alignmentScore.toFixed(1)}/100, backed by strong ${scores.engineering >= scores.heritage ? 'mechanical execution' : 'provenance'} and a case architecture that fits your tolerance for compromise.`
      thinkTwiceIf =
        scores.value < 65
          ? 'You expect maximum dollar-for-spec yields; market pricing reflects luxury cachet over sheer feature count.'
          : watch.case_thickness_mm && watch.case_thickness_mm > 12.5
          ? `You need an ultra-thin silhouette; the ${watch.case_thickness_mm}mm case has tangible presence on the wrist.`
          : 'Your aesthetic leans toward unconventional avant-garde silhouettes rather than classical genre archetypes.'
    } else if (verdict === 'CONSIDER') {
      why = `A compelling timepiece with genuine merit, but one that presents noticeable trade-offs against your selected priorities (${priorityLabels}). At ${alignmentScore.toFixed(1)}/100 alignment, it warrants serious consideration only if you are comfortable balancing ${scores.value < 60 ? 'market pricing against substance' : 'its specific case dimensions against daily wear'}.`
      thinkTwiceIf =
        'You are unwilling to make concessions on your top priorities. There are more focused references in the archive if you demand absolute optimization.'
    } else {
      why = `While the ${watch.brand} ${watch.model} is a cataloged reference in horological history, it struggles to make a convincing case for a buyer prioritizing ${priorityLabels} with ${compromiseTolerance.toLowerCase()} tolerance. Its ${alignmentScore.toFixed(1)}/100 alignment highlights friction between what you seek and what this case delivers.`
      thinkTwiceIf =
        'You find deep subjective emotional resonance with this reference that transcends analytical specification matching.'
    }

    return {
      verdict,
      why,
      thinkTwiceIf,
      alignmentScore,
      priorityLabels,
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
            <div className="flex items-center gap-2 text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-ink-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
              <span>THE CASE // DISCOVER • EXAMINE • DECIDE</span>
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
            The Case
          </h1>
          <p className="mt-2 text-xl sm:text-2xl font-light text-ink tracking-tight uppercase">
            Discover a watch. Examine the case. Make the call.
          </p>
          <p className="mt-3 text-xs sm:text-sm font-mono text-ink-secondary max-w-3xl leading-relaxed">
            An objective buying-decision instrument. We examine verified mechanical substance, case architecture, and market yield against what you actually prioritize in a watch.
          </p>
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

                  {/* Quick Specification Architecture */}
                  <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-hairline text-xs font-mono">
                    <div>
                      <dt className="text-[10px] text-ink-muted uppercase tracking-wider">Calibre</dt>
                      <dd className="mt-1 text-ink font-medium truncate">
                        {selectedWatch.calibre || selectedWatch.movement_name || '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-ink-muted uppercase tracking-wider">Diameter</dt>
                      <dd className="mt-1 text-ink font-medium">
                        {selectedWatch.case_diameter_mm ? `${selectedWatch.case_diameter_mm} mm` : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-ink-muted uppercase tracking-wider">Thickness</dt>
                      <dd className="mt-1 text-ink font-medium">
                        {selectedWatch.case_thickness_mm ? `${selectedWatch.case_thickness_mm} mm` : '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] text-ink-muted uppercase tracking-wider">MSRP / Est.</dt>
                      <dd className="mt-1 text-ink font-medium">
                        {selectedWatch.price !== null
                          ? `$${selectedWatch.price.toLocaleString()} ${selectedWatch.currency}`
                          : 'ON REQUEST'}
                      </dd>
                    </div>
                  </dl>

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
                    2. How much compromise are you willing to accept?
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

            {/* 3. The Buying Dimensions & Factual Pillars */}
            <div>
              <div className="border-b border-hairline pb-4 mb-8 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div>
                  <div className="text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-1">
                    FACTUAL ARCHIVE DECONSTRUCTION
                  </div>
                  <h3 className="font-display text-2xl sm:text-3xl font-normal text-ink uppercase tracking-tight">
                    The Five Pillars of Evidence
                  </h3>
                </div>
                <div className="text-xs font-mono text-ink-muted uppercase">
                  DETERMINISTIC PHASE 2H METHODOLOGY
                </div>
              </div>

              {/* 5 Factual Pillars Telemetry Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
                {EVALUATION_PILLARS.map((p, idx) => (
                  <div key={p.key} className="border border-hairline bg-warm-white p-3.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono tracking-wider text-ink-muted uppercase mb-1">
                        <span>0{idx + 1}</span>
                        <span>{p.weightLabel}</span>
                      </div>
                      <div className="text-xs font-mono font-semibold text-ink uppercase truncate">
                        {p.name}
                      </div>
                    </div>
                    <div className="mt-2 text-xl font-display font-normal text-ink">
                      {evaluation.scores[p.key].toFixed(1)}{' '}
                      <span className="text-[10px] font-mono text-ink-muted">/ 100</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 6 Buying Dimension Plates */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 1. The Machine */}
                <div className="border border-hairline bg-warm-surface/20 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono tracking-wider text-ink-muted uppercase mb-2">
                      <span>THE MACHINE</span>
                      <span>{evaluation.scores.engineering.toFixed(1)} / 100</span>
                    </div>
                    <div className="font-display text-lg uppercase text-ink">Engineering &amp; Mechanics</div>
                    <p className="mt-2 text-xs font-mono text-ink-secondary leading-relaxed">
                      {evaluation.breakdowns.engineering.summary}
                    </p>
                  </div>
                  <dl className="mt-4 pt-3 border-t border-hairline text-[11px] font-mono text-ink-muted space-y-1">
                    <div className="flex justify-between">
                      <span>Movement</span>
                      <span className="text-ink font-medium truncate max-w-[55%]">{selectedWatch.movement_type || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Calibre</span>
                      <span className="text-ink font-medium truncate max-w-[55%]">{selectedWatch.calibre || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Power Reserve</span>
                      <span className="text-ink font-medium">{selectedWatch.power_reserve_hours ? `${selectedWatch.power_reserve_hours}h` : '—'}</span>
                    </div>
                  </dl>
                </div>

                {/* 2. The Object */}
                <div className="border border-hairline bg-warm-surface/20 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono tracking-wider text-ink-muted uppercase mb-2">
                      <span>THE OBJECT</span>
                      <span>{evaluation.scores.materials.toFixed(1)} / 100</span>
                    </div>
                    <div className="font-display text-lg uppercase text-ink">Build &amp; Materials</div>
                    <p className="mt-2 text-xs font-mono text-ink-secondary leading-relaxed">
                      {evaluation.breakdowns.materials.summary}
                    </p>
                  </div>
                  <dl className="mt-4 pt-3 border-t border-hairline text-[11px] font-mono text-ink-muted space-y-1">
                    <div className="flex justify-between">
                      <span>Case Metallurgy</span>
                      <span className="text-ink font-medium truncate max-w-[55%]">{selectedWatch.case_material || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Crystal Defense</span>
                      <span className="text-ink font-medium truncate max-w-[55%]">{selectedWatch.crystal || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Water Resistance</span>
                      <span className="text-ink font-medium">{selectedWatch.water_resistance_m ? `${selectedWatch.water_resistance_m}m` : '—'}</span>
                    </div>
                  </dl>
                </div>

                {/* 3. The Wrist */}
                <div className="border border-hairline bg-warm-surface/20 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono tracking-wider text-ink-muted uppercase mb-2">
                      <span>THE WRIST</span>
                      <span>{evaluation.scores.wearability.toFixed(1)} / 100</span>
                    </div>
                    <div className="font-display text-lg uppercase text-ink">Wearability &amp; Ergonomics</div>
                    <p className="mt-2 text-xs font-mono text-ink-secondary leading-relaxed">
                      {evaluation.breakdowns.wearability.summary}
                    </p>
                  </div>
                  <dl className="mt-4 pt-3 border-t border-hairline text-[11px] font-mono text-ink-muted space-y-1">
                    <div className="flex justify-between">
                      <span>Case Diameter</span>
                      <span className="text-ink font-medium">{selectedWatch.case_diameter_mm ? `${selectedWatch.case_diameter_mm}mm` : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Thickness Profile</span>
                      <span className="text-ink font-medium">{selectedWatch.case_thickness_mm ? `${selectedWatch.case_thickness_mm}mm` : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lug-to-Lug Span</span>
                      <span className="text-ink font-medium">{selectedWatch.lug_to_lug_mm ? `${selectedWatch.lug_to_lug_mm}mm` : '—'}</span>
                    </div>
                  </dl>
                </div>

                {/* 4. The Story */}
                <div className="border border-hairline bg-warm-surface/20 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono tracking-wider text-ink-muted uppercase mb-2">
                      <span>THE STORY</span>
                      <span>{evaluation.scores.heritage.toFixed(1)} / 100</span>
                    </div>
                    <div className="font-display text-lg uppercase text-ink">Heritage &amp; Lineage</div>
                    <p className="mt-2 text-xs font-mono text-ink-secondary leading-relaxed">
                      {evaluation.breakdowns.heritage.summary}
                    </p>
                  </div>
                  <dl className="mt-4 pt-3 border-t border-hairline text-[11px] font-mono text-ink-muted space-y-1">
                    <div className="flex justify-between">
                      <span>Brand Standing</span>
                      <span className="text-ink font-medium">{selectedWatch.brand}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lineage Origin</span>
                      <span className="text-ink font-medium">{selectedWatch.release_year || 'Modern'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Category</span>
                      <span className="text-ink font-medium">{selectedWatch.category || '—'}</span>
                    </div>
                  </dl>
                </div>

                {/* 5. The Money */}
                <div className="border border-hairline bg-warm-surface/20 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono tracking-wider text-ink-muted uppercase mb-2">
                      <span>THE MONEY</span>
                      <span>{evaluation.scores.value.toFixed(1)} / 100</span>
                    </div>
                    <div className="font-display text-lg uppercase text-ink">Value Proposition</div>
                    <p className="mt-2 text-xs font-mono text-ink-secondary leading-relaxed">
                      {evaluation.breakdowns.value.summary}
                    </p>
                  </div>
                  <dl className="mt-4 pt-3 border-t border-hairline text-[11px] font-mono text-ink-muted space-y-1">
                    <div className="flex justify-between">
                      <span>MSRP / Estimate</span>
                      <span className="text-ink font-medium">{selectedWatch.price ? `$${selectedWatch.price.toLocaleString()} ${selectedWatch.currency}` : 'ON REQUEST'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Yield Tier</span>
                      <span className="text-ink font-medium">{evaluation.scores.value >= 75 ? 'HIGH YIELD' : evaluation.scores.value >= 55 ? 'BALANCED' : 'PRESTIGE PREMIUM'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Substance Yield</span>
                      <span className="text-ink font-medium">{evaluation.breakdowns.value.subScores[0].score}/50 PTS</span>
                    </div>
                  </dl>
                </div>

                {/* 6. The Life (Personal Context) */}
                <div className="border border-hairline bg-warm-surface/40 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono tracking-wider text-ink-muted uppercase mb-2">
                      <span>THE LIFE</span>
                      <span>PERSONAL CONTEXT</span>
                    </div>
                    <div className="font-display text-lg uppercase text-ink">Everyday Compatibility</div>
                    <p className="mt-2 text-xs font-mono text-ink-secondary leading-relaxed">
                      Evaluating how this watch integrates into your life given your focus on {verdictData.priorityLabels} and {compromiseTolerance.toLowerCase()} tolerance for compromises.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-hairline text-[11px] font-mono">
                    <div className="text-ink font-medium uppercase tracking-wider">
                      PRIORITY ALIGNMENT: {verdictData.alignmentScore.toFixed(1)} / 100
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. THE CASE: Evidence FOR and AGAINST */}
            <div className="border border-hairline bg-warm-surface/20 p-6 sm:p-8 lg:p-10">
              <div className="border-b border-hairline pb-4 mb-8">
                <div className="text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-1">
                  FORENSIC BALANCE SHEET
                </div>
                <h3 className="font-display text-2xl sm:text-3xl font-normal text-ink uppercase tracking-tight">
                  The Case: For &amp; Against
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* FOR COLUMN */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-hairline text-xs font-mono uppercase tracking-widest text-ink font-semibold">
                    <span className="text-ink">＋</span>
                    <span>THE CASE FOR</span>
                  </div>

                  <div className="space-y-3">
                    {caseEvidence.positivePoints.map((item) => (
                      <div key={item.label} className="p-4 border border-hairline bg-warm-white">
                        <div className="text-[10px] font-mono tracking-widest uppercase text-ink-muted mb-1">
                          {item.label}
                        </div>
                        <p className="text-xs font-mono text-ink leading-relaxed">
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AGAINST COLUMN */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-hairline text-xs font-mono uppercase tracking-widest text-ink font-semibold">
                    <span className="text-ink">－</span>
                    <span>THE CASE AGAINST (COMPROMISES)</span>
                  </div>

                  <div className="space-y-3">
                    {caseEvidence.compromisePoints.map((item) => (
                      <div key={item.label} className="p-4 border border-hairline bg-warm-surface/30">
                        <div className="text-[10px] font-mono tracking-widest uppercase text-ink-muted mb-1">
                          {item.label}
                        </div>
                        <p className="text-xs font-mono text-ink-secondary leading-relaxed">
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 5. THE VERDICT */}
            <div className="border border-hairline bg-warm-surface/40 p-8 sm:p-10 lg:p-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-hairline pb-8 mb-8">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-ink-muted mb-2">
                    THE CALL // INDEPENDENT EDITORIAL VERDICT
                  </div>
                  <h3 className="font-display text-3xl sm:text-4xl font-normal text-ink uppercase tracking-tight">
                    The Verdict
                  </h3>
                  <div className="mt-2 text-xs font-mono text-ink-secondary">
                    EVALUATED AGAINST {selectedPriorities.length > 0 ? selectedPriorities.join(' & ') : 'ARCHIVE BASELINE'} • {compromiseTolerance} COMPROMISE TOLERANCE
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
