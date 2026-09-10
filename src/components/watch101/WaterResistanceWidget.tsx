import { useState } from 'react'

interface DepthTier {
  meters: number
  atm: number
  category: string
  safeActivities: string[]
  prohibitedActivities: string[]
  mythbuster: string
  exampleWatch: string
  isScrewDownRequired: boolean
}

const DEPTH_TIERS: DepthTier[] = [
  {
    meters: 30,
    atm: 3,
    category: 'Splash Resistant Only',
    safeActivities: ['Accidental rain drops', 'Light hand washing splashes', 'Sweat'],
    prohibitedActivities: ['Showering', 'Swimming', 'Snorkeling', 'Scuba diving', 'Hot tubs'],
    mythbuster:
      'MYTH: "30M means I can dive 30 meters down into the ocean." REALITY: 30M is a static pressure test. Moving your wrist through water creates sudden pressure spikes. Submerging a 30m watch will almost certainly breach its seals.',
    exampleWatch: 'Cartier Tank Must (30m)',
    isScrewDownRequired: false,
  },
  {
    meters: 50,
    atm: 5,
    category: 'Surface Swimming Only',
    safeActivities: ['Light surface swimming', 'Sink immersion', 'Washing hands'],
    prohibitedActivities: ['High-dive jumping', 'Snorkeling', 'Scuba diving', 'Water skiing'],
    mythbuster:
      'MYTH: "50M is fine for water sports." REALITY: 50m can survive a calm dip in a pool, but jumping from a diving board or water skiing hits the watch with dynamic hydraulic shocks that can blow past standard push-in gaskets.',
    exampleWatch: 'Hamilton Khaki Field (50m), Omega Speedmaster (50m)',
    isScrewDownRequired: false,
  },
  {
    meters: 100,
    atm: 10,
    category: 'True Recreational Swimming',
    safeActivities: ['Pool laps', 'Snorkeling', 'Ocean surface swimming', 'Beach sports'],
    prohibitedActivities: ['Deep scuba diving with compressed gas cylinders'],
    mythbuster:
      'FACT: 100M is the sweet spot for everyday versatility. You never have to worry about taking your watch off before jumping into a pool, lake, or shower.',
    exampleWatch: 'Tissot PRX (100m), Rolex GMT-Master II (100m)',
    isScrewDownRequired: false,
  },
  {
    meters: 200,
    atm: 20,
    category: 'Certified Scuba Diver',
    safeActivities: ['Recreational scuba diving', 'High-speed water sports', 'Heavy surf', 'Snorkeling'],
    prohibitedActivities: ['Commercial saturation diving past 200m without helium escape valve'],
    mythbuster:
      'FACT: 200M meets official ISO 6425 dive watch standards. These pieces incorporate screw-down crowns and extra-thick casebacks designed for true oceanic exploration.',
    exampleWatch: 'Tudor Black Bay 58 (200m), Casio G-Shock (200m)',
    isScrewDownRequired: true,
  },
  {
    meters: 300,
    atm: 30,
    category: 'Deep Subsea Professional',
    safeActivities: ['Professional scuba diving', 'Deep sea exploration', 'Extreme maritime conditions'],
    prohibitedActivities: ['Virtually nothing on planet Earth'],
    mythbuster:
      'FACT: 300M watches like the Rolex Submariner are over-engineered pressure vaults. The sapphire crystal is up to 3mm thick, and the case tube utilizes three separate rubber O-rings (Rolex Triplock system).',
    exampleWatch: 'Rolex Submariner Date (300m)',
    isScrewDownRequired: true,
  },
]

