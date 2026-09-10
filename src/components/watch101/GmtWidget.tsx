import { useState } from 'react'

interface TimeZoneCity {
  name: string
  offset: number
  label: string
}

const CITIES: TimeZoneCity[] = [
  { name: 'London (UTC)', offset: 0, label: 'Greenwich Prime Meridian' },
  { name: 'Geneva / Paris', offset: 1, label: 'Central European Time' },
  { name: 'Tokyo', offset: 9, label: 'Japan Standard Time' },
  { name: 'New York', offset: -5, label: 'Eastern Standard Time' },
  { name: 'Los Angeles', offset: -8, label: 'Pacific Standard Time' },
]

export default function GmtWidget() {
  const [localHour, setLocalHour] = useState<number>(14) // 2:00 PM local
  const [homeCity, setHomeCity] = useState<TimeZoneCity>(CITIES[0]) // London UTC
  const [localCity, setLocalCity] = useState<TimeZoneCity>(CITIES[2]) // Tokyo (+9)

  // Calculate GMT hand hour (0 - 23)
  const homeHour24 = (localHour - localCity.offset + homeCity.offset + 24) % 24

  const isHomeDaytime = homeHour24 >= 6 && homeHour24 < 18
  const local12Hour = localHour % 12 === 0 ? 12 : localHour % 12
  const localAmPm = localHour >= 12 ? 'PM' : 'AM'

  return (
    <div className="border border-hairline bg-warm-surface/30 p-6 sm:p-8 my-8">
      <div className="border-b border-hairline pb-4 mb-6">
        <div className="text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-1">
          INTERACTIVE LAB // DUAL TIME ZONE ENGINE
        </div>
        <h3 className="font-display text-xl sm:text-2xl font-normal text-ink uppercase">
          GMT Dual-Time Simulator
        </h3>
        <p className="mt-1 text-xs font-mono text-ink-secondary">
          Simulate how a GMT 24-hour hand and two-tone bezel display home time while you adjust your local destination.
        </p>
      </div>

      {/* City Pickers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Local City Selector */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-ink font-semibold mb-2">
            Local Destination (12-Hour Hands):
          </label>
          <select
            value={localCity.name}
            onChange={(e) => {
              const found = CITIES.find((c) => c.name === e.target.value)
              if (found) setLocalCity(found)
            }}
            className="w-full bg-warm-white border border-hairline p-2.5 text-xs font-mono text-ink focus:outline-none focus:border-ink cursor-pointer"
          >
            {CITIES.map((city) => (
              <option key={city.name} value={city.name}>
                {city.name} ({city.offset >= 0 ? `+${city.offset}` : city.offset}h)
              </option>
            ))}
          </select>
        </div>

        {/* Home City Selector */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-ink font-semibold mb-2">
            Home Reference Time (24-Hour GMT Hand):
          </label>
          <select
            value={homeCity.name}
            onChange={(e) => {
              const found = CITIES.find((c) => c.name === e.target.value)
              if (found) setHomeCity(found)
            }}
            className="w-full bg-warm-white border border-hairline p-2.5 text-xs font-mono text-ink focus:outline-none focus:border-ink cursor-pointer"
          >
            {CITIES.map((city) => (
              <option key={city.name} value={city.name}>
                {city.name} ({city.offset >= 0 ? `+${city.offset}` : city.offset}h)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Local Time Hour Slider */}
      <div className="bg-warm-white border border-hairline p-4 sm:p-5 mb-8">
        <div className="flex items-center justify-between text-xs font-mono mb-2">
          <span className="text-ink-secondary uppercase tracking-wider">
            Adjust Local Time of Day:
          </span>
          <span className="text-ink font-bold">
            {local12Hour}:00 {localAmPm} ({localHour.toString().padStart(2, '0')}:00)
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="23"
          value={localHour}
          onChange={(e) => setLocalHour(Number(e.target.value))}
          className="w-full accent-ink cursor-pointer"
        />
        <div className="flex justify-between text-[10px] font-mono text-ink-muted mt-1">
          <span>00:00 (Midnight)</span>
          <span>12:00 (Noon)</span>
          <span>23:00 (11 PM)</span>
        </div>
      </div>

      {/* Dual Time Visual Readout Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Local Time Readout */}
        <div className="border border-hairline bg-warm-white p-6 text-center">
          <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted mb-2">
            LOCAL DESTINATION TIME
          </div>
          <div className="font-display text-4xl sm:text-5xl font-normal text-ink">
            {local12Hour}:00 <span className="text-xl font-mono text-ink-secondary">{localAmPm}</span>
          </div>
          <div className="mt-2 text-xs font-mono text-ink-secondary">
            {localCity.name}
          </div>
          <div className="mt-4 pt-3 border-t border-hairline text-[10px] font-mono uppercase text-ink-muted">
            READ ON TRADITIONAL 12-HOUR DIAL
          </div>
        </div>

        {/* 24-Hour GMT Reference Readout */}
        <div className="border border-hairline bg-warm-white p-6 text-center relative overflow-hidden">
          {/* Bezel Day/Night Color bar */}
          <div
            className={`absolute top-0 left-0 right-0 h-1.5 ${
              isHomeDaytime ? 'bg-red-700' : 'bg-blue-900'
            }`}
          />

          <div className="text-[10px] font-mono uppercase tracking-widest text-ink-muted mb-2">
            24-HOUR GMT BEZEL READING
          </div>
          <div className="font-display text-4xl sm:text-5xl font-normal text-ink">
            {homeHour24.toString().padStart(2, '0')}:00
          </div>
          <div className="mt-2 text-xs font-mono text-ink-secondary">
            {homeCity.name} &bull; {isHomeDaytime ? 'DAYTIME' : 'NIGHTTIME'}
          </div>
          <div className="mt-4 pt-3 border-t border-hairline text-[10px] font-mono uppercase text-ink-muted flex items-center justify-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isHomeDaytime ? 'bg-red-600' : 'bg-blue-800'
              }`}
            />
            <span>
              {isHomeDaytime ? 'RED HALF (DAYLIGHT)' : 'BLUE HALF (NIGHT HOURS)'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
