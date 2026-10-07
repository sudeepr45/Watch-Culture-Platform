import { useEffect, useState } from 'react'
import Container from '../components/common/Container'
import { Link } from '../router'
import { getPublishedBulletins } from '../services/bulletinService'
import type { Bulletin } from '../services/bulletinService'

type BulletinVolumeFilter = 'modern' | 'vintage' | 'both'

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

function getExcerpt(body: string): string {
  const plainText = body
    .replace(/<[^>]*>/g, ' ')
    .replace(/!?(?:\[([^\]]*)\])\([^)]*\)/g, '$1')
    .replace(/[#*_>`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (plainText.length <= 190) return plainText

  const excerpt = plainText.slice(0, 190)
  const lastSpace = excerpt.lastIndexOf(' ')
  return `${excerpt.slice(0, lastSpace > 130 ? lastSpace : 190).trimEnd()}…`
}

export default function BulletinPage() {
  const [bulletins, setBulletins] = useState<Bulletin[] | null>(null)
  const [volumeFilter, setVolumeFilter] = useState<BulletinVolumeFilter>('both')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConfigured, setIsConfigured] = useState(true)

  const visibleBulletins = bulletins?.filter((bulletin) =>
    volumeFilter === 'both' ||
    (volumeFilter === 'modern' && bulletin.era === 'Modern') ||
    (volumeFilter === 'vintage' && bulletin.era === 'Vintage')
  )

  const loadBulletins = async () => {
    setLoading(true)
    setError(null)
    const result = await getPublishedBulletins()
    setIsConfigured(result.isConfigured)
    if (result.error) {
      setError(result.error.message)
      setBulletins(null)
    } else {
      setBulletins(result.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    let isMounted = true

    getPublishedBulletins().then((result) => {
      if (!isMounted) return
      setIsConfigured(result.isConfigured)
      if (result.error) {
        setError(result.error.message)
      } else {
        setBulletins(result.data)
      }
      setLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        <header className="mb-10 border-b border-hairline pb-8 sm:mb-14 sm:pb-10">
          <p className="mb-4 text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">READ</p>
          <h1 className="font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl md:text-5xl">
            THE BULLETIN
          </h1>
          <section className="mt-6 border-t border-hairline pt-5" aria-label="A note on the volumes">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">
              A NOTE ON THE VOLUMES
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 sm:gap-8">
              <div>
                <h2 className="text-[10px] font-mono uppercase tracking-[0.18em] text-ink-secondary">
                  VOL. I — MODERN
                </h2>
                <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink">
                  The contemporary watch world — new watches, current makers, releases and the culture surrounding them.
                </p>
              </div>
              <div className="border-t border-hairline pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                <h2 className="text-[10px] font-mono uppercase tracking-[0.18em] text-ink-secondary">
                  VOL. II — VINTAGE
                </h2>
                <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink">
                  The watches that came before — heritage, collecting, historical references, movements and the stories behind them.
                </p>
              </div>
            </div>
            <p className="mt-5 text-xs leading-relaxed text-ink-muted">
              Two editorial worlds within one publication, not chronological issues.
            </p>
          </section>
        </header>

        <div
          className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-hairline pb-3 sm:mb-10"
          role="group"
          aria-label="Filter Bulletins by editorial volume"
        >
          {([
            ['modern', 'VOL. I'],
            ['vintage', 'VOL. II'],
            ['both', 'BOTH'],
          ] as const).map(([filter, label]) => {
            const isSelected = volumeFilter === filter

            return (
              <button
                key={filter}
                type="button"
                onClick={() => setVolumeFilter(filter)}
                aria-pressed={isSelected}
                className={`border-b py-2 text-[10px] font-mono uppercase tracking-[0.18em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink ${
                  isSelected
                    ? 'border-ink text-ink'
                    : 'border-transparent text-ink-secondary hover:text-ink'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {loading && (
          <p className="py-10 text-sm text-ink-secondary" role="status">Loading the Bulletin…</p>
        )}

        {!loading && error && (
          <div className="border-y border-hairline py-8 sm:py-10" role="alert">
            <h2 className="font-display text-xl font-medium text-ink">Unable to load the Bulletin</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-secondary">
              {isConfigured
                ? `Database connection error: ${error}`
                : 'Supabase credentials are not configured in the environment.'}
            </p>
            <button
              type="button"
              onClick={loadBulletins}
              className="mt-5 text-[10px] font-mono uppercase tracking-[0.2em] text-ink underline underline-offset-4"
            >
              Retry query
            </button>
          </div>
        )}

        {!loading && !error && bulletins && visibleBulletins?.length === 0 && (
          <p className="border-y border-hairline py-8 text-sm leading-relaxed text-ink-secondary sm:py-10">
            {volumeFilter === 'modern'
              ? 'No Modern Bulletins have been published yet.'
              : volumeFilter === 'vintage'
                ? 'No Vintage Bulletins have been published yet.'
                : 'No bulletins have been published yet.'}
          </p>
        )}

        {!loading && !error && visibleBulletins && visibleBulletins.length > 0 && (
          <ol>
            {visibleBulletins.map((bulletin) => (
              <li key={bulletin.id} className="border-b border-hairline py-7 first:pt-0 sm:py-9">
                <article>
                  <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">
                    <span>BULLETIN NO. {String(bulletin.bulletin_number).padStart(3, '0')}</span>
                    <span>{formatEditorialDate(bulletin.published_at)}</span>
                  </div>
                  <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">
                    {bulletin.era} · {bulletin.category}
                  </p>
                  <h2 className="font-display text-xl font-medium leading-snug tracking-tight text-ink sm:text-2xl">
                    <Link
                      to={`/bulletin/${bulletin.slug}`}
                      className="decoration-ink/30 underline-offset-4 hover:underline focus-visible:underline"
                    >
                      {bulletin.title}
                    </Link>
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-secondary sm:text-base">
                    {getExcerpt(bulletin.body)}
                  </p>
                </article>
              </li>
            ))}
          </ol>
        )}
      </Container>
    </div>
  )
}
