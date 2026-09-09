import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Profile } from '../types/auth'
import type { StoryWithAuthorAndWatch } from '../types/story'
import type {
  StoryComment,
  StoryCommentWithAuthor,
  InteractionActionResult,
  FetchCommentsResult,
  PostCommentResult,
  UpdateCommentResult,
  FetchBookmarkedStoriesResult,
} from '../types/interaction'
import { STORY_SELECT_FIELDS, normalizeStoryRow } from './storyService'

interface RawCommentRow {
  id: string
  story_id: string
  user_id: string
  comment_text: string
  created_at: string
  updated_at: string
  author: Profile | Profile[] | null
}

function normalizeCommentRow(row: RawCommentRow): StoryCommentWithAuthor | null {
  const authorRecord = Array.isArray(row.author) ? row.author[0] : row.author

  if (!authorRecord) {
    return null
  }

  return {
    id: row.id,
    story_id: row.story_id,
    user_id: row.user_id,
    comment_text: row.comment_text,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: authorRecord,
  }
}

// ==============================================================================
// 1. LIKE FUNCTIONS
// ==============================================================================

/**
 * Record a like on a published story by the authenticated user.
 * The database trigger on_story_like_change automatically increments likes_count.
 * Duplicate like attempts are handled gracefully without fabricating false errors.
 */
export async function likeStory(
  userId: string,
  storyId: string
): Promise<InteractionActionResult> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      error: new Error('Supabase project credentials not configured.'),
      isConfigured: false,
    }
  }

  const cleanUserId = typeof userId === 'string' ? userId.trim() : ''
  const cleanStoryId = typeof storyId === 'string' ? storyId.trim() : ''

  if (!cleanUserId || !cleanStoryId) {
    return {
      success: false,
      error: new Error('Both userId and storyId are required to like a story.'),
      isConfigured: true,
    }
  }

  try {
    const { error } = await supabase.from('story_likes').insert({
      user_id: cleanUserId,
      story_id: cleanStoryId,
    })

    if (error) {
      // Handle unique violation gracefully (already liked)
      if (error.code === '23505' || error.message.includes('unique_story_like')) {
        return {
          success: true,
          error: null,
          isConfigured: true,
        }
      }

      return {
        success: false,
        error: new Error(error.message),
        isConfigured: true,
      }
    }

    return {
      success: true,
      error: null,
      isConfigured: true,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error('An unexpected error occurred while liking story.'),
      isConfigured: true,
    }
  }
}

/**
 * Remove an authenticated user's like from a story.
 * The database trigger on_story_like_change automatically decrements likes_count.
 */
export async function unlikeStory(
  userId: string,
  storyId: string
): Promise<InteractionActionResult> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      error: new Error('Supabase project credentials not configured.'),
      isConfigured: false,
    }
  }

  const cleanUserId = typeof userId === 'string' ? userId.trim() : ''
  const cleanStoryId = typeof storyId === 'string' ? storyId.trim() : ''

  if (!cleanUserId || !cleanStoryId) {
    return {
      success: false,
      error: new Error('Both userId and storyId are required to unlike a story.'),
      isConfigured: true,
    }
  }

  try {
    const { error } = await supabase
      .from('story_likes')
      .delete()
      .eq('user_id', cleanUserId)
      .eq('story_id', cleanStoryId)

    if (error) {
      return {
        success: false,
        error: new Error(error.message),
        isConfigured: true,
      }
    }

    return {
      success: true,
      error: null,
      isConfigured: true,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error('An unexpected error occurred while unliking story.'),
      isConfigured: true,
    }
  }
}

/**
 * Check whether the authenticated collector has already liked a story.
 */
export async function hasLikedStory(
  userId: string,
  storyId: string
): Promise<boolean> {
  if (!isSupabaseConfigured) return false

  const cleanUserId = typeof userId === 'string' ? userId.trim() : ''
  const cleanStoryId = typeof storyId === 'string' ? storyId.trim() : ''

  if (!cleanUserId || !cleanStoryId) return false

  try {
    const { data, error } = await supabase
      .from('story_likes')
      .select('id')
      .eq('user_id', cleanUserId)
      .eq('story_id', cleanStoryId)
      .maybeSingle()

    return Boolean(data && !error)
  } catch {
    return false
  }
}

