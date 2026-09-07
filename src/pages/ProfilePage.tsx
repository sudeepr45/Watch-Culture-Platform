import Container from '../components/common/Container'
import Button from '../components/common/Button'
import { useRouter } from '../router/useRouter'

export default function ProfilePage() {
  const { navigate } = useRouter()

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        {/* Profile Header */}
        <div className="border-b border-hairline pb-8 mb-12 sm:mb-16">
          <div className="flex items-center gap-2 mb-3 text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-ink-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden="true" />
            <span>COLLECTOR VAULT &bull; NOT SIGNED IN</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-ink uppercase">
            Your Wrist
          </h1>
          <p className="mt-3 text-base sm:text-lg text-ink-secondary max-w-2xl">
            Sign in to build your collection, save stories and share your watch journey.
          </p>
        </div>

        {/* Unauthenticated Collector Action Card */}
        <div className="relative border border-hairline bg-warm-surface/40 p-8 sm:p-12 lg:p-16 max-w-3xl mx-auto text-center mb-16">
          <div className="w-14 h-14 mx-auto mb-6 flex items-center justify-center border border-hairline bg-warm-white text-ink">
            <svg
              className="w-6 h-6 text-ink-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-ink uppercase">
            Access Your Collection
          </h2>

          <p className="mt-3 text-sm sm:text-base text-ink-secondary font-light max-w-md mx-auto leading-relaxed">
            Create a personal digital watch box, log references, bookmark community investigations, and participate in Watch Battles.
          </p>

          <div className="mt-8 flex justify-center">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/login')}
            >
              SIGN IN
            </Button>
          </div>

          <p className="mt-4 text-[11px] font-mono tracking-[0.16em] text-ink-muted uppercase">
            SUPABASE AUTH INTEGRATION PLANNED
          </p>
        </div>

        {/* Collector Grid Placeholders (Clean empty wireframes without fake records) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border border-hairline p-6 bg-warm-surface/20">
            <div className="flex items-center justify-between text-[10px] font-mono tracking-[0.18em] text-ink-muted uppercase pb-3 border-b border-hairline">
              <span>VAULT</span>
              <span>0 WATCHES</span>
            </div>
            <p className="mt-4 text-xs text-ink-secondary leading-relaxed font-light">
              Your digital watch box is empty. Add references once signed in.
            </p>
          </div>

          <div className="border border-hairline p-6 bg-warm-surface/20">
            <div className="flex items-center justify-between text-[10px] font-mono tracking-[0.18em] text-ink-muted uppercase pb-3 border-b border-hairline">
              <span>BOOKMARKS</span>
              <span>0 STORIES</span>
            </div>
            <p className="mt-4 text-xs text-ink-secondary leading-relaxed font-light">
              Saved editorial pieces and technical guides will be stored here.
            </p>
          </div>

          <div className="border border-hairline p-6 bg-warm-surface/20">
            <div className="flex items-center justify-between text-[10px] font-mono tracking-[0.18em] text-ink-muted uppercase pb-3 border-b border-hairline">
              <span>COMMUNITY</span>
              <span>0 CONTRIBUTIONS</span>
            </div>
            <p className="mt-4 text-xs text-ink-secondary leading-relaxed font-light">
              Your community stories, battle votes, and comments will appear here.
            </p>
          </div>
        </div>
      </Container>
    </div>
  )
}
