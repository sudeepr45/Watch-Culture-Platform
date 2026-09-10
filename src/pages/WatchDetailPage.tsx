import { useEffect, useState, useMemo } from 'react'
import Container from '../components/common/Container'
import Button from '../components/common/Button'
import WatchImage from '../components/common/WatchImage'
import { Link } from '../router'
import { useRouter } from '../router/useRouter'
import { useAuth } from '../context/useAuth'
import { fetchWatchBySlug, fetchWatches } from '../services/watchService'
import {
  isWatchInCollection,
  addWatchToCollection,
  removeWatchFromCollection,
} from '../services/collectionService'
import { fetchStoriesByWatchId } from '../services/storyService'
import type { Watch } from '../types/watch'
import type { StoryWithAuthorAndWatch } from '../types/story'

interface WatchDetailPageProps {
  slug: string
}

export default function WatchDetailPage({ slug }: WatchDetailPageProps) {
  const [watch, setWatch] = useState<Watch | null>(null)
  const [relatedWatches, setRelatedWatches] = useState<Watch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inCollection, setInCollection] = useState(false)
  const [checkingCollection, setCheckingCollection] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [communityStories, setCommunityStories] = useState<StoryWithAuthorAndWatch[]>([])
  const [storiesLoading, setStoriesLoading] = useState(true)
  const [storiesError, setStoriesError] = useState<string | null>(null)
  const { user, isAuthenticated } = useAuth()
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
        setStoriesLoading(true)
        setStoriesError(null)

        // Query genuine community dispatches referencing this specimen
        fetchStoriesByWatchId(result.data.id).then((storiesResult) => {
          if (!isMounted) return
          if (storiesResult.error) {
            setStoriesError('Unable to load community stories for this timepiece.')
          } else {
            setCommunityStories(storiesResult.data || [])
          }
          setStoriesLoading(false)
        }).catch(() => {
          if (!isMounted) return
          setStoriesError('Unable to load community stories for this timepiece.')
          setStoriesLoading(false)
        })

        // Query all watches from repository for genuine archival cross-references
        fetchWatches().then((allWatchesResult) => {
          if (!isMounted || !allWatchesResult.data) return
          setRelatedWatches(allWatchesResult.data)
        })
      }
      setLoading(false)
    }

    loadWatch()

    return () => {
      isMounted = false
    }
  }, [slug])

  // Genuine Archival Cross-References derived strictly from real repository data
  const sameBrandWatches = useMemo(() => {
    if (!watch || !relatedWatches.length) return []
    return relatedWatches.filter(
      (w) => w.id !== watch.id && w.brand.toLowerCase() === watch.brand.toLowerCase()
    )
  }, [watch, relatedWatches])

  const sameCategoryWatches = useMemo(() => {
    const currentCategory = watch?.category
    if (!watch || !currentCategory || !relatedWatches.length) return []
    return relatedWatches.filter(
      (w) =>
        w.id !== watch.id &&
        w.brand.toLowerCase() !== watch.brand.toLowerCase() &&
        w.category &&
        w.category.toLowerCase() === currentCategory.toLowerCase()
    )
  }, [watch, relatedWatches])

  const sameEraWatches = useMemo(() => {
    const currentYear = watch?.release_year
    if (!watch || !currentYear || !relatedWatches.length) return []
    return relatedWatches.filter(
      (w) =>
        w.id !== watch.id &&
        w.brand.toLowerCase() !== watch.brand.toLowerCase() &&
        w.category !== watch.category &&
        w.release_year &&
        Math.abs(w.release_year - currentYear) <= 2
    )
  }, [watch, relatedWatches])

  // Check if current watch is in the collector's wrist collection
  useEffect(() => {
    let isMounted = true

    if (watch?.id && user?.id) {
      isWatchInCollection(user.id, watch.id).then((result) => {
        if (!isMounted) return
        setInCollection(result.inCollection)
        setCheckingCollection(false)
      })
    }

    return () => {
      isMounted = false
    }
  }, [watch?.id, user?.id])

  const handleAddToCollection = async () => {
    if (!isAuthenticated || !user) {
      navigate('/login')
      return
    }

    if (!watch || inCollection || actionLoading) return

    setActionLoading(true)
    setActionError(null)

    const result = await addWatchToCollection(user.id, watch.id)
    setActionLoading(false)

    if (result.success) {
      setInCollection(true)
    } else {
      setActionError(result.error || 'Failed to add watch to your wrist.')
    }
  }

  const handleRemoveFromCollection = async () => {
    if (!user || !watch || actionLoading) return

    setActionLoading(true)
    setActionError(null)

    const result = await removeWatchFromCollection(user.id, watch.id)
    setActionLoading(false)

    if (result.success) {
      setInCollection(false)
    } else {
      setActionError(result.error || 'Failed to remove watch from your wrist.')
    }
  }

  if (loading) {
    return (
      <div className="py-20 sm:py-32">
        <Container>
          <div className="border border-hairline bg-warm-surface/30 p-16 text-center max-w-2xl mx-auto">
            <div className="w-10 h-10 mx-auto mb-6 flex items-center justify-center border border-hairline bg-warm-white">
              <svg
                className="w-5 h-5 text-steel animate-spin"
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
        <div className="mb-8 sm:mb-12 flex items-center justify-between">
          <Link
            to="/watches"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-ink-secondary hover:text-ink transition-colors"
          >
            &larr; <span>BACK TO ARCHIVE INDEX</span>
          </Link>
          <span className="text-[10px] font-mono tracking-widest text-ink-muted uppercase hidden sm:inline-block">
            SPECIMEN RECORD // {watch.slug}
          </span>
        </div>

        {/* Archival Specimen Dossier Masthead */}
        <div className="border-b border-hairline pb-8 mb-10 sm:mb-14">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-hairline/60">
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
                <span>ARCHIVAL DOSSIER</span>
                <span>&bull;</span>
                <span className="text-ink font-semibold">{watch.brand}</span>
                <span>&bull;</span>
                <span>REF. {watch.reference_number}</span>
                {watch.release_year && (
                  <>
                    <span>&bull;</span>
                    <span>CIRCA {watch.release_year}</span>
                  </>
                )}
              </div>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-ink uppercase">
                {watch.model}
              </h1>
            </div>

            {/* Archival Ledger Metadata (No leading price) */}
            <div className="lg:text-right flex flex-col items-start lg:items-end gap-1.5 font-mono text-[10px] tracking-wider uppercase text-ink-muted">
              <div className="text-ink font-semibold">
                CATALOG ENTRY // {watch.slug}
              </div>
              <div>
                CLASSIFICATION: <span className="text-ink-secondary font-medium">{watch.category || 'ARCHIVE SPECIMEN'}</span>
              </div>
              {communityStories.length > 0 ? (
                <a
                  href="#owner-dispatches"
                  className="text-ink hover:text-neutral-700 underline tracking-wider cursor-pointer"
                >
                  APPEARS IN {communityStories.length} {communityStories.length === 1 ? 'COMMUNITY DISPATCH' : 'COMMUNITY DISPATCHES'} &darr;
                </a>
              ) : (
                <div>0 DISPATCH CITATIONS</div>
              )}
              {watch.updated_at && (
                <div className="text-[9px] text-ink-muted">
                  RECORD UPDATED: {new Date(watch.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </div>
              )}
            </div>
          </div>

          {/* Essential Specification Telemetry Strip */}
          <div className="pt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="border-r last:border-r-0 border-hairline/60 pr-4">
              <span className="text-[9px] uppercase tracking-[0.2em] text-ink-muted block mb-1">
                CALIBRE
              </span>
              <span className="text-ink font-medium tracking-wide block truncate" title={watch.calibre || watch.movement_name || watch.movement_type || '—'}>
                {watch.calibre || watch.movement_name || watch.movement_type || '—'}
              </span>
            </div>

            <div className="border-r last:border-r-0 border-hairline/60 pr-4">
              <span className="text-[9px] uppercase tracking-[0.2em] text-ink-muted block mb-1">
                CASE ARCHITECTURE
              </span>
              <span className="text-ink font-medium tracking-wide block">
                {watch.case_diameter_mm ? `${watch.case_diameter_mm}mm` : '—'}
                {watch.case_thickness_mm ? ` × ${watch.case_thickness_mm}mm` : ''}
              </span>
            </div>

            <div className="border-r last:border-r-0 border-hairline/60 pr-4">
              <span className="text-[9px] uppercase tracking-[0.2em] text-ink-muted block mb-1">
                CASE MATERIAL
              </span>
              <span className="text-ink font-medium tracking-wide block truncate" title={watch.case_material || '—'}>
                {watch.case_material || '—'}
              </span>
            </div>

            <div>
              <span className="text-[9px] uppercase tracking-[0.2em] text-ink-muted block mb-1">
                WATER DEPTH
              </span>
              <span className="text-ink font-medium tracking-wide block">
                {watch.water_resistance_m ? `${watch.water_resistance_m}m (${Math.round(watch.water_resistance_m / 10)} bar)` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Content: Large Image & Technical Plate */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Dominant Watch Photography (7 cols) */}
          <div className="lg:col-span-7">
            <div className="relative border border-hairline bg-warm-surface overflow-hidden">
              <div className="w-full">
                <WatchImage
                  src={watch.image_url}
                  alt={`${watch.brand} ${watch.model}`}
                  aspectRatio="aspect-[4/3] sm:aspect-[16/11]"
                  loading="eager"
                />
              </div>

              {/* Technical Specimen Plate */}
              <div className="p-4 border-t border-hairline bg-warm-white flex items-center justify-between text-[10px] font-mono tracking-[0.18em] uppercase text-ink">
                <span>SPECIMEN ARCHIVE // {watch.slug}</span>
                <span className="text-steel font-semibold">RECORD ID: {watch.id.substring(0, 8)}</span>
              </div>
            </div>

            {/* Editorial Description */}
            {watch.description && (
              <div className="mt-8 sm:mt-10 p-6 sm:p-8 border border-hairline bg-warm-surface/20">
                <div className="text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-3">
                  ARCHIVAL COMMENTARY & HISTORICAL SIGNIFICANCE
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
                <div className="flex items-baseline justify-between border-b border-hairline/60 pb-2">
                  <dt className="text-ink-muted uppercase tracking-wider">Style</dt>
                  <dd className="text-ink font-medium tracking-wide">
                    {watch.style || '—'}
                  </dd>
                </div>

                {/* Published Retail */}
                <div className="flex items-baseline justify-between border-b border-hairline/60 pb-2">
                  <dt className="text-ink-muted uppercase tracking-wider">Published Retail</dt>
                  <dd className="text-ink font-medium tracking-wide">
                    {watch.price !== null
                      ? `$${watch.price.toLocaleString()} ${watch.currency}`
                      : 'Price Upon Request'}
                  </dd>
                </div>

                {/* Database Record ID */}
                <div className="flex items-baseline justify-between pt-1 text-[10px]">
                  <dt className="text-ink-muted uppercase tracking-wider">Record UID</dt>
                  <dd className="text-ink-muted font-mono tracking-widest">
                    {watch.id.substring(0, 13)}...
                  </dd>
                </div>
              </dl>

              {/* Action Triggers: My Wrist Collection, Watch Battle, & Worth It */}
              <div className="mt-8 pt-6 border-t border-hairline flex flex-col gap-3">
                {/* Collection Action */}
                {!isAuthenticated ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate('/login')}
                    className="w-full"
                  >
                    ADD TO MY WRIST &rarr;
                  </Button>
                ) : inCollection ? (
                  <div className="flex flex-col gap-2">
                    <div className="w-full py-2.5 px-4 bg-warm-surface border border-hairline flex items-center justify-between text-xs font-mono text-ink">
                      <span className="flex items-center gap-2 text-ink font-semibold">
                        <span className="text-steel font-bold">&#10003;</span> IN MY WRIST
                      </span>
                      <span className="text-[10px] text-ink-muted uppercase tracking-widest">
                        CATALOGED
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleRemoveFromCollection}
                      className="text-[11px] font-mono uppercase tracking-wider text-ink-muted hover:text-rose-800 transition-colors py-1 text-center cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading ? 'UPDATING WRIST...' : 'REMOVE FROM MY WRIST'}
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={actionLoading || checkingCollection}
                    onClick={handleAddToCollection}
                    className="w-full"
                  >
                    {actionLoading ? 'ADDING TO WRIST...' : 'ADD TO MY WRIST'}
                  </Button>
                )}

                {actionError && (
                  <div className="text-[11px] font-mono text-rose-800 bg-rose-50 border border-rose-200 p-2 text-center">
                    {actionError}
                  </div>
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/battles?w1=${watch.slug}`)}
                  className="w-full"
                >
                  AUDIT IN WATCH BATTLE &rarr;
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/case?slug=${watch.slug}`)}
                  className="w-full"
                >
                  EXAMINE IN WORTH IT? &rarr;
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Genuine Archival Cross-References */}
        {(sameBrandWatches.length > 0 || sameCategoryWatches.length > 0 || sameEraWatches.length > 0) && (
          <div className="border-t border-hairline mt-14 sm:mt-20 pt-10 sm:pt-14">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
                  <span>ARCHIVAL CROSS-REFERENCES // CONTEXTUAL SPECIMENS</span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-normal uppercase tracking-tight text-ink">
                  Related Archive Records
                </h2>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted hidden sm:inline-block">
                VERIFIED ARCHIVAL AFFINITIES
              </span>
            </div>

            <div className="space-y-8">
              {/* Same Maison / Brand */}
              {sameBrandWatches.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-secondary mb-3 pb-1 border-b border-hairline/60 flex items-center justify-between">
                    <span>SAME MAISON // {watch.brand.toUpperCase()}</span>
                    <span>{sameBrandWatches.length} {sameBrandWatches.length === 1 ? 'SPECIMEN' : 'SPECIMENS'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sameBrandWatches.slice(0, 3).map((rel) => (
                      <Link
                        key={rel.id}
                        to={`/watches/${rel.slug}`}
                        className="group border border-hairline bg-warm-surface/20 p-4 hover:border-ink hover:bg-warm-surface/50 transition-colors flex items-center gap-4"
                      >
                        <div className="w-16 h-16 bg-warm-surface border border-hairline flex-shrink-0 overflow-hidden">
                          <WatchImage
                            src={rel.image_url}
                            alt={`${rel.brand} ${rel.model}`}
                            aspectRatio="aspect-square"
                            compact
                          />
                        </div>
                        <div className="min-w-0 flex-grow">
                          <div className="text-[9px] font-mono uppercase tracking-wider text-ink-secondary">
                            REF. {rel.reference_number}
                          </div>
                          <div className="font-display text-sm uppercase text-ink group-hover:text-neutral-700 truncate">
                            {rel.model}
                          </div>
                          <div className="text-[10px] font-mono text-ink-muted truncate mt-0.5">
                            {rel.calibre || rel.movement_type || '—'}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Same Archive Category */}
              {sameCategoryWatches.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-secondary mb-3 pb-1 border-b border-hairline/60 flex items-center justify-between">
                    <span>SEE ALSO // {watch.category ? watch.category.toUpperCase() : 'ARCHIVE'} CLASSIFICATION</span>
                    <span>{sameCategoryWatches.length} {sameCategoryWatches.length === 1 ? 'SPECIMEN' : 'SPECIMENS'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sameCategoryWatches.slice(0, 3).map((rel) => (
                      <Link
                        key={rel.id}
                        to={`/watches/${rel.slug}`}
                        className="group border border-hairline bg-warm-surface/20 p-4 hover:border-ink hover:bg-warm-surface/50 transition-colors flex items-center gap-4"
                      >
                        <div className="w-16 h-16 bg-warm-surface border border-hairline flex-shrink-0 overflow-hidden">
                          <WatchImage
                            src={rel.image_url}
                            alt={`${rel.brand} ${rel.model}`}
                            aspectRatio="aspect-square"
                            compact
                          />
                        </div>
                        <div className="min-w-0 flex-grow">
                          <div className="text-[9px] font-mono uppercase tracking-wider text-ink-secondary">
                            {rel.brand} &bull; REF. {rel.reference_number}
                          </div>
                          <div className="font-display text-sm uppercase text-ink group-hover:text-neutral-700 truncate">
                            {rel.model}
                          </div>
                          <div className="text-[10px] font-mono text-ink-muted truncate mt-0.5">
                            {rel.case_diameter_mm ? `${rel.case_diameter_mm}mm` : ''} &bull; {rel.movement_type || '—'}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Same Era */}
              {sameEraWatches.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-ink-secondary mb-3 pb-1 border-b border-hairline/60 flex items-center justify-between">
                    <span>CONTEMPORARY SPECIMENS // CIRCA {watch.release_year}</span>
                    <span>{sameEraWatches.length} {sameEraWatches.length === 1 ? 'SPECIMEN' : 'SPECIMENS'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sameEraWatches.slice(0, 3).map((rel) => (
                      <Link
                        key={rel.id}
                        to={`/watches/${rel.slug}`}
                        className="group border border-hairline bg-warm-surface/20 p-4 hover:border-ink hover:bg-warm-surface/50 transition-colors flex items-center gap-4"
                      >
                        <div className="w-16 h-16 bg-warm-surface border border-hairline flex-shrink-0 overflow-hidden">
                          <WatchImage
                            src={rel.image_url}
                            alt={`${rel.brand} ${rel.model}`}
                            aspectRatio="aspect-square"
                            compact
                          />
                        </div>
                        <div className="min-w-0 flex-grow">
                          <div className="text-[9px] font-mono uppercase tracking-wider text-ink-secondary">
                            {rel.brand} &bull; CIRCA {rel.release_year}
                          </div>
                          <div className="font-display text-sm uppercase text-ink group-hover:text-neutral-700 truncate">
                            {rel.model}
                          </div>
                          <div className="text-[10px] font-mono text-ink-muted truncate mt-0.5">
                            REF. {rel.reference_number}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Community Stories / Field Reports Section */}
        <div id="owner-dispatches" className="border-t border-hairline mt-16 sm:mt-24 pt-12 sm:pt-16">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
                <span>COMMUNITY STORIES // FIELD REPORTS</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-normal uppercase tracking-tight text-ink">
                Owner Dispatches
              </h2>
            </div>
            <p className="text-xs font-mono text-ink-muted">
              Stories from collectors who live with this watch.
            </p>
          </div>

          {storiesLoading ? (
            <div className="p-12 border border-hairline bg-warm-surface/20 text-center">
              <span className="font-mono text-xs text-ink-muted uppercase tracking-[0.2em] animate-pulse">
                QUERYING COMMUNITY DISPATCHES...
              </span>
            </div>
          ) : storiesError ? (
            <div className="p-6 border border-hairline bg-warm-surface/30 text-center">
              <p className="text-xs font-mono text-ink-muted uppercase tracking-wider">
                {storiesError}
              </p>
            </div>
          ) : communityStories.length === 0 ? (
            <div className="border border-hairline p-8 sm:p-12 bg-warm-surface/10 text-center">
              <div className="font-mono text-[10px] tracking-[0.2em] text-ink-muted uppercase mb-2">
                COLLECTOR ARCHIVE // UNANNOTATED REFERENCE
              </div>
              <p className="text-base font-sans font-light text-ink-secondary max-w-md mx-auto mb-4">
                No collector stories have been linked to this watch yet.
              </p>
              <p className="text-xs font-mono text-ink-muted max-w-md mx-auto mb-6">
                Own this reference? Document your personal provenance, wrist reflections, and acquisition story for the archive.
              </p>
              <Link
                to="/stories/new"
                className="inline-flex items-center text-xs font-mono text-ink font-semibold hover:text-neutral-700 uppercase tracking-wider transition-colors"
              >
                RECORD YOUR STORY &rarr;
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {communityStories.map((story) => {
                const authorName = story.author.display_name || story.author.username
                const formattedDate = story.published_at
                  ? new Date(story.published_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'RECENT DISPATCH'

                return (
                  <Link
                    key={story.id}
                    to={`/stories/${story.slug}`}
                    className="group border border-hairline bg-warm-white flex flex-col justify-between hover:border-ink/60 transition-colors"
                  >
                    <div>
                      {story.photo_url ? (
                        <div className="aspect-[16/10] overflow-hidden bg-warm-surface border-b border-hairline">
                          <img
                            src={story.photo_url}
                            alt={story.title}
                            loading="lazy"
                            className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 transition-all duration-300"
                          />
                        </div>
                      ) : (
                        <div className="aspect-[16/10] flex items-center justify-center bg-warm-surface/40 border-b border-hairline text-[10px] font-mono tracking-widest text-ink-muted uppercase">
                          SPECIMEN PHOTO PENDING
                        </div>
                      )}

                      <div className="p-5 sm:p-6">
                        <div className="flex items-center justify-between text-[9px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-2">
                          <span className="truncate max-w-[70%]">
                            {story.personal_watch_brand} &bull; {story.personal_watch_model}
                          </span>
                          <span>{formattedDate}</span>
                        </div>

                        <h3 className="font-display text-xl uppercase tracking-tight text-ink group-hover:text-neutral-700 transition-colors duration-200 line-clamp-2 leading-snug">
                          {story.title}
                        </h3>

                        <p className="mt-2.5 text-xs sm:text-sm text-ink-secondary font-light leading-relaxed line-clamp-3">
                          {story.story_text}
                        </p>

                        <div className="mt-4 pt-3 border-t border-hairline/60 flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-ink-muted">
                          <span>BY {authorName}</span>
                          {((story.likes_count ?? 0) > 0 || (story.comments_count ?? 0) > 0) && (
                            <span>
                              {story.likes_count ?? 0}L &bull; {story.comments_count ?? 0}N
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 pt-0 mt-auto">
                      <span className="text-[11px] font-mono font-semibold text-ink group-hover:text-neutral-700 transition-colors duration-200 flex items-center gap-1 uppercase tracking-wider">
                        READ DISPATCH <span className="group-hover:translate-x-1 transition-transform duration-200 inline-block">&rarr;</span>
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </Container>
    </div>
  )
}
