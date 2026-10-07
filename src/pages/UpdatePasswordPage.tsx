import { useState, type FormEvent } from 'react'
import Container from '../components/common/Container'
import Button from '../components/common/Button'
import { Link } from '../router'
import { useAuth } from '../context/useAuth'

export default function UpdatePasswordPage() {
  const { loading, isPasswordRecovery, updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!password || !confirmPassword) {
      setError('Enter and confirm your new password.')
      return
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }
    if (!isPasswordRecovery) {
      setError('Your recovery link is invalid or has expired. Return to sign in and request a new link.')
      return
    }

    setSubmitting(true)
    const result = await updatePassword(password)
    setSubmitting(false)
    if (!result.success) {
      setError('Your recovery session is invalid or has expired. Return to sign in and request a new link.')
      return
    }
    setPassword('')
    setConfirmPassword('')
    setSuccess(true)
  }

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        <div className="mb-10 border-b border-hairline pb-8 sm:mb-12">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-mono font-semibold uppercase tracking-[0.25em] text-ink-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-steel" aria-hidden="true" />
            <span>MOERI &amp; JEANNERET / ACCOUNT ACCESS</span>
          </div>
          <h1 className="font-display text-3xl font-normal uppercase tracking-tight text-ink sm:text-4xl">UPDATE PASSWORD</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-secondary">
            Set a new password for your MOJEAN account.
          </p>
        </div>

        <div className="mx-auto max-w-xl border border-hairline bg-warm-surface/40 p-6 sm:p-10">
          {loading ? (
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-ink-muted" role="status">VERIFYING RECOVERY LINK…</p>
          ) : success ? (
            <div role="status">
              <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.18em] text-ink-muted">PASSWORD UPDATED</p>
              <p className="text-sm leading-relaxed text-ink-secondary">Your password has been changed. You can now sign in with your new password.</p>
              <Link to="/login" className="mt-6 inline-flex border border-ink px-5 py-3 text-[10px] font-mono uppercase tracking-[0.16em] text-ink transition-colors hover:bg-ink hover:text-warm-white">RETURN TO SIGN IN</Link>
            </div>
          ) : !isPasswordRecovery ? (
            <div>
              <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.18em] text-ink-muted">RECOVERY LINK UNAVAILABLE</p>
              <p className="text-sm leading-relaxed text-ink-secondary">This password recovery session is invalid or has expired. Return to sign in and request a new recovery link.</p>
              <Link to="/login" className="mt-6 inline-flex border border-ink px-5 py-3 text-[10px] font-mono uppercase tracking-[0.16em] text-ink transition-colors hover:bg-ink hover:text-warm-white">RETURN TO SIGN IN</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="new-password" className="mb-1.5 block text-xs font-mono font-medium uppercase tracking-[0.18em] text-ink">New password</label>
                <input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full border border-hairline bg-warm-white px-4 py-3 text-xs font-mono text-ink focus:border-ink focus:outline-none" />
              </div>
              <div>
                <label htmlFor="confirm-new-password" className="mb-1.5 block text-xs font-mono font-medium uppercase tracking-[0.18em] text-ink">Confirm new password</label>
                <input id="confirm-new-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full border border-hairline bg-warm-white px-4 py-3 text-xs font-mono text-ink focus:border-ink focus:outline-none" />
              </div>
              {error && <p className="border-y border-rose-300 py-3 text-xs leading-relaxed text-rose-900" role="alert">{error}</p>}
              <Button type="submit" variant="primary" size="md" className="w-full" disabled={submitting}>
                {submitting ? 'UPDATING PASSWORD…' : 'UPDATE PASSWORD'}
              </Button>
            </form>
          )}
        </div>
      </Container>
    </div>
  )
}
