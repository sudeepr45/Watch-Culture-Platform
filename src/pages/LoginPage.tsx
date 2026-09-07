import Container from '../components/common/Container'
import Button from '../components/common/Button'

export default function LoginPage() {
  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        {/* Page Header */}
        <div className="border-b border-hairline pb-8 mb-12 sm:mb-16">
          <div className="flex items-center gap-2 mb-3 text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-ink-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden="true" />
            <span>COLLECTOR GATEWAY &bull; ACCESS</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-ink uppercase">
            Enter the Watch World
          </h1>
          <p className="mt-3 text-base sm:text-lg text-ink-secondary max-w-2xl">
            Access your personal watch vault, community investigations, and collection telemetry.
          </p>
        </div>

        {/* Authentication Form Card */}
        <div className="relative border border-hairline bg-warm-surface/40 p-8 sm:p-12 lg:p-16 max-w-xl mx-auto">
          {/* Status Indicator */}
          <div className="mb-8 p-3.5 border border-hairline bg-warm-white flex items-center justify-between text-[11px] font-mono tracking-[0.16em] uppercase">
            <span className="text-ink font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" aria-hidden="true" />
              SUPABASE AUTH — NEXT PHASE
            </span>
            <span className="text-ink-muted">SECURITY READY</span>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-mono uppercase tracking-[0.18em] text-ink font-medium mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                disabled
                placeholder="collector@watchculture.com"
                className="w-full px-4 py-3 bg-warm-white border border-hairline text-ink text-sm font-sans focus:outline-none focus:border-ink placeholder:text-ink-muted/50 cursor-not-allowed opacity-75"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-mono uppercase tracking-[0.18em] text-ink font-medium mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                disabled
                placeholder="••••••••••••"
                className="w-full px-4 py-3 bg-warm-white border border-hairline text-ink text-sm font-sans focus:outline-none focus:border-ink placeholder:text-ink-muted/50 cursor-not-allowed opacity-75"
              />
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-4">
              <Button
                type="button"
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => {
                  alert('Supabase Auth integration is scheduled for the next phase. Authentication is currently disabled.')
                }}
              >
                SIGN IN
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => {
                  alert('Account registration will open when the Supabase database is connected.')
                }}
              >
                CREATE ACCOUNT
              </Button>
            </div>
          </form>

          <p className="mt-8 pt-6 border-t border-hairline text-center text-xs text-ink-muted font-light leading-relaxed">
            Real collector authentication will connect to Supabase Auth. No credentials are saved or processed locally.
          </p>
        </div>
      </Container>
    </div>
  )
}
