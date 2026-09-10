import { useState } from 'react'

export default function PowerReserveWidget() {
  const [currentHours, setCurrentHours] = useState(80)
  const maxHours = 80

  const handleWind = () => {
    setCurrentHours((prev) => Math.min(maxHours, prev + 25))
  }

  const handleDrain = (hoursToDrain: number) => {
    setCurrentHours((prev) => Math.max(0, prev - hoursToDrain))
  }

  const percentage = Math.round((currentHours / maxHours) * 100)

  // Status message
  let statusText = 'Fully Charged (Weekend-Proof)'
  let statusColor = 'text-emerald-700'
  if (currentHours === 0) {
    statusText = 'Dead Stop (Mainspring Completely Unwound)'
    statusColor = 'text-rose-800'
  } else if (currentHours < 20) {
    statusText = 'Low Reserve (Amplitude Dropping, Wind Soon)'
    statusColor = 'text-amber-800'
  } else if (currentHours < 50) {
    statusText = 'Moderate Reserve (Operating Optimally)'
    statusColor = 'text-ink'
  }

  return (
    <div className="border border-hairline bg-warm-surface/30 p-6 sm:p-8 my-8">
      <div className="border-b border-hairline pb-4 mb-6">
        <div className="text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-1">
          INTERACTIVE LAB // MAINSPRING TENSION GAUGE
        </div>
        <h3 className="font-display text-xl sm:text-2xl font-normal text-ink uppercase">
          Power Reserve Indicator Simulator
        </h3>
        <p className="mt-1 text-xs font-mono text-ink-secondary">
          Simulate how hours deplete when a watch rests on a nightstand, and test whether an 80-hour calibre survives the weekend.
        </p>
      </div>

      <div className="border border-hairline bg-warm-white p-6 sm:p-8 max-w-xl mx-auto">
        {/* Gauge Numerical Display */}
        <div className="flex items-baseline justify-between mb-4 font-mono">
          <div>
            <div className="text-[10px] text-ink-muted uppercase tracking-widest">
              STORED ENERGY
            </div>
            <div className="font-display text-4xl sm:text-5xl font-normal text-ink mt-0.5">
              {currentHours}{' '}
              <span className="text-xl font-mono text-ink-secondary">HOURS</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-ink-muted uppercase tracking-widest">
              BARREL CAPACITY
            </div>
            <div className="text-xl font-mono font-bold text-ink mt-0.5">
              {percentage}%
            </div>
          </div>
        </div>

        {/* Visual Progress Bar / Mainspring Coil representation */}
        <div className="w-full bg-warm-surface border border-hairline h-4 overflow-hidden mb-6 p-0.5">
          <div
            className={`h-full transition-all duration-300 ${
              currentHours === 0
                ? 'bg-transparent'
                : currentHours < 20
                ? 'bg-amber-600'
                : 'bg-ink'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Status indicator */}
        <div className="text-xs font-mono mb-8 p-3 border border-hairline bg-warm-surface/20 flex items-center justify-between">
          <span className="text-ink-secondary uppercase tracking-wider">Status:</span>
          <span className={`font-semibold uppercase tracking-wider ${statusColor}`}>
            {statusText}
          </span>
        </div>

        {/* Interactive Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={handleWind}
            disabled={currentHours >= maxHours}
            className="p-3 border border-ink bg-ink text-warm-white text-xs font-mono uppercase tracking-wider hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            Wind Crown (+25h)
          </button>

          <button
            type="button"
            onClick={() => handleDrain(24)}
            disabled={currentHours === 0}
            className="p-3 border border-hairline bg-warm-white text-ink text-xs font-mono uppercase tracking-wider hover:border-ink disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
          >
            Advance 1 Day (-24h)
          </button>
        </div>

        {/* The Weekend Test Quick Button */}
        <button
          type="button"
          onClick={() => handleDrain(60)}
          disabled={currentHours === 0}
          className="w-full py-2.5 px-4 border border-dashed border-hairline text-[11px] font-mono uppercase tracking-widest text-ink-secondary hover:border-ink hover:text-ink cursor-pointer transition-colors"
        >
          Simulate Full Weekend Off Wrist (-60 Hours)
        </button>
      </div>
    </div>
  )
}