// ==============================================================================
// 2. BOOKMARK FUNCTIONS
// ==============================================================================

/**
 * Save a published story to the authenticated collector's private bookmarks.
 * Duplicate bookmark requests are handled gracefully.
 */
export async function bookmarkStory(
  userId: string,
  storyId: string
): Promise<InteractionActionResult> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      error: new Error('Supabase project credentials not configured.'),
      isConfigured: false,
    }
  }

  const cleanUserId = typeof userId === 'string' ? userId.trim() : ''
  const cleanStoryId = typeof storyId === 'string' ? storyId.trim() : ''

  if (!cleanUserId || !cleanStoryId) {
    return {
      success: false,
      error: new Error('Both userId and storyId are required to bookmark a story.'),
      isConfigured: true,
    }
  }

  try {
    const { error } = await supabase.from('story_bookmarks').insert({
      user_id: cleanUserId,
      story_id: cleanStoryId,
    })

    if (error) {
      if (error.code === '23505' || error.message.includes('unique_story_bookmark')) {
        return {
          success: true,
          error: null,
          isConfigured: true,
        }
      }

      return {
        success: false,
        error: new Error(error.message),
        isConfigured: true,
      }
    }

    return {
      success: true,
      error: null,
      isConfigured: true,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error('An unexpected error occurred while bookmarking story.'),
      isConfigured: true,
    }
  }
}

/**
 * Remove a story from the authenticated collector's private bookmarks.
 */
export async function unbookmarkStory(
  userId: string,
  storyId: string
): Promise<InteractionActionResult> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      error: new Error('Supabase project credentials not configured.'),
      isConfigured: false,
    }
  }

  const cleanUserId = typeof userId === 'string' ? userId.trim() : ''
  const cleanStoryId = typeof storyId === 'string' ? storyId.trim() : ''

  if (!cleanUserId || !cleanStoryId) {
    return {
      success: false,
      error: new Error('Both userId and storyId are required to unbookmark a story.'),
      isConfigured: true,
    }
  }

  try {
    const { error } = await supabase
      .from('story_bookmarks')
      .delete()
      .eq('user_id', cleanUserId)
      .eq('story_id', cleanStoryId)

    if (error) {
      return {
        success: false,
        error: new Error(error.message),
        isConfigured: true,
      }
    }

    return {
      success: true,
      error: null,
      isConfigured: true,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error('An unexpected error occurred while unbookmarking story.'),
      isConfigured: true,
    }
  }
}

/**
 * Check whether the authenticated user has bookmarked a story.
 */
export async function hasBookmarkedStory(
  userId: string,
  storyId: string
): Promise<boolean> {
  if (!isSupabaseConfigured) return false

  const cleanUserId = typeof userId === 'string' ? userId.trim() : ''
  const cleanStoryId = typeof storyId === 'string' ? storyId.trim() : ''

  if (!cleanUserId || !cleanStoryId) return false

  try {
    const { data, error } = await supabase
      .from('story_bookmarks')
      .select('id')
      .eq('user_id', cleanUserId)
      .eq('story_id', cleanStoryId)
      .maybeSingle()

    return Boolean(data && !error)
  } catch {
    return false
  }
}

// ==============================================================================
// 3. COMMENT FUNCTIONS
// ==============================================================================

const MAX_COMMENT_LENGTH = 1000

/**
 * Fetch all collector comments for a published community story, ordered chronologically (oldest first).
 * Joins author profile data from public.profiles.
 */
