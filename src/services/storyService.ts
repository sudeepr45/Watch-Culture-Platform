import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Profile } from '../types/auth'
import type { Watch } from '../types/watch'
import type {
  StoryStatus,
  StoryWithAuthorAndWatch,
  FetchStoriesResult,
  FetchStoryResult,
} from '../types/story'

interface RawStoryRow {
  id: string
  user_id: string
  watch_id: string
  slug: string
  title: string
  story_text: string
  photo_url: string | null
  status: StoryStatus
  published_at: string | null
  created_at: string
  updated_at: string
  author: Profile | Profile[] | null
  watch: Watch | Watch[] | null
}

const STORY_SELECT_FIELDS = `
  id,
  user_id,
  watch_id,
  slug,
  title,
  story_text,
  photo_url,
  status,
  published_at,
  created_at,
  updated_at,
  author:profiles (*),
  watch:watches (*)
`

function normalizeStoryRow(row: RawStoryRow): StoryWithAuthorAndWatch | null {
  const authorRecord = Array.isArray(row.author) ? row.author[0] : row.author
  const watchRecord = Array.isArray(row.watch) ? row.watch[0] : row.watch

  if (!authorRecord || !watchRecord) {
    return null
  }

  return {
    id: row.id,
    user_id: row.user_id,
    watch_id: row.watch_id,
    slug: row.slug,
    title: row.title,
    story_text: row.story_text,
    photo_url: row.photo_url,
    status: row.status,
    published_at: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: authorRecord,
    watch: watchRecord,
  }
}

/**
 * Fetch all published community stories ordered newest first.
 * Joins author profile from public.profiles and watch from public.watches.
 */
export async function fetchPublishedStories(): Promise<FetchStoriesResult> {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: new Error('Supabase project credentials not configured in environment variables.'),
      isConfigured: false,
    }
  }

  try {
    const { data, error } = await supabase
      .from('stories')
      .select(STORY_SELECT_FIELDS)
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (error) {
      return {
        data: null,
        error: new Error(error.message),
        isConfigured: true,
      }
    }

    const rows = (data as unknown as RawStoryRow[]) || []
    const stories: StoryWithAuthorAndWatch[] = rows
      .map(normalizeStoryRow)
      .filter((s): s is StoryWithAuthorAndWatch => s !== null)

    return {
      data: stories,
      error: null,
      isConfigured: true,
    }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('An unexpected network error occurred.'),
      isConfigured: true,
    }
  }
}

/**
 * Fetch exactly one published community story by its unique slug.
 * Excludes drafts to ensure only publicly released community content is accessible.
 */
export async function fetchStoryBySlug(slug: string): Promise<FetchStoryResult> {
  const trimmed = slug.trim()
  if (!trimmed) {
    return {
      data: null,
      error: new Error('A story slug is required.'),
      isConfigured: isSupabaseConfigured,
    }
  }

  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: new Error('Supabase project credentials not configured in environment variables.'),
      isConfigured: false,
    }
  }

  try {
    const { data, error } = await supabase
      .from('stories')
      .select(STORY_SELECT_FIELDS)
      .eq('slug', trimmed)
      .eq('status', 'published')
      .maybeSingle()

    if (error) {
      return {
        data: null,
        error: new Error(error.message),
        isConfigured: true,
      }
    }

    if (!data) {
      return {
        data: null,
        error: null,
        isConfigured: true,
      }
    }

    const story = normalizeStoryRow(data as unknown as RawStoryRow)

    return {
      data: story,
      error: story ? null : new Error('Associated author or watch record could not be resolved.'),
      isConfigured: true,
    }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('An unexpected network error occurred.'),
      isConfigured: true,
    }
  }
}

/**
 * Fetch all published community stories associated with a specific watch.
 * Ordered newest first by published_at descending.
 */
export async function fetchStoriesByWatchId(watchId: string): Promise<FetchStoriesResult> {
  const trimmed = watchId.trim()
  if (!trimmed) {
    return {
      data: [],
      error: null,
      isConfigured: isSupabaseConfigured,
    }
  }

  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: new Error('Supabase project credentials not configured in environment variables.'),
      isConfigured: false,
    }
  }

  try {
    const { data, error } = await supabase
      .from('stories')
      .select(STORY_SELECT_FIELDS)
      .eq('watch_id', trimmed)
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (error) {
      return {
        data: null,
        error: new Error(error.message),
        isConfigured: true,
      }
    }

    const rows = (data as unknown as RawStoryRow[]) || []
    const stories: StoryWithAuthorAndWatch[] = rows
      .map(normalizeStoryRow)
      .filter((s): s is StoryWithAuthorAndWatch => s !== null)

    return {
      data: stories,
      error: null,
      isConfigured: true,
    }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('An unexpected network error occurred.'),
      isConfigured: true,
    }
  }
}
