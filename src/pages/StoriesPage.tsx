import { useEffect, useState } from 'react'
import Container from '../components/common/Container'
import Button from '../components/common/Button'
import { Link } from '../router'
import { useRouter } from '../router/useRouter'
import { fetchPublishedStories } from '../services/storyService'
import type { StoryWithAuthorAndWatch } from '../types/story'

export default function StoriesPage() {
  const [stories, setStories] = useState<StoryWithAuthorAndWatch[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConfigured, setIsConfigured] = useState(true)
  const { navigate } = useRouter()

  useEffect(() => {
    let isMounted = true

    fetchPublishedStories().then((result) => {
      if (!isMounted) return
      setIsConfigured(result.isConfigured)
      if (result.error) {
        setError(result.error.message)
      } else {
        setStories(result.data)
      }
      setLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [])

  const handleRetry = async () => {
    setLoading(true)
    setError(null)
    const result = await fetchPublishedStories()
    setIsConfigured(result.isConfigured)
    if (result.error) {
      setError(result.error.message)
    } else {
      setStories(result.data)
    }
    setLoading(false)
  }

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        {/* Editorial Stories Header */}
        <div className="border-b border-hairline pb-8 mb-12 sm:mb-16">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5 mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
                <span>COMMUNITY ARCHIVE &bull; DISPATCHES</span>
                <span className="text-ink-muted">&bull;</span>
                <span className="text-ink-muted">VOL. I</span>
              </div>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-ink uppercase">
                Stories
              </h1>
              <p className="mt-3 text-base sm:text-lg text-ink-secondary max-w-2xl font-normal leading-relaxed">
                Real collectors, real watches, and the personal provenance behind the timepieces.
              </p>
            </div>

            {/* Editorial Manifesto Badge & Share Action */}
            <div className="flex flex-col items-start lg:items-end text-left lg:text-right border-t lg:border-t-0 pt-4 lg:pt-0 border-hairline gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/stories/new')}
              >
                SHARE YOUR STORY &rarr;
              </Button>
              <div className="hidden sm:flex flex-col items-start lg:items-end">
                <span className="text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase">
                  AUTHENTICATED VOICES
                </span>
                <span className="text-xs font-mono text-ink tracking-wider uppercase mt-1">
                  COLLECTOR PHOTOGRAPHY &bull; UNFILTERED NARRATIVE
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 1. Loading State */}
        {loading && (
          <div className="relative border border-hairline bg-warm-surface/30 p-12 sm:p-20 text-center max-w-3xl mx-auto">
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
            <h2 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-ink uppercase">
              Loading Community Stories
            </h2>
            <p className="mt-3 text-xs sm:text-sm font-mono tracking-widest text-ink-muted uppercase">
              QUERYING SUPABASE REPOSITORY...
            </p>
          </div>
        )}

        {/* 2. Error / Disconnected State */}
        {!loading && error && (
          <div className="relative border border-hairline bg-warm-surface/40 p-8 sm:p-14 lg:p-20 text-center max-w-3xl mx-auto">
            <div className="absolute top-3 left-4 text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase">
              STORIES // 01
            </div>
            <div className="absolute top-3 right-4 text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase">
              STATUS: {isConfigured ? 'QUERY ERROR' : 'DISCONNECTED'}
            </div>

            <div className="max-w-md mx-auto py-6">
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

              <h2 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-ink uppercase">
                Unable to Load Stories
              </h2>

              <p className="mt-3 text-sm sm:text-base text-ink-secondary font-light leading-relaxed">
                {isConfigured
                  ? `Database connection error: ${error}`
                  : 'Supabase credentials are not configured in your environment variables. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'}
              </p>

              <div className="mt-8 flex justify-center">
                <Button variant="secondary" size="sm" onClick={handleRetry}>
                  RETRY QUERY &rarr;
                </Button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-hairline flex items-center justify-between text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase">
              <span>COMMUNITY REPOSITORY</span>
              <span className="text-ink">SUPABASE STORIES ENGINE</span>
            </div>
          </div>
        )}

        {/* 3. Empty State (Zero published stories) */}
        {!loading && !error && (!stories || stories.length === 0) && (
          <div className="relative border border-hairline bg-warm-surface/40 p-8 sm:p-14 lg:p-20 text-center max-w-3xl mx-auto">
            <div className="absolute top-3 left-4 text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase">
              STORIES // ARCHIVE
            </div>
            <div className="absolute top-3 right-4 text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase">
              STORIES: 0
            </div>

            <div className="max-w-md mx-auto py-6">
              <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center border border-hairline rounded-none bg-warm-white text-ink">
                <svg
                  className="w-5 h-5 text-ink-secondary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                  />
                </svg>
              </div>

              <h2 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-ink uppercase">
                No Community Stories Yet
              </h2>

              <p className="mt-3 text-sm sm:text-base text-ink-secondary font-light leading-relaxed">
                Be the first collector to share the story behind your watch.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/stories/new')}
                >
                  SHARE YOUR STORY &rarr;
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/watches')}
                >
                  OPEN ARCHIVE &rarr;
                </Button>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-hairline flex items-center justify-between text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase">
              <span>AUTHENTICATED ARCHIVE</span>
              <span className="text-ink">COMMUNITY PUBLISHING ENGINE</span>
            </div>
          </div>
        )}

        {/* 4. Real Data-Driven Community Stories */}
        {!loading && !error && stories && stories.length > 0 && (() => {
          const [leadStory, ...otherStories] = stories

          return (
            <div>
              {/* Stories Telemetry Bar */}
              <div className="mb-8 flex items-center justify-between text-[11px] font-mono tracking-[0.2em] text-ink-muted uppercase">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
                  <span>COMMUNITY STORIES // {stories.length} {stories.length === 1 ? 'RECORD' : 'RECORDS'}</span>
                </div>
                <span>ORDER: CHRONOLOGICAL // NEWEST</span>
              </div>

              {/* Featured Lead Story Profile */}
              <Link
                to={`/stories/${leadStory.slug}`}
                className="group mb-12 sm:mb-16 block border border-hairline bg-warm-surface/20 hover:border-ink hover:bg-warm-surface/40 transition-all duration-300 overflow-hidden"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12">
                  {/* Lead Photography (7 cols on desktop) */}
                  <div className="lg:col-span-7 relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto min-h-[280px] sm:min-h-[380px] bg-warm-surface border-b lg:border-b-0 lg:border-r border-hairline overflow-hidden">
                    {leadStory.photo_url ? (
                      <img
                        src={leadStory.photo_url}
                        alt={leadStory.title}
                        loading="lazy"
                        className="h-full w-full object-cover object-center transition-opacity duration-300 group-hover:opacity-90"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs font-mono text-ink-muted uppercase tracking-widest py-20">
                        SPECIMEN PHOTO PENDING
                      </div>
                    )}

                    {/* Timepiece Badge */}
                    <div className="absolute top-4 left-4 px-3 py-1.5 bg-warm-white border border-hairline text-[10px] font-mono tracking-[0.2em] uppercase text-ink font-semibold">
                      {leadStory.personal_watch_brand} &bull; {leadStory.personal_watch_model}
                    </div>

                    {/* Reference Tag */}
                    {leadStory.personal_watch_reference && (
                      <div className="absolute bottom-4 left-4 hidden sm:block px-2.5 py-1 bg-warm-surface border border-hairline text-[9px] font-mono tracking-[0.2em] uppercase text-ink-secondary">
                        REF. {leadStory.personal_watch_reference}
                      </div>
                    )}
                  </div>

                  {/* Lead Narrative (5 cols on desktop) */}
                  <div className="lg:col-span-5 p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
                    <div>
                      {/* Lead Section Marker */}
                      <div className="flex items-center gap-2 mb-4 text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
                        <span>FEATURED STORY // PROFILE</span>
                      </div>

                      {/* Author Info */}
                      <div className="flex items-center gap-3 mb-6">
                        {leadStory.author.avatar_url ? (
                          <img
                            src={leadStory.author.avatar_url}
                            alt={leadStory.author.display_name || leadStory.author.username}
                            className="w-8 h-8 rounded-full object-cover border border-hairline"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-warm-surface border border-hairline flex items-center justify-center font-mono font-bold text-xs text-ink">
                            {(leadStory.author.display_name || leadStory.author.username).charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-semibold tracking-wide text-ink uppercase">
                            {leadStory.author.display_name || leadStory.author.username}
                          </div>
                          <div className="text-[10px] font-mono text-ink-muted">
                            @{leadStory.author.username}
                          </div>
                        </div>
                      </div>

                      {/* Title */}
                      <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight text-ink uppercase group-hover:text-neutral-700 transition-colors leading-[1.1]">
                        {leadStory.title}
                      </h2>

                      {/* Excerpt */}
                      <p className="mt-4 text-sm sm:text-base text-ink-secondary font-light leading-relaxed line-clamp-4">
                        {leadStory.story_text}
                      </p>
                    </div>

                    {/* Bottom Meta */}
                    <div className="mt-8 pt-6 border-t border-hairline flex flex-wrap items-center justify-between gap-3 text-xs font-mono uppercase tracking-wider">
                      <div className="flex items-center gap-3 text-ink-muted text-[11px]">
                        <span>
                          {leadStory.published_at
                            ? new Date(leadStory.published_at).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'RECENT STORY'}
                        </span>
                        {((leadStory.likes_count ?? 0) > 0 || (leadStory.comments_count ?? 0) > 0) && (
                          <>
                            <span>&bull;</span>
                            <span className="text-ink-muted">
                              {leadStory.likes_count ?? 0} {(leadStory.likes_count ?? 0) === 1 ? 'like' : 'likes'}
                              {(leadStory.comments_count ?? 0) > 0 && ` &bull; ${leadStory.comments_count} ${leadStory.comments_count === 1 ? 'note' : 'notes'}`}
                            </span>
                          </>
                        )}
                      </div>
                      <span className="text-ink font-semibold group-hover:text-neutral-700 transition-colors flex items-center gap-1">
                        READ <span className="group-hover:translate-x-1.5 transition-transform inline-block">&rarr;</span>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Subsequent Community Stories Grid (if more than 1) */}
              {otherStories.length > 0 && (
                <div>
                  <div className="mb-6 flex items-center justify-between text-[11px] font-mono tracking-[0.2em] text-ink-muted uppercase pt-4 border-t border-hairline">
                    <span>COMMUNITY STORIES // CHRONOLOGICAL</span>
                    <span>{otherStories.length} {otherStories.length === 1 ? 'RECORD' : 'RECORDS'}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {otherStories.map((story) => (
                      <Link
                        key={story.id}
                        to={`/stories/${story.slug}`}
                        className="group relative border border-hairline bg-warm-surface/20 flex flex-col justify-between transition-all duration-300 hover:border-ink hover:bg-warm-surface/50 overflow-hidden"
                      >
                        {/* Photography */}
                        <div className="relative aspect-[4/3] w-full bg-warm-surface border-b border-hairline overflow-hidden">
                          {story.photo_url ? (
                            <img
                              src={story.photo_url}
                              alt={story.title}
                              loading="lazy"
                              className="h-full w-full object-cover object-center transition-opacity duration-300 group-hover:opacity-90"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-xs font-mono text-ink-muted uppercase tracking-widest">
                              SPECIMEN PHOTO PENDING
                            </div>
                          )}

                          {/* Associated Watch Pill Badge */}
                          <div className="absolute top-3 left-3 px-2.5 py-1 bg-warm-white border border-hairline text-[9px] font-mono tracking-[0.2em] uppercase text-ink font-medium max-w-[85%] truncate">
                            {story.personal_watch_brand} &bull; {story.personal_watch_model}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 sm:p-7 flex flex-col justify-between flex-grow">
                          <div>
                            {/* Author Bar */}
                            <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-hairline">
                              <div className="flex items-center gap-2 min-w-0">
                                {story.author.avatar_url ? (
                                  <img
                                    src={story.author.avatar_url}
                                    alt={story.author.display_name || story.author.username}
                                    className="w-5 h-5 rounded-full object-cover border border-hairline flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-warm-surface border border-hairline flex items-center justify-center text-[9px] font-mono font-bold text-ink flex-shrink-0">
                                    {(story.author.display_name || story.author.username).charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="text-[11px] font-mono tracking-[0.14em] uppercase text-ink font-medium truncate">
                                  {story.author.display_name || `@${story.author.username}`}
                                </span>
                              </div>

                              {story.published_at && (
                                <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted flex-shrink-0">
                                  {new Date(story.published_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              )}
                            </div>

                            {/* Title */}
                            <h3 className="font-display text-xl sm:text-2xl font-normal tracking-tight text-ink uppercase group-hover:text-neutral-700 transition-colors line-clamp-2 leading-snug">
                              {story.title}
                            </h3>

                            {/* Excerpt */}
                            <p className="mt-3 text-xs sm:text-sm text-ink-secondary font-light leading-relaxed line-clamp-3">
                              {story.story_text}
                            </p>
                          </div>

                          {/* Footer */}
                          <div className="mt-6 pt-4 border-t border-hairline flex items-center justify-between text-[10px] font-mono tracking-[0.16em] uppercase">
                            <div className="text-ink-muted flex items-center gap-2 truncate max-w-[65%]">
                              <span className="truncate">
                                {story.personal_watch_reference ? `REF. ${story.personal_watch_reference}` : story.personal_watch_brand}
                              </span>
                              {(story.likes_count ?? 0) > 0 && (
                                <span className="text-ink-muted font-normal flex-shrink-0">
                                  &bull; {story.likes_count}L
                                </span>
                              )}
                            </div>
                            <span className="text-ink font-semibold group-hover:text-neutral-700 transition-colors flex items-center gap-1 flex-shrink-0">
                              OPEN STORY <span className="group-hover:translate-x-1 transition-transform inline-block">&rarr;</span>
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })()}
      </Container>
    </div>
  )
}