export async function fetchStoryComments(
  storyId: string
): Promise<FetchCommentsResult> {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: new Error('Supabase project credentials not configured.'),
      isConfigured: false,
    }
  }

  const cleanStoryId = typeof storyId === 'string' ? storyId.trim() : ''
  if (!cleanStoryId) {
    return {
      data: [],
      error: null,
      isConfigured: true,
    }
  }

  try {
    const { data, error } = await supabase
      .from('story_comments')
      .select(`
        id,
        story_id,
        user_id,
        comment_text,
        created_at,
        updated_at,
        author:profiles (
          id,
          username,
          display_name,
          avatar_url,
          bio,
          created_at,
          updated_at
        )
      `)
      .eq('story_id', cleanStoryId)
      .order('created_at', { ascending: true })

    if (error) {
      return {
        data: null,
        error: new Error(error.message),
        isConfigured: true,
      }
    }

    const rows = (data as unknown as RawCommentRow[]) || []
    const comments: StoryCommentWithAuthor[] = rows
      .map(normalizeCommentRow)
      .filter((c): c is StoryCommentWithAuthor => c !== null)

    return {
      data: comments,
      error: null,
      isConfigured: true,
    }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('An unexpected error occurred while fetching comments.'),
      isConfigured: true,
    }
  }
}

/**
 * Post a new comment on a published community story by an authenticated collector.
 * Automatically validates non-empty text and enforces the 1000-character limit.
 * The database trigger on_story_comment_change updates comments_count atomically.
 */
export async function postStoryComment(
  userId: string,
  storyId: string,
  commentText: string
): Promise<PostCommentResult> {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: new Error('Supabase project credentials not configured.'),
      isConfigured: false,
    }
  }

  const cleanUserId = typeof userId === 'string' ? userId.trim() : ''
  const cleanStoryId = typeof storyId === 'string' ? storyId.trim() : ''

  if (!cleanUserId || !cleanStoryId) {
    return {
      data: null,
      error: new Error('A valid user ID and story ID are required to post a comment.'),
      isConfigured: true,
    }
  }

  const trimmedText = typeof commentText === 'string' ? commentText.trim() : ''

  if (!trimmedText) {
    return {
      data: null,
      error: new Error('Comment cannot be empty.'),
      isConfigured: true,
    }
  }

  if (trimmedText.length > MAX_COMMENT_LENGTH) {
    return {
      data: null,
      error: new Error(`Comment exceeds maximum limit of ${MAX_COMMENT_LENGTH} characters.`),
      isConfigured: true,
    }
  }

  try {
    const { data, error } = await supabase
      .from('story_comments')
      .insert({
        user_id: cleanUserId,
        story_id: cleanStoryId,
        comment_text: trimmedText,
      })
      .select(`
        id,
        story_id,
        user_id,
        comment_text,
        created_at,
        updated_at,
        author:profiles (
          id,
          username,
          display_name,
          avatar_url,
          bio,
          created_at,
          updated_at
        )
      `)
      .single()

    if (error) {
      return {
        data: null,
        error: new Error(error.message),
        isConfigured: true,
      }
    }

    const comment = normalizeCommentRow(data as unknown as RawCommentRow)

    return {
      data: comment,
      error: comment ? null : new Error('Failed to resolve author profile for comment.'),
      isConfigured: true,
    }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('An unexpected error occurred while posting comment.'),
      isConfigured: true,
    }
  }
}

/**
 * Delete a comment owned by the authenticated collector.
 * The database trigger on_story_comment_change updates comments_count atomically.
 */
export async function deleteStoryComment(
  userId: string,
  commentId: string
): Promise<InteractionActionResult> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      error: new Error('Supabase project credentials not configured.'),
      isConfigured: false,
    }
  }

  const cleanUserId = typeof userId === 'string' ? userId.trim() : ''
  const cleanCommentId = typeof commentId === 'string' ? commentId.trim() : ''

  if (!cleanUserId || !cleanCommentId) {
    return {
      success: false,
      error: new Error('A valid user ID and comment ID are required.'),
      isConfigured: true,
    }
  }

  try {
    const { error } = await supabase
      .from('story_comments')
      .delete()
      .eq('id', cleanCommentId)
      .eq('user_id', cleanUserId)

    if (error) {
      return {
        success: false,
        error: new Error(error.message),
        isConfigured: true,
      }
    }

    return {
      success: true,
      error: null,
      isConfigured: true,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err : new Error('An unexpected error occurred while deleting comment.'),
      isConfigured: true,
    }
  }
}

/**
 * Update the text of a comment owned by the authenticated collector.
 * The database trigger on_story_comment_updated sets updated_at = now() automatically.
 */
