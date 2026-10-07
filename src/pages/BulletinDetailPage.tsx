import { useEffect, useState } from 'react'
import Container from '../components/common/Container'
import { Link } from '../router'
import { getBulletinBySlug } from '../services/bulletinService'
import type { BulletinWithRelatedWatchAndImages } from '../services/bulletinService'

const BULLETIN_VOLUME_LABELS = {
  Modern: 'VOL. I — MODERN',
  Vintage: 'VOL. II — VINTAGE',
} as const

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

function splitParagraphs(body: string): string[] {
  return body.split(/\r?\n(?:[\t ]*\r?\n)+/).filter((paragraph) => paragraph.trim().length > 0)
}

interface BulletinDetailPageProps {
  slug: string
}

export default function BulletinDetailPage({ slug }: BulletinDetailPageProps) {
  const [bulletin, setBulletin] = useState<BulletinWithRelatedWatchAndImages | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConfigured, setIsConfigured] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadBulletin = async () => {
      setLoading(true)
      setError(null)
      setBulletin(null)

      const result = await getBulletinBySlug(slug)
      if (!isMounted) return

      setIsConfigured(result.isConfigured)
      if (result.error) {
        setError(result.error.message)
      } else {
        setBulletin(result.data)
      }
      setLoading(false)
    }

    loadBulletin()

    return () => {
      isMounted = false
    }
  }, [slug])

  const handleRetry = async () => {
    setLoading(true)
    setError(null)
    const result = await getBulletinBySlug(slug)
    setIsConfigured(result.isConfigured)
    if (result.error) {
      setError(result.error.message)
      setBulletin(null)
    } else {
      setBulletin(result.data)
    }
    setLoading(false)
  }

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        {loading && (
          <p className="py-10 text-sm text-ink-secondary" role="status">Loading the Bulletin…</p>
        )}

        {!loading && error && (
          <section className="max-w-3xl border-y border-hairline py-8 sm:py-10" role="alert">
            <h1 className="font-display text-xl font-medium text-ink">Unable to load this Bulletin</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
              {isConfigured
                ? `Database connection error: ${error}`
                : 'Supabase credentials are not configured in the environment.'}
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-5 text-[10px] font-mono uppercase tracking-[0.2em] text-ink underline underline-offset-4"
            >
              Retry query
            </button>
          </section>
        )}

        {!loading && !error && !bulletin && (
          <section className="max-w-3xl border-y border-hairline py-8 sm:py-10">
            <p className="mb-3 text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">
              THE BULLETIN
            </p>
            <h1 className="font-display text-2xl font-medium tracking-tight text-ink sm:text-3xl">
              Bulletin not found
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
              This Bulletin may be unavailable or has not been published.
            </p>
            <Link
              to="/bulletin"
              className="mt-6 inline-block text-[10px] font-mono uppercase tracking-[0.2em] text-ink underline underline-offset-4"
            >
              Return to the Bulletin
            </Link>
          </section>
        )}

        {!loading && !error && bulletin && (
          <article className="mx-auto max-w-3xl">
            <header className="border-b border-hairline pb-7 sm:pb-9">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">
                THE BULLETIN
              </p>
              <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">
                {BULLETIN_VOLUME_LABELS[bulletin.era]}
              </p>
              <p className="mt-7 text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">
                BULLETIN NO. {String(bulletin.bulletin_number).padStart(3, '0')}
              </p>
              <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">
                {formatEditorialDate(bulletin.published_at)}
              </p>
              <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">
                {bulletin.era} · {bulletin.category}
              </p>
              <h1 className="mt-4 font-display text-3xl font-medium leading-tight tracking-tight text-ink sm:text-4xl lg:text-5xl">
                {bulletin.title}
              </h1>
            </header>

            <div className="mt-8 space-y-5 text-base leading-8 text-ink-secondary sm:mt-10">
              {splitParagraphs(bulletin.body).map((paragraph, index) => (
                <p key={`${index}-${paragraph.slice(0, 24)}`} className="whitespace-pre-line">
                  {paragraph}
                </p>
              ))}
            </div>

            {bulletin.images.length > 0 && (
              <section className="mt-10 space-y-10 sm:mt-12" aria-label="Bulletin photographs">
                {bulletin.images.map((image, index) => (
                  <figure key={image.id}>
                    <img
                      src={image.signed_url}
                      alt=""
                      loading="lazy"
                      className="h-auto max-h-[42rem] w-full object-contain object-left"
                    />
                    <figcaption className="mt-2 text-[10px] font-mono uppercase tracking-[0.16em] text-ink-muted">
                      PHOTOGRAPH {String(index + 1).padStart(2, '0')}
                    </figcaption>
                  </figure>
                ))}
              </section>
            )}

            {bulletin.cover_image && (
              <figure className="mt-9 max-w-lg">
                <img
                  src={bulletin.cover_image}
                  alt=""
                  loading="lazy"
                  className="h-auto max-h-[28rem] w-full object-contain object-left"
                />
              </figure>
            )}

            {bulletin.related_watch && (
              <aside className="mt-10 border-t border-hairline pt-5">
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">
                  RELATED WATCH
                </p>
                <Link
                  to={`/watches/${bulletin.related_watch.slug}`}
                  className="mt-2 inline-block font-display text-base font-medium text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink"
                >
                  {bulletin.related_watch.brand} {bulletin.related_watch.model}
                </Link>
                <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.15em] text-ink-muted">
                  REF. {bulletin.related_watch.reference_number}
                </p>
              </aside>
            )}

            <footer className="mt-12 border-t border-hairline pt-5 sm:mt-14">
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-muted">
                END OF BULLETIN — VOL. I
              </p>
              <Link
                to="/bulletin"
                className="mt-3 inline-block text-[10px] font-mono uppercase tracking-[0.2em] text-ink underline underline-offset-4"
              >
                Return to the Bulletin
              </Link>
            </footer>
          </article>
        )}
      </Container>
    </div>
  )
}
