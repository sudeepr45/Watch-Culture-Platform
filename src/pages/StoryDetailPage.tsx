import { useEffect, useState, useCallback, type FormEvent } from 'react'
import Container from '../components/common/Container'
import Button from '../components/common/Button'
import { Link } from '../router'
import { useRouter } from '../router/useRouter'
import { useAuth } from '../context/useAuth'
import { fetchStoryBySlug, deleteStory } from '../services/storyService'
import {
  likeStory,
  unlikeStory,
  hasLikedStory,
  bookmarkStory,
  unbookmarkStory,
  hasBookmarkedStory,
  fetchStoryComments,
  postStoryComment,
  deleteStoryComment,
  updateStoryComment,
} from '../services/interactionService'
import type { StoryWithAuthorAndWatch } from '../types/story'
import type { StoryCommentWithAuthor } from '../types/interaction'

interface StoryDetailPageProps {
  slug: string
}

export default function StoryDetailPage({ slug }: StoryDetailPageProps) {
  const { user, isAuthenticated } = useAuth()
  const { navigate } = useRouter()

  const [story, setStory] = useState<StoryWithAuthorAndWatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConfigured, setIsConfigured] = useState(true)

  // Story ownership and deletion state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingStory, setDeletingStory] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const isOwner = Boolean(user && story && user.id === story.user_id)

  const handleCloseDeleteDialog = useCallback(() => {
    if (!deletingStory) {
      setDeleteDialogOpen(false)
      setDeleteError(null)
    }
  }, [deletingStory])

  const handleConfirmDeleteStory = async () => {
    if (!user || !story || deletingStory) return

    setDeletingStory(true)
    setDeleteError(null)

    const result = await deleteStory(user.id, story.id)

    if (!result.success || result.error) {
      setDeleteError(result.error?.message || 'Failed to delete story.')
      setDeletingStory(false)
      return
    }

    setDeletingStory(false)
    setDeleteDialogOpen(false)
    navigate('/stories')
  }

  // Close delete dialog on Escape key
  useEffect(() => {
    if (!deleteDialogOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deletingStory) {
        handleCloseDeleteDialog()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [deleteDialogOpen, deletingStory, handleCloseDeleteDialog])

  // Interaction state
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [actionProcessing, setActionProcessing] = useState(false)
  const [authPrompt, setAuthPrompt] = useState<string | null>(null)

  // Comments state
  const [comments, setComments] = useState<StoryCommentWithAuthor[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentsError, setCommentsError] = useState<string | null>(null)
  const [commentInput, setCommentInput] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)

  // Comment edit/delete state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentText, setEditingCommentText] = useState('')
  const [updatingComment, setUpdatingComment] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)

  // Reload story data strictly from the database (authoritative counter source)
  const refreshStoryData = async () => {
    const result = await fetchStoryBySlug(slug)
    if (result.data) {
      setStory(result.data)
    }
  }

  // Load comments strictly through the interaction service
  const loadComments = async (storyId: string) => {
    setCommentsLoading(true)
    setCommentsError(null)
    const result = await fetchStoryComments(storyId)
    if (result.error) {
      setCommentsError(result.error.message)
    } else {
      setComments(result.data || [])
    }
    setCommentsLoading(false)
  }

  // Initial story load
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

  // Derived authenticated interaction states
  const userHasLiked = Boolean(user && isLiked)
  const userHasBookmarked = Boolean(user && isBookmarked)

  // Load authenticated user like & bookmark states when story or user changes
  useEffect(() => {
    let isMounted = true
    const userId = user?.id
    const storyId = story?.id

    if (!userId || !storyId) {
      return
    }

    Promise.all([
      hasLikedStory(userId, storyId),
      hasBookmarkedStory(userId, storyId),
    ]).then(([liked, bookmarked]) => {
      if (!isMounted) return
      setIsLiked(liked)
      setIsBookmarked(bookmarked)
    })

    return () => {
      isMounted = false
    }
  }, [story?.id, user?.id])

  // Load comments when story is loaded
  useEffect(() => {
    let isMounted = true
    const storyId = story?.id
    if (!storyId) return

    fetchStoryComments(storyId).then((result) => {
      if (!isMounted) return
      if (result.error) {
        setCommentsError(result.error.message)
      } else {
        setComments(result.data || [])
      }
      setCommentsLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [story?.id])

  // Like / Unlike action (NO optimistic counter mutations; reloads database counters)
  const handleToggleLike = async () => {
    if (!isAuthenticated || !user) {
      setAuthPrompt('Sign in to appreciate and like community dispatches.')
      return
    }
    if (!story || actionProcessing) return

    setActionProcessing(true)
    setAuthPrompt(null)

    if (userHasLiked) {
      const res = await unlikeStory(user.id, story.id)
      if (res.success) {
        setIsLiked(false)
        await refreshStoryData()
      } else if (res.error) {
        setAuthPrompt(res.error.message)
      }
    } else {
      const res = await likeStory(user.id, story.id)
      if (res.success) {
        setIsLiked(true)
        await refreshStoryData()
      } else if (res.error) {
        setAuthPrompt(res.error.message)
      }
    }
    setActionProcessing(false)
  }

  // Bookmark / Unbookmark action
  const handleToggleBookmark = async () => {
    if (!isAuthenticated || !user) {
      setAuthPrompt('Sign in to save dispatches to your collector profile.')
      return
    }
    if (!story || actionProcessing) return

    setActionProcessing(true)
    setAuthPrompt(null)

    if (userHasBookmarked) {
      const res = await unbookmarkStory(user.id, story.id)
      if (res.success) {
        setIsBookmarked(false)
      } else if (res.error) {
        setAuthPrompt(res.error.message)
      }
    } else {
      const res = await bookmarkStory(user.id, story.id)
      if (res.success) {
        setIsBookmarked(true)
      } else if (res.error) {
        setAuthPrompt(res.error.message)
      }
    }
    setActionProcessing(false)
  }

  // Post comment action
  const handlePostComment = async (e: FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated || !user) {
      setAuthPrompt('Sign in to leave a collector note.')
      return
    }
    if (!story || submittingComment) return

    const trimmedText = commentInput.trim()
    if (!trimmedText) {
      setCommentError('Comment cannot be empty.')
      return
    }
    if (trimmedText.length > 1000) {
      setCommentError('Comment exceeds maximum 1000 characters limit.')
      return
    }

    setSubmittingComment(true)
    setCommentError(null)

    const res = await postStoryComment(user.id, story.id, trimmedText)
    if (res.error) {
      setCommentError(res.error.message)
    } else {
      setCommentInput('')
      await Promise.all([loadComments(story.id), refreshStoryData()])
    }
    setSubmittingComment(false)
  }

  // Save edited comment action
  const handleSaveEdit = async (commentId: string) => {
    if (!user || updatingComment) return

    const trimmedText = editingCommentText.trim()
    if (!trimmedText) {
      setCommentError('Comment cannot be empty.')
      return
    }
    if (trimmedText.length > 1000) {
      setCommentError('Comment exceeds maximum 1000 characters limit.')
      return
    }

    setUpdatingComment(true)
    setCommentError(null)

    const res = await updateStoryComment(user.id, commentId, trimmedText)
    if (res.error) {
      setCommentError(res.error.message)
    } else {
      setEditingCommentId(null)
      setEditingCommentText('')
      if (story) {
        await loadComments(story.id)
      }
    }
    setUpdatingComment(false)
  }

  // Delete comment action
  const handleDeleteComment = async (commentId: string) => {
    if (!user || deletingCommentId) return
    const confirmed = window.confirm('Are you sure you want to remove this collector note?')
    if (!confirmed) return

    setDeletingCommentId(commentId)
    setCommentError(null)

    const res = await deleteStoryComment(user.id, commentId)
    if (res.error) {
      setCommentError(res.error.message)
    } else {
      if (story) {
        await Promise.all([loadComments(story.id), refreshStoryData()])
      }
    }
    setDeletingCommentId(null)
  }

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
        {/* Navigation Breadcrumb & Owner Controls */}
        <div className="mb-8 sm:mb-12 flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/stories"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-ink-secondary hover:text-ink transition-colors"
          >
            &larr; <span>BACK TO STORIES</span>
          </Link>

          {/* Owner Actions */}
          {isOwner && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(`/stories/${story.slug}/edit`)}
                className="px-3 py-1.5 border border-hairline bg-warm-white text-[10px] font-mono tracking-[0.2em] uppercase text-ink-secondary hover:text-ink hover:border-ink transition-colors cursor-pointer"
              >
                [ EDIT DISPATCH ]
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteError(null)
                  setDeleteDialogOpen(true)
                }}
                className="px-3 py-1.5 border border-hairline bg-warm-white text-[10px] font-mono tracking-[0.2em] uppercase text-accent-burgundy/80 hover:text-accent-burgundy hover:border-accent-burgundy transition-colors cursor-pointer"
              >
                [ DELETE DISPATCH ]
              </button>
            </div>
          )}
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
              {story.watch ? (
                <Link
                  to={`/watches/${story.watch.slug}`}
                  className="px-3 py-1 bg-warm-surface border border-hairline hover:border-ink hover:text-ink transition-colors text-ink-secondary font-medium"
                >
                  {story.personal_watch_brand} {story.personal_watch_model} &rarr;
                </Link>
              ) : (
                <span className="px-3 py-1 bg-warm-surface border border-hairline text-ink font-medium">
                  {story.personal_watch_brand} {story.personal_watch_model}
                </span>
              )}
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
              <span>SUBJECT: {story.personal_watch_brand} {story.personal_watch_model}</span>
            </div>
          </div>
        </div>

        {/* Personal Story Narrative */}
        <div className="max-w-3xl mx-auto mb-12 sm:mb-16">
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

        {/* Restrained Editorial Interaction Bar */}
        <div className="max-w-3xl mx-auto my-10 py-5 border-y border-hairline flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Like Button with Real Database Counter */}
            <button
              type="button"
              onClick={handleToggleLike}
              disabled={actionProcessing}
              title={userHasLiked ? 'Unlike story' : 'Like story'}
              className={`inline-flex items-center gap-2.5 px-4 py-2 text-xs font-mono tracking-wider uppercase transition-all duration-200 border ${
                userHasLiked
                  ? 'bg-ink text-warm-white border-ink font-semibold'
                  : 'bg-warm-surface/30 text-ink border-hairline hover:border-ink hover:bg-warm-surface/60'
              }`}
            >
              <svg
                className="w-3.5 h-3.5 transition-transform active:scale-125"
                viewBox="0 0 24 24"
                fill={userHasLiked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={1.75}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                />
              </svg>
              <span>
                {story.likes_count ?? 0} {(story.likes_count ?? 0) === 1 ? 'LIKE' : 'LIKES'}
              </span>
            </button>

            {/* Private Bookmark / Save Button */}
            <button
              type="button"
              onClick={handleToggleBookmark}
              disabled={actionProcessing}
              title={userHasBookmarked ? 'Remove from saved stories' : 'Save story to profile'}
              className={`inline-flex items-center gap-2.5 px-4 py-2 text-xs font-mono tracking-wider uppercase transition-all duration-200 border ${
                userHasBookmarked
                  ? 'bg-ink text-warm-white border-ink font-semibold'
                  : 'bg-warm-surface/30 text-ink border-hairline hover:border-ink hover:bg-warm-surface/60'
              }`}
            >
              <svg
                className="w-3.5 h-3.5 transition-transform active:scale-125"
                viewBox="0 0 24 24"
                fill={userHasBookmarked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={1.75}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                />
              </svg>
              <span>{userHasBookmarked ? 'SAVED' : 'SAVE'}</span>
            </button>
          </div>

          {/* Jump to Notes Anchor */}
          <a
            href="#community-notes"
            className="inline-flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-ink-secondary hover:text-ink transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
              />
            </svg>
            <span>
              {story.comments_count ?? 0} {(story.comments_count ?? 0) === 1 ? 'NOTE' : 'NOTES'}
            </span>
          </a>
        </div>

        {/* Unauthenticated / Informational Notification Banner */}
        {authPrompt && (
          <div className="max-w-3xl mx-auto mb-8 p-4 border border-hairline bg-warm-surface/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono text-ink">
            <span>{authPrompt}</span>
            <div className="flex items-center gap-3">
              <Button variant="primary" size="sm" onClick={() => navigate('/login')}>
                SIGN IN &rarr;
              </Button>
              <button
                type="button"
                onClick={() => setAuthPrompt(null)}
                className="text-[10px] uppercase text-ink-muted hover:text-ink tracking-wider"
              >
                DISMISS
              </button>
            </div>
          </div>
        )}

        {/* Featured Timepiece Card */}
        <div className="max-w-4xl mx-auto mb-16 sm:mb-20 border-t border-hairline pt-12">
          <div className="mb-4 text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase">
            {story.watch ? 'VERIFIED WATCH ARCHIVE' : 'PERSONAL TIMEPIECE // COLLECTOR SPECIMEN'}
          </div>

          <div className="border border-hairline bg-warm-surface/20 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-ink transition-colors">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-ink-secondary">
                {story.watch ? story.watch.brand : story.personal_watch_brand}
              </div>
              <h3 className="mt-1 font-display text-2xl sm:text-3xl font-normal uppercase tracking-tight text-ink">
                {story.watch ? story.watch.model : story.personal_watch_model}
              </h3>
              <div className="mt-2 text-xs font-mono text-ink-muted tracking-wider">
                {story.watch
                  ? `REF. ${story.watch.reference_number}`
                  : story.personal_watch_reference
                  ? `REF. ${story.personal_watch_reference}`
                  : 'COMMUNITY TIMEPIECE'}
              </div>
            </div>

            {story.watch && (
              <Link to={`/watches/${story.watch.slug}`}>
                <Button variant="secondary" size="sm">
                  VIEW WATCH DOSSIER &rarr;
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Collector Notes (Comments) Section */}
        <div id="community-notes" className="max-w-3xl mx-auto mb-16 sm:mb-20 border-t border-hairline pt-12">
          <div className="mb-8 pb-4 border-b border-hairline flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden="true" />
                <span>COMMUNITY NOTES // DISCUSSIONS</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-normal uppercase tracking-tight text-ink">
                Collector Notes
              </h2>
            </div>
            <span className="text-xs font-mono tracking-wider text-ink-muted uppercase">
              {story.comments_count ?? 0} {(story.comments_count ?? 0) === 1 ? 'RECORD' : 'RECORDS'}
            </span>
          </div>

          {/* Comments Loading State */}
          {commentsLoading && comments.length === 0 && (
            <div className="py-8 text-center text-xs font-mono tracking-widest text-ink-muted uppercase">
              LOADING NOTES...
            </div>
          )}

          {/* Comments Query Error */}
          {commentsError && (
            <div className="p-4 mb-6 border border-hairline bg-red-50/50 text-xs font-mono text-red-700">
              Unable to load notes: {commentsError}
            </div>
          )}

          {/* Empty Notes State */}
          {!commentsLoading && comments.length === 0 && (
            <div className="border border-hairline p-8 bg-warm-surface/20 text-center mb-8">
              <p className="font-display text-lg uppercase text-ink">No notes yet.</p>
              <p className="mt-1 text-xs font-mono text-ink-muted">
                Be the first to share your reflections on this timepiece and personal provenance.
              </p>
            </div>
          )}

          {/* Comments List (Oldest First) */}
          {comments.length > 0 && (
            <div className="space-y-6 mb-10">
              {comments.map((comment) => {
                const commentAuthorName =
                  comment.author.display_name || comment.author.username
                const commentInitial = commentAuthorName.charAt(0).toUpperCase()
                const isCommentOwner = user?.id === comment.user_id
                const isBeingEdited = editingCommentId === comment.id

                return (
                  <div
                    key={comment.id}
                    className="border border-hairline p-5 sm:p-6 bg-warm-surface/20 hover:border-ink/60 transition-colors"
                  >
                    {/* Comment Header */}
                    <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-hairline">
                      <div className="flex items-center gap-2.5">
                        {comment.author.avatar_url ? (
                          <img
                            src={comment.author.avatar_url}
                            alt={commentAuthorName}
                            className="w-6 h-6 rounded-full object-cover border border-hairline"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-warm-surface border border-hairline flex items-center justify-center text-[10px] font-mono font-bold text-ink">
                            {commentInitial}
                          </div>
                        )}
                        <div>
                          <span className="text-xs font-semibold text-ink uppercase tracking-wide">
                            {commentAuthorName}
                          </span>
                          <span className="ml-2 text-[10px] font-mono text-ink-muted">
                            @{comment.author.username}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
                          {new Date(comment.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                          {comment.updated_at !== comment.created_at && (
                            <span className="ml-1 text-ink-secondary">(edited)</span>
                          )}
                        </span>

                        {/* Owner Controls: Edit & Delete */}
                        {isCommentOwner && !isBeingEdited && (
                          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-ink-muted pl-2 border-l border-hairline">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCommentId(comment.id)
                                setEditingCommentText(comment.comment_text)
                                setCommentError(null)
                              }}
                              className="hover:text-ink transition-colors"
                            >
                              EDIT
                            </button>
                            <span>&bull;</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteComment(comment.id)}
                              disabled={deletingCommentId === comment.id}
                              className="hover:text-red-700 transition-colors"
                            >
                              {deletingCommentId === comment.id ? '...' : 'DELETE'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Comment Content / Inline Editor */}
                    {isBeingEdited ? (
                      <div className="space-y-3">
                        <textarea
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          maxLength={1000}
                          rows={3}
                          className="w-full bg-warm-white border border-hairline p-3 text-sm text-ink font-light focus:outline-none focus:border-ink resize-y transition-colors leading-relaxed"
                        />
                        <div className="flex items-center justify-between text-[10px] font-mono text-ink-muted uppercase">
                          <span>{editingCommentText.length} / 1000</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCommentId(null)
                                setEditingCommentText('')
                              }}
                              className="px-3 py-1 border border-hairline hover:border-ink transition-colors text-ink uppercase"
                            >
                              CANCEL
                            </button>
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={updatingComment || !editingCommentText.trim()}
                              onClick={() => handleSaveEdit(comment.id)}
                            >
                              {updatingComment ? 'SAVING...' : 'SAVE CHANGES'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm sm:text-base text-ink font-light leading-relaxed whitespace-pre-wrap">
                        {comment.comment_text}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Comment Composer */}
          {isAuthenticated ? (
            <form onSubmit={handlePostComment} className="border border-hairline bg-warm-surface/20 p-6 sm:p-8">
              <div className="flex items-center justify-between mb-3 text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase">
                <span>LEAVE A NOTE</span>
                <span className={commentInput.length > 950 ? 'text-amber-700 font-bold' : ''}>
                  {commentInput.length} / 1000
                </span>
              </div>
              <textarea
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                maxLength={1000}
                rows={4}
                placeholder="Share reflections on this timepiece, its provenance, or personal collecting impressions..."
                className="w-full bg-warm-white border border-hairline p-4 text-sm text-ink placeholder:text-ink-muted font-light focus:outline-none focus:border-ink resize-y transition-colors leading-relaxed"
              />
              {commentError && (
                <p className="mt-2 text-xs font-mono text-red-600">
                  {commentError}
                </p>
              )}
              <div className="mt-4 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submittingComment || !commentInput.trim()}
                >
                  {submittingComment ? 'POSTING NOTE...' : 'POST NOTE \u2192'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="border border-hairline bg-warm-surface/30 p-6 sm:p-8 text-center">
              <p className="text-sm text-ink-secondary font-light mb-4">
                Sign in to join the conversation and leave notes on collector dispatches.
              </p>
              <Button variant="secondary" size="sm" onClick={() => navigate('/login')}>
                SIGN IN TO LEAVE A NOTE &rarr;
              </Button>
            </div>
          )}
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

      {/* Delete Confirmation Modal Dialog */}
      {deleteDialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-ink/60 backdrop-blur-sm animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          onClick={handleCloseDeleteDialog}
        >
          <div
            className="w-full max-w-lg border border-hairline bg-warm-white p-6 sm:p-8 shadow-2xl space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b border-hairline pb-4">
              <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.25em] text-accent-burgundy uppercase mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-burgundy" />
                <span>PERMANENT REMOVAL</span>
              </div>
              <h3
                id="delete-dialog-title"
                className="font-display text-2xl sm:text-3xl font-normal uppercase tracking-tight text-ink"
              >
                DELETE THIS DISPATCH?
              </h3>
            </div>

            {/* Body */}
            <p className="text-xs sm:text-sm font-sans text-ink-secondary leading-relaxed">
              This will permanently remove your story and its associated comments, bookmarks, and engagement records. This action cannot be undone.
            </p>

            {/* Error if delete failed */}
            {deleteError && (
              <div className="p-3 border border-hairline bg-warm-surface/60 flex items-start gap-2.5">
                <span className="text-accent-burgundy text-xs font-mono shrink-0">&bull;</span>
                <p className="text-xs font-mono text-ink tracking-wide">
                  {deleteError}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
              <Button
                variant="secondary"
                size="md"
                disabled={deletingStory}
                onClick={handleCloseDeleteDialog}
                className="w-full sm:w-auto"
              >
                CANCEL
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={deletingStory}
                onClick={handleConfirmDeleteStory}
                className="w-full sm:w-auto !bg-accent-burgundy hover:!bg-accent-burgundy/90 text-warm-white"
              >
                {deletingStory ? 'REMOVING DISPATCH...' : 'DELETE STORY'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
