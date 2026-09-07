import { useState } from 'react'

interface SizePreset {
  diameter: number
  lugToLug: number
  category: string
  recommendedWrist: string
  wristPresence: string
  databaseExample: string
}

const SIZE_PRESETS: SizePreset[] = [
  {
    diameter: 34,
    lugToLug: 41,
    category: 'Vintage / Compact Dress',
    recommendedWrist: '5.5" to 6.5" (14cm to 16.5cm)',
    wristPresence: 'Understated, disappears under shirt cuffs, mid-century classic elegance.',
    databaseExample: 'Cartier Tank Must (Classic Proportions)',
  },
  {
    diameter: 38,
    lugToLug: 47,
    category: 'Traditional Military / Field',
    recommendedWrist: '6.0" to 7.0" (15cm to 17.5cm)',
    wristPresence: 'Balanced, functional utilitarian field watch profile with extended straight lugs.',
    databaseExample: 'Hamilton Khaki Field Mechanical (38.0mm / 47.0mm Lug-to-Lug)',
  },
  {
    diameter: 39,
    lugToLug: 47.8,
    category: 'Universal Golden Proportion',
    recommendedWrist: '6.25" to 7.25" (16cm to 18.5cm)',
    wristPresence: 'The enthusiast consensus sweet spot: substantial presence without bulk or lug overhang.',
    databaseExample: 'Tudor Black Bay 58 (39.0mm / 47.8mm Lug-to-Lug)',
  },
  {
    diameter: 40,
    lugToLug: 48,
    category: 'Modern Pilot / GMT / Sport',
    recommendedWrist: '6.5" to 7.5" (16.5cm to 19cm)',
    wristPresence: 'Contemporary luxury sports profile with full bezel legibility.',
    databaseExample: 'Rolex GMT-Master II "Pepsi" (40.0mm / 48.0mm Lug-to-Lug)',
  },
  {
    diameter: 41,
    lugToLug: 48.1,
    category: 'Modern Heavy Dive Tool',
    recommendedWrist: '6.75"+ (17cm+)',
    wristPresence: 'Commanding wrist silhouette, maximized dial legibility, engineered for subsea utility.',
    databaseExample: 'Rolex Submariner Date 126610LN (41.0mm / 48.1mm Lug-to-Lug)',
  },
  {
    diameter: 42,
    lugToLug: 47.5,
    category: 'Chronograph Professional',
    recommendedWrist: '6.5" to 7.5" (16.5cm to 19cm)',
    wristPresence: 'Twisted lyre lugs contour around the wrist, allowing a 42mm case to wear like a 40mm.',
    databaseExample: 'Omega Speedmaster Professional Moonwatch (42.0mm / 47.5mm Lug-to-Lug)',
  },
  {
    diameter: 45,
    lugToLug: 48.5,
    category: 'Oversized Tactical Instrument',
    recommendedWrist: '7.0"+ (18cm+)',
    wristPresence: 'Bold, rugged, maximum shock shielding, carbon-reinforced shock architecture.',
    databaseExample: 'Casio G-Shock CasiOak (45.4mm / 48.5mm Lug-to-Lug)',
  },
]

