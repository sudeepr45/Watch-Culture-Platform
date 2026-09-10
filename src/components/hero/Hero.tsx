import Container from '../common/Container'
import Button from '../common/Button'
import WatchImage from '../common/WatchImage'
import { useRouter } from '../../router/useRouter'
import heroWatchImage from '../../assets/hero-watch.png'

export default function Hero() {
  const { navigate } = useRouter()

  // Editorial watch photograph reference
  const watchImageUrl = heroWatchImage

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
            <div className="flex items-center gap-3 mb-5 sm:mb-6">
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
              className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[64px] xl:text-[76px] font-normal leading-[1.02] tracking-tight text-ink uppercase text-balance"
            >
              The culture of time.
              <br />
              Archived &amp; examined.
            </h1>

            {/* Supporting Copy */}
            <p className="mt-6 sm:mt-7 text-base sm:text-lg md:text-xl text-ink-secondary font-normal leading-relaxed max-w-xl">
              Independent criticism, technical breakdowns, community archives,
              and mechanical substance.
            </p>

            {/* Call to Action */}
            <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-5 sm:gap-6">
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
                ENTER THE ARCHIVE
              </Button>

              <span className="text-xs font-mono tracking-[0.18em] text-ink-muted uppercase">
                INDEPENDENT HOROLOGICAL REVIEW
              </span>
            </div>

            {/* Editorial Pillars */}
            <div className="mt-12 pt-6 border-t border-hairline grid grid-cols-3 gap-4 max-w-lg">
              <div>
                <span className="block text-[10px] font-mono uppercase tracking-[0.18em] text-ink-muted">
                  EDITORIAL
                </span>
                <span className="mt-0.5 block text-xs font-semibold tracking-wider text-ink uppercase">
                  Independent
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-mono uppercase tracking-[0.18em] text-ink-muted">
                  ARCHIVE
                </span>
                <span className="mt-0.5 block text-xs font-semibold tracking-wider text-ink uppercase">
                  Verified Data
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-mono uppercase tracking-[0.18em] text-ink-muted">
                  INSTRUMENTS
                </span>
                <span className="mt-0.5 block text-xs font-semibold tracking-wider text-ink uppercase">
                  Deterministic
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Dominant Visual (5 cols on lg) */}
          <div className="lg:col-span-5 order-1 lg:order-2">
            <div className="relative group mx-auto max-w-[460px] lg:max-w-none">
              {/* Architectural framing line */}
              <div
                className="absolute -inset-2 sm:-inset-3 border border-hairline pointer-events-none transition-colors duration-200 group-hover:border-ink/40"
                aria-hidden="true"
              />

              {/* Image Container with Restrained Motion */}
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-warm-surface border border-hairline">
                <WatchImage
                  src={watchImageUrl}
                  alt="Precision horological archival specimen detail"
                  aspectRatio="h-full w-full"
                  loading="eager"
                />

                {/* Floating Technical Plate */}
                <div className="absolute bottom-4 left-4 right-4 p-3 bg-warm-white border border-hairline flex items-center justify-between text-[10px] font-mono tracking-[0.16em] uppercase text-ink">
                  <span>SPECIMEN // STUDY</span>
                  <span className="text-steel font-semibold">HOROLOGY ARCHIVE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
