import { useEffect, useState, type FormEvent } from 'react'
import Container from '../components/common/Container'
import { BulletinCategoryDescription, BulletinCategoryLabels } from '../components/bulletin/BulletinCategorySelector'
import Button from '../components/common/Button'
import WatchImage from '../components/common/WatchImage'
import { Link } from '../router'
import { useRouter } from '../router/useRouter'
import { useAuth } from '../context/useAuth'
import Hero from '../components/hero/Hero'
import PhilosophyStrip from '../components/home/PhilosophyStrip'
import PlateHero from '../components/plate/PlateHero'
import { fetchPublishedWatches } from '../services/watchService'
import { fetchPublishedStories } from '../services/storyService'
import { getPublishedBulletins } from '../services/bulletinService'
import { fetchUserCollection } from '../services/collectionService'
import { getAllTopics } from '../data/watch101'
import { longDate } from '../lib/plate'
import type { Bulletin } from '../services/bulletinService'
import type { StoryWithAuthorAndWatch } from '../types/story'
import type { Watch } from '../types/watch'
import type { UserWatchWithWatch } from '../types/collection'
import type { Watch101Topic } from '../types/watch101'
import { isSafeWatchImageUrl } from '../utils/imageSafety'

const BULLETIN_FRESH_DAYS = 14
const DAY_IN_MILLISECONDS = 86_400_000

function getLocalDayKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return year + '-' + month + '-' + day
}

function selectWatchOfTheDay(watches: Watch[], dayKey: string): Watch | null {
  if (watches.length === 0) return null
  const [year, month, day] = dayKey.split('-').map(Number)
  const dayIndex = Math.floor(Date.UTC(year, month - 1, day) / DAY_IN_MILLISECONDS)
  const orderedWatches = [...watches].sort((a, b) => a.id.localeCompare(b.id))
  const watchIndex = ((dayIndex % orderedWatches.length) + orderedWatches.length) % orderedWatches.length
  return orderedWatches[watchIndex]
}

function utcDayNumber(value: string | Date): number | null {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / DAY_IN_MILLISECONDS
}

/** Uses UTC calendar dates like the existing Bulletin date display; publication day 14 is included. */
function isBulletinFreshForDate(
  bulletins: readonly Pick<Bulletin, 'published_at'>[] | null,
  today = new Date(),
): boolean {
  const newestPublishedAt = bulletins?.[0]?.published_at
  if (!newestPublishedAt) return false
  const publicationDay = utcDayNumber(newestPublishedAt)
  const currentDay = utcDayNumber(today)
  if (publicationDay === null || currentDay === null) return false
  const ageInDays = currentDay - publicationDay
  return ageInDays >= 0 && ageInDays <= BULLETIN_FRESH_DAYS
}

function getBulletinSummary(body: string): string {
  const plainText = body
    .replace(/<[^>]*>/g, ' ')
    .replace(/!?(?:\[([^\]]*)\])\([^)]*\)/g, '$1')
    .replace(/[#*_>~]/g, '')
    .replace(/\u0060/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  if (plainText.length <= 140) return plainText
  const excerpt = plainText.slice(0, 139)
  const lastSpace = excerpt.lastIndexOf(' ')
  return excerpt.slice(0, lastSpace > 95 ? lastSpace : 139).trimEnd() + '…'
}

function formatBulletinDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date).toUpperCase()
}

function isValidPublishedDate(value: string | null): value is string {
  return Boolean(value && !Number.isNaN(new Date(value).getTime()))
}

