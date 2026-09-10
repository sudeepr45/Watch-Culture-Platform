import { useEffect, useState, useMemo } from 'react'
import Container from '../components/common/Container'
import Button from '../components/common/Button'
import { Link } from '../router'
import WatchImage from '../components/common/WatchImage'
import { fetchWatches } from '../services/watchService'
import type { Watch } from '../types/watch'

export default function WatchesPage() {
  const [watches, setWatches] = useState<Watch[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConfigured, setIsConfigured] = useState(true)

  // Assembled Specification Filters
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedMovement, setSelectedMovement] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    let isMounted = true

    fetchWatches().then((result) => {
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

  // Derive genuine distinct categories from loaded watches
  const categories = useMemo(() => {
    if (!watches) return []
    const set = new Set<string>()
    watches.forEach((w) => {
      if (w.category) set.add(w.category)
    })
    return Array.from(set).sort()
  }, [watches])

  // Derive genuine distinct movement types from loaded watches
  const movementTypes = useMemo(() => {
    if (!watches) return []
    const set = new Set<string>()
    watches.forEach((w) => {
      if (w.movement_type) set.add(w.movement_type)
    })
    return Array.from(set).sort()
  }, [watches])

  // Count specimens per category based on real data
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    if (!watches) return counts
    watches.forEach((w) => {
      if (w.category) {
        counts[w.category] = (counts[w.category] || 0) + 1
      }
    })
    return counts
  }, [watches])

  // Filtered specimen catalog
  const filteredWatches = useMemo(() => {
    if (!watches) return []
    return watches.filter((w) => {
      if (selectedCategory && w.category !== selectedCategory) {
        return false
      }
      if (selectedMovement && w.movement_type !== selectedMovement) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const brandMatch = w.brand.toLowerCase().includes(q)
        const modelMatch = w.model.toLowerCase().includes(q)
        const refMatch = w.reference_number.toLowerCase().includes(q)
        const calMatch = (w.calibre || '').toLowerCase().includes(q)
        if (!brandMatch && !modelMatch && !refMatch && !calMatch) {
          return false
        }
      }
      return true
    })
  }, [watches, selectedCategory, selectedMovement, searchQuery])

  const hasActiveFilters = Boolean(selectedCategory || selectedMovement || searchQuery.trim())

  const handleResetFilters = () => {
    setSelectedCategory(null)
    setSelectedMovement(null)
    setSearchQuery('')
  }

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        {/* Archival Masthead */}
        <div className="border-b border-hairline pb-8 mb-10 sm:mb-14">
          <div className="flex items-center gap-2 mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
            <span>VERIFIED REFERENCE ARCHIVE // SPECIMEN CATALOG</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-ink uppercase">
            The Archive
          </h1>
          <p className="mt-3 text-base sm:text-lg text-ink-secondary max-w-3xl font-light leading-relaxed">
            A living reference repository of historically significant and culturally definitive horological specimens. Indexed by mechanical specification and archival provenance.
          </p>
        </div>

        {/* 1. Loading State */}
        {loading && (
          <div className="relative border border-hairline bg-warm-surface/30 p-12 sm:p-20 text-center max-w-3xl mx-auto">
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
              Loading Watch Index
            </h2>
            <p className="mt-3 text-xs sm:text-sm font-mono tracking-widest text-ink-muted uppercase">
              QUERYING SUPABASE REPOSITORY...
            </p>
          </div>
        )}

        {/* 2. Error / Unconfigured State */}
        {!loading && error && (
          <div className="relative border border-hairline bg-warm-surface/40 p-8 sm:p-14 lg:p-20 text-center max-w-3xl mx-auto">
            <div className="absolute top-3 left-4 text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase">
              INDEX // 01
            </div>
            <div className="absolute top-3 right-4 text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase">
              STATUS: {isConfigured ? 'QUERY ERROR' : 'DISCONNECTED'}
            </div>

            <div className="max-w-md mx-auto py-6">
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

              <h2 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-ink uppercase">
                Unable to Load Watch Index
              </h2>

              <p className="mt-3 text-sm sm:text-base text-ink-secondary font-light leading-relaxed">
                {isConfigured
                  ? `Database connection error: ${error}`
                  : 'Supabase credentials are not configured in your environment variables. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'}
              </p>

              <div className="mt-8 flex justify-center">
                <Button variant="secondary" size="sm" onClick={handleRetry}>
                  RETRY QUERY &rarr;
                </Button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-hairline flex items-center justify-between text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase">
              <span>POSTGRESQL ARCHITECTURE</span>
              <span className="text-ink">SUPABASE WATCH DATABASE</span>
            </div>
          </div>
        )}

        {/* 3. Empty State */}
        {!loading && !error && (!watches || watches.length === 0) && (
          <div className="relative border border-hairline bg-warm-surface/40 p-8 sm:p-14 lg:p-20 text-center max-w-3xl mx-auto">
            <div className="max-w-md mx-auto py-6">
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

              <h2 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-ink uppercase">
                No Watches in the Index Yet
              </h2>

              <p className="mt-3 text-sm sm:text-base text-ink-secondary font-light leading-relaxed">
                Run the database seed script in your Supabase SQL Editor to populate the initial watch records.
              </p>
            </div>
          </div>
        )}

        {/* 4. Assembled Specification Filters & Archive Catalog */}
        {!loading && !error && watches && watches.length > 0 && (
          <div>
            {/* Specification Filter Assembly */}
            <div className="mb-10 border border-hairline bg-warm-surface/25 p-5 sm:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-hairline text-[10px] font-mono tracking-[0.2em] uppercase text-ink-muted">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
                  <span className="text-ink font-semibold">SPECIFICATION ASSEMBLY // FILTERS</span>
                </div>
                <span>
                  {filteredWatches.length} OF {watches.length} SPECIMENS MATCHING CRITERIA
                </span>
              </div>

              {/* Search Query Input */}
              <div className="pt-4 pb-4 border-b border-hairline">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="QUERY BY BRAND, MODEL, REFERENCE, OR CALIBRE..."
                    className="w-full bg-warm-white border border-hairline px-4 py-2.5 text-xs font-mono placeholder:text-ink-muted text-ink focus:outline-none focus:border-ink uppercase tracking-wider"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-ink-muted hover:text-ink cursor-pointer"
                    >
                      [CLEAR]
                    </button>
                  )}
                </div>
              </div>

              {/* Category Specification Row */}
              {categories.length > 0 && (
                <div className="pt-4 pb-4 border-b border-hairline">
                  <div className="text-[10px] font-mono tracking-[0.2em] text-ink-secondary uppercase mb-2">
                    CLASSIFICATION SPECIFICATION:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(null)}
                      className={`px-2.5 py-1 text-[10px] font-mono tracking-wider uppercase border transition-colors cursor-pointer ${
                        selectedCategory === null
                          ? 'border-ink bg-ink text-warm-white font-semibold'
                          : 'border-hairline bg-warm-white text-ink-secondary hover:border-ink hover:text-ink'
                      }`}
                    >
                      ALL CLASSIFICATIONS ({watches.length})
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                        className={`px-2.5 py-1 text-[10px] font-mono tracking-wider uppercase border transition-colors cursor-pointer ${
                          selectedCategory === cat
                            ? 'border-ink bg-ink text-warm-white font-semibold'
                            : 'border-hairline bg-warm-white text-ink-secondary hover:border-ink hover:text-ink'
                        }`}
                      >
                        {cat} ({categoryCounts[cat] || 0})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Movement Type Specification Row */}
              {movementTypes.length > 0 && (
                <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-mono tracking-[0.2em] text-ink-secondary uppercase mb-2">
                      CALIBRE ESCAPEMENT:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedMovement(null)}
                        className={`px-2.5 py-1 text-[10px] font-mono tracking-wider uppercase border transition-colors cursor-pointer ${
                          selectedMovement === null
                            ? 'border-ink bg-ink text-warm-white font-semibold'
                            : 'border-hairline bg-warm-white text-ink-secondary hover:border-ink hover:text-ink'
                        }`}
                      >
                        ALL ESCAPEMENTS
                      </button>
                      {movementTypes.map((mov) => (
                        <button
                          key={mov}
                          type="button"
                          onClick={() => setSelectedMovement(selectedMovement === mov ? null : mov)}
                          className={`px-2.5 py-1 text-[10px] font-mono tracking-wider uppercase border transition-colors cursor-pointer ${
                            selectedMovement === mov
                              ? 'border-ink bg-ink text-warm-white font-semibold'
                              : 'border-hairline bg-warm-white text-ink-secondary hover:border-ink hover:text-ink'
                          }`}
                        >
                          {mov}
                        </button>
                      ))}
                    </div>
                  </div>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="self-start sm:self-auto px-3 py-1 text-[10px] font-mono tracking-wider uppercase border border-ink text-ink bg-warm-white hover:bg-ink hover:text-warm-white transition-colors cursor-pointer"
                    >
                      RESET SPECIFICATIONS &times;
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Empty Filter Results State */}
            {filteredWatches.length === 0 ? (
              <div className="border border-hairline bg-warm-surface/20 p-12 text-center max-w-xl mx-auto my-12">
                <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-ink-muted mb-2">
                  ARCHIVE QUERY // NO SPECIMENS FOUND
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-normal tracking-tight text-ink uppercase">
                  No Matching Records
                </h3>
                <p className="mt-2 text-xs font-mono text-ink-secondary leading-relaxed">
                  No cataloged specimens meet the assembled specifications. Clear your filters to restore the archive view.
                </p>
                <div className="mt-6">
                  <Button variant="secondary" size="sm" onClick={handleResetFilters}>
                    RESET SPECIFICATIONS &rarr;
                  </Button>
                </div>
              </div>
            ) : (
              /* Archival Specimen Cards Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredWatches.map((watch) => (
                  <Link
                    key={watch.id}
                    to={`/watches/${watch.slug}`}
                    className="group relative border border-hairline bg-warm-surface/20 flex flex-col justify-between transition-all duration-300 hover:border-ink hover:bg-warm-surface/50 overflow-hidden"
                  >
                    {/* Documentary Specimen Photography */}
                    <div className="relative aspect-[4/3] w-full bg-warm-surface border-b border-hairline overflow-hidden">
                      <WatchImage
                        src={watch.image_url}
                        alt={`${watch.brand} ${watch.model}`}
                        imageClassName="group-hover:opacity-90"
                      />

                      {/* Integrated Archival Corner Tag */}
                      {watch.category && (
                        <div className="absolute top-0 left-0 border-b border-r border-hairline bg-warm-white px-2.5 py-1 text-[9px] font-mono tracking-[0.2em] uppercase text-ink font-medium z-10">
                          {watch.category}
                        </div>
                      )}

                      {/* Era Tag */}
                      {watch.release_year && (
                        <div className="absolute top-0 right-0 border-b border-l border-hairline bg-warm-white px-2.5 py-1 text-[9px] font-mono tracking-[0.15em] text-ink-muted z-10">
                          CIRCA {watch.release_year}
                        </div>
                      )}
                    </div>

                    {/* Specimen Identity & Concise Metadata */}
                    <div className="p-6 flex flex-col justify-between flex-grow">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink-secondary">
                          {watch.brand}
                        </div>

                        <h2 className="mt-1 font-display text-xl sm:text-2xl font-normal tracking-tight text-ink uppercase group-hover:text-neutral-800 transition-colors">
                          {watch.model}
                        </h2>

                        <div className="mt-1 text-xs font-mono text-ink-muted tracking-wider">
                          REF. {watch.reference_number}
                        </div>

                        {/* Concise Specification Architecture Strip */}
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

                      {/* Specimen Card Footer */}
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
            )}
          </div>
        )}
      </Container>
    </div>
  )
}
