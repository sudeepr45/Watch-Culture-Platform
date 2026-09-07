import { useState, useEffect, useMemo, useCallback } from 'react'
import type { Watch } from '../../types/watch'

interface WatchPickerModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (watch: Watch) => void
  watches: Watch[]
  disabledWatchId?: string
  slotNumber: 1 | 2
}

export default function WatchPickerModal({
  isOpen,
  onClose,
  onSelect,
  watches,
  disabledWatchId,
  slotNumber,
}: WatchPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleClose = useCallback(() => {
    setSearchQuery('')
    onClose()
  }, [onClose])

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleClose])

  // Filter watches by search query
  const filteredWatches = useMemo(() => {
    if (!searchQuery.trim()) return watches

    const query = searchQuery.toLowerCase().trim()
    return watches.filter(
      (w) =>
        w.brand.toLowerCase().includes(query) ||
        w.model.toLowerCase().includes(query) ||
        w.reference_number.toLowerCase().includes(query) ||
        (w.category && w.category.toLowerCase().includes(query))
    )
  }, [watches, searchQuery])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-ink/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="watch-picker-title"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-warm-white border border-hairline shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 sm:p-8 border-b border-hairline flex items-start justify-between bg-warm-surface/20">
          <div>
            <div className="flex items-center gap-2 mb-2 text-[10px] font-mono tracking-[0.25em] text-ink-secondary uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden="true" />
              <span>CENTRAL DATABASE // CONTENDER 0{slotNumber} SELECTION</span>
            </div>
            <h2
              id="watch-picker-title"
              className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-ink uppercase"
            >
              Choose Contender 0{slotNumber}
            </h2>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close selector"
            className="p-2 border border-hairline hover:border-ink bg-warm-white text-ink transition-colors cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path strokeLinecap="square" strokeLinejoin="miter" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 sm:p-6 border-b border-hairline bg-warm-white">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by brand, model, reference number, or category..."
              className="w-full bg-warm-surface/40 border border-hairline px-4 py-3 pl-11 text-xs font-mono text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink transition-colors"
              autoFocus
            />
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-secondary">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="16.5" y1="16.5" x2="21" y2="21" />
              </svg>
            </div>

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-ink-muted hover:text-ink text-xs font-mono"
              >
                CLEAR
              </button>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase">
            <span>
              SHOWING {filteredWatches.length} OF {watches.length} SPECIMENS
            </span>
            <span>VERIFIED SUPABASE RECORDS</span>
          </div>
        </div>

        {/* Watch Grid / List */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1 space-y-3 sm:space-y-4">
          {filteredWatches.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-hairline bg-warm-surface/20">
              <p className="text-xs font-mono tracking-widest text-ink-muted uppercase">
                NO TIMEPIECES MATCH &ldquo;{searchQuery}&rdquo;
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-3 text-[11px] font-mono uppercase tracking-wider text-ink underline"
              >
                Reset Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWatches.map((watch) => {
                const isOpposingSelection = watch.id === disabledWatchId

                return (
                  <div
                    key={watch.id}
                    className={`relative border text-left transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                      isOpposingSelection
                        ? 'border-hairline bg-warm-surface/40 opacity-45 cursor-not-allowed'
                        : 'border-hairline bg-warm-surface/20 hover:border-ink hover:bg-warm-surface/60 cursor-pointer group'
                    }`}
                    onClick={() => {
                      if (!isOpposingSelection) {
                        onSelect(watch)
                        handleClose()
                      }
                    }}
                  >
                    {/* Watch Image */}
                    <div className="relative aspect-[4/3] w-full bg-warm-surface border-b border-hairline overflow-hidden">
                      {watch.image_url ? (
                        <img
                          src={watch.image_url}
                          alt={`${watch.brand} ${watch.model}`}
                          loading="lazy"
                          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[10px] font-mono text-ink-muted uppercase tracking-widest">
                          PHOTO PENDING
                        </div>
                      )}

                      {/* Opposing Selection Overlay Tag */}
                      {isOpposingSelection && (
                        <div className="absolute inset-0 bg-ink/70 backdrop-blur-[2px] flex flex-col items-center justify-center p-3 text-center">
                          <span className="text-[10px] font-mono tracking-[0.2em] uppercase font-semibold text-warm-white">
                            SELECTED IN OPPOSING SLOT
                          </span>
                          <span className="text-[9px] font-mono tracking-wider text-warm-white/70 mt-1">
                            CANNOT BATTLE ITSELF
                          </span>
                        </div>
                      )}

                      {/* Category Badge */}
                      {!isOpposingSelection && watch.category && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 bg-warm-white/90 backdrop-blur-sm border border-hairline text-[8px] font-mono tracking-[0.2em] uppercase text-ink font-medium">
                          {watch.category}
                        </div>
                      )}
                    </div>

                    {/* Metadata Content */}
                    <div className="p-4 flex flex-col justify-between flex-grow">
                      <div>
                        <div className="text-[9px] font-mono uppercase tracking-[0.22em] text-ink-secondary">
                          {watch.brand}
                        </div>
                        <div className="font-display text-base font-normal tracking-tight text-ink uppercase leading-snug mt-0.5">
                          {watch.model}
                        </div>
                        <div className="mt-1 text-[10px] font-mono text-ink-muted tracking-wider">
                          REF. {watch.reference_number}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-hairline flex items-center justify-between text-[10px] font-mono tracking-wider">
                        <span className="text-ink font-semibold">
                          {watch.price !== null
                            ? `$${watch.price.toLocaleString()} ${watch.currency}`
                            : 'PRICE ON REQUEST'}
                        </span>
                        {!isOpposingSelection && (
                          <span className="text-gold tracking-[0.15em] uppercase text-[9px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                            SELECT &rarr;
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-hairline bg-warm-surface/20 flex items-center justify-between text-[10px] font-mono text-ink-secondary">
          <span className="tracking-wider">SELECT TO LOCK INTO BATTLE MATRIX</span>
          <button
            type="button"
            onClick={handleClose}
            className="hover:text-ink uppercase tracking-widest font-semibold cursor-pointer"
          >
            CANCEL [ESC]
          </button>
        </div>
      </div>
    </div>
  )
}
