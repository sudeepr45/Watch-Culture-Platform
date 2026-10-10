import { useState } from 'react'
import Container from '../common/Container'
import Button from '../common/Button'
import { useRouter } from '../../router/useRouter'
import { useLiveTime } from '../../hooks/useLiveTime'
import FinalInstrument from './FinalInstrument'
import HeroNote from './HeroNote'

export default function Hero() {
  const { navigate } = useRouter()
  const liveTime = useLiveTime()
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const leaderLines: Record<string, {
    desktop: string
    compact: string
    desktopSource: { x: number; y: number }
    compactSource: { x: number; y: number }
    x: number
    y: number
  }> = {
    chronograph: {
      desktop: 'M 517 518 L 517 168 L 510 153 C 502 135 486 132 465 143',
      compact: 'M 480 135 L 465 143',
      desktopSource: { x: 517, y: 518 },
      compactSource: { x: 480, y: 135 },
      x: 465,
      y: 143,
    },
    moonphase: {
      desktop: 'M 405 52 C 366 56 328 66 287 83',
      compact: 'M 378 62 C 340 66 312 75 287 83',
      desktopSource: { x: 405, y: 52 },
      compactSource: { x: 378, y: 62 },
      x: 287,
      y: 83,
    },
    date: {
      desktop: 'M 434 451 C 391 445 342 428 292 414',
      compact: 'M 382 440 C 350 432 320 421 292 414',
      desktopSource: { x: 434, y: 451 },
      compactSource: { x: 382, y: 440 },
      x: 292,
      y: 414,
    },
    instrument: {
      desktop: 'M 40 78 C 55 70 77 78 96 96',
      compact: 'M 53 78 L 96 96',
      desktopSource: { x: 40, y: 78 },
      compactSource: { x: 53, y: 78 },
      x: 96,
      y: 96,
    },
  }
  const activeLeader = activeNoteId ? leaderLines[activeNoteId] : undefined

  return (
    <section
      id="home"
      aria-labelledby="hero-headline"
      className="relative min-h-[calc(100vh-80px)] flex items-center border-b border-hairline bg-warm-white overflow-hidden py-12 lg:py-16"
    >
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 xl:gap-16 items-center">
          {/* Left Column: Editorial Content (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col justify-center order-2 lg:order-1">
            {/* Editorial Header / Category Badge */}
            {/* Main Headline */}
            <h1
              id="hero-headline"
              className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[64px] xl:text-[74px] font-normal leading-[1.02] tracking-[-0.035em] text-ink uppercase text-balance"
            >
              Understand watches.
              <br />
              Read their stories.
            </h1>

            {/* Supporting Copy */}
            <p className="mt-6 sm:mt-7 text-base sm:text-lg md:text-xl text-ink-secondary font-normal leading-relaxed max-w-xl">
              MOJEAN is a verified watch archive with technical guides and stories about the mechanics, design, and history of timepieces.
            </p>

            {/* Call to Action */}
            <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-4 sm:gap-5">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/watches')}
                className="group"
                iconRight={
                  <span
                    className="inline-block transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  >
                    &rarr;
                  </span>
                }
              >
                BROWSE WATCH ARCHIVE
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/watch-101')}
              >
                START WITH WATCH 101
              </Button>
            </div>

          </div>

          {/* Right Column: MOJEAN original instrument */}
          <div className="lg:col-span-5 order-1 lg:order-2">
            <div className="relative group mx-auto w-full max-w-[460px] lg:max-w-none">
              {/* Architectural framing line */}
              <div
                className="absolute -inset-2 sm:-inset-3 border border-hairline pointer-events-none transition-colors duration-200 group-hover:border-ink/40"
                aria-hidden="true"
              />

              <div className="relative aspect-square w-full overflow-hidden">
                <FinalInstrument {...liveTime} />
                <svg
                  className="pointer-events-none absolute inset-0 h-full w-full"
                  viewBox="0 0 520 520"
                  aria-hidden="true"
                >
                  <defs>
                    <marker id="hero-note-arrow-active" viewBox="0 0 6 6" refX="5.5" refY="3" markerWidth="6" markerHeight="6" markerUnits="userSpaceOnUse" orient="auto">
                      <path d="M 0 0 L 6 3 L 0 6 Z" fill="#121212" />
                    </marker>
                  </defs>
                  {activeLeader && (
                    <>
                      <path className="hidden lg:block" d={activeLeader.desktop} fill="none" stroke="#121212" strokeWidth="1.5" markerEnd="url(#hero-note-arrow-active)" />
                      <path className="lg:hidden" d={activeLeader.compact} fill="none" stroke="#121212" strokeWidth="1.5" markerEnd="url(#hero-note-arrow-active)" />
                      <circle className="hidden lg:block" cx={activeLeader.desktopSource.x} cy={activeLeader.desktopSource.y} r="2" fill="#FAF9F5" stroke="#121212" strokeWidth="1" />
                      <circle className="lg:hidden" cx={activeLeader.compactSource.x} cy={activeLeader.compactSource.y} r="2" fill="#FAF9F5" stroke="#121212" strokeWidth="1" />
                    </>
                  )}
                  {activeNoteId === 'chronograph' && (
                    <circle cx="458.3" cy="145.5" r="21" fill="none" stroke="#57534E" strokeWidth="1" strokeOpacity="0.9" />
                  )}
                  {activeNoteId === 'moonphase' && (
                    <circle cx="260" cy="111" r="37.5" fill="none" stroke="#57534E" strokeWidth="1" strokeOpacity="0.9" />
                  )}
                  {activeNoteId === 'date' && (
                    <rect x="227" y="397" width="66" height="34" rx="2" fill="none" stroke="#57534E" strokeWidth="1" strokeOpacity="0.9" />
                  )}
                </svg>
              </div>
              <HeroNote
                onActiveNoteChange={setActiveNoteId}
                notes={[
                  {
                    id: 'chronograph',
                    number: '01',
                    title: 'The Chronograph',
                    body: 'Start the instrument and watch the central seconds hand begin its sweep. The chronograph measures elapsed time independently of the running watch.',
                  },
                  {
                    id: 'moonphase',
                    number: '02',
                    title: 'The Moonphase',
                    liveValue: `CURRENT PHASE · ${liveTime.moonPhaseName.toUpperCase()}`,
                    body: 'The moonphase follows the current lunar cycle, turning a changing sky into a mechanical indication.',
                  },
                  {
                    id: 'date',
                    number: '03',
                    title: 'The Date',
                    liveValue: `TODAY · ${liveTime.calendar.weekday}, ${liveTime.calendar.month} ${liveTime.calendar.day}`.toUpperCase(),
                    body: 'The date window keeps the instrument tied to the ordinary rhythm of the day.',
                  },
                  {
                    id: 'instrument',
                    number: '04',
                    title: 'The Instrument',
                    body: 'A living horological instrument: time, calendar, moonphase and elapsed time brought together in one object.',
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