export async function updateStoryComment(
  userId: string,
  commentId: string,
  commentText: string
): Promise<UpdateCommentResult> {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: new Error('Supabase project credentials not configured.'),
      isConfigured: false,
    }
  }

  const cleanUserId = typeof userId === 'string' ? userId.trim() : ''
  const cleanCommentId = typeof commentId === 'string' ? commentId.trim() : ''

  if (!cleanUserId || !cleanCommentId) {
    return {
      data: null,
      error: new Error('A valid user ID and comment ID are required.'),
      isConfigured: true,
    }
  }

  const trimmedText = typeof commentText === 'string' ? commentText.trim() : ''

  if (!trimmedText) {
    return {
      data: null,
      error: new Error('Comment cannot be empty.'),
      isConfigured: true,
    }
  }

  if (trimmedText.length > MAX_COMMENT_LENGTH) {
    return {
      data: null,
      error: new Error(`Comment exceeds maximum limit of ${MAX_COMMENT_LENGTH} characters.`),
      isConfigured: true,
    }
  }

  try {
    const { data, error } = await supabase
      .from('story_comments')
      .update({ comment_text: trimmedText })
      .eq('id', cleanCommentId)
      .eq('user_id', cleanUserId)
      .select('id, story_id, user_id, comment_text, created_at, updated_at')
      .single()

    if (error) {
      return {
        data: null,
        error: new Error(error.message),
        isConfigured: true,
      }
    }

    return {
      data: data as StoryComment,
      error: null,
      isConfigured: true,
    }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('An unexpected error occurred while updating comment.'),
      isConfigured: true,
    }
  }
}

// ==============================================================================
// 4. BOOKMARKED STORIES QUERY
// ==============================================================================

/**
 * Fetch all published community stories saved by the authenticated user in their private bookmarks.
 * Uses a safe two-step query:
 * 1. Retrieves the user's private bookmark records (ordered newest first).
 * 2. Fetches the corresponding published stories with joined author profiles and real live counters.
 * 3. Preserves the bookmark order.
 */
export async function fetchBookmarkedStories(
  userId: string
): Promise<FetchBookmarkedStoriesResult> {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: new Error('Supabase project credentials not configured.'),
      isConfigured: false,
    }
  }

  const cleanUserId = typeof userId === 'string' ? userId.trim() : ''
  if (!cleanUserId) {
    return {
      data: [],
      error: null,
      isConfigured: true,
    }
  }

  try {
    // 1. Fetch user's bookmark story IDs (strictly protected by RLS auth.uid() = user_id)
    const { data: bookmarkRows, error: bookmarkError } = await supabase
      .from('story_bookmarks')
      .select('story_id, created_at')
      .eq('user_id', cleanUserId)
      .order('created_at', { ascending: false })

    if (bookmarkError) {
      return {
        data: null,
        error: new Error(bookmarkError.message),
        isConfigured: true,
      }
    }

    if (!bookmarkRows || bookmarkRows.length === 0) {
      return {
        data: [],
        error: null,
        isConfigured: true,
      }
    }

    const storyIds = bookmarkRows.map((b) => b.story_id)

    // 2. Fetch corresponding published stories with author profile and live counters
    const { data: storyRows, error: storiesError } = await supabase
      .from('stories')
      .select(STORY_SELECT_FIELDS)
      .in('id', storyIds)
      .eq('status', 'published')

    if (storiesError) {
      return {
        data: null,
        error: new Error(storiesError.message),
        isConfigured: true,
      }
    }

    const rawStories = (storyRows as unknown as Parameters<typeof normalizeStoryRow>[0][]) || []
    const storyMap = new Map<string, StoryWithAuthorAndWatch>()

    for (const raw of rawStories) {
      const story = normalizeStoryRow(raw)
      if (story) {
        storyMap.set(story.id, story)
      }
    }

    // 3. Preserve the bookmark order (most recently saved stories first)
    const sortedStories: StoryWithAuthorAndWatch[] = []
    for (const b of bookmarkRows) {
      const match = storyMap.get(b.story_id)
      if (match) {
        sortedStories.push(match)
      }
    }

    return {
      data: sortedStories,
      error: null,
      isConfigured: true,
    }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('An unexpected error occurred while loading bookmarked stories.'),
      isConfigured: true,
    }
  }
}
