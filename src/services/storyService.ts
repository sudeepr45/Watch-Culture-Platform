import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Profile } from '../types/auth'
import type {
  Story,
  StoryStatus,
  StoryArchiveWatch,
  StoryWithAuthorAndWatch,
  FetchStoriesResult,
  FetchStoryResult,
  UploadStoryPhotoResult,
  CreateStoryInput,
  CreateStoryResult,
  UpdateStoryInput,
  UpdateStoryResult,
  DeleteStoryResult,
} from '../types/story'

interface RawStoryWatch {
  id: string
  brand: string
  model: string
  reference_number: string
  slug: string
  image_url: string | null
}

interface RawStoryRow {
  id: string
  user_id: string
  watch_id: string | null
  personal_watch_brand: string
  personal_watch_model: string
  personal_watch_reference: string | null
  slug: string
  title: string
  story_text: string
  photo_url: string | null
  status: StoryStatus
  published_at: string | null
  created_at: string
  updated_at: string
  likes_count?: number
  comments_count?: number
  author: Profile | Profile[] | null
  watch?: RawStoryWatch | RawStoryWatch[] | null
}

export const STORY_SELECT_FIELDS = `
  id,
  user_id,
  watch_id,
  personal_watch_brand,
  personal_watch_model,
  personal_watch_reference,
  slug,
  title,
  story_text,
  photo_url,
  status,
  published_at,
  created_at,
  updated_at,
  likes_count,
  comments_count,
  author:profiles (*),
  watch:watches (
    id,
    brand,
    model,
    reference_number,
    slug,
    image_url
  )
`

export function normalizeStoryRow(row: RawStoryRow): StoryWithAuthorAndWatch | null {
  const authorRecord = Array.isArray(row.author) ? row.author[0] : row.author
  const rawWatchRecord = Array.isArray(row.watch) ? row.watch[0] : row.watch

  if (!authorRecord) {
    return null
  }

  const watchRecord: StoryArchiveWatch | null =
    rawWatchRecord && rawWatchRecord.id
      ? {
          id: rawWatchRecord.id,
          brand: rawWatchRecord.brand,
          model: rawWatchRecord.model,
          reference_number: rawWatchRecord.reference_number,
          slug: rawWatchRecord.slug,
          image_url: rawWatchRecord.image_url ?? null,
        }
      : null

  return {
    id: row.id,
    user_id: row.user_id,
    watch_id: row.watch_id,
    personal_watch_brand: row.personal_watch_brand || '',
    personal_watch_model: row.personal_watch_model || '',
    personal_watch_reference: row.personal_watch_reference || null,
    slug: row.slug,
    title: row.title,
    story_text: row.story_text,
    photo_url: row.photo_url,
    status: row.status,
    published_at: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    likes_count: typeof row.likes_count === 'number' ? row.likes_count : 0,
    comments_count: typeof row.comments_count === 'number' ? row.comments_count : 0,
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

const ALLOWED_PHOTO_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

/**
 * Upload an authenticated collector's real watch photograph to Supabase Storage.
 * Stores photos under: story-photos/{userId}/{timestamp}-{uuid}.{ext}
 * Enforces strict MIME type (JPEG, PNG, WebP) and 10MB size limits.
 */
export async function uploadStoryPhoto(
  userId: string,
  file: File
): Promise<UploadStoryPhotoResult> {
  const cleanUserId = typeof userId === 'string' ? userId.trim() : ''
  if (!cleanUserId) {
    return {
      publicUrl: null,
      filePath: null,
      error: new Error('A valid user ID is required to upload a story photo.'),
      isConfigured: isSupabaseConfigured,
    }
  }

  if (!file) {
    return {
      publicUrl: null,
      filePath: null,
      error: new Error('A photo file is required.'),
      isConfigured: isSupabaseConfigured,
    }
  }

  const extension = ALLOWED_PHOTO_MIME_TYPES[file.type]
  if (!extension) {
    return {
      publicUrl: null,
      filePath: null,
      error: new Error('Invalid file format. Please upload a JPEG, PNG, or WebP photograph.'),
      isConfigured: isSupabaseConfigured,
    }
  }

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    return {
      publicUrl: null,
      filePath: null,
      error: new Error('File size exceeds the 10MB limit. Please upload an image under 10MB.'),
      isConfigured: isSupabaseConfigured,
    }
  }

  if (!isSupabaseConfigured) {
    return {
      publicUrl: null,
      filePath: null,
      error: new Error('Supabase project credentials not configured in environment variables.'),
      isConfigured: false,
    }
  }

  try {
    const uniqueId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15)

    const fileName = `${Date.now()}-${uniqueId}.${extension}`
    const storagePath = `${cleanUserId}/${fileName}`

    const { data, error: uploadError } = await supabase.storage
      .from('story-photos')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })

    if (uploadError) {
      return {
        publicUrl: null,
        filePath: null,
        error: new Error(uploadError.message),
        isConfigured: true,
      }
    }

    const { data: urlData } = supabase.storage
      .from('story-photos')
      .getPublicUrl(storagePath)

    return {
      publicUrl: urlData?.publicUrl || null,
      filePath: data?.path || storagePath,
      error: null,
      isConfigured: true,
    }
  } catch (err) {
    return {
      publicUrl: null,
      filePath: null,
      error: err instanceof Error ? err : new Error('An unexpected storage error occurred.'),
      isConfigured: true,
    }
  }
}

