import { useState, useEffect, useRef } from 'react'
import Container from '../components/common/Container'
import Button from '../components/common/Button'
import { Link } from '../router'
import { useRouter } from '../router/useRouter'
import { searchAll } from '../services/searchService'
import type { SearchFilter, UnifiedSearchResults } from '../types/search'

const SUGGESTED_QUERIES = [
  'Speedmaster',
  'GA-2100',
  'Chronograph',
  'Rolex',
  'Automatic',
  'Water Resistance',
]

export default function SearchPage() {
  const { navigate } = useRouter()

  // Initialize query from URL search parameters (?q=...)
  const [query, setQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('q') || ''
    }
    return ''
  })

  const [activeFilter, setActiveFilter] = useState<SearchFilter>('all')
  const [results, setResults] = useState<UnifiedSearchResults>({
    watches: [],
    topics: [],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track the latest search request to prevent race conditions
  const latestRequestId = useRef(0)

  const handleQueryChange = (val: string) => {
    setQuery(val)
    if (!val.trim()) {
      setResults({ watches: [], topics: [] })
      setLoading(false)
      setError(null)
    }
  }

  // Execute search with 300ms debounce
  useEffect(() => {
    const trimmed = query.trim()

    // Synchronize URL query parameter without polluting history
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (trimmed) {
        url.searchParams.set('q', trimmed)
      } else {
        url.searchParams.delete('q')
      }
      window.history.replaceState(null, '', url.pathname + url.search)
    }

    if (!trimmed) {
      return
    }

    const requestId = ++latestRequestId.current

    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      const res = await searchAll(trimmed)

      // Only apply results if this request is still the most recent
      if (requestId === latestRequestId.current) {
        if (res.error) {
          setError(res.error.message)
        } else {
          setResults(res.data)
        }
        setLoading(false)
      }
    }, 300)

    return () => {
      clearTimeout(timer)
    }
  }, [query])

  const handleClear = () => {
    setQuery('')
    setResults({ watches: [], topics: [] })
    setLoading(false)
    setError(null)
    setActiveFilter('all')
  }

  const handleRetry = async () => {
    const trimmed = query.trim()
    if (!trimmed) return

    setLoading(true)
    setError(null)
    const res = await searchAll(trimmed)
    if (res.error) {
      setError(res.error.message)
    } else {
      setResults(res.data)
    }
    setLoading(false)
  }

  const watchCount = results.watches.length
  const topicCount = results.topics.length
  const totalCount = watchCount + topicCount
  const hasQuery = Boolean(query.trim())

  const showWatches =
    (activeFilter === 'all' || activeFilter === 'watches') && watchCount > 0
  const showTopics =
    (activeFilter === 'all' || activeFilter === 'topics') && topicCount > 0

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        {/* Editorial Header */}
        <div className="border-b border-hairline pb-8 mb-12 sm:mb-16">
          <div className="flex items-center gap-2 mb-3 text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-ink-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden="true" />
            <span>GLOBAL REPOSITORY &bull; SEARCH &amp; DISCOVERY</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-ink uppercase">
            Search Index
          </h1>
          <p className="mt-3 text-base sm:text-lg text-ink-secondary max-w-2xl">
            Query timepieces, reference numbers, calibres, materials, and horological fundamentals.
          </p>
        </div>

        {/* Search Input Bar */}
        <div className="max-w-3xl mx-auto mb-10">
          <div className="relative flex items-center border border-hairline bg-warm-surface/50 transition-colors focus-within:border-ink">
            <span className="pl-4 sm:pl-6 text-ink-muted">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search watches, references, calibres, topics..."
              className="w-full px-4 sm:px-6 py-4 bg-transparent text-ink text-base font-sans focus:outline-none placeholder:text-ink-muted/60"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="pr-4 sm:pr-6 text-xs font-mono uppercase tracking-widest text-ink-muted hover:text-ink cursor-pointer"
              >
                CLEAR
              </button>
            )}
          </div>

          {/* Quick Suggestions when input is empty */}
          {!hasQuery && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-ink-muted mr-1">
                POPULAR:
              </span>
              {SUGGESTED_QUERIES.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="px-2.5 py-1 border border-hairline bg-warm-white text-[11px] font-mono text-ink-secondary hover:text-ink hover:border-ink transition-colors cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          )}

          {/* Filter Pills (Shown when search has results) */}
          {hasQuery && !loading && totalCount > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider border transition-colors cursor-pointer ${
                    activeFilter === 'all'
                      ? 'bg-ink text-warm-white border-ink'
                      : 'bg-warm-surface/40 text-ink-secondary border-hairline hover:border-ink hover:text-ink'
                  }`}
                >
                  ALL ({totalCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('watches')}
                  className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider border transition-colors cursor-pointer ${
                    activeFilter === 'watches'
                      ? 'bg-ink text-warm-white border-ink'
                      : 'bg-warm-surface/40 text-ink-secondary border-hairline hover:border-ink hover:text-ink'
                  }`}
                >
                  WATCHES ({watchCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('topics')}
                  className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider border transition-colors cursor-pointer ${
                    activeFilter === 'topics'
                      ? 'bg-ink text-warm-white border-ink'
                      : 'bg-warm-surface/40 text-ink-secondary border-hairline hover:border-ink hover:text-ink'
                  }`}
                >
                  ACADEMY TOPICS ({topicCount})
                </button>
              </div>

              <span className="text-[10px] font-mono tracking-widest text-ink-muted uppercase">
                {totalCount} {totalCount === 1 ? 'RESULT' : 'RESULTS'} FOR &ldquo;{query.trim()}&rdquo;
              </span>
            </div>
          )}
        </div>

        {/* 1. Loading State */}
        {loading && (
          <div className="border border-hairline bg-warm-surface/20 p-16 text-center max-w-2xl mx-auto my-8">
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
            <h2 className="font-display text-2xl font-normal uppercase tracking-tight text-ink">
              Searching Repository
            </h2>
            <p className="mt-2 text-xs font-mono tracking-widest text-ink-muted uppercase">
              QUERYING WATCHES &amp; ACADEMY SPECIMENS...
            </p>
          </div>
        )}

        {/* 2. Error State */}
        {!loading && error && (
          <div className="border border-hairline bg-warm-surface/40 p-10 text-center max-w-2xl mx-auto my-8">
            <p className="text-xs font-mono text-rose-800 mb-4">{error}</p>
            <Button variant="secondary" size="sm" onClick={handleRetry}>
              RETRY QUERY &rarr;
            </Button>
          </div>
        )}

        {/* 3. Empty State (No Results) */}
        {!loading && !error && hasQuery && totalCount === 0 && (
          <div className="border border-hairline bg-warm-surface/30 p-10 sm:p-16 text-center max-w-2xl mx-auto my-8">
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
            <h3 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-ink uppercase">
              No Specimens Found
            </h3>
            <p className="mt-3 text-xs sm:text-sm font-light text-ink-secondary leading-relaxed max-w-md mx-auto">
              No timepieces or academy lessons matched &ldquo;{query.trim()}&rdquo;. Try another search term, or browse the complete Watch Index.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button variant="primary" size="sm" onClick={() => navigate('/watches')}>
                BROWSE WATCH INDEX &rarr;
              </Button>
              <Button variant="secondary" size="sm" onClick={handleClear}>
                CLEAR SEARCH
              </Button>
            </div>
          </div>
        )}

        {/* 4. Idle State (Empty Input) */}
        {!loading && !error && !hasQuery && (
          <div className="border border-hairline bg-warm-surface/20 p-8 sm:p-14 text-center max-w-3xl mx-auto my-8">
            <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-ink-muted mb-2">
              CENTRAL DIRECTORY // STANDBY
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-ink uppercase">
              Explore the Watch Index
            </h3>
            <p className="mt-3 text-xs sm:text-sm font-light text-ink-secondary leading-relaxed max-w-lg mx-auto">
              Type a brand name, reference code, movement calibre, case material, or horological concept to query the platform.
            </p>
          </div>
        )}

        {/* 5. Results Display */}
        {!loading && !error && hasQuery && totalCount > 0 && (
          <div className="space-y-16">
            {/* Watches Results Section */}
            {showWatches && (
              <div>
                <div className="mb-6 flex items-center justify-between border-b border-hairline pb-3 text-[11px] font-mono tracking-[0.2em] uppercase">
                  <span className="text-ink font-semibold">
                    WATCH INDEX // {watchCount} {watchCount === 1 ? 'SPECIMEN' : 'SPECIMENS'}
                  </span>
                  <Link
                    to="/watches"
                    className="text-ink-muted hover:text-ink transition-colors"
                  >
                    VIEW ALL WATCHES &rarr;
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {results.watches.map((watch) => (
                    <Link
                      key={watch.id}
                      to={`/watches/${watch.slug}`}
                      className="group relative border border-hairline bg-warm-surface/20 flex flex-col justify-between transition-all duration-300 hover:border-ink hover:bg-warm-surface/60 overflow-hidden"
                    >
                      {/* Watch Photography */}
                      <div className="relative aspect-[4/3] w-full bg-warm-surface border-b border-hairline overflow-hidden">
                        {watch.image_url ? (
                          <img
                            src={watch.image_url}
                            alt={`${watch.brand} ${watch.model}`}
                            loading="lazy"
                            className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xs font-mono text-ink-muted uppercase tracking-widest">
                            SPECIMEN PHOTO PENDING
                          </div>
                        )}
                        {watch.category && (
                          <div className="absolute top-3 left-3 px-2.5 py-1 bg-warm-white/90 backdrop-blur-sm border border-hairline text-[9px] font-mono tracking-[0.2em] uppercase text-ink font-medium">
                            {watch.category}
                          </div>
                        )}
                      </div>

                      {/* Editorial Metadata */}
                      <div className="p-6 sm:p-7 flex flex-col justify-between flex-grow">
                        <div>
                          <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink-secondary">
                            {watch.brand}
                          </div>
                          <h4 className="mt-1 font-display text-xl sm:text-2xl font-normal tracking-tight text-ink uppercase group-hover:text-neutral-800 transition-colors">
                            {watch.model}
                          </h4>
                          <div className="mt-2 text-xs font-mono text-ink-muted tracking-wider">
                            REF. {watch.reference_number}
                          </div>
                        </div>

                        {/* Specifications Footer */}
                        <div className="mt-6 pt-4 border-t border-hairline flex items-center justify-between text-[11px] font-mono tracking-wider">
                          <div className="text-ink font-semibold">
                            {watch.price !== null
                              ? `$${watch.price.toLocaleString()} ${watch.currency}`
                              : 'PRICE UPON REQUEST'}
                          </div>
                          <div className="text-ink-secondary">
                            {watch.case_diameter_mm ? `${watch.case_diameter_mm} mm` : ''}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Topics Results Section */}
            {showTopics && (
              <div>
                <div className="mb-6 flex items-center justify-between border-b border-hairline pb-3 text-[11px] font-mono tracking-[0.2em] uppercase">
                  <span className="text-ink font-semibold">
                    WATCH 101 ACADEMY // {topicCount} {topicCount === 1 ? 'TOPIC' : 'TOPICS'}
                  </span>
                  <Link
                    to="/watch-101"
                    className="text-ink-muted hover:text-ink transition-colors"
                  >
                    VIEW CURRICULUM &rarr;
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.topics.map((topic) => (
                    <Link
                      key={topic.id}
                      to={`/watch-101/${topic.slug}`}
                      className="group border border-hairline bg-warm-surface/20 p-6 sm:p-7 flex flex-col justify-between hover:border-ink hover:bg-warm-surface/50 transition-all duration-300"
                    >
                      <div>
                        {/* Topic Category & Read Time */}
                        <div className="flex items-center justify-between gap-2 text-[9px] font-mono uppercase tracking-[0.2em] text-ink-secondary mb-3">
                          <span className="font-semibold text-gold">{topic.category}</span>
                          <span>{topic.readTimeMinutes} MIN</span>
                        </div>

                        <h4 className="font-display text-xl sm:text-2xl font-normal text-ink uppercase tracking-tight group-hover:text-neutral-800 transition-colors">
                          {topic.title}
                        </h4>

                        <p className="mt-2 text-xs sm:text-sm text-ink-secondary font-light line-clamp-3 leading-relaxed">
                          {topic.shortDescription}
                        </p>

                        {/* Interactive Widget indicator */}
                        {topic.interactiveType && (
                          <div className="mt-4 inline-flex items-center gap-1.5 px-2 py-0.5 border border-hairline bg-warm-white text-[8px] font-mono tracking-widest uppercase text-ink font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                            <span>INTERACTIVE LAB</span>
                          </div>
                        )}
                      </div>

                      {/* Footer Callout */}
                      <div className="mt-6 pt-4 border-t border-hairline flex items-center justify-between text-[10px] font-mono uppercase text-ink-muted group-hover:text-ink transition-colors">
                        <span className="tracking-wider">EXPLORE LESSON</span>
                        <span className="text-gold font-semibold transition-transform duration-300 group-hover:translate-x-1">
                          &rarr;
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Container>
    </div>
  )
}
