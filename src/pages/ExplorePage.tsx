import Container from '../components/common/Container'
import { Link } from '../router'

interface FeatureModule {
  tag: string
  title: string
  description: string
  status: string
  to?: string
}

const FUTURE_MODULES: FeatureModule[] = [
  {
    tag: 'CATALOG // ARCHIVE',
    title: 'WATCH ARCHIVE',
    description:
      'Curated technical specifications, reference history, calibre architecture, and case dimensions.',
    status: 'CENTRAL ARCHIVE',
    to: '/watches',
  },
  {
    tag: 'INTERACTIVE // SHOWDOWN',
    title: 'WATCH BATTLES',
    description:
      'Head-to-head community match-ups, collector voting, and side-by-side spec comparisons.',
    status: 'INTERACTIVE ENGINE',
    to: '/battles',
  },
  {
    tag: 'EXAMINATION // VERDICT',
    title: 'WORTH IT?',
    description:
      "See the facts. Decide if it's worth it for you. An objective buying-decision instrument evaluating substance against your priorities.",
    status: 'DECISION INSTRUMENT',
    to: '/case',
  },
  {
    tag: 'ACADEMY // FUNDAMENTALS',
    title: 'WATCH 101',
    description:
      'The mechanics of mechanical time: escapements, balance springs, complications, and finishing.',
    status: 'EDUCATIONAL SERIES',
    to: '/watch-101',
  },
  {
    tag: 'DISCOVERY // DISPATCH',
    title: 'RANDOM WATCH',
    description:
      'Spontaneous exploration engine surfacing forgotten references, prototypes, and icons.',
    status: 'DISCOVERY TOOL',
    to: '/random',
  },
  {
    tag: 'COMMUNITY // VAULT',
    title: 'MY COLLECTION',
    description:
      'Personal digital watch boxes, provenance logs, wrist shots, and collection telemetry.',
    status: 'COLLECTOR PROFILE',
    to: '/profile',
  },
]

export default function ExplorePage() {
  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        {/* Page Header */}
        <div className="border-b border-hairline pb-8 mb-12 sm:mb-16">
          <div className="flex items-center gap-2 mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
            <span>DISCOVERY ARENA</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-ink uppercase">
            Explore Watch Culture
          </h1>
          <p className="mt-3 text-base sm:text-lg text-ink-secondary max-w-2xl">
            Discover watches, stories, battles and rabbit holes.
          </p>
        </div>

        {/* Feature Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {FUTURE_MODULES.map((mod, index) => {
            const cardContent = (
              <>
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-4">
                    <span>{mod.tag}</span>
                    <span>MOD 0{index + 1}</span>
                  </div>

                  <h2 className="font-display text-xl sm:text-2xl font-normal tracking-tight text-ink uppercase group-hover:text-neutral-800 transition-colors">
                    {mod.title}
                  </h2>

                  <p className="mt-3 text-xs sm:text-sm text-ink-secondary font-light leading-relaxed">
                    {mod.description}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-hairline flex items-center justify-between text-[10px] font-mono tracking-[0.16em] uppercase">
                  <span className="text-ink-muted">{mod.status}</span>
                  <span className="text-ink-secondary group-hover:text-ink group-hover:translate-x-1 transition-all duration-200">
                    &rarr;
                  </span>
                </div>
              </>
            )

            const className =
              'relative group border border-hairline bg-warm-surface/30 p-7 sm:p-8 flex flex-col justify-between transition-colors duration-200 hover:border-ink hover:bg-warm-surface/60 cursor-pointer block'

            if (mod.to) {
              return (
                <Link key={mod.title} to={mod.to} className={className}>
                  {cardContent}
                </Link>
              )
            }

            return (
              <div key={mod.title} className={className}>
                {cardContent}
              </div>
            )
          })}
        </div>
      </Container>
    </div>
  )
}
