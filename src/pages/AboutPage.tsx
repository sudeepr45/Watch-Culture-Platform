import Container from '../components/common/Container'
import SectionHeading from '../components/common/SectionHeading'
import { Link } from '../router'

export default function AboutPage() {
  const pillars = [
    {
      label: 'DISCOVER',
      title: 'Cultural Architecture',
      description: 'Examining the design movements, historical contexts, and artistic philosophies that define mechanical watchmaking across eras.',
      linkText: 'Explore Culture',
      linkTo: '/explore',
    },
    {
      label: 'INTERACT',
      title: 'Watch 101 Instruments',
      description: 'Hands-on interactive learning tools—exploring power reserves, GMT bezel logic, water resistance ratings, and chronograph mechanics in real time.',
      linkText: 'Launch Instruments',
      linkTo: '/watch-101',
    },
    {
      label: 'COMPARE',
      title: 'Battles & The Case',
      description: 'Head-to-head community audits and the deterministic "WORTH IT?" evaluation engine assessing heritage, finishing, daily wear, and value retention.',
      linkText: 'View Battles',
      linkTo: '/battles',
    },
    {
      label: 'CREATE & COLLECT',
      title: 'Stories & My Wrist',
      description: 'A living archive for personal wrist experiences, collector dossiers, and genuine mechanical reflections without commercial gatekeeping.',
      linkText: 'Read Stories',
      linkTo: '/stories',
    },
  ]

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        {/* Editorial Masthead / Header */}
        <div className="border-b border-hairline pb-8 mb-12 sm:mb-16">
          <SectionHeading
            label="ORIGIN &bull; MANIFESTO &bull; PURPOSE"
            title="A watch magazine you can actually play with."
            description="MOERI & JEANNERET is an independent horological journal and cultural archive built to explore, examine, and celebrate the mechanics of time."
          />
          <div className="mt-6 flex items-center gap-4 text-xs font-mono tracking-widest text-ink-muted uppercase">
            <span>VOL. I // FOUNDATION</span>
            <span>&bull;</span>
            <span>CULTURAL ARCHIVE &amp; DISPATCHES</span>
          </div>
        </div>

        {/* Narrative Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 mb-16 sm:mb-20">
          <div className="lg:col-span-5 space-y-6">
            <div className="p-8 bg-warm-surface border border-hairline relative">
              <div className="absolute -inset-1.5 border border-hairline pointer-events-none" aria-hidden="true" />
              <div className="text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-3">
                FOUNDATIONAL PROPOSITION
              </div>
              <h2 className="font-display text-2xl sm:text-3xl text-ink uppercase tracking-tight leading-tight mb-4">
                Mechanical Substance Over Speculative Noise.
              </h2>
              <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed font-normal">
                Most modern watch media functions as an extension of the luxury marketing apparatus—chasing hype cycles,
                speculative auction results, and press releases. We built MOERI &amp; JEANNERET to return to substance:
                mechanical architecture, design restraint, and genuine collector curiosity.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6 text-sm sm:text-base text-ink-secondary leading-relaxed font-normal">
            <p>
              Horology is a singular intersection of engineering, art, human history, and personal memory. Yet exploring
              watches online often feels either flatly commercial or overwhelmingly academic.
            </p>
            <p>
              MOERI &amp; JEANNERET bridges that divide by pairing rigorous editorial criticism with deterministic,
              interactive tools. We think of it as an open archive: a space where you can read an essay on dial balance,
              interactively test how a dual-time GMT hand rotates around a 24-hour bezel, evaluate whether an iconic reference
              justifies its secondary market premium, and document your own wrist journey alongside fellow collectors.
            </p>
            <p>
              <strong className="text-ink font-medium">The Exploration Cycle:</strong> Our architecture is built around a natural
              rhythm of engagement:
            </p>
            <div className="p-4 bg-warm-surface/40 border border-hairline text-xs font-mono text-ink tracking-wider uppercase flex flex-wrap items-center gap-2">
              <span>Discover</span>
              <span className="text-ink-muted">&rarr;</span>
              <span>Interact</span>
              <span className="text-ink-muted">&rarr;</span>
              <span>Compare</span>
              <span className="text-ink-muted">&rarr;</span>
              <span>Explore</span>
              <span className="text-ink-muted">&rarr;</span>
              <span>Learn</span>
              <span className="text-ink-muted">&rarr;</span>
              <span>Create</span>
              <span className="text-ink-muted">&rarr;</span>
              <span>Collect</span>
            </div>
            <p className="text-xs text-ink-muted font-mono leading-relaxed pt-2">
              <strong className="text-ink font-medium">Note on Brand Identity:</strong> MOERI &amp; JEANNERET is our independent
              editorial and digital publication title. We do not manufacture watches, nor are we an authorized dealer or
              commercial affiliate of any watch manufacturer.
            </p>
          </div>
        </div>

        {/* Four Architectural Pillars */}
        <div className="border-t border-hairline pt-12 sm:pt-16 mb-16 sm:mb-20">
          <div className="text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-8">
            CORE PLATFORM INSTRUMENTS
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {pillars.map((pillar) => (
              <div
                key={pillar.label}
                className="p-8 bg-warm-surface/30 border border-hairline flex flex-col justify-between"
              >
                <div>
                  <div className="text-[10px] font-mono tracking-[0.25em] text-steel font-semibold uppercase mb-2">
                    {pillar.label}
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl text-ink uppercase tracking-tight mb-3">
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed font-normal mb-6">
                    {pillar.description}
                  </p>
                </div>
                <Link
                  to={pillar.linkTo}
                  className="inline-flex items-center gap-2 text-xs font-mono tracking-widest text-ink font-semibold uppercase hover:text-steel transition-colors group"
                >
                  <span>{pillar.linkText}</span>
                  <span className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">
                    &rarr;
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Final Colophon / Links */}
        <div className="border-t border-hairline pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-ink-muted">
          <div>
            MOERI &amp; JEANNERET &bull; ESTABLISHED AS AN INDEPENDENT HOROLOGICAL ARCHIVE
          </div>
          <div className="flex items-center gap-4">
            <Link to="/contact" className="text-ink underline hover:text-steel">Contact Desk</Link>
            <span>&bull;</span>
            <Link to="/community-guidelines" className="text-ink underline hover:text-steel">Community Guidelines</Link>
          </div>
        </div>
      </Container>
    </div>
  )
}
