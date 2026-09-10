import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/useAuth'
import { useRouter } from '../router/useRouter'
import Container from '../components/common/Container'
import WatchImage from '../components/common/WatchImage'
import {
  curatorFetchAllWatches,
  curatorPublishWatch,
  curatorUnpublishWatch,
  curatorArchiveWatch,
} from '../services/curatorWatchService'
import type { Watch } from '../types/watch'
import type { WatchStatus } from '../services/curatorWatchService'

// ------------------------------------------------------------------
// Status badge
// ------------------------------------------------------------------
function StatusBadge({ status }: { status: Watch['status'] }) {
  const label = status.toUpperCase()
  const color =
    status === 'published'
      ? 'text-ink'
      : status === 'archived'
        ? 'text-ink-muted'
        : 'text-steel'

  return (
    <span className={`text-[10px] font-mono tracking-[0.18em] uppercase ${color}`}>
      {label}
    </span>
  )
}

// ------------------------------------------------------------------
// Watch row in the curator archive list
// ------------------------------------------------------------------
function CuratorWatchRow({
  watch,
  onStatusChange,
}: {
  watch: Watch
  onStatusChange: () => void
}) {
  const { navigate } = useRouter()
  const [acting, setActing] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const handleAction = async (
    action: 'publish' | 'unpublish' | 'archive'
  ) => {
    setActing(true)
    setActionError(null)

    let result
    if (action === 'publish') result = await curatorPublishWatch(watch.id)
    else if (action === 'unpublish') result = await curatorUnpublishWatch(watch.id)
    else result = await curatorArchiveWatch(watch.id)

    if (result.error) {
      setActionError(result.error.message)
    } else {
      onStatusChange()
    }
    setActing(false)
  }

  return (
    <div className="flex items-center gap-4 py-4 border-b border-hairline last:border-0 group">
      {/* Photograph thumbnail */}
      <div className="flex-shrink-0 w-16 h-12 overflow-hidden border border-hairline">
        <WatchImage
          src={watch.image_url}
          alt={`${watch.brand} ${watch.model}`}
          aspectRatio="aspect-auto"
          className="!aspect-auto h-12 w-16"
          compact
        />
      </div>

      {/* Watch identity */}
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[11px] font-mono tracking-[0.14em] text-ink-secondary uppercase truncate">
            {watch.brand}
          </span>
          <span className="text-hairline">·</span>
          <StatusBadge status={watch.status} />
        </div>
        <p className="text-sm font-medium text-ink truncate leading-tight">
          {watch.model}
        </p>
        <p className="text-[11px] font-mono tracking-wider text-ink-muted mt-0.5 truncate">
          {watch.reference_number}
        </p>
        {actionError && (
          <p className="text-[10px] font-mono text-steel-dark mt-1">{actionError}</p>
        )}
      </div>

      {/* Date */}
      <div className="flex-shrink-0 hidden sm:block text-right">
        <span className="text-[10px] font-mono tracking-wider text-ink-muted">
          {new Date(watch.updated_at).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-1">
        <button
          onClick={() => navigate(`/curator/edit/${watch.slug}`)}
          className="text-[10px] font-mono tracking-[0.14em] uppercase px-3 py-1.5 border border-hairline text-ink-secondary hover:text-ink hover:border-ink transition-colors"
          disabled={acting}
        >
          EDIT
        </button>

        {watch.status === 'draft' && (
          <button
            onClick={() => handleAction('publish')}
            disabled={acting}
            className="text-[10px] font-mono tracking-[0.14em] uppercase px-3 py-1.5 border border-ink text-ink hover:bg-ink hover:text-warm-white transition-colors disabled:opacity-40"
          >
            PUBLISH
          </button>
        )}

        {watch.status === 'published' && (
          <button
            onClick={() => handleAction('unpublish')}
            disabled={acting}
            className="text-[10px] font-mono tracking-[0.14em] uppercase px-3 py-1.5 border border-hairline text-ink-secondary hover:border-ink hover:text-ink transition-colors disabled:opacity-40"
          >
            DRAFT
          </button>
        )}

        {watch.status !== 'archived' && (
          <button
            onClick={() => handleAction('archive')}
            disabled={acting}
            className="text-[10px] font-mono tracking-[0.14em] uppercase px-3 py-1.5 border border-hairline text-ink-muted hover:border-steel hover:text-steel transition-colors disabled:opacity-40"
          >
            ARCHIVE
          </button>
        )}

        {watch.status === 'archived' && (
          <button
            onClick={() => handleAction('unpublish')}
            disabled={acting}
            className="text-[10px] font-mono tracking-[0.14em] uppercase px-3 py-1.5 border border-hairline text-ink-secondary hover:border-ink hover:text-ink transition-colors disabled:opacity-40"
          >
            RESTORE
          </button>
        )}
      </div>
    </div>
  )
}

// ------------------------------------------------------------------
// Status filter tab
// ------------------------------------------------------------------
function FilterTab({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`text-[10px] font-mono tracking-[0.18em] uppercase px-4 py-2 border-b-2 transition-colors ${
        active
          ? 'border-ink text-ink'
          : 'border-transparent text-ink-muted hover:text-ink-secondary'
      }`}
    >
      {label}
    </button>
  )
}