export default function CaseSizeWidget() {
  const [selectedDiameter, setSelectedDiameter] = useState<number>(39)

  const currentPreset =
    SIZE_PRESETS.find((p) => p.diameter === selectedDiameter) || SIZE_PRESETS[2]

  return (
    <div className="border border-hairline bg-warm-surface/30 p-6 sm:p-8 my-8">
      <div className="border-b border-hairline pb-4 mb-6">
        <div className="text-[10px] font-mono tracking-[0.25em] text-gold uppercase mb-1">
          INTERACTIVE LAB // PROPORTIONS &amp; WRIST PRESENCE
        </div>
        <h3 className="font-display text-xl sm:text-2xl font-normal text-ink uppercase">
          Case Diameter &amp; Lug-to-Lug Comparator
        </h3>
        <p className="mt-1 text-xs font-mono text-ink-secondary">
          Toggle case sizes to see how case diameter interacts with lug-to-lug distance to define true wrist fit.
        </p>
      </div>

      {/* Preset Diameter Buttons */}
      <div className="flex flex-wrap gap-2 mb-8">
        {SIZE_PRESETS.map((preset) => (
          <button
            key={preset.diameter}
            type="button"
            onClick={() => setSelectedDiameter(preset.diameter)}
            className={`px-3.5 py-2.5 border text-xs font-mono transition-all cursor-pointer ${
              selectedDiameter === preset.diameter
                ? 'border-ink bg-ink text-warm-white font-semibold shadow-sm'
                : 'border-hairline bg-warm-white text-ink hover:border-ink'
            }`}
          >
            {preset.diameter}mm
          </button>
        ))}
      </div>

      {/* Visual Dimension Plate */}
      <div className="border border-hairline bg-warm-white p-6 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Visual Silhouette & Ruler */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 border border-hairline bg-warm-surface/20">
            <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted mb-4">
              PROPORTIONAL SILHOUETTE
            </div>

            {/* Scaled Visual Representation */}
            <div className="relative flex items-center justify-center">
              {/* Outer Lug Span */}
              <div
                className="border border-dashed border-ink/40 flex items-center justify-center transition-all duration-300 relative"
                style={{
                  width: `${currentPreset.diameter * 3.6}px`,
                  height: `${currentPreset.lugToLug * 3.6}px`,
                }}
              >
                {/* Round Bezel Inside */}
                <div
                  className="rounded-full border-2 border-ink bg-warm-surface flex items-center justify-center shadow-inner transition-all duration-300"
                  style={{
                    width: `${currentPreset.diameter * 3.6}px`,
                    height: `${currentPreset.diameter * 3.6}px`,
                  }}
                >
                  <div className="text-center font-mono">
                    <div className="font-display text-lg font-normal text-ink">
                      {currentPreset.diameter}mm
                    </div>
                    <div className="text-[8px] tracking-widest text-ink-muted uppercase">
                      DIAMETER
                    </div>
                  </div>
                </div>

                {/* Vertical Lug-to-Lug Indicator */}
                <div className="absolute -right-7 top-0 bottom-0 flex flex-col justify-between items-center text-[9px] font-mono text-gold font-semibold">
                  <span>&uarr;</span>
                  <span className="rotate-90 whitespace-nowrap">{currentPreset.lugToLug}mm</span>
                  <span>&darr;</span>
                </div>
              </div>
            </div>

            <div className="mt-6 text-[10px] font-mono text-ink-secondary text-center tracking-wider">
              LUG-TO-LUG SPAN: {currentPreset.lugToLug} MM
            </div>
          </div>

          {/* Dimension Breakdown Metrics */}
          <div className="lg:col-span-7 space-y-4">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted">
                PROFILE CATEGORY
              </div>
              <h4 className="font-display text-2xl font-normal text-ink uppercase mt-0.5">
                {currentPreset.category}
              </h4>
            </div>

            <div className="border-t border-hairline pt-3 space-y-3 text-xs font-mono">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                <span className="text-ink-muted uppercase">Recommended Wrist Circumference:</span>
                <span className="text-ink font-semibold">{currentPreset.recommendedWrist}</span>
              </div>

              <div className="border-t border-hairline/60 pt-2">
                <span className="text-ink-muted uppercase block mb-1">Wrist Presence &amp; Fit:</span>
                <p className="text-ink font-light leading-relaxed">
                  {currentPreset.wristPresence}
                </p>
              </div>

              <div className="border-t border-hairline/60 pt-2 flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-1">
                <span className="text-ink-muted uppercase">Database Representative:</span>
                <span className="text-gold font-semibold">{currentPreset.databaseExample}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
