import Container from '../common/Container'
import { Link } from '../../router'

export default function PhilosophyStrip() {
  return (
    <section
      aria-label="Editorial Manifesto"
      className="relative border-b border-hairline bg-warm-surface/60 py-12 sm:py-15 lg:py-18"
    >
      <Container>
        <div className="relative mx-auto max-w-5xl">

          <div className="text-center sm:text-left">
            <h2 className="font-display text-3xl font-normal leading-[1.08] tracking-tight text-ink uppercase sm:text-4xl md:text-5xl lg:text-6xl">
              Don't just read about watches.{' '}
              <span className="block text-ink sm:inline">
                Examine them.
              </span>
            </h2>
            <p className="mt-6 max-w-3xl text-base font-light leading-relaxed text-ink-secondary sm:mt-8 sm:text-xl md:text-2xl">
              An independent journal of mechanical time. Physical specifications,
              critical deconstruction, and interactive decision instruments.
            </p>
          </div>
          <div className="mt-12 flex items-center justify-between border-t border-hairline/80 pt-6 text-xs font-mono uppercase tracking-[0.2em] text-ink-muted">
            <Link
              to="/watches"
              className="font-semibold uppercase tracking-wider text-ink transition-colors hover:text-neutral-700"
            >
              OPEN ARCHIVE INDEX &rarr;
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
