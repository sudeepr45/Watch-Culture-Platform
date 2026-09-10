import Container from '../common/Container'
import { Link } from '../../router'

export default function PhilosophyStrip() {
  return (
    <section
      aria-label="Editorial Manifesto"
      className="relative border-b border-hairline bg-warm-surface/60 py-16 sm:py-20 lg:py-24"
    >
      <Container>
        <div className="relative max-w-5xl mx-auto">
          {/* Subtle Dial Marker Accents */}
          <div className="flex items-center justify-between text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-8 border-b border-hairline/80 pb-4">
            <span className="flex items-center gap-2">
              <span className="w-1 h-1 bg-steel rounded-full" aria-hidden="true" />
              MANIFESTO // 001
            </span>
            <span>HOROLOGICAL CRITICISM &bull; ARCHIVAL RECORD</span>
            <span className="hidden sm:inline">COORDINATES 46°12′N 6°09′E</span>
          </div>

          {/* Philosophy Statement */}
          <div className="text-center sm:text-left">
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal leading-[1.08] tracking-tight text-ink uppercase">
              Don't just read about watches.{' '}
              <span className="block sm:inline text-ink">
                Examine them.
              </span>
            </h2>

            <p className="mt-6 sm:mt-8 text-base sm:text-xl md:text-2xl text-ink-secondary font-light leading-relaxed max-w-3xl">
              An independent journal of mechanical time. Physical specifications,
              critical deconstruction, and interactive decision instruments.
            </p>
          </div>

          {/* Bottom Indicators */}
          <div className="mt-12 flex items-center justify-between pt-6 border-t border-hairline/80 text-[11px] font-mono tracking-[0.2em] text-ink-muted uppercase">
            <span className="flex items-center gap-2">
              <span className="inline-block w-6 h-px bg-ink" aria-hidden="true" />
              FOUNDATION SPECIFICATIONS
            </span>
            <Link
              to="/watches"
              className="text-ink font-semibold hover:text-neutral-700 transition-colors uppercase tracking-wider"
            >
              OPEN ARCHIVE INDEX &rarr;
            </Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