/**
 * Generates a clean, URL-safe slug from a story title.
 * - Converts to lowercase
 * - Trims whitespace
 * - Strips diacritics / accents
 * - Replaces non-alphanumeric character sequences with a single hyphen
 * - Strips leading and trailing hyphens
 * - Falls back to 'story' if string produces empty slug
 */
export function generateStorySlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return base || 'story'
}

/**
 * Create a community story record for an authenticated collector.
 * Enforces ownership via RLS, generates a collision-resistant unique slug,
 * validates title, text, watch reference, and publication rules.
 *
 * Publication integrity:
 * - Draft: photo_url is optional, published_at is null.
 * - Published: photo_url is required, published_at is set to current timestamp.
 */
export async function createStory(input: CreateStoryInput): Promise<CreateStoryResult> {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: new Error('Supabase project credentials not configured in environment variables.'),
      isConfigured: false,
    }
  }

  // 1. Validate userId
  const cleanUserId = typeof input.userId === 'string' ? input.userId.trim() : ''
  if (!cleanUserId) {
    return {
      data: null,
      error: new Error('A valid user ID is required to create a story.'),
      isConfigured: true,
    }
  }

  // 2. Validate personal_watch_brand
  const cleanBrand =
    typeof input.personal_watch_brand === 'string' ? input.personal_watch_brand.trim() : ''
  if (!cleanBrand) {
    return {
      data: null,
      error: new Error('The watch brand is required.'),
      isConfigured: true,
    }
  }

  // 3. Validate personal_watch_model
  const cleanModel =
    typeof input.personal_watch_model === 'string' ? input.personal_watch_model.trim() : ''
  if (!cleanModel) {
    return {
      data: null,
      error: new Error('The watch model or name is required.'),
      isConfigured: true,
    }
  }

  // Optional personal_watch_reference
  const cleanReference =
    typeof input.personal_watch_reference === 'string' && input.personal_watch_reference.trim()
      ? input.personal_watch_reference.trim()
      : null

  // 4. Validate title
  const cleanTitle = typeof input.title === 'string' ? input.title.trim() : ''
  if (!cleanTitle) {
    return {
      data: null,
      error: new Error('A story title is required.'),
      isConfigured: true,
    }
  }

  // 5. Validate story_text
  const rawStoryText = input.story_text
  const cleanStoryText = typeof rawStoryText === 'string' ? rawStoryText.trim() : ''
  if (!cleanStoryText) {
    return {
      data: null,
      error: new Error('Story text is required.'),
      isConfigured: true,
    }
  }

  // 6. Validate status & publication constraints
  const status: StoryStatus = input.status === 'published' ? 'published' : 'draft'
  const cleanPhotoUrl =
    typeof input.photo_url === 'string' && input.photo_url.trim()
      ? input.photo_url.trim()
      : null

  if (status === 'published' && !cleanPhotoUrl) {
    return {
      data: null,
      error: new Error('A photograph is required to publish a community story.'),
      isConfigured: true,
    }
  }

  try {
    // 7. Generate URL-safe unique slug
    const baseSlug = generateStorySlug(cleanTitle)
    let slug = baseSlug

    // Check if the base slug is already in use
    const { data: existingSlugRow } = await supabase
      .from('stories')
      .select('id')
      .eq('slug', baseSlug)
      .maybeSingle()

    if (existingSlugRow) {
      const uniqueSuffix = (
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2, 10)
      )
        .replace(/-/g, '')
        .slice(0, 8)

      slug = `${baseSlug}-${uniqueSuffix}`
    }

    const cleanWatchId =
      typeof input.watch_id === 'string' && input.watch_id.trim()
        ? input.watch_id.trim()
        : null

    const payload = {
      user_id: cleanUserId,
      watch_id: cleanWatchId,
      personal_watch_brand: cleanBrand,
      personal_watch_model: cleanModel,
      personal_watch_reference: cleanReference,
      slug,
      title: cleanTitle,
      story_text: cleanStoryText,
      photo_url: cleanPhotoUrl,
      status,
      published_at: status === 'published' ? new Date().toISOString() : null,
    }

    let { data, error } = await supabase
      .from('stories')
      .insert(payload)
      .select()
      .single()

    // If a collision occurs concurrently, retry with a unique suffix
    if (error && (error.code === '23505' || error.message.includes('slug'))) {
      const fallbackSuffix = (
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : Math.random().toString(36).substring(2, 10)
      )
        .replace(/-/g, '')
        .slice(0, 8)

      slug = `${baseSlug}-${fallbackSuffix}`
      const retry = await supabase
        .from('stories')
        .insert({ ...payload, slug })
        .select()
        .single()

      data = retry.data
      error = retry.error
    }

    if (error) {
      return {
        data: null,
        error: new Error(error.message),
        isConfigured: true,
      }
    }

    return {
      data: data as Story,
      error: null,
      isConfigured: true,
    }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('An unexpected database error occurred.'),
      isConfigured: true,
    }
  }
}