export default function WaterResistanceWidget() {
  const [selectedMeters, setSelectedMeters] = useState<number>(100)

  const currentTier = DEPTH_TIERS.find((t) => t.meters === selectedMeters) || DEPTH_TIERS[2]

  return (
    <div className="border border-hairline bg-warm-surface/30 p-6 sm:p-8 my-8">
      <div className="border-b border-hairline pb-4 mb-6">
        <div className="text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-1">
          LABORATORY INSTRUMENT // HYDROSTATIC PRESSURE &amp; SEALING INTEGRITY
        </div>
        <h3 className="font-display text-xl sm:text-2xl font-normal text-ink uppercase">
          Hydrostatic Pressure &amp; Dynamic Depth Tolerance
        </h3>
        <p className="mt-1 text-xs font-mono text-ink-secondary">
          Audit static barometric pressure ratings against real-world dynamic hydraulic tolerances.
        </p>
      </div>

      {/* Meter Depth Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-8">
        {DEPTH_TIERS.map((tier) => (
          <button
            key={tier.meters}
            type="button"
            onClick={() => setSelectedMeters(tier.meters)}
            className={`p-3 border text-center transition-all cursor-pointer ${
              selectedMeters === tier.meters
                ? 'border-ink bg-ink text-warm-white'
                : 'border-hairline bg-warm-white text-ink hover:border-ink'
            }`}
          >
            <div className="font-display text-xl sm:text-2xl font-normal">
              {tier.meters}M
            </div>
            <div
              className={`text-[9px] font-mono uppercase tracking-wider mt-0.5 ${
                selectedMeters === tier.meters ? 'text-warm-white/80' : 'text-ink-muted'
              }`}
            >
              {tier.atm} ATM / BAR
            </div>
          </button>
        ))}
      </div>

      {/* Tier Details Dossier */}
      <div className="border border-hairline bg-warm-white p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-hairline pb-4 mb-6">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted">
              RATING CLASSIFICATION
            </div>
            <h4 className="font-display text-2xl sm:text-3xl font-normal text-ink uppercase mt-0.5">
              {currentTier.category}
            </h4>
          </div>

          <div className="text-xs font-mono text-ink-secondary">
            SCREW-DOWN CROWN: {currentTier.isScrewDownRequired ? 'MANDATORY' : 'OPTIONAL'}
          </div>
        </div>

        {/* Permitted vs Prohibited Activities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="border border-hairline/80 bg-warm-surface/20 p-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 font-semibold mb-3 flex items-center gap-1.5">
              <span>&#10003;</span>
              <span>SAFE &amp; APPROVED ACTIVITIES</span>
            </div>
            <ul className="space-y-1.5 text-xs font-mono text-ink">
              {currentTier.safeActivities.map((act) => (
                <li key={act} className="flex items-center gap-2">
                  <span className="text-emerald-700">&bull;</span>
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-hairline/80 bg-warm-surface/20 p-4">
            <div className="text-[10px] font-mono uppercase tracking-wider text-rose-800 font-semibold mb-3 flex items-center gap-1.5">
              <span>&times;</span>
              <span>STRICTLY PROHIBITED (RISK OF FLOODING)</span>
            </div>
            <ul className="space-y-1.5 text-xs font-mono text-ink">
              {currentTier.prohibitedActivities.map((act) => (
                <li key={act} className="flex items-center gap-2">
                  <span className="text-rose-700">&bull;</span>
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Mythbuster Callout Box */}
        <div className="border border-hairline bg-warm-surface/40 p-4 sm:p-5 mb-6">
          <div className="text-[10px] font-mono uppercase tracking-widest text-ink font-semibold mb-1">
            HOROLOGICAL REALITY CHECK
          </div>
          <p className="text-xs sm:text-sm font-mono text-ink leading-relaxed">
            {currentTier.mythbuster}
          </p>
        </div>

        {/* Real Watch Example Footer */}
        <div className="pt-4 border-t border-hairline flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono text-ink-secondary gap-2">
          <span>DATABASE SPECIMENS AT THIS DEPTH:</span>
          <span className="text-ink font-semibold">{currentTier.exampleWatch}</span>
        </div>
      </div>
    </div>
  )
}
