import Container from '../components/common/Container'
import Button from '../components/common/Button'
import { useRouter } from '../router/useRouter'

export default function StoriesPage() {
  const { navigate } = useRouter()

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        {/* Page Header */}
        <div className="border-b border-hairline pb-8 mb-12 sm:mb-16">
          <div className="flex items-center gap-2 mb-3 text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-ink-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden="true" />
            <span>DISPATCHES &bull; ARCHIVE</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-ink uppercase">
            Stories
          </h1>
          <p className="mt-3 text-base sm:text-lg text-ink-secondary max-w-2xl">
            Independent editorial journalism, deep-dive investigations, and collector perspectives from the horological world.
          </p>
        </div>

        {/* Intentional Editorial Empty State */}
        <div className="relative border border-hairline bg-warm-surface/40 p-8 sm:p-14 lg:p-20 text-center max-w-3xl mx-auto">
          {/* Subtle Corner Accents */}
          <div className="absolute top-3 left-4 text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase">
            SECTION // 02
          </div>
          <div className="absolute top-3 right-4 text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase">
            FEED: INACTIVE
          </div>

          <div className="max-w-md mx-auto py-6">
            <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center border border-hairline rounded-none bg-warm-white text-ink">
              <svg
                className="w-5 h-5 text-ink-secondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                />
              </svg>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-ink uppercase">
              No Stories Yet
            </h2>

            <p className="mt-3 text-sm sm:text-base text-ink-secondary font-light leading-relaxed">
              Stories from the watch community will appear here.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/explore')}
              >
                EXPLORE PLATFORM &rarr;
              </Button>
            </div>
          </div>

          {/* Bottom Terminal Plate */}
          <div className="mt-6 pt-4 border-t border-hairline flex items-center justify-between text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase">
            <span>DATABASE: PENDING CONNECTION</span>
            <span className="text-gold">COMMUNITY PUBLISHING ENGINE</span>
          </div>
        </div>
      </Container>
    </div>
  )
}
