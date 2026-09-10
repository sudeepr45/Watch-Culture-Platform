import { useEffect, useState, useRef, useMemo } from 'react'
import Container from '../components/common/Container'
import Button from '../components/common/Button'
import WatchImage from '../components/common/WatchImage'
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
    name: 'Presence & Distinction',
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
          <div className="flex items-center gap-2 mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
            <span>HEAD-TO-HEAD SPECIFICATION AUDIT // WATCH COMPARISON</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-ink uppercase">
            Analytical Comparison
          </h1>
          <p className="mt-3 text-base sm:text-lg text-ink-secondary max-w-2xl font-light leading-relaxed">
            Select two timepieces from the verified archive to examine the comparative engineering dossier, evaluate five horological dimensions, and review the deterministic benchmark.
          </p>
        </div>

        {/* 1. Loading State */}
        {loading && (
          <div className="border border-hairline bg-warm-surface/30 p-12 sm:p-20 text-center max-w-3xl mx-auto mb-12">
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
              Loading Watch Database
            </h2>
            <p className="mt-3 text-xs sm:text-sm font-mono tracking-widest text-ink-muted uppercase">
              RETRIEVING SPECIFICATIONS...
            </p>
          </div>
        )}

        {/* 2. Error / Unconfigured State */}
        {!loading && error && (
          <div className="border border-hairline bg-warm-surface/40 p-8 sm:p-14 text-center max-w-3xl mx-auto mb-12">
            <h2 className="font-display text-2xl font-normal tracking-tight text-ink uppercase mb-2">
              Database Connection Error
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

        {/* 4. Dual Contender Slots Selection */}
        {!loading && !error && watches && watches.length > 0 && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-5xl mx-auto mb-12">
              {/* Contender 01 Slot */}
              <div className="border border-hairline bg-warm-surface/20 flex flex-col justify-between overflow-hidden">
                <div className="p-4 border-b border-hairline bg-warm-surface/40 flex items-center justify-between text-[10px] font-mono tracking-[0.2em] uppercase">
                  <span className="text-ink font-semibold">SPECIMEN A</span>
                  <span className="text-ink-muted">
                    {watch1 ? 'SPECIMEN SELECTED' : 'SLOT VACANT'}
                  </span>
                </div>

                {watch1 ? (
                  <div>
                    {/* Selected Watch Image */}
                    <div className="relative aspect-[16/10] w-full bg-warm-surface border-b border-hairline overflow-hidden">
                      <WatchImage
                        src={watch1.image_url}
                        alt={`${watch1.brand} ${watch1.model}`}
                        aspectRatio="aspect-[16/10]"
                      />
                      {watch1.category && (
                        <div className="absolute top-3 left-3 px-2.5 py-1 bg-warm-white border border-hairline text-[9px] font-mono tracking-[0.2em] uppercase text-ink font-medium z-10">
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
                      <span className="font-mono text-xs">A</span>
                    </div>
                    <h3 className="font-display text-xl sm:text-2xl font-normal text-ink uppercase">
                      Select Specimen A
                    </h3>
                    <p className="mt-2 text-xs font-mono text-ink-secondary">
                      CHOOSE FROM VERIFIED ARCHIVE
                    </p>
                  </div>
                )}

                {/* Specimen A Action */}
                <div className="p-4 sm:p-6 border-t border-hairline bg-warm-white flex items-center justify-between">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setActivePickerSlot(1)}
                    className="w-full"
                  >
                    {watch1 ? 'CHANGE SPECIMEN A \u2192' : 'CHOOSE SPECIMEN A \u2192'}
                  </Button>
                </div>
              </div>

              {/* Contender 02 Slot */}
              <div className="border border-hairline bg-warm-surface/20 flex flex-col justify-between overflow-hidden">
                <div className="p-4 border-b border-hairline bg-warm-surface/40 flex items-center justify-between text-[10px] font-mono tracking-[0.2em] uppercase">
                  <span className="text-ink font-semibold">SPECIMEN B</span>
                  <span className="text-ink-muted">
                    {watch2 ? 'SPECIMEN SELECTED' : 'SLOT VACANT'}
                  </span>
                </div>

                {watch2 ? (
                  <div>
                    {/* Selected Watch Image */}
                    <div className="relative aspect-[16/10] w-full bg-warm-surface border-b border-hairline overflow-hidden">
                      <WatchImage
                        src={watch2.image_url}
                        alt={`${watch2.brand} ${watch2.model}`}
                        aspectRatio="aspect-[16/10]"
                      />
                      {watch2.category && (
                        <div className="absolute top-3 left-3 px-2.5 py-1 bg-warm-white border border-hairline text-[9px] font-mono tracking-[0.2em] uppercase text-ink font-medium z-10">
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
                      <span className="font-mono text-xs">B</span>
                    </div>
                    <h3 className="font-display text-xl sm:text-2xl font-normal text-ink uppercase">
                      Select Specimen B
                    </h3>
                    <p className="mt-2 text-xs font-mono text-ink-secondary">
                      CHOOSE FROM VERIFIED ARCHIVE
                    </p>
                  </div>
                )}

                {/* Specimen B Action */}
                <div className="p-4 sm:p-6 border-t border-hairline bg-warm-white flex items-center justify-between">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setActivePickerSlot(2)}
                    className="w-full"
                  >
                    {watch2 ? 'CHANGE SPECIMEN B \u2192' : 'CHOOSE SPECIMEN B \u2192'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Battle Trigger Central Callout */}
            <div className="max-w-xl mx-auto text-center border border-hairline bg-warm-surface/40 p-8 sm:p-10 mb-16">
              <div className="text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-3">
                {watch1 && watch2
                  ? 'COMPARATIVE DOSSIER READY // SPECIMENS LOCKED'
                  : 'SELECTION REQUIRED // VACANT SPECIMEN SLOTS'}
              </div>

              {watch1 && watch2 ? (
                <div>
                  <h2 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-ink uppercase mb-2">
                    {watch1.brand} &bull; {watch2.brand}
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
                    GENERATE COMPARATIVE ANALYSIS &rarr;
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-xs sm:text-sm font-mono text-ink-secondary mb-4 leading-relaxed">
                    Select two distinct timepieces above to unlock the side-by-side specification ledger, deterministic evaluation, and dimensional assessment.
                  </p>
                  <Button variant="secondary" size="md" disabled className="w-full sm:w-auto">
                    SELECT TWO SPECIMENS TO COMPARE
                  </Button>
                </div>
              )}
            </div>

            {/* 5. Head-to-Head Comparison & Interactive Voting Arena */}
            {isBattleEngaged && watch1 && watch2 && (
              <div ref={arenaRef} id="battle-arena" className="pt-8 scroll-mt-24">
                {/* -------------------------------------------------------- */}
                {/* SECTION 1: FACTUAL EVIDENCE // SPECIFICATION MATRIX       */}
                {/* -------------------------------------------------------- */}
                <div className="mb-20">
                  <div className="border-b border-hairline pb-6 mb-10">
                    <div className="flex items-center gap-2 mb-2 text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
                      <span>FACTUAL EVIDENCE // TECHNICAL SPECIFICATION MATRIX</span>
                    </div>
                    <h2 className="font-display text-3xl sm:text-4xl font-normal tracking-tight text-ink uppercase">
                      Dimensional &amp; Mechanical Evidence
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm font-mono text-ink-secondary">
                      VERIFIED SPECIFICATIONS EXTRACTED DIRECTLY FROM THE ARCHIVAL DOSSIER.
                    </p>
                  </div>

                  {/* Spec Table */}
                  <div className="border border-hairline bg-warm-white overflow-hidden">
                    {/* Table Header: Specimen Names */}
                    <div className="grid grid-cols-1 md:grid-cols-12 border-b border-hairline bg-warm-surface/40 text-xs font-mono">
                      <div className="md:col-span-5 p-4 sm:p-6 text-left border-b md:border-b-0 md:border-r border-hairline">
                        <div className="text-[10px] text-ink-muted tracking-[0.2em] uppercase">
                          SPECIMEN A
                        </div>
                        <div className="font-display text-xl uppercase font-normal text-ink mt-1">
                          {watch1.brand}
                        </div>
                        <div className="text-xs text-ink-secondary">{watch1.model}</div>
                      </div>

                      <div className="md:col-span-2 hidden md:flex items-center justify-center p-4 text-[10px] text-ink-muted uppercase tracking-[0.2em] border-r border-hairline bg-warm-surface/60">
                        DIMENSION
                      </div>

                      <div className="md:col-span-5 p-4 sm:p-6 text-left md:text-right">
                        <div className="text-[10px] text-ink-muted tracking-[0.2em] uppercase">
                          SPECIMEN B
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
                          {/* Specimen A Value */}
                          <div className="md:col-span-5 p-3.5 sm:p-4 text-xs font-mono text-ink flex items-center justify-between md:justify-start md:border-r border-hairline">
                            <span className="md:hidden text-[10px] text-ink-muted uppercase tracking-wider">
                              {row.label} (A):
                            </span>
                            <span className="font-medium">{row.val1}</span>
                          </div>

                          {/* Center Spec Label (Desktop) */}
                          <div className="md:col-span-2 hidden md:flex items-center justify-center p-3 text-[10px] font-mono text-ink-muted uppercase tracking-wider text-center bg-warm-surface/10 md:border-r border-hairline">
                            {row.label}
                          </div>

                          {/* Specimen B Value */}
                          <div className="md:col-span-5 p-3.5 sm:p-4 text-xs font-mono text-ink flex items-center justify-between md:justify-end">
                            <span className="md:hidden text-[10px] text-ink-muted uppercase tracking-wider">
                              {row.label} (B):
                            </span>
                            <span className="font-medium text-right">{row.val2}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* -------------------------------------------------------- */}
                {/* SECTION 2: DETERMINISTIC ENGINE BENCHMARK                */}
                {/* -------------------------------------------------------- */}
                {deterministicEvaluation && (
                  <div className="mb-20">
                    <div className="border-b border-hairline pb-6 mb-10">
                      <div className="flex items-center gap-2 mb-2 text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
                        <span>DETERMINISTIC EVALUATION // 5-PILLAR BENCHMARK</span>
                      </div>
                      <h2 className="font-display text-3xl sm:text-4xl font-normal tracking-tight text-ink uppercase">
                        Deterministic Benchmark
                      </h2>
                      <p className="mt-2 text-xs sm:text-sm font-mono text-ink-secondary max-w-2xl">
                        Algorithmic composite evaluation derived strictly from verified database specifications across five horological pillars.
                      </p>
                    </div>

                    {/* Benchmark Composite Score Card */}
                    <div className="border border-hairline bg-ink text-warm-white p-8 sm:p-10 mb-10 relative overflow-hidden">
                      {/* Top Bar: Verdict Meta */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-warm-white/15 pb-6 mb-8">
                        <div>
                          <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-warm-white/80 mb-1">
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
                              PARITY (&plusmn;{deterministicEvaluation.margin.toFixed(1)} PTS)
                            </span>
                          )}
                          {deterministicEvaluation.verdictType === 'SLIGHT EDGE' && (
                            <span className="border border-warm-white/40 bg-warm-white/10 text-warm-white px-3 py-1 font-mono text-[10px] tracking-widest uppercase font-semibold">
                              MARGINAL ADVANTAGE (+{deterministicEvaluation.margin.toFixed(1)} PTS)
                            </span>
                          )}
                          {deterministicEvaluation.verdictType === 'CLEAR ADVANTAGE' && (
                            <span className="border border-warm-white bg-warm-white text-ink px-3 py-1 font-mono text-[10px] tracking-widest uppercase font-bold">
                              DISTINCT ADVANTAGE (+{deterministicEvaluation.margin.toFixed(1)} PTS)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Dual Specimen Composite Scores */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center border-b border-warm-white/15 pb-8 mb-8">
                        {/* Specimen A Composite */}
                        <div className="md:col-span-5 flex flex-col">
                          <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-warm-white/60 mb-1">
                            SPECIMEN A &bull; {watch1.brand}
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
                          <div className="text-[10px] font-mono uppercase tracking-widest text-warm-white/50 mt-2">
                            REF. {watch1.reference_number} &bull; CALIBRE {watch1.calibre || watch1.movement_name || 'N/A'}
                          </div>
                        </div>

                        {/* Center Differential */}
                        <div className="md:col-span-2 flex flex-col items-center justify-center text-center py-2">
                          <span className="font-mono text-xs tracking-widest text-warm-white/40 uppercase font-light">DIFFERENTIAL</span>
                          <span className="font-mono text-[11px] text-warm-white/80 tracking-widest uppercase mt-1">
                            &Delta; {deterministicEvaluation.margin.toFixed(1)} PTS
                          </span>
                        </div>

                        {/* Specimen B Composite */}
                        <div className="md:col-span-5 flex flex-col md:text-right">
                          <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-warm-white/60 mb-1">
                            SPECIMEN B &bull; {watch2.brand}
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
                          <div className="text-[10px] font-mono uppercase tracking-widest text-warm-white/50 mt-2">
                            REF. {watch2.reference_number} &bull; CALIBRE {watch2.calibre || watch2.movement_name || 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Editorial Benchmark Written Interpretation */}
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-warm-white/80 mb-2">
                          WRITTEN SYNTHESIS // {deterministicEvaluation.headline}
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
                                  <span className="text-[10px] font-mono tracking-widest text-ink uppercase font-semibold">
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
                                  <span className="text-ink font-semibold border border-ink/40 px-2.5 py-1 bg-warm-white">
                                    FAVORS {watch1.brand} (+{pAdvantage.delta.toFixed(1)} PTS)
                                  </span>
                                ) : (
                                  <span className="text-ink font-semibold border border-ink/40 px-2.5 py-1 bg-warm-white">
                                    FAVORS {watch2.brand} (+{pAdvantage.delta.toFixed(1)} PTS)
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Side-by-Side Pillar Comparison */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Specimen A Pillar Box */}
                              <div className={`p-5 border ${pAdvantage.winnerSlot === 1 ? 'border-ink bg-warm-white' : 'border-hairline bg-warm-surface/10'}`}>
                                <div className="flex items-center justify-between text-xs font-mono mb-3 pb-2 border-b border-hairline/60">
                                  <span className="text-ink-muted tracking-wider uppercase">{watch1.brand}</span>
                                  <span className="font-display text-xl font-normal text-ink">{s1.toFixed(1)} <span className="text-[10px] font-mono text-ink-muted">/ 100</span></span>
                                </div>
                                {/* Subscore breakdowns */}
                                <div className="space-y-1.5">
                                  {b1.subScores.map((sub) => (
                                    <div key={sub.label} className="text-[11px] font-mono text-ink-secondary">
                                      <span className="font-medium text-ink">{sub.label} ({sub.score}/{sub.max}):</span> {sub.rationale}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Specimen B Pillar Box */}
                              <div className={`p-5 border ${pAdvantage.winnerSlot === 2 ? 'border-ink bg-warm-white' : 'border-hairline bg-warm-surface/10'}`}>
                                <div className="flex items-center justify-between text-xs font-mono mb-3 pb-2 border-b border-hairline/60">
                                  <span className="text-ink-muted tracking-wider uppercase">{watch2.brand}</span>
                                  <span className="font-display text-xl font-normal text-ink">{s2.toFixed(1)} <span className="text-[10px] font-mono text-ink-muted">/ 100</span></span>
                                </div>
                                {/* Subscore breakdowns */}
                                <div className="space-y-1.5">
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
                {/* SECTION 3: DIMENSIONAL ASSESSMENT (COLLECTOR'S RECORD)   */}
                {/* -------------------------------------------------------- */}
                <div className="border-b border-hairline pb-6 mb-10">
                  <div className="flex items-center gap-2 mb-2 text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
                    <span>DIMENSIONAL CRITERIA // EDITORIAL ASSESSMENT</span>
                  </div>
                  <h2 className="font-display text-3xl sm:text-4xl font-normal tracking-tight text-ink uppercase">
                    Dimensional Assessment
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm font-mono text-ink-secondary">
                    SESSION EVALUATION &bull; RECORD YOUR COMPARATIVE PREFERENCE ACROSS 5 CORE HOROLOGICAL CRITERIA.
                  </p>
                </div>

                {/* Scorecard Summary Top Banner */}
                <div className="border border-hairline bg-ink text-warm-white p-8 sm:p-10 mb-16 relative overflow-hidden">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-warm-white/15 pb-8 mb-8">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-warm-white/70 mb-1">
                        DIMENSIONAL SUMMARY // ASSESSMENT RECORD
                      </div>
                      <h2 className="font-display text-2xl sm:text-3xl font-normal tracking-tight uppercase">
                        Assessment Tally
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

                  {/* Dynamic Assessment Banner */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="text-xs sm:text-sm font-mono tracking-wider text-warm-white/80">
                      {totalVotesCast === 0 ? (
                        <span>AWAITING EVALUATION &bull; SELECT PREFERENCES ACROSS THE 5 CRITERIA BELOW</span>
                      ) : watch1Score > watch2Score ? (
                        <span className="text-warm-white font-semibold">
                          ASSESSMENT: {watch1.brand} {watch1.model.toUpperCase()} FAVORED ({watch1Score} &mdash; {watch2Score})
                          {undecidedCount > 0 ? ` [${undecidedCount} REMAINING]` : ' [DISTINCT PREFERENCE]'}
                        </span>
                      ) : watch2Score > watch1Score ? (
                        <span className="text-warm-white font-semibold">
                          ASSESSMENT: {watch2.brand} {watch2.model.toUpperCase()} FAVORED ({watch2Score} &mdash; {watch1Score})
                          {undecidedCount > 0 ? ` [${undecidedCount} REMAINING]` : ' [DISTINCT PREFERENCE]'}
                        </span>
                      ) : (
                        <span className="text-warm-white font-semibold">
                          ASSESSMENT: EVEN SPLIT &bull; TIED AT {watch1Score} &mdash; {watch2Score}
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
                          RESET SELECTIONS
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleResetBattle}
                        className="text-[10px] font-mono uppercase tracking-widest text-warm-white/80 hover:text-warm-white hover:underline cursor-pointer"
                      >
                        RESET &bull; CHOOSE NEW SPECIMENS
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section: 5-Category Interactive Evaluation */}
                <div className="mb-20">
                  <div className="border-b border-hairline pb-6 mb-10">
                    <div className="flex items-center gap-2 mb-2 text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase">
                      <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
                      <span>THE 5 DIMENSIONS // EDITORIAL CRITERIA</span>
                    </div>
                    <h2 className="font-display text-3xl sm:text-4xl font-normal tracking-tight text-ink uppercase">
                      Evaluate Dimensions
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm font-mono text-ink-secondary">
                      LOCAL INTERACTIVE EVALUATION MATRIX (OBJECTIVE FACTUAL INPUTS).
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

                            {/* Two-Way Selection Toggles */}
                            <div className="lg:col-span-8 flex flex-col sm:flex-row items-stretch gap-4">
                              {/* Select Specimen A */}
                              <button
                                type="button"
                                onClick={() => handleVote(cat.key, 1)}
                                className={`flex-1 p-4 border text-left transition-all duration-200 cursor-pointer ${
                                  currentVote === 1
                                    ? 'border-ink bg-ink text-warm-white'
                                    : 'border-hairline bg-warm-white text-ink hover:border-ink'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[9px] font-mono tracking-[0.2em] uppercase mb-1">
                                  <span className={currentVote === 1 ? 'text-steel font-semibold' : 'text-ink-muted'}>
                                    SPECIMEN A
                                  </span>
                                  {currentVote === 1 && (
                                    <span className="text-steel font-mono tracking-widest text-[9px] uppercase">SELECTED PREFERENCE</span>
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

                              {/* Select Specimen B */}
                              <button
                                type="button"
                                onClick={() => handleVote(cat.key, 2)}
                                className={`flex-1 p-4 border text-left transition-all duration-200 cursor-pointer ${
                                  currentVote === 2
                                    ? 'border-ink bg-ink text-warm-white'
                                    : 'border-hairline bg-warm-white text-ink hover:border-ink'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[9px] font-mono tracking-[0.2em] uppercase mb-1">
                                  <span className={currentVote === 2 ? 'text-steel font-semibold' : 'text-ink-muted'}>
                                    SPECIMEN B
                                  </span>
                                  {currentVote === 2 && (
                                    <span className="text-steel font-mono tracking-widest text-[9px] uppercase">SELECTED PREFERENCE</span>
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
                              CLICK TO TOGGLE PREFERENCE
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Final Callout & Reset Footer */}
                <div className="border border-hairline bg-warm-surface/30 p-8 sm:p-12 text-center max-w-2xl mx-auto">
                  <div className="text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-3">
                    COMPARATIVE AUDIT COMPLETE
                  </div>
                  <h3 className="font-display text-2xl sm:text-3xl font-normal text-ink uppercase mb-3">
                    Conclude or Compare New Specimens
                  </h3>
                  <p className="text-xs sm:text-sm font-mono text-ink-secondary max-w-md mx-auto mb-8 leading-relaxed">
                    Compare another pair of timepieces from the central archive or reset the current assessment.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button variant="secondary" size="sm" onClick={handleResetVotes}>
                      CLEAR SELECTIONS ONLY
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleResetBattle}>
                      RESET &bull; CHOOSE NEW SPECIMENS &rarr;
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
