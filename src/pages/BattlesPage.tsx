import { useEffect, useState, useRef, useMemo } from 'react'
import Container from '../components/common/Container'
import Button from '../components/common/Button'
import WatchPickerModal from '../components/battles/WatchPickerModal'
import { fetchWatches } from '../services/watchService'
import type { Watch } from '../types/watch'
import { EVALUATION_PILLARS } from '../types/evaluation'
import { evaluateMatchup } from '../services/evaluationEngine'
import type { DeterministicEvaluation } from '../types/evaluation'

type CategoryKey = 'design' | 'movement' | 'value' | 'heritage' | 'flex'

interface CategoryDefinition {
  key: CategoryKey
  name: string
  description: string
}

const CATEGORIES: CategoryDefinition[] = [
  {
    key: 'design',
    name: 'Design & Aesthetics',
    description: 'Case architecture, proportions, dial balance, finishing, and everyday wrist presence.',
  },
  {
    key: 'movement',
    name: 'Movement & Mechanics',
    description: 'Engineering innovation, calibre pedigree, precision, power reserve, and horological finishing.',
  },
  {
    key: 'value',
    name: 'Value & Substance',
    description: 'MSRP positioning, material substance, finishing quality per dollar, and market retention.',
  },
  {
    key: 'heritage',
    name: 'Heritage & Lineage',
    description: 'Historical provenance, brand pedigree, iconic milestones, and enduring cultural prestige.',
  },
  {
    key: 'flex',
    name: 'Flex & Street Clout',
    description: 'Collector recognition, exclusivity, wrist presence, and unmistakable horological status.',
  },
]

