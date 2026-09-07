import Container from '../components/common/Container'
import Button from '../components/common/Button'
import { useRouter } from '../router/useRouter'

export default function BattlesPage() {
  const { navigate } = useRouter()

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        {/* Page Header */}
        <div className="border-b border-hairline pb-8 mb-12 sm:mb-16">
          <div className="flex items-center gap-2 mb-3 text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-ink-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden="true" />
            <span>INTERACTIVE ARENA &bull; SHOWDOWN</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-ink uppercase">
            Watch Battle
          </h1>
          <p className="mt-3 text-base sm:text-lg text-ink-secondary max-w-2xl">
            Put two watches head-to-head.
          </p>
        </div>

        {/* Dual Contender Selectors (Architecture ready for dynamic selection from Watch Database) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {/* Contender 1 Slot */}
          <div className="border border-dashed border-hairline bg-warm-surface/20 p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[260px]">
            <div className="text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-3">
              CONTENDER 01
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-normal text-ink uppercase">
              Select First Watch
            </h2>
            <p className="mt-2 text-xs font-mono text-ink-secondary">
              PULLS DIRECTLY FROM WATCH INDEX
            </p>
            <div className="mt-6">
              <Button variant="secondary" size="sm" onClick={() => navigate('/watches')}>
                CHOOSE WATCH 1 &rarr;
              </Button>
            </div>
          </div>

          {/* Contender 2 Slot */}
          <div className="border border-dashed border-hairline bg-warm-surface/20 p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[260px]">
            <div className="text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-3">
              CONTENDER 02
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-normal text-ink uppercase">
              Select Second Watch
            </h2>
            <p className="mt-2 text-xs font-mono text-ink-secondary">
              PULLS DIRECTLY FROM WATCH INDEX
            </p>
            <div className="mt-6">
              <Button variant="secondary" size="sm" onClick={() => navigate('/watches')}>
                CHOOSE WATCH 2 &rarr;
              </Button>
            </div>
          </div>
        </div>

        {/* Engine Status Callout */}
        <div className="border border-hairline bg-warm-surface/40 p-8 text-center max-w-4xl mx-auto">
          <div className="text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-2">
            DATABASE ARCHITECTURE // BATTLE ENGINE
          </div>
          <p className="text-xs sm:text-sm font-mono text-ink-secondary leading-relaxed">
            The Battle Engine allows any two timepieces from the Supabase database to be paired for community voting, spec deconstruction, and value comparisons.
          </p>
        </div>
      </Container>
    </div>
  )
}
