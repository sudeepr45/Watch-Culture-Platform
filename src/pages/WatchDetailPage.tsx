import { useEffect, useState } from 'react'
import Container from '../components/common/Container'
import Button from '../components/common/Button'
import { Link } from '../router'
import { useRouter } from '../router/useRouter'
import { useAuth } from '../context/useAuth'
import { fetchWatchBySlug } from '../services/watchService'
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
      }
      setLoading(false)
    }

    loadWatch()

    return () => {
      isMounted = false
    }
  }, [slug])

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
            <div className="flex items-center gap-3 mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
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
                <span className="text-steel font-semibold">DATABASE SOURCE RECORD</span>
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

              {/* Action Triggers: My Wrist Collection & Watch Battle */}
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
                  COMPARE IN WATCH BATTLE &rarr;
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Community Stories / Field Reports Section */}
        <div className="border-t border-hairline mt-16 sm:mt-24 pt-12 sm:pt-16">
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
              <p className="text-base font-sans font-light text-ink-secondary italic max-w-md mx-auto mb-4">
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
                            className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
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
