import { useState } from 'react'
import Container from '../common/Container'
import Button from '../common/Button'
import { useRouter } from '../../router/useRouter'

export default function Hero() {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const { navigate } = useRouter()

  // High-resolution editorial watch photograph
  const watchImageUrl =
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1600&q=85'

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
                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" aria-hidden="true" />
                WATCH CULTURE PLATFORM
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
              The new era of watch culture &{' '}
              <span className="italic font-light underline decoration-gold/50 decoration-1 underline-offset-8">
                exploration.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="mt-6 sm:mt-7 text-base sm:text-lg md:text-xl text-ink-secondary font-normal leading-relaxed max-w-xl">
              Independent stories, technical breakdowns, community collections,
              and the culture of time.
            </p>

            {/* Call to Action */}
            <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-5 sm:gap-6">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/explore')}
                className="group"
                iconRight={
                  <span
                    className="inline-block transition-transform duration-300 group-hover:translate-x-1.5"
                    aria-hidden="true"
                  >
                    &rarr;
                  </span>
                }
              >
                EXPLORE THE PLATFORM
              </Button>

              <span className="text-xs font-mono tracking-[0.18em] text-ink-muted uppercase">
                CURATED FOR ENTHUSIASTS
              </span>
            </div>

            {/* Platform Pillars */}
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
                  DISCOVERY
                </span>
                <span className="mt-0.5 block text-xs font-semibold tracking-wider text-ink uppercase">
                  Interactive
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-mono uppercase tracking-[0.18em] text-ink-muted">
                  COMMUNITY
                </span>
                <span className="mt-0.5 block text-xs font-semibold tracking-wider text-gold uppercase">
                  Watch Lovers
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Dominant Visual (5 cols on lg) */}
          <div className="lg:col-span-5 order-1 lg:order-2">
            <div className="relative group mx-auto max-w-[460px] lg:max-w-none">
              {/* Architectural framing line */}
              <div
                className="absolute -inset-2 sm:-inset-3 border border-hairline pointer-events-none transition-colors duration-500 group-hover:border-gold/40"
                aria-hidden="true"
              />

              {/* Image Container with Subtle Zoom/Hover Motion */}
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-warm-surface border border-hairline">
                {!imageError ? (
                  <img
                    src={watchImageUrl}
                    alt="Precision horological luxury timepiece detail showcasing dial craft and steel finish"
                    className={`h-full w-full object-cover object-center transition-all duration-700 ease-out group-hover:scale-105 ${
                      imageLoaded ? 'opacity-100' : 'opacity-0 scale-95'
                    }`}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                    loading="eager"
                  />
                ) : (
                  /* Elegant Fallback Graphic if offline */
                  <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center bg-[#181817] text-warm-white">
                    <svg
                      className="w-16 h-16 text-gold/80 mb-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1}
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 3" />
                      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                    </svg>
                    <span className="font-display text-2xl tracking-wide uppercase">
                      Precision Specimen
                    </span>
                    <span className="mt-2 text-[11px] font-mono tracking-[0.2em] text-neutral-400 uppercase">
                      Mechanical Masterpiece
                    </span>
                  </div>
                )}

                {/* Floating Technical Plate */}
                <div className="absolute bottom-4 left-4 right-4 p-3 bg-warm-white/90 backdrop-blur-sm border border-hairline flex items-center justify-between text-[10px] font-mono tracking-[0.16em] uppercase text-ink">
                  <span>SPECIMEN // STUDY</span>
                  <span className="text-gold font-semibold">HOROLOGY LAB</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