/**
 * Update an existing story owned by the authenticated collector.
 * Enforces ownership via RLS and userId verification.
 * Preserves publication integrity constraints.
 */
export async function updateStory(
  userId: string,
  storyId: string,
  input: UpdateStoryInput
): Promise<UpdateStoryResult> {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: new Error('Supabase project credentials not configured in environment variables.'),
      isConfigured: false,
    }
  }

  const cleanUserId = typeof userId === 'string' ? userId.trim() : ''
  if (!cleanUserId) {
    return {
      data: null,
      error: new Error('A valid user ID is required to update a story.'),
      isConfigured: true,
    }
  }

  const cleanStoryId = typeof storyId === 'string' ? storyId.trim() : ''
  if (!cleanStoryId) {
    return {
      data: null,
      error: new Error('A story ID is required to update a story.'),
      isConfigured: true,
    }
  }

  try {
    // 1. Fetch current story to check ownership and state
    const { data: existing, error: fetchError } = await supabase
      .from('stories')
      .select('*')
      .eq('id', cleanStoryId)
      .eq('user_id', cleanUserId)
      .maybeSingle()

    if (fetchError) {
      return {
        data: null,
        error: new Error(fetchError.message),
        isConfigured: true,
      }
    }

    if (!existing) {
      return {
        data: null,
        error: new Error('Story not found or you do not have permission to modify it.'),
        isConfigured: true,
      }
    }

    // 2. Build update payload
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (input.watch_id !== undefined) {
      payload.watch_id =
        typeof input.watch_id === 'string' && input.watch_id.trim()
          ? input.watch_id.trim()
          : null
    }

    if (input.personal_watch_brand !== undefined) {
      const cleanBrand = input.personal_watch_brand.trim()
      if (!cleanBrand) {
        return {
          data: null,
          error: new Error('Watch brand cannot be empty.'),
          isConfigured: true,
        }
      }
      payload.personal_watch_brand = cleanBrand
    }

    if (input.personal_watch_model !== undefined) {
      const cleanModel = input.personal_watch_model.trim()
      if (!cleanModel) {
        return {
          data: null,
          error: new Error('Watch model cannot be empty.'),
          isConfigured: true,
        }
      }
      payload.personal_watch_model = cleanModel
    }

    if (input.personal_watch_reference !== undefined) {
      payload.personal_watch_reference =
        input.personal_watch_reference && input.personal_watch_reference.trim()
          ? input.personal_watch_reference.trim()
          : null
    }

    if (input.title !== undefined) {
      const cleanTitle = input.title.trim()
      if (!cleanTitle) {
        return {
          data: null,
          error: new Error('Story title cannot be empty.'),
          isConfigured: true,
        }
      }
      payload.title = cleanTitle
    }

    if (input.story_text !== undefined) {
      const cleanStoryText = input.story_text.trim()
      if (!cleanStoryText) {
        return {
          data: null,
          error: new Error('Story text cannot be empty.'),
          isConfigured: true,
        }
      }
      payload.story_text = cleanStoryText
    }

    if (input.photo_url !== undefined) {
      payload.photo_url =
        input.photo_url && input.photo_url.trim() ? input.photo_url.trim() : null
    }

    if (input.status !== undefined) {
      if (input.status !== 'draft' && input.status !== 'published') {
        return {
          data: null,
          error: new Error('Status must be either "draft" or "published".'),
          isConfigured: true,
        }
      }
      payload.status = input.status
    }

    // 3. Maintain publication integrity
    const effectiveStatus: StoryStatus =
      (payload.status as StoryStatus) || (existing.status as StoryStatus)
    const effectivePhotoUrl =
      payload.photo_url !== undefined
        ? (payload.photo_url as string | null)
        : (existing.photo_url as string | null)
    const effectiveTitle = (payload.title as string) || existing.title
    const effectiveStoryText = (payload.story_text as string) || existing.story_text
    const effectiveBrand = (payload.personal_watch_brand as string) || existing.personal_watch_brand
    const effectiveModel = (payload.personal_watch_model as string) || existing.personal_watch_model

    if (effectiveStatus === 'published') {
      if (!effectiveBrand || !effectiveBrand.trim()) {
        return {
          data: null,
          error: new Error('Watch brand cannot be empty.'),
          isConfigured: true,
        }
      }
      if (!effectiveModel || !effectiveModel.trim()) {
        return {
          data: null,
          error: new Error('Watch model cannot be empty.'),
          isConfigured: true,
        }
      }
      if (!effectivePhotoUrl || !effectivePhotoUrl.trim()) {
        return {
          data: null,
          error: new Error('A photograph is required to publish a community story.'),
          isConfigured: true,
        }
      }
      if (!effectiveTitle || !effectiveTitle.trim()) {
        return {
          data: null,
          error: new Error('Story title cannot be empty.'),
          isConfigured: true,
        }
      }
      if (!effectiveStoryText || !effectiveStoryText.trim()) {
        return {
          data: null,
          error: new Error('Story text cannot be empty.'),
          isConfigured: true,
        }
      }
      if (!existing.published_at) {
        payload.published_at = new Date().toISOString()
      }
    }

    // 4. Execute update
    const { data, error } = await supabase
      .from('stories')
      .update(payload)
      .eq('id', cleanStoryId)
      .eq('user_id', cleanUserId)
      .select()
      .single()

    if (error) {
      return {
        data: null,
        error: new Error(error.message),
        isConfigured: true,
      }
    }

    return {
      data: data as Story,
      error: null,
      isConfigured: true,
    }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('An unexpected database error occurred.'),
      isConfigured: true,
    }
  }
}

