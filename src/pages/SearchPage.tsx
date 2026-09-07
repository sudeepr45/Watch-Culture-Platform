import { useState } from 'react'
import Container from '../components/common/Container'

export default function SearchPage() {
  const [query, setQuery] = useState('')

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        {/* Page Header */}
        <div className="border-b border-hairline pb-8 mb-12 sm:mb-16">
          <div className="flex items-center gap-2 mb-3 text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-ink-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden="true" />
            <span>GLOBAL INDEX &bull; QUERY ENGINE</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-ink uppercase">
            Search the Watch Index
          </h1>
          <p className="mt-3 text-base sm:text-lg text-ink-secondary max-w-2xl">
            Query timepieces, reference numbers, technical calibres, and community dispatches.
          </p>
        </div>

        {/* Search Input Bar */}
        <div className="max-w-3xl mx-auto mb-16">
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
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search watches, stories, people..."
              className="w-full px-4 sm:px-6 py-4 bg-transparent text-ink text-base font-sans focus:outline-none placeholder:text-ink-muted/60"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="pr-4 sm:pr-6 text-xs font-mono uppercase tracking-widest text-ink-muted hover:text-ink cursor-pointer"
              >
                CLEAR
              </button>
            )}
          </div>
        </div>

        {/* Intentional Empty State */}
        <div className="relative border border-hairline bg-warm-surface/40 p-8 sm:p-14 lg:p-20 text-center max-w-3xl mx-auto">
          <div className="absolute top-3 left-4 text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase">
            QUERY STATUS // STANDBY
          </div>
          <div className="absolute top-3 right-4 text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase">
            DATABASE DISCONNECTED
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
                />
              </svg>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-ink uppercase">
              Search Index Not Connected
            </h2>

            <p className="mt-3 text-sm sm:text-base text-ink-secondary font-light leading-relaxed">
              Search will work once watches and stories are connected to the database.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-hairline flex items-center justify-between text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase">
            <span>FULL-TEXT SEARCH ENGINE</span>
            <span className="text-gold">SUPABASE POSTGRES ARCHITECTURE</span>
          </div>
        </div>
      </Container>
    </div>
  )
}
