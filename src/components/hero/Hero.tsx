import Container from '../common/Container'
import Button from '../common/Button'
import { useRouter } from '../../router/useRouter'
import heroWatchImage from '../../assets/hero-watch.png'

export default function Hero() {
  const { navigate } = useRouter()

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
            <div className="flex flex-wrap items-center gap-3 mb-5 sm:mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-warm-surface border border-hairline text-[11px] font-mono uppercase tracking-[0.2em] text-ink font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
                HOROLOGICAL JOURNAL &bull; ARCHIVE
              </span>
              <span className="text-[11px] font-mono tracking-[0.18em] text-ink-muted uppercase">
                VOL. I &bull; FOUNDATION
              </span>
            </div>

            {/* Main Headline */}
            <h1
              id="hero-headline"
              className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[62px] xl:text-[72px] font-normal leading-[1.02] tracking-tight text-ink uppercase text-balance"
            >
              Understand watches.
              <br />
              Decide about them.
            </h1>

            {/* Supporting Copy */}
            <p className="mt-6 sm:mt-7 text-base sm:text-lg md:text-xl text-ink-secondary font-normal leading-relaxed max-w-xl">
              MOJEAN is a verified archive of watches with guides, stories, and tools that help people find, understand, compare, and evaluate watches.
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
                EXPLORE WATCHES
              </Button>

              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/watch-101')}
              >
                START WITH WATCH 101
              </Button>
            </div>

            {/* Secondary Brand Tagline */}
            <div className="mt-4 text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase">
              A WATCH MAGAZINE YOU CAN ACTUALLY PLAY WITH.
            </div>

            {/* Editorial Pillars: FIND / LEARN / DECIDE */}
            <div className="mt-10 pt-6 border-t border-hairline grid grid-cols-3 gap-4 max-w-lg">
              <div>
                <span className="block text-[10px] font-mono uppercase tracking-[0.18em] text-ink-muted">
                  01 // FIND
                </span>
                <span className="mt-0.5 block text-xs font-semibold tracking-wider text-ink uppercase">
                  Verified Archive
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-mono uppercase tracking-[0.18em] text-ink-muted">
                  02 // LEARN
                </span>
                <span className="mt-0.5 block text-xs font-semibold tracking-wider text-ink uppercase">
                  Watch 101 Lab
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-mono uppercase tracking-[0.18em] text-ink-muted">
                  03 // DECIDE
                </span>
                <span className="mt-0.5 block text-xs font-semibold tracking-wider text-ink uppercase">
                  WORTH IT? Tool
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Archival Monolith (5 cols on lg) */}
          <div className="lg:col-span-5 order-1 lg:order-2">
            <div className="relative group mx-auto max-w-[460px] lg:max-w-none">
              {/* Architectural framing line */}
              <div
                className="absolute -inset-2 sm:-inset-3 border border-hairline pointer-events-none transition-colors duration-200 group-hover:border-ink/40"
                aria-hidden="true"
              />

              {/* Archival Monolith Specimen Panel */}
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#191c1f] border border-hairline flex flex-col justify-between p-6 sm:p-8 select-none">
                {/* Top Archival Metadata Header */}
                <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-mono tracking-[0.2em] text-warm-white/40 uppercase">
                  <span>MONOGRAPH // SPECIMEN 01</span>
                </div>

                {/* Central Deliberate Brand Lockup Presentation */}
                <div className="flex-1 flex items-center justify-center p-4">
                  <img
                    src={heroWatchImage}
                    alt="MOERI & JEANNERET — Horological Archive"
                    className="w-full max-w-[280px] sm:max-w-[320px] h-auto object-contain transition-opacity duration-300"
                    loading="eager"
                  />
                </div>

                {/* Bottom Archival Identifier Plate */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[9px] sm:text-[10px] font-mono tracking-[0.2em] text-warm-white/40 uppercase">
                  <span>ARCHIVAL IDENTIFIER</span>
                  <span className="text-warm-white/60 font-medium">VERIFIED CULTURE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
