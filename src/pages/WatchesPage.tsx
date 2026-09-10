import { useEffect, useState } from 'react'
import Container from '../components/common/Container'
import Button from '../components/common/Button'
import { Link } from '../router'
import { fetchWatches } from '../services/watchService'
import type { Watch } from '../types/watch'

export default function WatchesPage() {
  const [watches, setWatches] = useState<Watch[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConfigured, setIsConfigured] = useState(true)

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

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        {/* Page Header */}
        <div className="border-b border-hairline pb-8 mb-12 sm:mb-16">
          <div className="flex items-center gap-2 mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
            <span>CENTRAL WATCH DATABASE &bull; INDEX</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-ink uppercase">
            Watch Index
          </h1>
          <p className="mt-3 text-base sm:text-lg text-ink-secondary max-w-2xl">
            Explore the watches behind the culture.
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

        {/* 4. Real Watch Archive Grid (Data-driven from Supabase) */}
        {!loading && !error && watches && watches.length > 0 && (
          <div>
            <div className="mb-6 flex items-center justify-between text-[11px] font-mono tracking-[0.2em] text-ink-muted uppercase">
              <span>CATALOGED TIMEPIECES // {watches.length} RECORDS</span>
              <span>SORT: ALPHABETICAL</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {watches.map((watch) => (
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

                    {/* Category pill */}
                    {watch.category && (
                      <div className="absolute top-3 left-3 px-2.5 py-1 bg-warm-white/90 backdrop-blur-sm border border-hairline text-[9px] font-mono tracking-[0.2em] uppercase text-ink font-medium">
                        {watch.category}
                      </div>
                    )}
                  </div>

                  {/* Watch Editorial Data */}
                  <div className="p-6 sm:p-7 flex flex-col justify-between flex-grow">
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink-secondary">
                        {watch.brand}
                      </div>

                      <h2 className="mt-1 font-display text-xl sm:text-2xl font-normal tracking-tight text-ink uppercase group-hover:text-neutral-800 transition-colors">
                        {watch.model}
                      </h2>

                      <div className="mt-2 text-xs font-mono text-ink-muted tracking-wider">
                        REF. {watch.reference_number}
                      </div>
                    </div>

                    {/* Specifications footer */}
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
      </Container>
    </div>
  )
}