export default function BattlesPage() {
  const [watches, setWatches] = useState<Watch[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConfigured, setIsConfigured] = useState(true)

  // Battle Contender Selection
  const [watch1, setWatch1] = useState<Watch | null>(null)
  const [watch2, setWatch2] = useState<Watch | null>(null)
  const [activePickerSlot, setActivePickerSlot] = useState<1 | 2 | null>(null)
  const [isBattleEngaged, setIsBattleEngaged] = useState(false)

  // Category Voting State
  const [votes, setVotes] = useState<Record<CategoryKey, 1 | 2 | null>>({
    design: null,
    movement: null,
    value: null,
    heritage: null,
    flex: null,
  })

  const arenaRef = useRef<HTMLDivElement | null>(null)

  // Load watches from Supabase
  useEffect(() => {
    let isMounted = true

    fetchWatches().then((result) => {
      if (!isMounted) return
      setIsConfigured(result.isConfigured)
      if (result.error) {
        setError(result.error.message)
      } else {
        setWatches(result.data)

        // If a query parameter was passed (e.g. ?w1=slug), pre-select watch 1
        if (result.data && typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search)
          const preselectedSlug = params.get('w1')
          if (preselectedSlug) {
            const found = result.data.find((w) => w.slug === preselectedSlug)
            if (found) {
              setWatch1(found)
            }
          }
        }
      }
      setLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [])

  const handleRetry = async () => {
    setLoading(true)
    setError(null)
    const result = await fetchWatches()
    setIsConfigured(result.isConfigured)
    if (result.error) {
      setError(result.error.message)
    } else {
      setWatches(result.data)
    }
    setLoading(false)
  }

  // Handle watch selection from modal
  const handleSelectWatch = (selectedWatch: Watch) => {
    if (activePickerSlot === 1) {
      setWatch1(selectedWatch)
    } else if (activePickerSlot === 2) {
      setWatch2(selectedWatch)
    }
    // If contenders change, reset votes
    handleResetVotes()
  }

  // Engage Battle and scroll to comparison arena
  const handleEngageBattle = () => {
    if (!watch1 || !watch2) return
    setIsBattleEngaged(true)
    setTimeout(() => {
      if (arenaRef.current) {
        arenaRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  // Voting handlers
  const handleVote = (category: CategoryKey, contender: 1 | 2) => {
    setVotes((prev) => ({
      ...prev,
      [category]: prev[category] === contender ? null : contender,
    }))
  }

  const handleResetVotes = () => {
    setVotes({
      design: null,
      movement: null,
      value: null,
      heritage: null,
      flex: null,
    })
  }

  const handleResetBattle = () => {
    setWatch1(null)
    setWatch2(null)
    setIsBattleEngaged(false)
    handleResetVotes()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Vote Score Calculation
  const watch1Score = useMemo(
    () => Object.values(votes).filter((v) => v === 1).length,
    [votes]
  )
  const watch2Score = useMemo(
    () => Object.values(votes).filter((v) => v === 2).length,
    [votes]
  )
  const totalVotesCast = useMemo(
    () => Object.values(votes).filter((v) => v !== null).length,
    [votes]
  )
  const undecidedCount = CATEGORIES.length - totalVotesCast

  // Deterministic 5-Pillar Engine Evaluation
  const deterministicEvaluation: DeterministicEvaluation | null = useMemo(() => {
    if (!watch1 || !watch2) return null
    return evaluateMatchup(watch1, watch2)
  }, [watch1, watch2])

  // 17-Spec Technical Dossier Matrix
  const specList = useMemo(() => {
    if (!watch1 || !watch2) return []

    return [
      {
        label: 'Brand',
        val1: watch1.brand,
        val2: watch2.brand,
      },
      {
        label: 'Model',
        val1: watch1.model,
        val2: watch2.model,
      },
      {
        label: 'Reference Number',
        val1: `REF. ${watch1.reference_number}`,
        val2: `REF. ${watch2.reference_number}`,
      },
      {
        label: 'MSRP / Market Estimate',
        val1: watch1.price !== null ? `$${watch1.price.toLocaleString()} ${watch1.currency}` : 'PRICE ON REQUEST',
        val2: watch2.price !== null ? `$${watch2.price.toLocaleString()} ${watch2.currency}` : 'PRICE ON REQUEST',
      },
      {
        label: 'Movement Type',
        val1: watch1.movement_type || '—',
        val2: watch2.movement_type || '—',
      },
      {
        label: 'Calibre',
        val1: watch1.calibre || watch1.movement_name || '—',
        val2: watch2.calibre || watch2.movement_name || '—',
      },
      {
        label: 'Power Reserve',
        val1: watch1.power_reserve_hours ? `${watch1.power_reserve_hours} Hours` : '—',
        val2: watch2.power_reserve_hours ? `${watch2.power_reserve_hours} Hours` : '—',
      },
      {
        label: 'Case Diameter',
        val1: watch1.case_diameter_mm ? `${watch1.case_diameter_mm} mm` : '—',
        val2: watch2.case_diameter_mm ? `${watch2.case_diameter_mm} mm` : '—',
      },
      {
        label: 'Case Thickness',
        val1: watch1.case_thickness_mm ? `${watch1.case_thickness_mm} mm` : '—',
        val2: watch2.case_thickness_mm ? `${watch2.case_thickness_mm} mm` : '—',
      },
      {
        label: 'Lug-to-Lug',
        val1: watch1.lug_to_lug_mm ? `${watch1.lug_to_lug_mm} mm` : '—',
        val2: watch2.lug_to_lug_mm ? `${watch2.lug_to_lug_mm} mm` : '—',
      },
      {
        label: 'Case Material',
        val1: watch1.case_material || '—',
        val2: watch2.case_material || '—',
      },
      {
        label: 'Crystal',
        val1: watch1.crystal || '—',
        val2: watch2.crystal || '—',
      },
      {
        label: 'Water Resistance',
        val1: watch1.water_resistance_m ? `${watch1.water_resistance_m} m` : '—',
        val2: watch2.water_resistance_m ? `${watch2.water_resistance_m} m` : '—',
      },
      {
        label: 'Bracelet / Strap',
        val1: watch1.bracelet_or_strap || '—',
        val2: watch2.bracelet_or_strap || '—',
      },
      {
        label: 'Release Year',
        val1: watch1.release_year ? `${watch1.release_year}` : '—',
        val2: watch2.release_year ? `${watch2.release_year}` : '—',
      },
      {
        label: 'Category',
        val1: watch1.category || '—',
        val2: watch2.category || '—',
      },
      {
        label: 'Style',
        val1: watch1.style || '—',
        val2: watch2.style || '—',
      },
    ]
  }, [watch1, watch2])

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        {/* Page Header */}
        <div className="border-b border-hairline pb-8 mb-12 sm:mb-16">
          <div className="flex items-center gap-2 mb-3 text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-ink-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden="true" />
            <span>INTERACTIVE ARENA &bull; HEAD-TO-HEAD SHOWDOWN</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-ink uppercase">
            Watch Battle
          </h1>
          <p className="mt-3 text-base sm:text-lg text-ink-secondary max-w-2xl">
            Select two timepieces from the verified watch index, examine the engineering dossier, and cast your votes.
          </p>
        </div>

        {/* 1. Loading State */}
        {loading && (
          <div className="border border-hairline bg-warm-surface/30 p-12 sm:p-20 text-center max-w-3xl mx-auto mb-12">
            <div className="w-10 h-10 mx-auto mb-6 flex items-center justify-center border border-hairline bg-warm-white">
              <svg
                className="w-5 h-5 text-gold animate-spin"
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
              Loading Watch Database
            </h2>
            <p className="mt-3 text-xs sm:text-sm font-mono tracking-widest text-ink-muted uppercase">
              PREPARING BATTLE MATRIX...
            </p>
          </div>
        )}

        {/* 2. Error / Unconfigured State */}
        {!loading && error && (
          <div className="border border-hairline bg-warm-surface/40 p-8 sm:p-14 text-center max-w-3xl mx-auto mb-12">
            <h2 className="font-display text-2xl font-normal tracking-tight text-ink uppercase mb-2">
              Battle Engine Offline
            </h2>
            <p className="text-sm text-ink-secondary max-w-md mx-auto mb-6">
              {isConfigured ? `Query error: ${error}` : 'Supabase credentials missing.'}
            </p>
            <Button variant="secondary" size="sm" onClick={handleRetry}>
              RETRY CONNECTION &rarr;
            </Button>
          </div>
        )}

        {/* 3. Empty State */}
        {!loading && !error && (!watches || watches.length === 0) && (
          <div className="border border-hairline bg-warm-surface/40 p-12 text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-2xl font-normal text-ink uppercase mb-2">
              No Timepieces Cataloged
            </h2>
            <p className="text-xs font-mono text-ink-secondary">
              Seed the database in Supabase SQL editor to populate watches.
            </p>
          </div>
        )}

        {/* 4. Dual Contender Slots Selection Arena */}
        {!loading && !error && watches && watches.length > 0 && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto mb-12">
              {/* Contender 01 Slot */}
              <div className="border border-hairline bg-warm-surface/20 flex flex-col justify-between overflow-hidden">
                <div className="p-4 border-b border-hairline bg-warm-surface/40 flex items-center justify-between text-[10px] font-mono tracking-[0.2em] uppercase">
                  <span className="text-ink font-semibold">CONTENDER 01</span>
                  <span className="text-ink-muted">
                    {watch1 ? 'LOCKED IN MATRIX' : 'SLOT VACANT'}
                  </span>
                </div>

                {watch1 ? (
                  <div>
                    {/* Selected Watch Image */}
                    <div className="relative aspect-[16/10] w-full bg-warm-surface border-b border-hairline overflow-hidden">
                      {watch1.image_url ? (
                        <img
                          src={watch1.image_url}
                          alt={`${watch1.brand} ${watch1.model}`}
                          className="h-full w-full object-cover object-center"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs font-mono text-ink-muted uppercase tracking-widest">
                          PHOTOGRAPHY PENDING
                        </div>
                      )}
                      {watch1.category && (
                        <div className="absolute top-3 left-3 px-2.5 py-1 bg-warm-white/90 backdrop-blur-sm border border-hairline text-[9px] font-mono tracking-[0.2em] uppercase text-ink font-medium">
                          {watch1.category}
                        </div>
                      )}
                    </div>

                    {/* Selected Watch Dossier Header */}
                    <div className="p-6 sm:p-8">
                      <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-ink-secondary">
                        {watch1.brand}
                      </div>
                      <h3 className="mt-1 font-display text-2xl sm:text-3xl font-normal tracking-tight text-ink uppercase">
                        {watch1.model}
                      </h3>
                      <div className="mt-2 text-xs font-mono text-ink-muted tracking-wider">
                        REF. {watch1.reference_number}
                      </div>

                      <div className="mt-6 pt-4 border-t border-hairline flex items-center justify-between text-xs font-mono">
                        <span className="text-ink font-semibold">
                          {watch1.price !== null
                            ? `$${watch1.price.toLocaleString()} ${watch1.currency}`
                            : 'PRICE ON REQUEST'}
                        </span>
                        <span className="text-ink-secondary">
                          {watch1.case_diameter_mm ? `${watch1.case_diameter_mm} mm` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 sm:p-16 text-center flex flex-col items-center justify-center flex-grow">
                    <div className="w-12 h-12 border border-dashed border-hairline flex items-center justify-center mb-4 text-ink-muted">
                      <span className="font-mono text-xs">01</span>
                    </div>
                    <h3 className="font-display text-xl sm:text-2xl font-normal text-ink uppercase">
                      Select First Contender
                    </h3>
                    <p className="mt-2 text-xs font-mono text-ink-secondary">
                      CHOOSE FROM 12 VERIFIED TIMEPIECES
                    </p>
                  </div>
                )}

                {/* Contender 01 Action */}
                <div className="p-4 sm:p-6 border-t border-hairline bg-warm-white flex items-center justify-between">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setActivePickerSlot(1)}
                    className="w-full"
                  >
                    {watch1 ? 'CHANGE WATCH 1 \u2192' : 'CHOOSE WATCH 1 \u2192'}
                  </Button>
                </div>
              </div>

              {/* Contender 02 Slot */}
              <div className="border border-hairline bg-warm-surface/20 flex flex-col justify-between overflow-hidden">
                <div className="p-4 border-b border-hairline bg-warm-surface/40 flex items-center justify-between text-[10px] font-mono tracking-[0.2em] uppercase">
                  <span className="text-ink font-semibold">CONTENDER 02</span>
                  <span className="text-ink-muted">
                    {watch2 ? 'LOCKED IN MATRIX' : 'SLOT VACANT'}
                  </span>
                </div>

                {watch2 ? (
                  <div>
                    {/* Selected Watch Image */}
                    <div className="relative aspect-[16/10] w-full bg-warm-surface border-b border-hairline overflow-hidden">
                      {watch2.image_url ? (
                        <img
                          src={watch2.image_url}
                          alt={`${watch2.brand} ${watch2.model}`}
                          className="h-full w-full object-cover object-center"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs font-mono text-ink-muted uppercase tracking-widest">
                          PHOTOGRAPHY PENDING
                        </div>
                      )}
                      {watch2.category && (
                        <div className="absolute top-3 left-3 px-2.5 py-1 bg-warm-white/90 backdrop-blur-sm border border-hairline text-[9px] font-mono tracking-[0.2em] uppercase text-ink font-medium">
                          {watch2.category}
                        </div>
                      )}
                    </div>

                    {/* Selected Watch Dossier Header */}
                    <div className="p-6 sm:p-8">
                      <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-ink-secondary">
                        {watch2.brand}
                      </div>
                      <h3 className="mt-1 font-display text-2xl sm:text-3xl font-normal tracking-tight text-ink uppercase">
                        {watch2.model}
                      </h3>
                      <div className="mt-2 text-xs font-mono text-ink-muted tracking-wider">
                        REF. {watch2.reference_number}
                      </div>

                      <div className="mt-6 pt-4 border-t border-hairline flex items-center justify-between text-xs font-mono">
                        <span className="text-ink font-semibold">
                          {watch2.price !== null
                            ? `$${watch2.price.toLocaleString()} ${watch2.currency}`
                            : 'PRICE ON REQUEST'}
                        </span>
                        <span className="text-ink-secondary">
                          {watch2.case_diameter_mm ? `${watch2.case_diameter_mm} mm` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 sm:p-16 text-center flex flex-col items-center justify-center flex-grow">
                    <div className="w-12 h-12 border border-dashed border-hairline flex items-center justify-center mb-4 text-ink-muted">
                      <span className="font-mono text-xs">02</span>
                    </div>
                    <h3 className="font-display text-xl sm:text-2xl font-normal text-ink uppercase">
                      Select Second Contender
                    </h3>
                    <p className="mt-2 text-xs font-mono text-ink-secondary">
                      CHOOSE FROM 12 VERIFIED TIMEPIECES
                    </p>
                  </div>
                )}

                {/* Contender 02 Action */}
                <div className="p-4 sm:p-6 border-t border-hairline bg-warm-white flex items-center justify-between">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setActivePickerSlot(2)}
                    className="w-full"
                  >
                    {watch2 ? 'CHANGE WATCH 2 \u2192' : 'CHOOSE WATCH 2 \u2192'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Battle Trigger Central Callout */}
            <div className="max-w-xl mx-auto text-center border border-hairline bg-warm-surface/40 p-8 sm:p-10 mb-16">
              <div className="text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-3">
                {watch1 && watch2
                  ? 'BATTLE MATRIX READY // CONTENDERS LOCKED'
                  : 'SELECTION REQUIRED // VACANT CONTENDER SLOTS'}
              </div>

              {watch1 && watch2 ? (
                <div>
                  <h2 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-ink uppercase mb-2">
                    {watch1.brand} vs {watch2.brand}
                  </h2>
                  <p className="text-xs font-mono text-ink-secondary mb-6">
                    {watch1.model} against {watch2.model}
                  </p>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleEngageBattle}
                    className="w-full sm:w-auto"
                  >
                    ENGAGE BATTLE &bull; FIGHT! &rarr;
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-xs sm:text-sm font-mono text-ink-secondary mb-4 leading-relaxed">
                    Select two distinct timepieces above to unlock the technical comparison matrix and five-category showdown judging.
                  </p>
                  <Button variant="secondary" size="md" disabled className="w-full sm:w-auto">
                    SELECT TWO CONTENDERS TO ENGAGE
                  </Button>
                </div>
              )}
            </div>

            {/* 5. Head-to-Head Comparison & Interactive Voting Arena */}
            {isBattleEngaged && watch1 && watch2 && (
              <div ref={arenaRef} id="battle-arena" className="pt-8 scroll-mt-24">
                {/* -------------------------------------------------------- */}
                {/* SECTION 1: DETERMINISTIC ENGINE BENCHMARK                */}
                {/* -------------------------------------------------------- */}
                {deterministicEvaluation && (
                  <div className="mb-20">
                    <div className="border-b border-hairline pb-6 mb-10">
                      <div className="flex items-center gap-2 mb-2 text-[10px] font-mono tracking-[0.25em] text-ink-secondary uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden="true" />
                        <span>DETERMINISTIC BENCHMARK // 5-PILLAR EVALUATION ENGINE</span>
                      </div>
                      <h2 className="font-display text-3xl sm:text-4xl font-normal tracking-tight text-ink uppercase">
                        Engine Benchmark
                      </h2>
                      <p className="mt-2 text-xs sm:text-sm font-mono text-ink-secondary max-w-2xl">
                        Algorithmic 0–100 composite evaluation derived from verified database specifications across 5 core pillars.
                      </p>
                    </div>

                    {/* Benchmark Composite Score Card */}
                    <div className="border border-hairline bg-ink text-warm-white p-8 sm:p-10 mb-10 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-80 h-80 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

                      {/* Top Bar: Verdict Meta */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-warm-white/15 pb-6 mb-8">
                        <div>
                          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-gold mb-1">
                            OBJECTIVE HOROLOGICAL SCORING &bull; ZERO FABRICATED DATA
                          </div>
                          <div className="text-xs font-mono text-warm-white/70">
                            WEIGHTED COMPOSITE // 25% ENG &bull; 20% MAT &bull; 20% WEAR &bull; 20% VAL &bull; 15% HER
                          </div>
                        </div>

                        {/* Verdict Badge */}
                        <div className="flex items-center gap-2">
                          {deterministicEvaluation.verdictType === 'DEAD HEAT' && (
                            <span className="border border-warm-white/30 bg-warm-white/10 text-warm-white px-3 py-1 font-mono text-[10px] tracking-widest uppercase font-semibold">
                              DEAD HEAT (&plusmn;{deterministicEvaluation.margin.toFixed(1)} PTS)
                            </span>
                          )}
                          {deterministicEvaluation.verdictType === 'SLIGHT EDGE' && (
                            <span className="border border-gold/50 bg-gold/15 text-gold px-3 py-1 font-mono text-[10px] tracking-widest uppercase font-semibold">
                              SLIGHT EDGE (+{deterministicEvaluation.margin.toFixed(1)} PTS)
                            </span>
                          )}
                          {deterministicEvaluation.verdictType === 'CLEAR ADVANTAGE' && (
                            <span className="border border-gold bg-gold text-ink px-3 py-1 font-mono text-[10px] tracking-widest uppercase font-bold">
                              CLEAR ADVANTAGE (+{deterministicEvaluation.margin.toFixed(1)} PTS)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Dual Contender Composite Scores */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center border-b border-warm-white/15 pb-8 mb-8">
                        {/* Contender 1 Composite */}
                        <div className="md:col-span-5 flex flex-col">
                          <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-warm-white/60 mb-1">
                            CONTENDER 01 &bull; {watch1.brand}
                          </div>
                          <div className="font-display text-xl sm:text-2xl uppercase tracking-tight text-warm-white truncate">
                            {watch1.model}
                          </div>
                          <div className="flex items-baseline gap-3 mt-3">
                            <span className="font-display text-4xl sm:text-5xl font-normal text-warm-white">
                              {deterministicEvaluation.contender1.overallScore.toFixed(1)}
                            </span>
                            <span className="font-mono text-xs text-warm-white/50 uppercase">/ 100 PTS</span>
                          </div>
                          {/* Progress Bar */}
                          <div className="w-full bg-warm-white/10 h-1.5 mt-3 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                deterministicEvaluation.winnerSlot === 1
                                  ? 'bg-gold'
                                  : 'bg-warm-white/60'
                              }`}
                              style={{ width: `${deterministicEvaluation.contender1.overallScore}%` }}
                            />
                          </div>
                        </div>

                        {/* Center Versus Divider */}
                        <div className="md:col-span-2 flex flex-col items-center justify-center text-center py-2">
                          <span className="font-mono text-xs tracking-widest text-warm-white/30 uppercase font-light">VS</span>
                          <span className="font-mono text-[10px] text-gold tracking-widest uppercase mt-1">
                            &Delta; {deterministicEvaluation.margin.toFixed(1)}
                          </span>
                        </div>

                        {/* Contender 2 Composite */}
                        <div className="md:col-span-5 flex flex-col md:text-right">
                          <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-warm-white/60 mb-1">
                            CONTENDER 02 &bull; {watch2.brand}
                          </div>
                          <div className="font-display text-xl sm:text-2xl uppercase tracking-tight text-warm-white truncate">
                            {watch2.model}
                          </div>
                          <div className="flex items-baseline md:justify-end gap-3 mt-3">
                            <span className="font-display text-4xl sm:text-5xl font-normal text-warm-white">
                              {deterministicEvaluation.contender2.overallScore.toFixed(1)}
                            </span>
                            <span className="font-mono text-xs text-warm-white/50 uppercase">/ 100 PTS</span>
                          </div>
                          {/* Progress Bar */}
                          <div className="w-full bg-warm-white/10 h-1.5 mt-3 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ml-auto ${
                                deterministicEvaluation.winnerSlot === 2
                                  ? 'bg-gold'
                                  : 'bg-warm-white/60'
                              }`}
                              style={{ width: `${deterministicEvaluation.contender2.overallScore}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Editorial Benchmark Verdict Callout */}
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-gold mb-2">
                          {deterministicEvaluation.headline}
                        </div>
                        <p className="text-xs sm:text-sm text-warm-white/90 font-mono leading-relaxed max-w-4xl">
                          {deterministicEvaluation.summaryRationale}
                        </p>
                      </div>
                    </div>

                    {/* 5-Pillar Detailed Algorithmic Breakdown */}
                    <div className="space-y-6">
                      {EVALUATION_PILLARS.map((pillar, idx) => {
                        const pAdvantage = deterministicEvaluation.pillarAdvantages[pillar.key]
                        const s1 = deterministicEvaluation.contender1.scores[pillar.key]
                        const s2 = deterministicEvaluation.contender2.scores[pillar.key]
                        const b1 = deterministicEvaluation.contender1.breakdowns[pillar.key]
                        const b2 = deterministicEvaluation.contender2.breakdowns[pillar.key]

                        return (
                          <div
                            key={pillar.key}
                            className="border border-hairline bg-warm-surface/20 p-6 sm:p-8 transition-colors hover:bg-warm-surface/30"
                          >
                            {/* Pillar Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-4 mb-6">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase">
                                    PILLAR 0{idx + 1}
                                  </span>
                                  <span className="text-[10px] font-mono tracking-widest text-gold uppercase font-semibold">
                                    [{pillar.weightLabel} WEIGHT]
                                  </span>
                                </div>
                                <h3 className="font-display text-xl sm:text-2xl font-normal text-ink uppercase mt-1">
                                  {pillar.name}
                                </h3>
                              </div>

                              {/* Advantage Indicator */}
                              <div className="text-[10px] font-mono tracking-wider uppercase">
                                {pAdvantage.winnerSlot === 'tie' ? (
                                  <span className="text-ink-muted border border-hairline px-2.5 py-1 bg-warm-white">
                                    PARITY // EVENLY MATCHED
                                  </span>
                                ) : pAdvantage.winnerSlot === 1 ? (
                                  <span className="text-gold font-semibold border border-gold/40 px-2.5 py-1 bg-warm-white">
                                    {watch1.brand} ADVANTAGE (+{pAdvantage.delta.toFixed(1)} PTS)
                                  </span>
                                ) : (
                                  <span className="text-gold font-semibold border border-gold/40 px-2.5 py-1 bg-warm-white">
                                    {watch2.brand} ADVANTAGE (+{pAdvantage.delta.toFixed(1)} PTS)
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Side-by-Side Pillar Comparison */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Contender 1 Pillar Box */}
                              <div className={`p-4 border ${pAdvantage.winnerSlot === 1 ? 'border-gold/40 bg-warm-white' : 'border-hairline bg-warm-surface/10'}`}>
                                <div className="flex items-center justify-between text-xs font-mono mb-2">
                                  <span className="text-ink-muted tracking-wider uppercase">{watch1.brand}</span>
                                  <span className="font-display text-xl font-normal text-ink">{s1.toFixed(1)} <span className="text-[10px] font-mono text-ink-muted">/ 100</span></span>
                                </div>
                                {/* Visual score bar */}
                                <div className="w-full bg-warm-surface/80 h-1 mb-3 overflow-hidden">
                                  <div
                                    className={`h-full ${pAdvantage.winnerSlot === 1 ? 'bg-gold' : 'bg-ink/40'}`}
                                    style={{ width: `${s1}%` }}
                                  />
                                </div>
                                {/* Subscore breakdowns */}
                                <div className="space-y-1.5 pt-2 border-t border-hairline/60">
                                  {b1.subScores.map((sub) => (
                                    <div key={sub.label} className="text-[11px] font-mono text-ink-secondary">
                                      <span className="font-medium text-ink">{sub.label} ({sub.score}/{sub.max}):</span> {sub.rationale}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Contender 2 Pillar Box */}
                              <div className={`p-4 border ${pAdvantage.winnerSlot === 2 ? 'border-gold/40 bg-warm-white' : 'border-hairline bg-warm-surface/10'}`}>
                                <div className="flex items-center justify-between text-xs font-mono mb-2">
                                  <span className="text-ink-muted tracking-wider uppercase">{watch2.brand}</span>
                                  <span className="font-display text-xl font-normal text-ink">{s2.toFixed(1)} <span className="text-[10px] font-mono text-ink-muted">/ 100</span></span>
                                </div>
                                {/* Visual score bar */}
                                <div className="w-full bg-warm-surface/80 h-1 mb-3 overflow-hidden">
                                  <div
                                    className={`h-full ${pAdvantage.winnerSlot === 2 ? 'bg-gold' : 'bg-ink/40'}`}
                                    style={{ width: `${s2}%` }}
                                  />
                                </div>
                                {/* Subscore breakdowns */}
                                <div className="space-y-1.5 pt-2 border-t border-hairline/60">
                                  {b2.subScores.map((sub) => (
                                    <div key={sub.label} className="text-[11px] font-mono text-ink-secondary">
                                      <span className="font-medium text-ink">{sub.label} ({sub.score}/{sub.max}):</span> {sub.rationale}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* -------------------------------------------------------- */}
                {/* SECTION 2: COLLECTOR'S VERDICT (YOUR VERDICT)            */}
                {/* -------------------------------------------------------- */}
                <div className="border-b border-hairline pb-6 mb-10">
                  <div className="flex items-center gap-2 mb-2 text-[10px] font-mono tracking-[0.25em] text-ink-secondary uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden="true" />
                    <span>COLLECTOR'S VERDICT // INTERACTIVE SHOWDOWN</span>
                  </div>
                  <h2 className="font-display text-3xl sm:text-4xl font-normal tracking-tight text-ink uppercase">
                    Your Verdict
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm font-mono text-ink-secondary">
                    SESSION VOTING &bull; CAST YOUR PERSONAL JUDGMENT ACROSS 5 CATEGORIES TO CHALLENGE THE BENCHMARK.
                  </p>
                </div>

                {/* Scorecard Summary Top Banner */}
                <div className="border border-hairline bg-ink text-warm-white p-8 sm:p-10 mb-16 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-warm-white/15 pb-8 mb-8">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-gold mb-1">
                        COLLECTOR'S VERDICT // SESSION SCORECARD
                      </div>
                      <h2 className="font-display text-2xl sm:text-3xl font-normal tracking-tight uppercase">
                        Round Score
                      </h2>
                    </div>

                    {/* Numeric Score Tally */}
                    <div className="flex items-center gap-6 text-center font-mono">
                      <div className="text-left">
                        <div className="text-[10px] uppercase tracking-widest text-warm-white/60">
                          {watch1.brand}
                        </div>
                        <div className="font-display text-4xl sm:text-5xl font-normal text-warm-white">
                          {watch1Score}
                        </div>
                      </div>

                      <div className="text-2xl text-warm-white/30 font-light">&mdash;</div>

                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-widest text-warm-white/60">
                          {watch2.brand}
                        </div>
                        <div className="font-display text-4xl sm:text-5xl font-normal text-warm-white">
                          {watch2Score}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Verdict Banner */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="text-xs sm:text-sm font-mono tracking-wider text-warm-white/80">
                      {totalVotesCast === 0 ? (
                        <span>AWAITING JUDGMENT &bull; CAST VOTES IN THE 5 CATEGORIES BELOW</span>
                      ) : watch1Score > watch2Score ? (
                        <span className="text-gold font-semibold">
                          VERDICT: {watch1.brand} {watch1.model.toUpperCase()} LEADS ({watch1Score} &mdash; {watch2Score})
                          {undecidedCount > 0 ? ` [${undecidedCount} REMAINING]` : ' [DECISIVE WIN]'}
                        </span>
                      ) : watch2Score > watch1Score ? (
                        <span className="text-gold font-semibold">
                          VERDICT: {watch2.brand} {watch2.model.toUpperCase()} LEADS ({watch2Score} &mdash; {watch1Score})
                          {undecidedCount > 0 ? ` [${undecidedCount} REMAINING]` : ' [DECISIVE WIN]'}
                        </span>
                      ) : (
                        <span className="text-warm-white font-semibold">
                          VERDICT: DEAD HEAT &bull; TIED AT {watch1Score} &mdash; {watch2Score}
                          {undecidedCount > 0 ? ` [${undecidedCount} UNDECIDED]` : ''}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      {totalVotesCast > 0 && (
                        <button
                          type="button"
                          onClick={handleResetVotes}
                          className="text-[10px] font-mono uppercase tracking-widest text-warm-white/60 hover:text-warm-white underline cursor-pointer"
                        >
                          RESET VOTES
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleResetBattle}
                        className="text-[10px] font-mono uppercase tracking-widest text-gold hover:underline cursor-pointer"
                      >
                        RESET BATTLE &bull; CHOOSE NEW CONTENDERS
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section: 5-Category Interactive Voting */}
                <div className="mb-20">
                  <div className="border-b border-hairline pb-6 mb-10">
                    <div className="flex items-center gap-2 mb-2 text-[10px] font-mono tracking-[0.25em] text-ink-secondary uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden="true" />
                      <span>THE 5 PILLARS // INTERACTIVE JUDGING</span>
                    </div>
                    <h2 className="font-display text-3xl sm:text-4xl font-normal tracking-tight text-ink uppercase">
                      Vote the Categories
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm font-mono text-ink-secondary">
                      SESSION VOTING &bull; LOCAL INTERACTIVE DECISION MATRIX (NO FABRICATED METRICS).
                    </p>
                  </div>

                  <div className="space-y-6">
                    {CATEGORIES.map((cat, idx) => {
                      const currentVote = votes[cat.key]
                      const isVoted = currentVote !== null

                      return (
                        <div
                          key={cat.key}
                          className="border border-hairline bg-warm-surface/20 p-6 sm:p-8 transition-colors hover:bg-warm-surface/40"
                        >
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                            {/* Category Metadata */}
                            <div className="lg:col-span-4">
                              <div className="text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase">
                                CRITERION 0{idx + 1}
                              </div>
                              <h3 className="font-display text-xl sm:text-2xl font-normal text-ink uppercase mt-1">
                                {cat.name}
                              </h3>
                              <p className="mt-2 text-xs font-mono text-ink-secondary leading-relaxed">
                                {cat.description}
                              </p>
                            </div>

                            {/* Two-Way Voting Toggles */}
                            <div className="lg:col-span-8 flex flex-col sm:flex-row items-stretch gap-4">
                              {/* Vote Contender 01 */}
                              <button
                                type="button"
                                onClick={() => handleVote(cat.key, 1)}
                                className={`flex-1 p-4 border text-left transition-all duration-200 cursor-pointer ${
                                  currentVote === 1
                                    ? 'border-ink bg-ink text-warm-white shadow-md'
                                    : 'border-hairline bg-warm-white text-ink hover:border-ink'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[9px] font-mono tracking-[0.2em] uppercase mb-1">
                                  <span className={currentVote === 1 ? 'text-gold font-semibold' : 'text-ink-muted'}>
                                    CONTENDER 01
                                  </span>
                                  {currentVote === 1 && (
                                    <span className="text-gold font-bold tracking-widest">&#10003; WINNER</span>
                                  )}
                                </div>
                                <div className="font-display text-base sm:text-lg uppercase">
                                  {watch1.brand}
                                </div>
                                <div
                                  className={`text-xs font-mono mt-0.5 truncate ${
                                    currentVote === 1 ? 'text-warm-white/80' : 'text-ink-secondary'
                                  }`}
                                >
                                  {watch1.model}
                                </div>
                              </button>

                              {/* VS Divider in middle on mobile/desktop */}
                              <div className="hidden sm:flex items-center justify-center font-mono text-xs text-ink-muted px-1">
                                VS
                              </div>

                              {/* Vote Contender 02 */}
                              <button
                                type="button"
                                onClick={() => handleVote(cat.key, 2)}
                                className={`flex-1 p-4 border text-left transition-all duration-200 cursor-pointer ${
                                  currentVote === 2
                                    ? 'border-ink bg-ink text-warm-white shadow-md'
                                    : 'border-hairline bg-warm-white text-ink hover:border-ink'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[9px] font-mono tracking-[0.2em] uppercase mb-1">
                                  <span className={currentVote === 2 ? 'text-gold font-semibold' : 'text-ink-muted'}>
                                    CONTENDER 02
                                  </span>
                                  {currentVote === 2 && (
                                    <span className="text-gold font-bold tracking-widest">&#10003; WINNER</span>
                                  )}
                                </div>
                                <div className="font-display text-base sm:text-lg uppercase">
                                  {watch2.brand}
                                </div>
                                <div
                                  className={`text-xs font-mono mt-0.5 truncate ${
                                    currentVote === 2 ? 'text-warm-white/80' : 'text-ink-secondary'
                                  }`}
                                >
                                  {watch2.model}
                                </div>
                              </button>
                            </div>
                          </div>

                          {/* Criterion Status Bar */}
                          <div className="mt-4 pt-3 border-t border-hairline/60 flex items-center justify-between text-[10px] font-mono uppercase text-ink-muted">
                            <span>
                              {isVoted
                                ? `SELECTED: ${currentVote === 1 ? watch1.brand : watch2.brand} FOR ${cat.name}`
                                : 'NO DECISION RECORDED'}
                            </span>
                            <span className="text-ink-secondary">
                              CLICK TO TOGGLE VOTE
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Section: Side-by-Side 17-Spec Technical Dossier */}
                <div className="mb-20">
                  <div className="border-b border-hairline pb-6 mb-10">
                    <div className="flex items-center gap-2 mb-2 text-[10px] font-mono tracking-[0.25em] text-ink-secondary uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden="true" />
                      <span>ENGINEERING ARCHITECTURE // SPEC MATRIX</span>
                    </div>
                    <h2 className="font-display text-3xl sm:text-4xl font-normal tracking-tight text-ink uppercase">
                      Technical Breakdown
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm font-mono text-ink-secondary">
                      VERIFIED SPECIFICATIONS EXTRACTED DIRECTLY FROM THE DATABASE DOSSIER.
                    </p>
                  </div>

                  {/* Spec Table */}
                  <div className="border border-hairline bg-warm-white overflow-hidden">
                    {/* Table Header: Contender Names */}
                    <div className="grid grid-cols-1 md:grid-cols-12 border-b border-hairline bg-warm-surface/40 text-xs font-mono">
                      <div className="md:col-span-5 p-4 sm:p-6 text-left border-b md:border-b-0 md:border-r border-hairline">
                        <div className="text-[10px] text-ink-muted tracking-[0.2em] uppercase">
                          CONTENDER 01
                        </div>
                        <div className="font-display text-xl uppercase font-normal text-ink mt-1">
                          {watch1.brand}
                        </div>
                        <div className="text-xs text-ink-secondary">{watch1.model}</div>
                      </div>

                      <div className="md:col-span-2 hidden md:flex items-center justify-center p-4 text-[10px] text-ink-muted uppercase tracking-[0.2em] border-r border-hairline bg-warm-surface/60">
                        SPECIFICATION
                      </div>

                      <div className="md:col-span-5 p-4 sm:p-6 text-left md:text-right">
                        <div className="text-[10px] text-ink-muted tracking-[0.2em] uppercase">
                          CONTENDER 02
                        </div>
                        <div className="font-display text-xl uppercase font-normal text-ink mt-1">
                          {watch2.brand}
                        </div>
                        <div className="text-xs text-ink-secondary">{watch2.model}</div>
                      </div>
                    </div>

                    {/* Spec Rows */}
                    <div className="divide-y divide-hairline">
                      {specList.map((row) => (
                        <div
                          key={row.label}
                          className="grid grid-cols-1 md:grid-cols-12 transition-colors hover:bg-warm-surface/20"
                        >
                          {/* Contender 1 Value */}
                          <div className="md:col-span-5 p-3.5 sm:p-4 text-xs font-mono text-ink flex items-center justify-between md:justify-start md:border-r border-hairline">
                            <span className="md:hidden text-[10px] text-ink-muted uppercase tracking-wider">
                              {row.label} (01):
                            </span>
                            <span className="font-medium">{row.val1}</span>
                          </div>

                          {/* Center Spec Label (Desktop) */}
                          <div className="md:col-span-2 hidden md:flex items-center justify-center p-3 text-[10px] font-mono text-ink-muted uppercase tracking-wider text-center bg-warm-surface/10 md:border-r border-hairline">
                            {row.label}
                          </div>

                          {/* Contender 2 Value */}
                          <div className="md:col-span-5 p-3.5 sm:p-4 text-xs font-mono text-ink flex items-center justify-between md:justify-end">
                            <span className="md:hidden text-[10px] text-ink-muted uppercase tracking-wider">
                              {row.label} (02):
                            </span>
                            <span className="font-medium text-right">{row.val2}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Final Arena Callout & Reset Footer */}
                <div className="border border-hairline bg-warm-surface/30 p-8 sm:p-12 text-center max-w-2xl mx-auto">
                  <div className="text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-3">
                    SHOWDOWN COMPLETE
                  </div>
                  <h3 className="font-display text-2xl sm:text-3xl font-normal text-ink uppercase mb-3">
                    Conclude or Re-engage
                  </h3>
                  <p className="text-xs sm:text-sm font-mono text-ink-secondary max-w-md mx-auto mb-8 leading-relaxed">
                    Compare another matchup from the central database archive or reset the current judging round.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button variant="secondary" size="sm" onClick={handleResetVotes}>
                      CLEAR VOTES ONLY
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleResetBattle}>
                      RESET &bull; CHOOSE NEW CONTENDERS &rarr;
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Watch Selection Modal */}
        {watches && (
          <WatchPickerModal
            isOpen={activePickerSlot !== null}
            onClose={() => setActivePickerSlot(null)}
            onSelect={handleSelectWatch}
            watches={watches}
            disabledWatchId={
              activePickerSlot === 1 ? watch2?.id : watch1?.id
            }
            slotNumber={activePickerSlot || 1}
          />
        )}
      </Container>
    </div>
  )
}
