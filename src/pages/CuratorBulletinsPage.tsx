import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/useAuth'
import { useRouter } from '../router/useRouter'
import Container from '../components/common/Container'
import {
  deleteBulletin,
  getCuratorBulletins,
} from '../services/curatorBulletinService'
import type { CuratorBulletinListItem } from '../services/curatorBulletinService'

function formatEditorialDate(value: string | null): string {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date).toUpperCase()
}

function BulletinRow({
  bulletin,
  onDeleted,
}: {
  bulletin: CuratorBulletinListItem
  onDeleted: () => void
}) {
  const { navigate } = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)
    const result = await deleteBulletin(bulletin.id)
    if (result.error) {
      setError(result.error.message)
      setDeleting(false)
      return
    }
    onDeleted()
  }

  const publicationDate = formatEditorialDate(bulletin.published_at)
  const metadataDate = formatEditorialDate(bulletin.updated_at || bulletin.created_at)

  return (
    <li className="border-b border-hairline py-6 first:pt-0 sm:py-8">
      <article>
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono uppercase tracking-[0.18em] text-ink-muted">
          <span>BULLETIN NO. {String(bulletin.bulletin_number).padStart(3, '0')}</span>
          <span className={bulletin.published_at ? 'text-ink-secondary' : 'text-steel'}>
            {bulletin.published_at ? 'PUBLISHED' : 'DRAFT'}
          </span>
          {publicationDate && <time dateTime={bulletin.published_at ?? undefined}>{publicationDate}</time>}
        </div>
        <p className="mb-3 text-[10px] font-mono uppercase tracking-[0.18em] text-ink-muted">
          {bulletin.era} · {bulletin.category}
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="font-display text-xl font-medium leading-snug tracking-tight text-ink sm:text-2xl">
              {bulletin.title}
            </h2>
            <p className="mt-2 text-[10px] font-mono uppercase tracking-[0.14em] text-ink-muted">
              {bulletin.updated_at && bulletin.updated_at !== bulletin.created_at
                ? `UPDATED ${metadataDate}`
                : `CREATED ${formatEditorialDate(bulletin.created_at)}`}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/curator/bulletins/${bulletin.id}/edit`)}
              className="border border-hairline px-3 py-2 text-[10px] font-mono uppercase tracking-[0.14em] text-ink-secondary transition-colors hover:border-ink hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => { setConfirming((value) => !value); setError(null) }}
              disabled={deleting}
              className="border border-hairline px-3 py-2 text-[10px] font-mono uppercase tracking-[0.14em] text-ink-muted transition-colors hover:border-steel hover:text-steel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink disabled:opacity-40"
            >
              Delete
            </button>
          </div>
        </div>

        {confirming && (
          <div className="mt-4 border-y border-hairline py-4" role="group" aria-label={`Confirm deletion of ${bulletin.title}`}>
            <p className="text-sm text-ink-secondary">Delete this Bulletin permanently?</p>
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="border border-ink bg-ink px-3 py-2 text-[10px] font-mono uppercase tracking-[0.14em] text-warm-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
              >
                {deleting ? 'Deleting…' : 'Confirm delete'}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={deleting}
                className="px-2 py-2 text-[10px] font-mono uppercase tracking-[0.14em] text-ink-muted hover:text-ink disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {error && <p className="mt-3 text-sm text-steel-dark" role="alert">Unable to delete Bulletin: {error}</p>}
      </article>
    </li>
  )
}

export default function CuratorBulletinsPage() {
  const { isAuthenticated, isCurator, loading: authLoading } = useAuth()
  const { navigate } = useRouter()
  const [bulletins, setBulletins] = useState<CuratorBulletinListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConfigured, setIsConfigured] = useState(true)

  const loadBulletins = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await getCuratorBulletins()
    setIsConfigured(result.isConfigured)
    if (result.error) {
      setError(result.error.message)
    } else {
      setBulletins(result.data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    let mounted = true
    if (!authLoading && isCurator) {
      getCuratorBulletins().then((result) => {
        if (!mounted) return
        setIsConfigured(result.isConfigured)
        if (result.error) setError(result.error.message)
        else setBulletins(result.data ?? [])
        setLoading(false)
      })
    }
    return () => { mounted = false }
  }, [authLoading, isCurator])

  if (authLoading) {
    return <Container className="py-20"><p className="text-[11px] font-mono uppercase tracking-wider text-ink-muted" role="status">VERIFYING…</p></Container>
  }

  if (!isAuthenticated) {
    return (
      <Container className="py-20">
        <div className="max-w-sm">
          <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">RESTRICTED</p>
          <h1 className="mb-4 text-xl font-semibold text-ink">Sign in required</h1>
          <button type="button" onClick={() => navigate('/login')} className="border border-ink px-5 py-2.5 text-[11px] font-mono uppercase tracking-[0.14em] text-ink transition-colors hover:bg-ink hover:text-warm-white">SIGN IN</button>
        </div>
      </Container>
    )
  }

  if (!isCurator) {
    return (
      <Container className="py-20">
        <div className="max-w-sm">
          <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">ACCESS DENIED</p>
          <h1 className="mb-2 text-xl font-semibold text-ink">Curator access required</h1>
          <p className="text-sm text-ink-secondary">This area is restricted to authorised MOERI &amp; JEANNERET curators.</p>
        </div>
      </Container>
    )
  }

  return (
    <div className="min-h-[70vh] bg-warm-white">
      <header className="border-b border-hairline bg-warm-surface/40">
        <Container className="py-8 sm:py-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.22em] text-ink-muted">MOERI &amp; JEANNERET · CURATOR DESK</p>
              <h1 className="font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">THE BULLETIN</h1>
              <p className="mt-2 text-[11px] font-mono uppercase tracking-[0.16em] text-ink-secondary">VOL. I — MODERN WATCH WORLD</p>
            </div>
            <button type="button" onClick={() => navigate('/curator/bulletins/new')} className="inline-flex self-start items-center gap-2 border border-ink px-5 py-3 text-[11px] font-mono uppercase tracking-[0.16em] text-ink transition-colors hover:bg-ink hover:text-warm-white sm:self-auto">
              <span className="text-base leading-none">+</span> NEW BULLETIN
            </button>
          </div>
        </Container>
      </header>

      <Container className="py-8 sm:py-10">
        {loading && <p className="py-10 text-sm text-ink-secondary" role="status">Loading the Bulletin…</p>}
        {!loading && error && (
          <div className="border-y border-hairline py-8 sm:py-10" role="alert">
            <h2 className="font-display text-xl font-medium text-ink">Unable to load the Bulletin</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-secondary">
              {isConfigured ? `Database connection error: ${error}` : 'Supabase credentials are not configured in the environment.'}
            </p>
            <button type="button" onClick={loadBulletins} className="mt-5 text-[10px] font-mono uppercase tracking-[0.2em] text-ink underline underline-offset-4">Retry query</button>
          </div>
        )}
        {!loading && !error && bulletins.length === 0 && (
          <div className="border-y border-hairline py-8 sm:py-10">
            <h2 className="font-display text-xl font-medium text-ink">No Bulletins yet.</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-secondary">The editorial desk is ready for its first entry.</p>
            <button type="button" onClick={() => navigate('/curator/bulletins/new')} className="mt-5 border border-ink px-4 py-2.5 text-[10px] font-mono uppercase tracking-[0.16em] text-ink transition-colors hover:bg-ink hover:text-warm-white">CREATE THE FIRST BULLETIN</button>
          </div>
        )}
        {!loading && !error && bulletins.length > 0 && (
          <ol>{bulletins.map((bulletin) => <BulletinRow key={bulletin.id} bulletin={bulletin} onDeleted={loadBulletins} />)}</ol>
        )}
      </Container>
    </div>
  )
}
