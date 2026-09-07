import Container from '../components/common/Container'
import Button from '../components/common/Button'
import { useRouter } from '../router/useRouter'

export default function Watch101Page() {
  const { navigate } = useRouter()

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        {/* Page Header */}
        <div className="border-b border-hairline pb-8 mb-12 sm:mb-16">
          <div className="flex items-center gap-2 mb-3 text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-ink-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden="true" />
            <span>ACADEMY &bull; HOROLOGICAL ESSENTIALS</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-ink uppercase">
            Watch 101
          </h1>
          <p className="mt-3 text-base sm:text-lg text-ink-secondary max-w-2xl">
            Learn watches without the bullshit.
          </p>
        </div>

        {/* Intentional Empty State */}
        <div className="relative border border-hairline bg-warm-surface/40 p-8 sm:p-14 lg:p-20 text-center max-w-3xl mx-auto">
          <div className="absolute top-3 left-4 text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase">
            ACADEMY // 03
          </div>
          <div className="absolute top-3 right-4 text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase">
            STATUS: CURATING
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342"
                />
              </svg>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-ink uppercase">
              Knowledge Base Initializing
            </h2>

            <p className="mt-3 text-sm sm:text-base text-ink-secondary font-light leading-relaxed">
              Interactive watch guides will appear here.
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
            <span>CURRICULUM: MOVEMENTS &bull; COMPLICATIONS &bull; FINISHING</span>
            <span className="text-gold">FOUNDATIONAL HOROLOGY</span>
          </div>
        </div>
      </Container>
    </div>
  )
}
