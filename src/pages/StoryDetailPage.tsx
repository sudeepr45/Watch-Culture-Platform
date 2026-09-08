import { useEffect, useState } from 'react'
import Container from '../components/common/Container'
import Button from '../components/common/Button'
import { Link } from '../router'
import { useRouter } from '../router/useRouter'
import { fetchStoryBySlug } from '../services/storyService'
import type { StoryWithAuthorAndWatch } from '../types/story'

interface StoryDetailPageProps {
  slug: string
}

export default function StoryDetailPage({ slug }: StoryDetailPageProps) {
  const [story, setStory] = useState<StoryWithAuthorAndWatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConfigured, setIsConfigured] = useState(true)
  const { navigate } = useRouter()

  useEffect(() => {
    let isMounted = true

    const loadStory = async () => {
      setLoading(true)
      setError(null)
      const result = await fetchStoryBySlug(slug)
      if (!isMounted) return

      setIsConfigured(result.isConfigured)
      if (result.error) {
        setError(result.error.message)
      } else {
        setStory(result.data)
      }
      setLoading(false)
    }

    loadStory()

    return () => {
      isMounted = false
    }
  }, [slug])

  // 1. Loading State
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
              Loading Community Story
            </h2>
            <p className="mt-2 text-xs font-mono tracking-widest text-ink-muted uppercase">
              QUERYING SUPABASE REPOSITORY...
            </p>
          </div>
        </Container>
      </div>
    )
  }

  // 2. Error / Disconnected State
  if (error) {
    return (
      <div className="py-20 sm:py-32">
        <Container>
          <div className="border border-hairline bg-warm-surface/40 p-12 sm:p-16 text-center max-w-2xl mx-auto">
            <div className="text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-3">
              STATUS: {isConfigured ? 'QUERY ERROR' : 'DISCONNECTED'}
            </div>
            <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center border border-hairline bg-warm-white text-ink">
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
              Unable to Load Story
            </h2>
            <p className="mt-3 text-sm text-ink-secondary font-light">
              {isConfigured
                ? `Database connection error: ${error}`
                : 'Supabase credentials are not configured in your environment variables.'}
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button variant="secondary" size="sm" onClick={() => navigate('/stories')}>
                &larr; BACK TO STORIES
              </Button>
            </div>
          </div>
        </Container>
      </div>
    )
  }

  // 3. Not Found State
  if (!story) {
    return (
      <div className="py-20 sm:py-32">
        <Container>
          <div className="border border-hairline bg-warm-surface/40 p-12 sm:p-16 text-center max-w-2xl mx-auto">
            <div className="text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-3">
              DISPATCH // 404
            </div>
            <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center border border-hairline bg-warm-white text-ink">
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
              Story Not Found
            </h2>
            <p className="mt-3 text-sm text-ink-secondary font-light">
              The requested community story &ldquo;{slug}&rdquo; does not exist or has not been published yet.
            </p>
            <div className="mt-8 flex justify-center">
              <Button variant="secondary" size="sm" onClick={() => navigate('/stories')}>
                &larr; RETURN TO STORIES
              </Button>
            </div>
          </div>
        </Container>
      </div>
    )
  }

  // Author representation
  const authorName = story.author.display_name || story.author.username
  const authorHandle = `@${story.author.username}`
  const initial = (story.author.display_name || story.author.username).charAt(0).toUpperCase()

  // Format publication date
  const publishedDate = story.published_at
    ? new Date(story.published_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'COMMUNITY DISPATCH'

  // Split story paragraphs
  const paragraphs = story.story_text.split(/\n+/).filter((p) => p.trim().length > 0)

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        {/* Navigation Breadcrumb */}
        <div className="mb-8 sm:mb-12">
          <Link
            to="/stories"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-ink-secondary hover:text-ink transition-colors"
          >
            &larr; <span>BACK TO STORIES</span>
          </Link>
        </div>

        {/* Story Header */}
        <div className="max-w-4xl mx-auto border-b border-hairline pb-8 mb-10 sm:mb-12">
          {/* Section Indicator */}
          <div className="flex items-center gap-2 mb-4 text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-ink-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden="true" />
            <span>COMMUNITY DISPATCH // WRIST STORY</span>
          </div>

          {/* Story Title */}
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight text-ink uppercase leading-[1.08]">
            {story.title}
          </h1>

          {/* Author & Publication Metadata Bar */}
          <div className="mt-6 sm:mt-8 pt-6 border-t border-hairline flex flex-wrap items-center justify-between gap-4">
            {/* Left: Author Identity */}
            <div className="flex items-center gap-3">
              {story.author.avatar_url ? (
                <img
                  src={story.author.avatar_url}
                  alt={authorName}
                  className="w-10 h-10 rounded-full object-cover border border-hairline"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-warm-surface border border-hairline flex items-center justify-center font-mono font-bold text-sm text-ink">
                  {initial}
                </div>
              )}
              <div>
                <div className="text-sm font-semibold tracking-wide text-ink">
                  {authorName}
                </div>
                <div className="text-xs font-mono text-ink-muted">
                  {authorHandle}
                </div>
              </div>
            </div>

            {/* Right: Date & Watch Quick Tag */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-mono uppercase tracking-wider text-ink-secondary">
              <span>{publishedDate}</span>
              <span>&bull;</span>
              <Link
                to={`/watches/${story.watch.slug}`}
                className="px-3 py-1 bg-warm-surface border border-hairline hover:border-ink hover:text-ink transition-colors text-ink-secondary font-medium"
              >
                {story.watch.brand} {story.watch.model} &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Story Photograph */}
        <div className="max-w-4xl mx-auto mb-12 sm:mb-16">
          <div className="border border-hairline bg-warm-surface overflow-hidden">
            {story.photo_url ? (
              <img
                src={story.photo_url}
                alt={story.title}
                className="w-full h-auto max-h-[720px] object-cover object-center"
              />
            ) : (
              <div className="py-24 sm:py-32 flex items-center justify-center text-xs font-mono tracking-widest text-ink-muted uppercase">
                SPECIMEN PHOTO PENDING
              </div>
            )}

            {/* Photograph Terminal Colophon Plate */}
            <div className="px-5 py-3 border-t border-hairline bg-warm-surface/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-ink-muted">
              <span>ORIGINAL COLLECTOR PHOTOGRAPH</span>
              <span>SUBJECT: {story.watch.brand} {story.watch.model}</span>
            </div>
          </div>
        </div>

        {/* Personal Story Narrative */}
        <div className="max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="mb-6 flex items-center gap-2 text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden="true" />
            <span>THE COLLECTOR&rsquo;S NOTE</span>
          </div>

          <div className="space-y-6 text-base sm:text-lg text-ink font-light leading-relaxed">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="text-balance">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Featured Timepiece Card */}
        <div className="max-w-4xl mx-auto mb-16 sm:mb-20 border-t border-hairline pt-12">
          <div className="mb-4 text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase">
            FEATURED TIMEPIECE // CENTRAL DATABASE
          </div>

          <div className="border border-hairline bg-warm-surface/20 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-ink transition-colors">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink-secondary">
                {story.watch.brand}
              </div>
              <h3 className="mt-1 font-display text-2xl sm:text-3xl font-normal uppercase tracking-tight text-ink">
                {story.watch.model}
              </h3>
              <div className="mt-2 text-xs font-mono text-ink-muted tracking-wider">
                REF. {story.watch.reference_number}
                {story.watch.case_diameter_mm ? ` • ${story.watch.case_diameter_mm} MM` : ''}
                {story.watch.movement_type ? ` • ${story.watch.movement_type.toUpperCase()}` : ''}
              </div>
            </div>

            <Link to={`/watches/${story.watch.slug}`}>
              <Button variant="secondary" size="sm">
                VIEW FULL SPECIFICATIONS &rarr;
              </Button>
            </Link>
          </div>
        </div>

        {/* Return to Stories Footer */}
        <div className="max-w-4xl mx-auto pt-8 border-t border-hairline flex items-center justify-between">
          <Button variant="secondary" size="sm" onClick={() => navigate('/stories')}>
            &larr; BACK TO ALL STORIES
          </Button>

          <span className="text-[10px] font-mono tracking-[0.18em] text-ink-muted uppercase hidden sm:inline-block">
            COMMUNITY ARCHIVE &bull; WATCH CULTURE PLATFORM
          </span>
        </div>
      </Container>
    </div>
  )
}
