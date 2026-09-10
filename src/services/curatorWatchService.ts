/**
 * MOERI & JEANNERET — CURATOR WATCH SERVICE
 *
 * Curator-only database operations for the watch archive.
 * All mutations are protected at the database level by RLS policies
 * that check public.is_curator(). Unauthorized calls will be rejected
 * by Supabase before any data is modified.
 *
 * NEVER bypass this service to call supabase.rpc() with service_role.
 * NEVER expose service_role credentials in VITE environment variables.
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Watch } from '../types/watch'

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

export type WatchStatus = 'draft' | 'published' | 'archived'

export interface CuratorWatchResult {
  data: Watch | null
  error: Error | null
}

export interface CuratorWatchesResult {
  data: Watch[] | null
  error: Error | null
}

export interface PhotoUploadResult {
  path: string | null
  publicUrl: string | null
  error: Error | null
}

/** Fields the curator may supply when creating or updating a watch. */
export interface WatchDraftPayload {
  brand: string
  model: string
  reference_number: string
  slug: string
  description?: string | null
  price?: number | null
  currency?: string
  movement_type?: string | null
  movement_name?: string | null
  calibre?: string | null
  case_diameter_mm?: number | null
  case_thickness_mm?: number | null
  lug_to_lug_mm?: number | null
  case_material?: string | null
  crystal?: string | null
  water_resistance_m?: number | null
  power_reserve_hours?: number | null
  bracelet_or_strap?: string | null
  release_year?: number | null
  category?: string | null
  style?: string | null
  image_url?: string | null
  // Provenance
  image_source_name?: string | null
  image_source_url?: string | null
  image_verification_status?: 'pending' | 'verified' | null
  image_verified_at?: string | null
  image_usage_note?: string | null
}

// ------------------------------------------------------------------
// Reads (curator sees all statuses through RLS)
// ------------------------------------------------------------------

/**
 * Fetch all archive watches for the curator dashboard.
 * RLS policy returns draft + published + archived to curators,
 * and only published to public users.
 */
export async function curatorFetchAllWatches(
  statusFilter?: WatchStatus
): Promise<CuratorWatchesResult> {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase not configured.') }
  }

  try {
    let query = supabase
      .from('watches')
      .select('*')
      .order('updated_at', { ascending: false })

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query

    if (error) return { data: null, error: new Error(error.message) }
    return { data: data as Watch[], error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unexpected error fetching watches.'),
    }
  }
}

/**
 * Fetch a single watch by slug for the edit form.
 * Curators see all statuses; public users see only published.
 */
export async function curatorFetchWatchBySlug(slug: string): Promise<CuratorWatchResult> {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase not configured.') }
  }

  try {
    const { data, error } = await supabase
      .from('watches')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    if (error) return { data: null, error: new Error(error.message) }
    return { data: data as Watch | null, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unexpected error fetching watch.'),
    }
  }
}

// ------------------------------------------------------------------
// Mutations — all protected by RLS (curator only)
// ------------------------------------------------------------------

/**
 * Create a new watch draft. Status defaults to 'draft' in the database.
 * Will be rejected by RLS if the calling user is not a curator.
 */
export async function curatorCreateDraft(
  payload: WatchDraftPayload
): Promise<CuratorWatchResult> {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase not configured.') }
  }

  try {
    const { data, error } = await supabase
      .from('watches')
      .insert({
        ...payload,
        status: 'draft',
        currency: payload.currency || 'USD',
      })
      .select()
      .single()

    if (error) return { data: null, error: new Error(error.message) }
    return { data: data as Watch, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unexpected error creating draft.'),
    }
  }
}

/**
 * Update any fields on an existing watch.
 * Will be rejected by RLS if the calling user is not a curator.
 */
export async function curatorUpdateWatch(
  id: string,
  updates: Partial<WatchDraftPayload> & { status?: WatchStatus }
): Promise<CuratorWatchResult> {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error('Supabase not configured.') }
  }

  try {
    const { data, error } = await supabase
      .from('watches')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) return { data: null, error: new Error(error.message) }
    return { data: data as Watch, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Unexpected error updating watch.'),
    }
  }
}

/**
 * Publish a draft or archived watch.
 * Sets status = 'published' making it visible to all users through RLS.
 */
export async function curatorPublishWatch(id: string): Promise<CuratorWatchResult> {
  return curatorUpdateWatch(id, { status: 'published' })
}

/**
 * Revert a published watch back to draft.
 */
export async function curatorUnpublishWatch(id: string): Promise<CuratorWatchResult> {
  return curatorUpdateWatch(id, { status: 'draft' })
}

/**
 * Archive a watch (soft-delete equivalent).
 * Sets status = 'archived' making it invisible to public users.
 * The record is preserved in the database.
 */
export async function curatorArchiveWatch(id: string): Promise<CuratorWatchResult> {
  return curatorUpdateWatch(id, { status: 'archived' })
}

// ------------------------------------------------------------------
// Photo upload — archive-photos bucket
// ------------------------------------------------------------------

const ARCHIVE_PHOTOS_BUCKET = 'archive-photos'
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

/**
 * Validate a file before upload.
 * Returns an error string if invalid, or null if valid.
 */
export function validateArchivePhoto(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return `Unsupported file type "${file.type}". Allowed: JPEG, PNG, WebP.`
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1)
    return `File size ${mb} MB exceeds the 10 MB limit.`
  }
  return null
}

/**
 * Upload a verified photograph to the archive-photos bucket.
 *
 * Path pattern: watches/<slug>/<timestamp>_<uuid8>.<ext>
 * Uses upsert: false — will error if the exact path already exists.
 * This prevents accidental overwrites.
 *
 * Will be rejected by Storage RLS if the calling user is not a curator.
 */
export async function uploadArchivePhoto(
  file: File,
  watchSlug: string
): Promise<PhotoUploadResult> {
  if (!isSupabaseConfigured) {
    return { path: null, publicUrl: null, error: new Error('Supabase not configured.') }
  }

  const validationError = validateArchivePhoto(file)
  if (validationError) {
    return { path: null, publicUrl: null, error: new Error(validationError) }
  }

  const ext = file.type === 'image/jpeg'
    ? 'jpg'
    : file.type === 'image/png'
      ? 'png'
      : 'webp'

  const timestamp = Date.now()
  const uuid8 = crypto.randomUUID().slice(0, 8)
  const path = `watches/${watchSlug}/${timestamp}_${uuid8}.${ext}`

  try {
    const { error: uploadError } = await supabase.storage
      .from(ARCHIVE_PHOTOS_BUCKET)
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return {
        path: null,
        publicUrl: null,
        error: new Error(uploadError.message),
      }
    }

    const { data: urlData } = supabase.storage
      .from(ARCHIVE_PHOTOS_BUCKET)
      .getPublicUrl(path)

    return {
      path,
      publicUrl: urlData.publicUrl,
      error: null,
    }
  } catch (err) {
    return {
      path: null,
      publicUrl: null,
      error: err instanceof Error ? err : new Error('Unexpected error uploading photograph.'),
    }
  }
}