/**
 * Permanently delete a story owned by the authenticated collector.
 * Enforces ownership via RLS and strict userId verification.
 * Automatically cascades associated likes, bookmarks, and comments in PostgreSQL.
 * Attempts non-blocking Supabase Storage cleanup for the story photo if present.
 */
export async function deleteStory(
  userId: string,
  storyId: string
): Promise<DeleteStoryResult> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      error: new Error('Supabase project credentials not configured in environment variables.'),
      isConfigured: false,
    }
  }

  const cleanUserId = typeof userId === 'string' ? userId.trim() : ''
  if (!cleanUserId) {
    return {
      success: false,
      error: new Error('A valid user ID is required to delete a story.'),
      isConfigured: true,
    }
  }

  const cleanStoryId = typeof storyId === 'string' ? storyId.trim() : ''
  if (!cleanStoryId) {
    return {
      success: false,
      error: new Error('A story ID is required to delete a story.'),
      isConfigured: true,
    }
  }

  try {
    // 1. Resolve and validate story ownership and existing photo URL
    const { data: existing, error: fetchError } = await supabase
      .from('stories')
      .select('id, user_id, photo_url')
      .eq('id', cleanStoryId)
      .eq('user_id', cleanUserId)
      .maybeSingle()

    if (fetchError) {
      return {
        success: false,
        error: new Error(fetchError.message),
        isConfigured: true,
      }
    }

    if (!existing) {
      return {
        success: false,
        error: new Error('Story not found or you do not have permission to delete it.'),
        isConfigured: true,
      }
    }

    // 2. Delete database story (Postgres ON DELETE CASCADE purges interactions atomically)
    const { error: deleteError } = await supabase
      .from('stories')
      .delete()
      .eq('id', cleanStoryId)
      .eq('user_id', cleanUserId)

    if (deleteError) {
      return {
        success: false,
        error: new Error(deleteError.message),
        isConfigured: true,
      }
    }

    // 3. Attempt non-blocking Storage cleanup afterward if photo exists in story-photos bucket
    if (existing.photo_url && typeof existing.photo_url === 'string') {
      try {
        const bucketMarker = '/story-photos/'
        const markerIndex = existing.photo_url.indexOf(bucketMarker)
        if (markerIndex !== -1) {
          const rawPath = existing.photo_url.substring(markerIndex + bucketMarker.length).split('?')[0]
          const decodedPath = decodeURIComponent(rawPath)
          // Ensure path is safely within the owner's storage directory
          if (decodedPath && decodedPath.startsWith(`${cleanUserId}/`)) {
            await supabase.storage.from('story-photos').remove([decodedPath])
          }
        }
      } catch {
        // Storage cleanup failures MUST NOT block successful database deletion
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
      error: err instanceof Error ? err : new Error('An unexpected database error occurred.'),
      isConfigured: true,
    }
  }
}