// ------------------------------------------------------------------
// Main page
// ------------------------------------------------------------------
export default function CuratorPage() {
  const { isAuthenticated, isCurator, loading: authLoading } = useAuth()
  const { navigate } = useRouter()

  const [watches, setWatches] = useState<Watch[]>([])
  const [statusFilter, setStatusFilter] = useState<WatchStatus | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // loadWatches is called from CuratorWatchRow onStatusChange (user events only, not effects)
  const loadWatches = useCallback(() => {
    curatorFetchAllWatches(statusFilter).then((result) => {
      if (result.error) {
        setError(result.error.message)
      } else {
        setWatches(result.data || [])
        setError(null)
      }
      setLoading(false)
    })
  }, [statusFilter])

  useEffect(() => {
    let isMounted = true
    if (!authLoading && isCurator) {
      curatorFetchAllWatches(statusFilter).then((result) => {
        if (!isMounted) return
        if (result.error) {
          setError(result.error.message)
        } else {
          setWatches(result.data || [])
          setError(null)
        }
        setLoading(false)
      })
    }
    return () => {
      isMounted = false
    }
  }, [authLoading, isCurator, statusFilter])

  // Auth gate
  if (authLoading) {
    return (
      <Container className="py-20">
        <p className="text-[11px] font-mono tracking-wider text-ink-muted uppercase">
          VERIFYING…
        </p>
      </Container>
    )
  }

  if (!isAuthenticated) {
    return (
      <Container className="py-20">
        <div className="max-w-sm">
          <p className="text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-2">
            RESTRICTED
          </p>
          <h1 className="text-xl font-semibold text-ink mb-4">Sign in required</h1>
          <button
            onClick={() => navigate('/login')}
            className="text-[11px] font-mono tracking-[0.14em] uppercase px-5 py-2.5 border border-ink text-ink hover:bg-ink hover:text-warm-white transition-colors"
          >
            SIGN IN
          </button>
        </div>
      </Container>
    )
  }

  if (!isCurator) {
    return (
      <Container className="py-20">
        <div className="max-w-sm">
          <p className="text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-2">
            ACCESS DENIED
          </p>
          <h1 className="text-xl font-semibold text-ink mb-2">Curator access required</h1>
          <p className="text-sm text-ink-secondary">
            This area is restricted to authorised MOERI &amp; JEANNERET curators.
          </p>
        </div>
      </Container>
    )
  }

  const counts = {
    all: watches.length,
    draft: watches.filter((w) => w.status === 'draft').length,
    published: watches.filter((w) => w.status === 'published').length,
    archived: watches.filter((w) => w.status === 'archived').length,
  }

  const displayedWatches = statusFilter
    ? watches.filter((w) => w.status === statusFilter)
    : watches

  return (
    <div className="min-h-[70vh] bg-warm-white">
      <div className="border-b border-hairline bg-warm-surface/40">
        <Container className="py-8 sm:py-12">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <p className="text-[10px] font-mono tracking-[0.22em] text-ink-muted uppercase mb-1">
                MOERI &amp; JEANNERET
              </p>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
                CURATOR
              </h1>
              <p className="text-[11px] font-mono tracking-[0.16em] text-ink-secondary uppercase mt-1">
                ARCHIVE DESK
              </p>
            </div>

            <button
              onClick={() => navigate('/curator/new')}
              className="inline-flex items-center gap-2 text-[11px] font-mono tracking-[0.16em] uppercase px-5 py-3 border border-ink text-ink hover:bg-ink hover:text-warm-white transition-colors self-start sm:self-auto"
            >
              <span className="text-base leading-none">+</span>
              NEW RECORD
            </button>
          </div>
        </Container>
      </div>

      <Container className="py-8">
        {/* Status filter tabs */}
        <div className="flex items-center gap-0 border-b border-hairline mb-6 overflow-x-auto">
          <FilterTab
            label={`ALL (${counts.all})`}
            active={statusFilter === undefined}
            onClick={() => setStatusFilter(undefined)}
          />
          <FilterTab
            label={`PUBLISHED (${counts.published})`}
            active={statusFilter === 'published'}
            onClick={() => setStatusFilter('published')}
          />
          <FilterTab
            label={`DRAFT (${counts.draft})`}
            active={statusFilter === 'draft'}
            onClick={() => setStatusFilter('draft')}
          />
          <FilterTab
            label={`ARCHIVED (${counts.archived})`}
            active={statusFilter === 'archived'}
            onClick={() => setStatusFilter('archived')}
          />
        </div>

        {/* Archive list */}
        {loading ? (
          <div className="py-16 text-center">
            <p className="text-[11px] font-mono tracking-wider text-ink-muted uppercase">
              LOADING ARCHIVE…
            </p>
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-[10px] font-mono tracking-wider text-ink-muted uppercase mb-2">
              ERROR
            </p>
            <p className="text-sm text-ink-secondary">{error}</p>
          </div>
        ) : displayedWatches.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[11px] font-mono tracking-wider text-ink-muted uppercase mb-4">
              NO RECORDS
            </p>
            <button
              onClick={() => navigate('/curator/new')}
              className="text-[11px] font-mono tracking-[0.14em] uppercase px-5 py-2.5 border border-ink text-ink hover:bg-ink hover:text-warm-white transition-colors"
            >
              ADD FIRST WATCH
            </button>
          </div>
        ) : (
          <div>
            <p className="text-[10px] font-mono tracking-[0.18em] text-ink-muted uppercase mb-4">
              {displayedWatches.length} RECORD{displayedWatches.length !== 1 ? 'S' : ''}
            </p>
            {displayedWatches.map((watch) => (
              <CuratorWatchRow
                key={watch.id}
                watch={watch}
                onStatusChange={loadWatches}
              />
            ))}
          </div>
        )}
      </Container>
    </div>
  )
}
