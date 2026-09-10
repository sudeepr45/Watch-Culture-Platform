import { useState, type FormEvent } from 'react'
import Container from '../components/common/Container'
import Button from '../components/common/Button'
import { useRouter } from '../router/useRouter'
import { useAuth } from '../context/useAuth'

interface LoginPageProps {
  initialMode?: 'login' | 'signup'
}

export default function LoginPage({ initialMode = 'login' }: LoginPageProps) {
  const { signIn, signUp, isAuthenticated } = useAuth()
  const { navigate } = useRouter()

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null)

  // If already logged in, redirect to /profile
  if (isAuthenticated) {
    navigate('/profile')
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setConfirmationNotice(null)

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both email and password.')
      return
    }

    setLoading(true)

    if (mode === 'signup') {
      if (!username.trim()) {
        setErrorMessage('A unique username is required.')
        setLoading(false)
        return
      }

      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.')
        setLoading(false)
        return
      }

      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.')
        setLoading(false)
        return
      }

      const result = await signUp({
        email: email.trim(),
        password,
        username: username.trim(),
        displayName: displayName.trim() || undefined,
      })

      setLoading(false)

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to create your account.')
        return
      }

      if (result.requiresConfirmation) {
        setConfirmationNotice(
          'A confirmation link has been sent to your email. Check your email to confirm your account before logging in.'
        )
      } else {
        navigate('/profile')
      }
    } else {
      // Login mode
      const result = await signIn({
        email: email.trim(),
        password,
      })

      setLoading(false)

      if (!result.success) {
        setErrorMessage(result.error || 'Invalid credentials or user does not exist.')
      } else {
        navigate('/profile')
      }
    }
  }

  const toggleMode = (newMode: 'login' | 'signup') => {
    setMode(newMode)
    setErrorMessage(null)
    setConfirmationNotice(null)
  }

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        {/* Page Header */}
        <div className="border-b border-hairline pb-8 mb-12 sm:mb-16">
          <div className="flex items-center gap-2 mb-3 text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-ink-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
            <span>COLLECTOR GATEWAY &bull; ARCHIVE LOGBOOK</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-ink uppercase">
            {mode === 'signup' ? 'Create Profile' : 'Welcome Back'}
          </h1>
          <p className="mt-3 text-base sm:text-lg text-ink-secondary max-w-2xl font-light">
            {mode === 'signup'
              ? 'Register your collector profile to document your personal wrist archive and participate in head-to-head audits.'
              : 'Sign in to access your collector dossier, profile specifications, and saved bookmarks.'}
          </p>
        </div>

        {/* Form Container Card */}
        <div className="relative border border-hairline bg-warm-surface/40 p-8 sm:p-12 max-w-xl mx-auto">
          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 border border-hairline bg-warm-white mb-8 p-1 text-xs font-mono">
            <button
              type="button"
              onClick={() => toggleMode('login')}
              className={`py-2.5 uppercase tracking-wider transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'bg-ink text-warm-white font-semibold'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => toggleMode('signup')}
              className={`py-2.5 uppercase tracking-wider transition-colors cursor-pointer ${
                mode === 'signup'
                  ? 'bg-ink text-warm-white font-semibold'
                  : 'text-ink-secondary hover:text-ink'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Success / Email Confirmation Banner */}
          {confirmationNotice && (
            <div className="mb-6 p-4 border border-hairline bg-warm-surface/60 text-xs font-mono text-ink leading-relaxed">
              <div className="text-[10px] uppercase tracking-widest text-ink font-bold mb-1">
                CONFIRMATION DISPATCHED
              </div>
              {confirmationNotice}
            </div>
          )}

          {/* Error Message Banner */}
          {errorMessage && (
            <div className="mb-6 p-4 border border-rose-300 bg-rose-50 text-xs font-mono text-rose-900 leading-relaxed">
              <div className="text-[10px] uppercase tracking-widest text-rose-800 font-bold mb-1">
                AUTHENTICATION NOTICE
              </div>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Extra Fields for Sign Up */}
            {mode === 'signup' && (
              <>
                <div>
                  <label
                    htmlFor="displayName"
                    className="block text-xs font-mono uppercase tracking-[0.18em] text-ink font-medium mb-1.5"
                  >
                    Display Name
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Hans Wilsdorf"
                    className="w-full px-4 py-3 bg-warm-white border border-hairline text-ink text-xs font-mono focus:outline-none focus:border-ink placeholder:text-ink-muted/50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="username"
                    className="block text-xs font-mono uppercase tracking-[0.18em] text-ink font-medium mb-1.5"
                  >
                    Username <span className="text-steel">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-xs font-mono text-ink-muted pointer-events-none">
                      @
                    </span>
                    <input
                      id="username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="collector_name"
                      className="w-full px-4 py-3 pl-8 bg-warm-white border border-hairline text-ink text-xs font-mono focus:outline-none focus:border-ink placeholder:text-ink-muted/50"
                    />
                  </div>
                  <p className="mt-1 text-[10px] font-mono text-ink-muted">
                    3–20 characters. Letters, numbers, and underscores only.
                  </p>
                </div>
              </>
            )}

            {/* Email Address */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-mono uppercase tracking-[0.18em] text-ink font-medium mb-1.5"
              >
                Email Address <span className="text-steel">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="collector@watchculture.com"
                className="w-full px-4 py-3 bg-warm-white border border-hairline text-ink text-xs font-mono focus:outline-none focus:border-ink placeholder:text-ink-muted/50"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-mono uppercase tracking-[0.18em] text-ink font-medium mb-1.5"
              >
                Password <span className="text-steel">*</span>
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 bg-warm-white border border-hairline text-ink text-xs font-mono focus:outline-none focus:border-ink placeholder:text-ink-muted/50"
              />
            </div>

            {/* Confirm Password (Sign Up only) */}
            {mode === 'signup' && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-mono uppercase tracking-[0.18em] text-ink font-medium mb-1.5"
                >
                  Confirm Password <span className="text-steel">*</span>
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3 bg-warm-white border border-hairline text-ink text-xs font-mono focus:outline-none focus:border-ink placeholder:text-ink-muted/50"
                />
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-3">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                disabled={loading}
              >
                {loading
                  ? 'TRANSMITTING CREDENTIALS...'
                  : mode === 'signup'
                  ? 'CREATE ACCOUNT \u2192'
                  : 'SIGN IN \u2192'}
              </Button>
            </div>
          </form>

          {/* Switch helper footer */}
          <div className="mt-8 pt-6 border-t border-hairline flex items-center justify-between text-xs font-mono text-ink-secondary">
            <span>
              {mode === 'signup' ? 'Already registered?' : 'New to Project Watch?'}
            </span>
            <button
              type="button"
              onClick={() => toggleMode(mode === 'signup' ? 'login' : 'signup')}
              className="text-ink font-semibold hover:text-neutral-700 uppercase tracking-wider underline cursor-pointer"
            >
              {mode === 'signup' ? 'Sign in instead' : 'Create profile'}
            </button>
          </div>

          <div className="mt-6 text-center text-[10px] font-mono text-ink-muted uppercase tracking-widest">
            AUTHENTICATED ARCHIVE ACCESS
          </div>
        </div>
      </Container>
    </div>
  )
}
