import { useState } from 'react'

export default function AutomaticVsQuartzWidget() {
  const [activeTab, setActiveTab] = useState<'compare' | 'decision'>('compare')

  // Decision helper state
  const [wearFrequency, setWearFrequency] = useState<'daily' | 'rotation' | 'occasional'>('daily')
  const [accuracyImportance, setAccuracyImportance] = useState<'exact' | 'tolerance'>('tolerance')
  const [coreInterest, setCoreInterest] = useState<'kinetic' | 'convenience'>('kinetic')

  const isAutomaticRecommended =
    coreInterest === 'kinetic' || (wearFrequency === 'daily' && accuracyImportance === 'tolerance')

  return (
    <div className="border border-hairline bg-warm-surface/30 p-6 sm:p-8 my-8">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-hairline pb-4 mb-6">
        <div>
          <div className="text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-1">
            INTERACTIVE LAB // MOVEMENT COMPARATOR
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-normal text-ink uppercase">
            Automatic vs Quartz Playground
          </h3>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center border border-hairline bg-warm-white p-1 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('compare')}
            className={`px-3 py-1.5 uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === 'compare'
                ? 'bg-ink text-warm-white font-semibold'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            Technical Specs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('decision')}
            className={`px-3 py-1.5 uppercase tracking-wider transition-colors cursor-pointer ${
              activeTab === 'decision'
                ? 'bg-ink text-warm-white font-semibold'
                : 'text-ink-secondary hover:text-ink'
            }`}
          >
            Decision Helper
          </button>
        </div>
      </div>

      {activeTab === 'compare' ? (
        <div>
          <p className="text-xs font-mono text-ink-secondary mb-6">
            Compare the core mechanical differences between battery-driven quartz and wrist-powered automatics.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Automatic Column */}
            <div className="border border-hairline bg-warm-white p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 text-[10px] font-mono uppercase tracking-widest text-ink-muted">
                  <span>MECHANICAL</span>
                  <span className="text-ink font-semibold">SWEEPING SECONDS</span>
                </div>
                <h4 className="font-display text-2xl font-normal text-ink uppercase mb-2">
                  Automatic Movement
                </h4>
                <p className="text-xs text-ink-secondary font-light leading-relaxed mb-4">
                  Driven by a coiled mainspring tensioned by the kinetic swing of a weighted rotor pivoting with your arm.
                </p>

                <dl className="space-y-3 text-xs font-mono border-t border-hairline pt-3">
                  <div className="flex justify-between">
                    <dt className="text-ink-muted uppercase">Power Source:</dt>
                    <dd className="text-ink font-medium">Kinetic Wrist Movement</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-muted uppercase">Seconds Motion:</dt>
                    <dd className="text-ink font-medium">Fluid 6–8 beats / sec sweep</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-muted uppercase">Average Accuracy:</dt>
                    <dd className="text-ink font-medium">-4 to +15 sec / day</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-muted uppercase">Battery Needed:</dt>
                    <dd className="text-ink font-medium">Zero (Pure Mechanical)</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-muted uppercase">Longevity:</dt>
                    <dd className="text-ink font-medium">Infinite with 5-10yr servicing</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-6 pt-3 border-t border-hairline/80 text-[10px] font-mono uppercase tracking-wider text-ink-secondary">
                EXAMPLE // SEIKO 5 SPORTS, TISSOT PRX, ROLEX
              </div>
            </div>

            {/* Quartz Column */}
            <div className="border border-hairline bg-warm-white p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 text-[10px] font-mono uppercase tracking-widest text-ink-muted">
                  <span>ELECTRONIC</span>
                  <span className="text-ink-muted font-semibold">1-SECOND TICK</span>
                </div>
                <h4 className="font-display text-2xl font-normal text-ink uppercase mb-2">
                  Quartz Movement
                </h4>
                <p className="text-xs text-ink-secondary font-light leading-relaxed mb-4">
                  Powered by a lithium battery that sends electric current through a synthetic quartz crystal oscillating 32,768 times / sec.
                </p>

                <dl className="space-y-3 text-xs font-mono border-t border-hairline pt-3">
                  <div className="flex justify-between">
                    <dt className="text-ink-muted uppercase">Power Source:</dt>
                    <dd className="text-ink font-medium">Silver Oxide / Lithium Battery</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-muted uppercase">Seconds Motion:</dt>
                    <dd className="text-ink font-medium">Crisp 1-second pulse tick</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-muted uppercase">Average Accuracy:</dt>
                    <dd className="text-ink font-medium">+/- 15 sec / month</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-muted uppercase">Battery Needed:</dt>
                    <dd className="text-ink font-medium">Yes (Replace every 2–5 years)</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-muted uppercase">Longevity:</dt>
                    <dd className="text-ink font-medium">Decades (eventual circuit wear)</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-6 pt-3 border-t border-hairline/80 text-[10px] font-mono uppercase tracking-wider text-ink-secondary">
                EXAMPLE // CASIO G-SHOCK, CARTIER TANK QUARTZ
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Decision Helper */
        <div>
          <p className="text-xs font-mono text-ink-secondary mb-6">
            Answer 3 quick lifestyle questions to identify which movement philosophy aligns with your wrist habits.
          </p>

          <div className="space-y-6">
            {/* Question 1 */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-ink font-semibold mb-2">
                1. How frequently will you wear this watch?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'daily', label: 'Every Single Day' },
                  { id: 'rotation', label: 'Rotated with Others' },
                  { id: 'occasional', label: 'Once a Month / Events' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setWearFrequency(opt.id as typeof wearFrequency)}
                    className={`p-3 border text-left text-xs font-mono transition-all cursor-pointer ${
                      wearFrequency === opt.id
                        ? 'border-ink bg-ink text-warm-white font-semibold'
                        : 'border-hairline bg-warm-white text-ink hover:border-ink'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question 2 */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-ink font-semibold mb-2">
                2. How do you feel about setting time and losing seconds?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'exact', label: 'Must be exact to the second always' },
                  { id: 'tolerance', label: 'A minute gained/lost per week is fine' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAccuracyImportance(opt.id as typeof accuracyImportance)}
                    className={`p-3 border text-left text-xs font-mono transition-all cursor-pointer ${
                      accuracyImportance === opt.id
                        ? 'border-ink bg-ink text-warm-white font-semibold'
                        : 'border-hairline bg-warm-white text-ink hover:border-ink'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question 3 */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-ink font-semibold mb-2">
                3. What draws you most to wristwatches?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'kinetic', label: 'Centuries of miniature gear mechanics & sweeping hands' },
                  { id: 'convenience', label: 'Grab-and-go convenience, zero fuss, tough durability' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCoreInterest(opt.id as typeof coreInterest)}
                    className={`p-3 border text-left text-xs font-mono transition-all cursor-pointer ${
                      coreInterest === opt.id
                        ? 'border-ink bg-ink text-warm-white font-semibold'
                        : 'border-hairline bg-warm-white text-ink hover:border-ink'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Recommendation Result Banner */}
            <div className="border border-ink bg-ink text-warm-white p-6 mt-6">
              <div className="text-[10px] font-mono tracking-[0.2em] text-warm-white/70 uppercase mb-1">
                TAILORED RECOMMENDATION
              </div>
              <h4 className="font-display text-2xl font-normal uppercase tracking-tight">
                {isAutomaticRecommended
                  ? 'Your Ideal Match: Automatic Mechanical'
                  : 'Your Ideal Match: High-Precision Quartz'}
              </h4>
              <p className="text-xs font-mono text-warm-white/80 mt-2 leading-relaxed">
                {isAutomaticRecommended
                  ? 'You value the kinetic soul, sweeping aesthetic, and enduring micro-engineering of horology. Pair yourself with an automatic watch that stays charged as you go about your day.'
                  : 'You prioritize ultimate grab-and-go readiness, shock resilience, and pinpoint precision. A quality quartz watch will keep running flawlessly even if left unworn for months.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