function selectArchiveWatches(watches: Watch[]): Watch[] {
  const makerUpdatedAt = new Map<string, number>()
  const latestAddedByMaker = new Map<string, Watch>()

  for (const watch of watches) {
    if (watch.status !== 'published' || !watch.brand.trim()) continue
    const makerKey = watch.brand.trim().toLowerCase()
    const updatedAt = new Date(watch.updated_at).getTime()
    const createdAt = new Date(watch.created_at).getTime()
    const validUpdatedAt = Number.isNaN(updatedAt) ? Number.NEGATIVE_INFINITY : updatedAt
    const validCreatedAt = Number.isNaN(createdAt) ? Number.NEGATIVE_INFINITY : createdAt
    const currentMakerUpdate = makerUpdatedAt.get(makerKey) ?? Number.NEGATIVE_INFINITY
    const currentLatestAdded = latestAddedByMaker.get(makerKey)
    const currentCreatedAt = currentLatestAdded ? new Date(currentLatestAdded.created_at).getTime() : Number.NEGATIVE_INFINITY
    const validCurrentCreatedAt = Number.isNaN(currentCreatedAt) ? Number.NEGATIVE_INFINITY : currentCreatedAt

    makerUpdatedAt.set(makerKey, Math.max(currentMakerUpdate, validUpdatedAt))
    if (
      !currentLatestAdded ||
      validCreatedAt > validCurrentCreatedAt ||
      (validCreatedAt === validCurrentCreatedAt && watch.id.localeCompare(currentLatestAdded.id) < 0)
    ) {
      latestAddedByMaker.set(makerKey, watch)
    }
  }

  return [...makerUpdatedAt.entries()]
    .sort(([brandA, updatedA], [brandB, updatedB]) => updatedB - updatedA || brandA.localeCompare(brandB))
    .slice(0, 3)
    .map(([brand]) => latestAddedByMaker.get(brand))
    .filter((watch): watch is Watch => Boolean(watch))
}
function formatStoryDate(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getAvailableTopics(topics: Watch101Topic[]): Watch101Topic[] {
  return topics.filter((topic) => topic.slug.trim() && topic.title.trim() && topic.shortDescription.trim()).slice(0, 3)
}

export default function HomePage() {
  const { navigate } = useRouter()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [watches, setWatches] = useState<Watch[] | null>(null)
  const [bulletins, setBulletins] = useState<Bulletin[] | null>(null)
  const [stories, setStories] = useState<StoryWithAuthorAndWatch[] | null>(null)
  const [collectionState, setCollectionState] = useState<{
    userId: string
    items: UserWatchWithWatch[]
    error: string | null
  } | null>(null)
  const [hasWatchLoadError, setHasWatchLoadError] = useState(false)
  const [dayKey, setDayKey] = useState(() => getLocalDayKey())

  useEffect(() => {
    let isMounted = true
    fetchPublishedWatches().then((result) => {
      if (!isMounted) return
      setHasWatchLoadError(Boolean(result.error))
      setWatches(result.error ? [] : result.data || [])
    })
    getPublishedBulletins().then((result) => {
      if (isMounted) setBulletins(result.error ? null : result.data || [])
    })
    fetchPublishedStories().then((result) => {
      if (isMounted) setStories(result.error ? null : result.data || [])
    })
    return () => { isMounted = false }
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const currentDay = getLocalDayKey()
      setDayKey((previousDay) => previousDay === currentDay ? previousDay : currentDay)
    }, 60_000)
    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const userId = user?.id
    if (!userId) return
    let isMounted = true
    fetchUserCollection(userId).then((result) => {
      if (!isMounted) return
      setCollectionState({
        userId,
        items: result.error ? [] : result.data || [],
        error: result.error?.message ?? null,
      })
    }).catch((error: unknown) => {
      if (!isMounted) return
      setCollectionState({
        userId,
        items: [],
        error: error instanceof Error ? error.message : 'Unable to load your collection.',
      })
    })
    return () => { isMounted = false }
  }, [user?.id])

  const eligibleWatches = (watches || []).filter(
    (watch) => watch.status === 'published' && isSafeWatchImageUrl(watch.image_url),
  )
  const verifiedWatches = eligibleWatches.filter((watch) => watch.image_verification_status === 'verified')
  const spotlightWatch = selectWatchOfTheDay(
    verifiedWatches.length > 0 ? verifiedWatches : eligibleWatches,
    dayKey,
  )
  const archiveWatches = selectArchiveWatches(watches || [])
  const todayDate = longDate(dayKey)
  const visibleBulletins = (bulletins || []).filter((bulletin) =>
    bulletin.slug.trim() &&
    bulletin.title.trim() &&
    isValidPublishedDate(bulletin.published_at) &&
    getBulletinSummary(bulletin.body),
  ).slice(0, 4)
  const bulletinIsFresh = isBulletinFreshForDate(bulletins)
  const topics = getAvailableTopics(getAllTopics())
  const visibleCollection = user?.id && collectionState?.userId === user.id ? collectionState : null
  const collectionLoading = Boolean(user?.id) && !visibleCollection
  const latestCollectionWatch = visibleCollection?.items[0]

  const handleArchiveSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const query = String(formData.get('q') || '').trim()
    if (query) navigate('/search?q=' + encodeURIComponent(query))
  }

  const bulletinSection = visibleBulletins.length > 0 ? (
    <section aria-labelledby="home-bulletin-heading" className="border-b border-hairline bg-warm-surface/20 py-8 sm:py-10 lg:py-12">
      <Container>
        <div className="mb-5 flex flex-col gap-3 border-b border-hairline pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.18em] text-ink-muted">BULLETIN / LATEST</p>
            <h2 id="home-bulletin-heading" className="mt-2 font-display text-2xl font-normal tracking-tight text-ink sm:text-3xl">The Bulletin</h2>
          </div>
          <Link to="/bulletin" className="text-sm font-mono uppercase tracking-wider text-ink underline decoration-hairline underline-offset-4 hover:decoration-ink">
            All bulletins &rarr;
          </Link>
        </div>
        <ol>
          {visibleBulletins.map((bulletin) => (
            <li key={bulletin.id} className="border-b border-hairline py-4 first:pt-0 last:border-b-0 last:pb-0">
              <article>
                <h3 className="font-display text-lg font-medium leading-snug tracking-tight text-ink sm:text-xl">
                  <Link to={'/bulletin/' + bulletin.slug} className="underline-offset-4 hover:underline focus-visible:underline">{bulletin.title}</Link>
                </h3>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono uppercase tracking-[0.14em] text-ink-muted">
                  <span>BULLETIN NO. {String(bulletin.bulletin_number).padStart(3, '0')}</span>
                  <time dateTime={bulletin.published_at || undefined}>{formatBulletinDate(bulletin.published_at || '')}</time>
                  <BulletinCategoryLabels categories={bulletin.categories} />
                </div>
                <BulletinCategoryDescription categories={bulletin.categories} description={bulletin.something_else_description} />
                <p className="mt-1 line-clamp-1 max-w-3xl text-sm leading-relaxed text-ink-secondary">{getBulletinSummary(bulletin.body)}</p>
              </article>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  ) : null

  return (
    <div className="flex flex-col">
      <Hero />

      <section aria-labelledby="today-heading" className="border-b border-hairline bg-warm-surface/20 py-8 sm:py-10 lg:py-12">
        <Container>
          <div className="mb-5 border-b border-hairline pb-4">
            <p id="today-heading" className="text-xs font-mono uppercase tracking-[0.18em] text-ink-muted">TODAY · {todayDate}</p>
          </div>
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-8">
            <div aria-label="Plate of the day"><PlateHero /></div>
            <div className="border border-hairline bg-warm-white p-4 sm:p-5">
              <div className="mb-4 border-b border-hairline pb-3">
                <h2 className="font-display text-base font-semibold uppercase tracking-[0.08em] text-ink sm:text-lg">WATCH OF THE DAY</h2>
              </div>
              {watches === null ? (
                <p className="py-8 text-sm text-ink-secondary" role="status">Loading today&apos;s watch…</p>
              ) : hasWatchLoadError || !spotlightWatch ? (
                <p className="py-6 text-sm text-ink-secondary">
                  {hasWatchLoadError ? 'The watch archive is unavailable right now.' : 'No published watch with a usable image is available today.'}
                </p>
              ) : (
                <div>
                  <div className="relative overflow-hidden border border-hairline bg-warm-surface">
                    <WatchImage src={spotlightWatch.image_url} alt={spotlightWatch.brand + ' ' + spotlightWatch.model} aspectRatio="aspect-[4/3]" loading="eager" />
                    {spotlightWatch.category && <span className="absolute left-0 top-0 border-b border-r border-hairline bg-warm-white px-2 py-1 text-xs font-mono uppercase tracking-wider text-ink">{spotlightWatch.category}</span>}
                    {spotlightWatch.release_year && <span className="absolute right-0 top-0 border-b border-l border-hairline bg-warm-white px-2 py-1 text-xs font-mono tracking-wider text-ink-muted">CIRCA {spotlightWatch.release_year}</span>}
                  </div>
                  <div className="pt-4">
                    <p className="text-xs font-mono uppercase tracking-[0.16em] text-ink-secondary">{spotlightWatch.brand}</p>
                    <h3 className="mt-1 font-display text-2xl font-normal tracking-tight text-ink sm:text-3xl">{spotlightWatch.model}</h3>
                    <p className="mt-1 text-xs font-mono tracking-wider text-ink-muted">REF. {spotlightWatch.reference_number}</p>
                    {spotlightWatch.description && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-secondary">{spotlightWatch.description}</p>}
                    <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-hairline pt-3 text-xs font-mono">
                      <div><dt className="uppercase tracking-wider text-ink-muted">CALIBRE</dt><dd className="mt-1 truncate text-ink">{spotlightWatch.calibre || spotlightWatch.movement_name || spotlightWatch.movement_type || '—'}</dd></div>
                      <div><dt className="uppercase tracking-wider text-ink-muted">DIAMETER</dt><dd className="mt-1 text-ink">{spotlightWatch.case_diameter_mm ? spotlightWatch.case_diameter_mm + ' mm' : '—'}</dd></div>
                      <div><dt className="uppercase tracking-wider text-ink-muted">DEPTH</dt><dd className="mt-1 text-ink">{spotlightWatch.water_resistance_m ? spotlightWatch.water_resistance_m + ' m' : '—'}</dd></div>
                    </dl>
                    <div className="mt-4 border-t border-hairline pt-3">
                      <Button variant="primary" size="sm" onClick={() => navigate('/watches/' + spotlightWatch.slug)}>VIEW SPECIMEN DOSSIER &rarr;</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      {bulletinIsFresh && bulletinSection}

      <section aria-labelledby="home-stories-heading" className="border-b border-hairline bg-warm-white py-8 sm:py-10 lg:py-12">
        <Container>
          <div className="mb-5 flex flex-col gap-3 border-b border-hairline pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>

              <h2 id="home-stories-heading" className="font-display text-base font-semibold uppercase tracking-[0.08em] text-ink sm:text-lg">Latest stories</h2>
            </div>
            <Link to="/stories" className="text-sm font-mono uppercase tracking-wider text-ink underline decoration-hairline underline-offset-4 hover:decoration-ink">All stories &rarr;</Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(stories || []).slice(0, 3).map((story) => (
              <Link key={story.id} to={'/stories/' + story.slug} className="group flex flex-col border border-hairline bg-warm-white hover:border-ink">
                {story.photo_url && <div className="aspect-[4/3] overflow-hidden border-b border-hairline bg-warm-surface"><img src={story.photo_url} alt={story.title} loading="lazy" className="h-full w-full object-cover object-center" /></div>}
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-3 text-xs font-mono uppercase tracking-wider text-ink-muted">
                    <span className="min-w-0 truncate">{story.author.display_name || '@' + story.author.username}</span>
                    {formatStoryDate(story.published_at) && <time>{formatStoryDate(story.published_at)}</time>}
                  </div>
                  <h3 className="mt-3 font-display text-lg font-medium leading-snug tracking-tight text-ink group-hover:underline">{story.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-secondary">{story.story_text}</p>
                  <span className="mt-4 border-t border-hairline pt-3 text-xs font-mono uppercase tracking-wider text-ink">READ STORY &rarr;</span>
                </div>
              </Link>
            ))}
            <Link to="/stories/new" className="flex min-h-44 flex-col justify-between border border-hairline bg-warm-surface/30 p-5 hover:border-ink">
              <p className="text-xs font-mono uppercase tracking-[0.18em] text-ink-muted">CONTRIBUTE</p>
              <span className="font-display text-2xl text-ink">Add your story &rarr;</span>
            </Link>
          </div>
        </Container>
      </section>

      {!bulletinIsFresh && bulletinSection}

      <section aria-labelledby="home-archive-heading" className="border-b border-hairline bg-warm-surface/20 py-8 sm:py-10 lg:py-12">
        <Container>
          <div className="mb-5 flex flex-col gap-4 border-b border-hairline pb-4 lg:flex-row lg:items-end lg:justify-between">
            <div>

              <h2 id="home-archive-heading" className="font-display text-base font-semibold uppercase tracking-[0.08em] text-ink sm:text-lg">The Reference Archive</h2>
            </div>
            <form onSubmit={handleArchiveSearch} className="flex w-full max-w-md gap-2">
              <label htmlFor="home-archive-search" className="sr-only">Search the archive</label>
              <input id="home-archive-search" type="search" name="q" placeholder="Search watches and topics" className="min-w-0 flex-1 border border-hairline bg-warm-white px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus-visible:border-ink" />
              <Button type="submit" variant="secondary" size="sm">Search</Button>
            </form>
          </div>
          {archiveWatches.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {archiveWatches.map((watch) => (
                <Link key={watch.id} to={'/watches/' + watch.slug} className="group flex border border-hairline bg-warm-white hover:border-ink">
                  <div className="w-2/5 min-w-0 border-r border-hairline">
                    <WatchImage src={watch.image_url} alt={watch.brand + ' ' + watch.model} aspectRatio="aspect-[4/3] h-full" compact />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center p-3">
                    <p className="text-xs font-mono uppercase tracking-wider text-ink-secondary">{watch.brand}</p>
                    <h3 className="mt-1 font-display text-lg leading-snug text-ink group-hover:underline">{watch.model}</h3>
                    <p className="mt-1 text-xs font-mono text-ink-muted">REF. {watch.reference_number}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-secondary" role="status">{watches === null ? 'Loading the archive…' : 'No published archive records are available.'}</p>
          )}
          <div className="mt-5 flex flex-col gap-3 border-t border-hairline pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Link to="/watches" className="text-sm font-mono uppercase tracking-wider text-ink underline decoration-hairline underline-offset-4 hover:decoration-ink">View all specimens &rarr;</Link>
            <p className="text-sm text-ink-secondary">Selected from the most recently updated available makers.</p>
          </div>
        </Container>
      </section>

      <section aria-labelledby="home-watch101-heading" className="border-b border-hairline bg-warm-white py-8 sm:py-10 lg:py-12">
        <Container>
          <div className="mb-5 flex flex-col gap-3 border-b border-hairline pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>

              <h2 id="home-watch101-heading" className="font-display text-base font-semibold uppercase tracking-[0.08em] text-ink sm:text-lg">Watch 101</h2>
            </div>
            <Link to="/watch-101" className="text-sm font-mono uppercase tracking-wider text-ink underline decoration-hairline underline-offset-4 hover:decoration-ink">All topics &rarr;</Link>
          </div>
          {topics.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {topics.map((topic) => (
                <Link key={topic.id} to={'/watch-101/' + topic.slug} className="border border-hairline p-4 hover:border-ink">
                  <p className="text-xs font-mono uppercase tracking-wider text-ink-muted">{topic.category}</p>
                  <h3 className="mt-2 font-display text-lg leading-snug text-ink">{topic.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-secondary">{topic.shortDescription}</p>
                </Link>
              ))}
            </div>
          ) : <p className="text-sm text-ink-secondary">No Watch 101 topics are available.</p>}
        </Container>
      </section>

      <section aria-labelledby="home-wrist-heading" className="border-b border-hairline bg-warm-surface/20 py-8 sm:py-10 lg:py-12">
        <Container>
          <div className="flex flex-col gap-4 border-b border-hairline pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>

              <h2 id="home-wrist-heading" className="font-display text-base font-semibold uppercase tracking-[0.08em] text-ink sm:text-lg">My Wrist</h2>
            </div>
            <Link to="/profile" className="text-sm font-mono uppercase tracking-wider text-ink underline decoration-hairline underline-offset-4 hover:decoration-ink">Open your dossier &rarr;</Link>
          </div>
          {authLoading ? (
            <p className="pt-4 text-sm text-ink-secondary" role="status">Checking your collector profile…</p>
          ) : !isAuthenticated || !user?.id ? (
            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink-secondary">Sign in to see your private watch collection.</p>
              <Link to="/profile" className="text-sm font-mono uppercase tracking-wider text-ink underline decoration-hairline underline-offset-4 hover:decoration-ink">Sign in &rarr;</Link>
            </div>
          ) : collectionLoading ? (
            <p className="pt-4 text-sm text-ink-secondary" role="status">Loading your collection…</p>
          ) : visibleCollection?.error ? (
            <p className="pt-4 text-sm text-ink-secondary" role="status">Your collection could not be loaded.</p>
          ) : visibleCollection ? (
            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink-secondary">{visibleCollection.items.length} {visibleCollection.items.length === 1 ? 'watch' : 'watches'} in your collection.</p>
              {latestCollectionWatch ? (
                <Link to={'/watches/' + latestCollectionWatch.watch.slug} className="inline-flex items-center gap-3 border border-hairline bg-warm-white p-2 hover:border-ink">
                  <WatchImage src={latestCollectionWatch.watch.image_url} alt={latestCollectionWatch.watch.brand + ' ' + latestCollectionWatch.watch.model} aspectRatio="h-16 w-20" compact />
                  <span className="pr-2">
                    <span className="block text-xs font-mono uppercase tracking-wider text-ink-muted">MOST RECENTLY ADDED</span>
                    <span className="mt-1 block text-sm text-ink">{latestCollectionWatch.watch.brand} {latestCollectionWatch.watch.model}</span>
                  </span>
                </Link>
              ) : <p className="text-sm text-ink-secondary">Your collection is empty.</p>}
            </div>
          ) : null}
        </Container>
      </section>

      <PhilosophyStrip />
    </div>
  )
}
