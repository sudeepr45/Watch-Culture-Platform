import Container from '../common/Container'
import Button from '../common/Button'
import { useRouter } from '../../router/useRouter'
import PlateHero from '../plate/PlateHero'

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

          {/* Right Column: Plate of the day */}
          <div className="lg:col-span-5 order-1 lg:order-2">
            <PlateHero />
          </div>
        </div>
      </Container>
    </section>
  )
}
