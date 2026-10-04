import { useEffect, useState } from 'react'
import Container from '../components/common/Container'
import { Link } from '../router'
import { getPublishedBulletins } from '../services/bulletinService'
import type { Bulletin } from '../services/bulletinService'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConfigured, setIsConfigured] = useState(true)

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
            THE BULLETIN — VOL. I
          </h1>
          <p className="mt-2 text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">
            MODERN WATCH WORLD
          </p>
        </header>

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

        {!loading && !error && bulletins?.length === 0 && (
          <p className="border-y border-hairline py-8 text-sm leading-relaxed text-ink-secondary sm:py-10">
            No bulletins have been published yet.
          </p>
        )}

        {!loading && !error && bulletins && bulletins.length > 0 && (
          <ol>
            {bulletins.map((bulletin) => (
              <li key={bulletin.id} className="border-b border-hairline py-7 first:pt-0 sm:py-9">
                <article>
                  <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">
                    <span>BULLETIN NO. {String(bulletin.bulletin_number).padStart(3, '0')}</span>
                    <span>{formatEditorialDate(bulletin.published_at)}</span>
                    {bulletin.category && <span>{bulletin.category}</span>}
                  </div>
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
