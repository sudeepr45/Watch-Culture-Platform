import { useEffect, useState } from 'react'
import Container from '../components/common/Container'
import Button from '../components/common/Button'
import { Link } from '../router'
import { useRouter } from '../router/useRouter'
import { fetchWatchBySlug } from '../services/watchService'
import type { Watch } from '../types/watch'

interface WatchDetailPageProps {
  slug: string
}

export default function WatchDetailPage({ slug }: WatchDetailPageProps) {
  const [watch, setWatch] = useState<Watch | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { navigate } = useRouter()

  useEffect(() => {
    let isMounted = true

    const loadWatch = async () => {
      setLoading(true)
      setError(null)
      const result = await fetchWatchBySlug(slug)
      if (!isMounted) return

      if (result.error) {
        setError(result.error.message)
      } else if (!result.data) {
        setError('Watch record not found in the index.')
      } else {
        setWatch(result.data)
      }
      setLoading(false)
    }

    loadWatch()

    return () => {
      isMounted = false
    }
  }, [slug])

  if (loading) {
    return (
      <div className="py-20 sm:py-32">
        <Container>
          <div className="border border-hairline bg-warm-surface/30 p-16 text-center max-w-2xl mx-auto">
            <div className="w-10 h-10 mx-auto mb-6 flex items-center justify-center border border-hairline bg-warm-white">
              <svg
                className="w-5 h-5 text-gold animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
              </svg>
            </div>
            <h2 className="font-display text-2xl font-normal uppercase tracking-tight text-ink">
              Loading Watch Profile
            </h2>
            <p className="mt-2 text-xs font-mono tracking-widest text-ink-muted uppercase">
              QUERYING SUPABASE SPECIFICATIONS...
            </p>
          </div>
        </Container>
      </div>
    )
  }

  if (error || !watch) {
    return (
      <div className="py-20 sm:py-32">
        <Container>
          <div className="border border-hairline bg-warm-surface/40 p-12 sm:p-16 text-center max-w-2xl mx-auto">
            <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center border border-hairline bg-warm-white">
              <svg
                className="w-5 h-5 text-ink-secondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-normal uppercase tracking-tight text-ink">
              Profile Unavailable
            </h2>
            <p className="mt-3 text-sm text-ink-secondary font-light">
              {error || 'The requested watch record does not exist in the central database.'}
            </p>
            <div className="mt-8">
              <Button variant="secondary" size="sm" onClick={() => navigate('/watches')}>
                &larr; BACK TO WATCH INDEX
              </Button>
            </div>
          </div>
        </Container>
      </div>
    )
  }

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        {/* Navigation Breadcrumb */}
        <div className="mb-8 sm:mb-12">
          <Link
            to="/watches"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-ink-secondary hover:text-ink transition-colors"
          >
            &larr; <span>BACK TO WATCH INDEX</span>
          </Link>
        </div>

        {/* Editorial Profile Header */}
        <div className="border-b border-hairline pb-8 mb-12 sm:mb-16 grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          <div className="lg:col-span-8">
            <div className="flex items-center gap-3 mb-3 text-[11px] font-mono uppercase tracking-[0.25em] text-ink-secondary">
              <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden="true" />
              <span>{watch.brand}</span>
              <span>&bull;</span>
              <span>REF. {watch.reference_number}</span>
              {watch.release_year && (
                <>
                  <span>&bull;</span>
                  <span>{watch.release_year}</span>
                </>
              )}
            </div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-ink uppercase">
              {watch.model}
            </h1>
          </div>

          <div className="lg:col-span-4 lg:text-right">
            <div className="text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase">
              MSRP ESTIMATE
            </div>
            <div className="mt-1 font-display text-2xl sm:text-3xl font-normal text-ink">
              {watch.price !== null
                ? `$${watch.price.toLocaleString()} ${watch.currency}`
                : 'PRICE UPON REQUEST'}
            </div>
            {watch.category && (
              <div className="mt-2 text-xs font-mono tracking-wider text-ink-secondary uppercase">
                CATEGORY // {watch.category}
              </div>
            )}
          </div>
        </div>

        {/* Profile Content: Large Image & Technical Plate */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Dominant Watch Photography (7 cols) */}
          <div className="lg:col-span-7">
            <div className="relative border border-hairline bg-warm-surface overflow-hidden">
              <div className="aspect-[4/3] sm:aspect-[16/11] w-full">
                {watch.image_url ? (
                  <img
                    src={watch.image_url}
                    alt={`${watch.brand} ${watch.model}`}
                    className="h-full w-full object-cover object-center"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs font-mono text-ink-muted uppercase tracking-widest">
                    ARCHIVAL PHOTOGRAPHY PENDING
                  </div>
                )}
              </div>

              {/* Technical Specimen Plate */}
              <div className="p-4 border-t border-hairline bg-warm-white flex items-center justify-between text-[10px] font-mono tracking-[0.18em] uppercase text-ink">
                <span>SPECIMEN ID // {watch.slug}</span>
                <span className="text-gold font-semibold">DATABASE SOURCE RECORD</span>
              </div>
            </div>

            {/* Editorial Description */}
            {watch.description && (
              <div className="mt-8 sm:mt-10 p-6 sm:p-8 border border-hairline bg-warm-surface/20">
                <div className="text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-3">
                  EDITORIAL OVERVIEW
                </div>
                <p className="text-base sm:text-lg text-ink-secondary font-light leading-relaxed">
                  {watch.description}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Full Technical Specification Architecture (5 cols) */}
          <div className="lg:col-span-5">
            <div className="border border-hairline bg-warm-surface/30 p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-hairline pb-4 mb-6">
                <span className="font-mono text-xs uppercase tracking-[0.2em] font-semibold text-ink">
                  TECHNICAL DOSSIER
                </span>
                <span className="text-[10px] font-mono tracking-[0.16em] text-ink-muted">
                  VERIFIED SPECS
                </span>
              </div>

              <dl className="space-y-4 text-xs font-mono">
                {/* Movement Type */}
                <div className="flex items-baseline justify-between border-b border-hairline/60 pb-2">
                  <dt className="text-ink-muted uppercase tracking-wider">Movement Type</dt>
                  <dd className="text-ink font-medium tracking-wide">
                    {watch.movement_type || '—'}
                  </dd>
                </div>

                {/* Calibre */}
                <div className="flex items-baseline justify-between border-b border-hairline/60 pb-2">
                  <dt className="text-ink-muted uppercase tracking-wider">Calibre</dt>
                  <dd className="text-ink font-medium tracking-wide">
                    {watch.calibre || watch.movement_name || '—'}
                  </dd>
                </div>

                {/* Power Reserve */}
                <div className="flex items-baseline justify-between border-b border-hairline/60 pb-2">
                  <dt className="text-ink-muted uppercase tracking-wider">Power Reserve</dt>
                  <dd className="text-ink font-medium tracking-wide">
                    {watch.power_reserve_hours ? `${watch.power_reserve_hours} Hours` : '—'}
                  </dd>
                </div>

                {/* Case Diameter */}
                <div className="flex items-baseline justify-between border-b border-hairline/60 pb-2">
                  <dt className="text-ink-muted uppercase tracking-wider">Case Diameter</dt>
                  <dd className="text-ink font-medium tracking-wide">
                    {watch.case_diameter_mm ? `${watch.case_diameter_mm} mm` : '—'}
                  </dd>
                </div>

                {/* Case Thickness */}
                <div className="flex items-baseline justify-between border-b border-hairline/60 pb-2">
                  <dt className="text-ink-muted uppercase tracking-wider">Thickness</dt>
                  <dd className="text-ink font-medium tracking-wide">
                    {watch.case_thickness_mm ? `${watch.case_thickness_mm} mm` : '—'}
                  </dd>
                </div>

                {/* Lug-to-Lug */}
                <div className="flex items-baseline justify-between border-b border-hairline/60 pb-2">
                  <dt className="text-ink-muted uppercase tracking-wider">Lug-to-Lug</dt>
                  <dd className="text-ink font-medium tracking-wide">
                    {watch.lug_to_lug_mm ? `${watch.lug_to_lug_mm} mm` : '—'}
                  </dd>
                </div>

                {/* Case Material */}
                <div className="flex items-baseline justify-between border-b border-hairline/60 pb-2">
                  <dt className="text-ink-muted uppercase tracking-wider">Case Material</dt>
                  <dd className="text-ink font-medium tracking-wide text-right">
                    {watch.case_material || '—'}
                  </dd>
                </div>

                {/* Crystal */}
                <div className="flex items-baseline justify-between border-b border-hairline/60 pb-2">
                  <dt className="text-ink-muted uppercase tracking-wider">Crystal</dt>
                  <dd className="text-ink font-medium tracking-wide text-right">
                    {watch.crystal || '—'}
                  </dd>
                </div>

                {/* Water Resistance */}
                <div className="flex items-baseline justify-between border-b border-hairline/60 pb-2">
                  <dt className="text-ink-muted uppercase tracking-wider">Water Resistance</dt>
                  <dd className="text-ink font-medium tracking-wide">
                    {watch.water_resistance_m ? `${watch.water_resistance_m} m` : '—'}
                  </dd>
                </div>

                {/* Bracelet / Strap */}
                <div className="flex items-baseline justify-between border-b border-hairline/60 pb-2">
                  <dt className="text-ink-muted uppercase tracking-wider">Bracelet / Strap</dt>
                  <dd className="text-ink font-medium tracking-wide text-right">
                    {watch.bracelet_or_strap || '—'}
                  </dd>
                </div>

                {/* Style */}
                <div className="flex items-baseline justify-between pt-1">
                  <dt className="text-ink-muted uppercase tracking-wider">Style</dt>
                  <dd className="text-ink font-medium tracking-wide">
                    {watch.style || '—'}
                  </dd>
                </div>
              </dl>

              {/* Action Trigger for future Battle / Collection */}
              <div className="mt-8 pt-6 border-t border-hairline flex flex-col gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/battles?w1=${watch.slug}`)}
                  className="w-full"
                >
                  COMPARE IN WATCH BATTLE &rarr;
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
