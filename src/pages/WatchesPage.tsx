import Container from '../components/common/Container'
import Button from '../components/common/Button'
import { useRouter } from '../router/useRouter'

export default function WatchesPage() {
  const { navigate } = useRouter()

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        {/* Page Header */}
        <div className="border-b border-hairline pb-8 mb-12 sm:mb-16">
          <div className="flex items-center gap-2 mb-3 text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-ink-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden="true" />
            <span>CENTRAL WATCH INDEX &bull; REPOSITORY</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-ink uppercase">
            Watch Index
          </h1>
          <p className="mt-3 text-base sm:text-lg text-ink-secondary max-w-2xl">
            Explore the watches behind the culture.
          </p>
        </div>

        {/* Intentional Empty State */}
        <div className="relative border border-hairline bg-warm-surface/40 p-8 sm:p-14 lg:p-20 text-center max-w-3xl mx-auto">
          <div className="absolute top-3 left-4 text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase">
            INDEX // 01
          </div>
          <div className="absolute top-3 right-4 text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase">
            STATUS: PENDING
          </div>

          <div className="max-w-md mx-auto py-6">
            <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center border border-hairline bg-warm-white text-ink">
              <svg
                className="w-5 h-5 text-ink-secondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-ink uppercase">
              Database Initializing
            </h2>

            <p className="mt-3 text-sm sm:text-base text-ink-secondary font-light leading-relaxed">
              Watch records will appear here once the watch index is connected.
            </p>

            <div className="mt-8 flex justify-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/explore')}
              >
                EXPLORE PLATFORM &rarr;
              </Button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-hairline flex items-center justify-between text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase">
            <span>DATABASE: SUPABASE CONNECTING SOON</span>
            <span className="text-gold">CANONICAL HOROLOGICAL ARCHIVE</span>
          </div>
        </div>
      </Container>
    </div>
  )
}
