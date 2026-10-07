import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type {
  Bulletin,
  BulletinEra,
  BulletinRelatedWatch,
  BulletinWithRelatedWatch,
} from './bulletinService'
import { BULLETIN_IMAGES_BUCKET } from './bulletinService'

export type { BulletinEra } from './bulletinService'

export type BulletinCategory = 'Market' | 'Auction' | 'Release' | 'History' | 'Note'

export interface CreateBulletinInput {
  title: string
  body: string
  era: BulletinEra
  category: BulletinCategory
  slug: string
  cover_image?: string | null
  related_watch_id?: string | null
  published_at?: string | null
}

export interface UpdateBulletinInput {
  title?: string
  body?: string
  era?: BulletinEra
  category?: BulletinCategory
  slug?: string
  cover_image?: string | null
  related_watch_id?: string | null
  published_at?: string | null
}

export interface CuratorBulletinsResult {
  data: CuratorBulletinListItem[] | null
  error: Error | null
  isConfigured: boolean
}

export interface CuratorBulletinListItem {
  id: string
  bulletin_number: number
  slug: string
  title: string
  era: BulletinEra
  category: BulletinCategory
  cover_image: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface CuratorBulletinResult {
  data: BulletinWithRelatedWatch | null
  error: Error | null
  isConfigured: boolean
}

export interface CuratorBulletinMutationResult {
  data: Bulletin | null
  error: Error | null
  isConfigured: boolean
}

export interface DeleteCuratorBulletinResult {
  success: boolean
  error: Error | null
  isConfigured: boolean
}

export interface UploadBulletinImagesResult {
  success: boolean
  error: Error | null
}

export interface BulletinPhotoUpload {
  file: File
  uploadId: string
}

const BULLETIN_IMAGE_FORMATS: Record<string, { mimeType: string; extension: string }> = {
  'image/jpeg': { mimeType: 'image/jpeg', extension: 'jpg' },
  'image/jpg': { mimeType: 'image/jpeg', extension: 'jpg' },
  'image/png': { mimeType: 'image/png', extension: 'png' },
  'image/webp': { mimeType: 'image/webp', extension: 'webp' },
}
const BULLETIN_IMAGE_EXTENSIONS: Record<string, { mimeType: string; extension: string }> = {
  '.jpg': { mimeType: 'image/jpeg', extension: 'jpg' },
  '.jpeg': { mimeType: 'image/jpeg', extension: 'jpg' },
  '.png': { mimeType: 'image/png', extension: 'png' },
  '.webp': { mimeType: 'image/webp', extension: 'webp' },
}
const MAX_BULLETIN_IMAGE_SIZE_BYTES = 10 * 1024 * 1024

function getBulletinPhotoFormat(file: File) {
  const declaredType = file.type.trim().toLowerCase().split(';', 1)[0]
  return BULLETIN_IMAGE_FORMATS[declaredType] ??
    BULLETIN_IMAGE_EXTENSIONS[file.name.slice(file.name.lastIndexOf('.')).toLowerCase()] ??
    null
}

export function validateBulletinPhoto(file: File): string | null {
  if (file.size > MAX_BULLETIN_IMAGE_SIZE_BYTES) {
    return 'Image exceeds the 10 MB per-image limit.'
  }
  if (!getBulletinPhotoFormat(file)) {
    return 'Use a JPEG, PNG, or WebP image.'
  }
  return null
}

interface RawBulletinWithRelatedWatch extends Bulletin {
  related_watch: BulletinRelatedWatch | BulletinRelatedWatch[] | null
}

const BULLETIN_LIST_FIELDS = `
  id,
  bulletin_number,
  slug,
  title,
  era,
  category,
  cover_image,
  published_at,
  created_at,
  updated_at
`

const BULLETIN_DETAIL_FIELDS = `
  id,
  bulletin_number,
  slug,
  title,
  body,
  era,
  category,
  cover_image,
  author_id,
  related_watch_id,
  published_at,
  created_at,
  updated_at,
  related_watch:watches (
    id,
    brand,
    model,
    reference_number,
    slug,
    image_url
  )
`

const BULLETIN_MUTATION_FIELDS = `
  id,
  bulletin_number,
  slug,
  title,
  body,
  era,
  category,
  cover_image,
  author_id,
  related_watch_id,
  published_at,
  created_at,
  updated_at
`

function normalizeRelatedWatch(
  row: RawBulletinWithRelatedWatch
): BulletinWithRelatedWatch {
  const relatedWatch = Array.isArray(row.related_watch)
    ? row.related_watch[0] ?? null
    : row.related_watch

  return {
    ...row,
    related_watch: relatedWatch,
  }
}

function configurationError() {
  return new Error('Supabase project credentials not configured in environment variables.')
}

function unexpectedError(err: unknown) {
  return err instanceof Error ? err : new Error('An unexpected database error occurred.')
}

function getBulletinImagePath(
  bulletinId: string,
  file: File,
  uploadId: string
): string {
  const format = getBulletinPhotoFormat(file)
  if (!format) throw new Error('Use a JPEG, PNG, or WebP image.')
  return `${bulletinId}/${uploadId}.${format.extension}`
}

/** Inspect a database-reserved path and its Storage object through the curator RPC. */
async function reconcileBulletinImagePath(
  bulletinId: string,
  imagePath: string,
  uploadId: string,
  sortOrder: number
): Promise<{ completed: boolean; error: Error | null }> {
  const [folder, ...nameParts] = imagePath.split('/')
  const fileName = nameParts.join('/')
  const expectedFileName = new RegExp(`^${uploadId}\\.(jpg|png|webp)$`, 'i')
  if (folder !== bulletinId || !expectedFileName.test(fileName) || nameParts.length !== 1) {
    return { completed: false, error: new Error('Photo path could not be safely matched to this Bulletin.') }
  }

  try {
    const { data: reservation, error } = await supabase.rpc(
      'inspect_bulletin_image_upload',
      {
        p_bulletin_id: bulletinId,
        p_upload_id: uploadId,
        p_image_path: imagePath,
        p_sort_order: sortOrder,
      }
    )

    if (error) return { completed: false, error: new Error(`Unable to verify the database photo reservation: ${error.message}`) }
    if (!reservation || reservation.image_path !== imagePath || reservation.sort_order !== sortOrder) {
      return { completed: false, error: new Error('No matching database reservation exists for this photo. The Storage object was left untouched.') }
    }
    const objectExists = reservation.object_exists === true

    if (objectExists && (
      reservation.object_bulletin_id !== bulletinId ||
      reservation.object_upload_id !== uploadId
    )) {
      return { completed: false, error: new Error('The existing Storage object does not match this photo upload.') }
    }

    if (objectExists) return { completed: true, error: null }
    if (reservation.upload_status === 'ready') {
      return { completed: false, error: new Error('A ready photo record exists but its Storage object is missing. Resolve the existing photo before retrying.') }
    }
    return { completed: false, error: null }
  } catch (err) {
    return { completed: false, error: unexpectedError(err) }
  }
}

/** Upload images only after a real Bulletin exists, then associate them in selected order. */
async function uploadBulletinImagesWithLock(
  bulletinId: string,
  photos: BulletinPhotoUpload[]
): Promise<UploadBulletinImagesResult> {
  const cleanBulletinId = typeof bulletinId === 'string' ? bulletinId.trim() : ''
  if (!cleanBulletinId) {
    return { success: false, error: new Error('A saved Bulletin ID is required for photo upload.') }
  }
  if (photos.length === 0) return { success: true, error: null }
  if (!isSupabaseConfigured) {
    return { success: false, error: configurationError() }
  }

  for (const { file, uploadId } of photos) {
    const validationError = validateBulletinPhoto(file)
    if (validationError) {
      return { success: false, error: new Error(`${file.name}: ${validationError}`) }
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uploadId)) {
      return { success: false, error: new Error(`Unable to safely identify the photo upload for "${file.name}".`) }
    }
  }

  for (const [sortOrder, { file, uploadId }] of photos.entries()) {
    const imagePath = getBulletinImagePath(cleanBulletinId, file, uploadId)
    const { data: reservationStatus, error: reservationError } = await supabase.rpc(
      'reserve_bulletin_image',
      {
        p_bulletin_id: cleanBulletinId,
        p_upload_id: uploadId,
        p_image_path: imagePath,
        p_sort_order: sortOrder,
      }
    )
    if (reservationError) {
      return { success: false, error: new Error(`Unable to reserve "${file.name}": ${reservationError.message}`) }
    }
    if (reservationStatus !== 'pending' && reservationStatus !== 'ready') {
      return { success: false, error: new Error(`The database returned an invalid reservation state for "${file.name}".`) }
    }
  }

  for (const [sortOrder, { file, uploadId }] of photos.entries()) {
    const imagePath = getBulletinImagePath(cleanBulletinId, file, uploadId)
    const reconciliation = await reconcileBulletinImagePath(cleanBulletinId, imagePath, uploadId, sortOrder)
    if (reconciliation.error) {
      return { success: false, error: new Error(`Unable to safely retry "${file.name}": ${reconciliation.error.message}`) }
    }
    if (reconciliation.completed) {
      continue
    }
    try {
      const { error } = await supabase.storage
        .from(BULLETIN_IMAGES_BUCKET)
        .upload(imagePath, file, {
          cacheControl: '3600',
          contentType: getBulletinPhotoFormat(file)?.mimeType,
          upsert: false,
          metadata: { bulletin_id: cleanBulletinId, photo_upload_id: uploadId },
        })

      if (error) {
        return {
          success: false,
          error: new Error(`Upload failed for "${file.name}": ${error.message} Its reserved photo record remains pending for a safe retry.`),
        }
      }
    } catch (err) {
      const message = unexpectedError(err).message
      return {
        success: false,
        error: new Error(`Upload failed for "${file.name}": ${message} Its reserved photo record remains pending for a safe retry.`),
      }
    }
  }

  try {
    const { error } = await supabase.rpc('finalize_bulletin_images', {
      p_bulletin_id: cleanBulletinId,
      p_upload_ids: photos.map(({ uploadId }) => uploadId),
    })
    if (error) {
      return { success: false, error: new Error(`Photos uploaded but could not be finalized: ${error.message}. Their reserved records remain pending for a safe retry.`) }
    }
    return { success: true, error: null }
  } catch (err) {
    return { success: false, error: unexpectedError(err) }
  }
}

/** Serialize upload and stale-object reconciliation across tabs in this browser origin. */
export async function uploadBulletinImages(
  bulletinId: string,
  photos: BulletinPhotoUpload[]
): Promise<UploadBulletinImagesResult> {
  const cleanBulletinId = typeof bulletinId === 'string' ? bulletinId.trim() : ''
  if (!cleanBulletinId) {
    return { success: false, error: new Error('A saved Bulletin ID is required for photo upload.') }
  }
  if (typeof navigator === 'undefined' || !navigator.locks) {
    return {
      success: false,
      error: new Error('This browser cannot safely coordinate Bulletin photo retries. Use a browser with Web Locks support.'),
    }
  }

  try {
    return await navigator.locks.request(
      `mojean:bulletin-images:${cleanBulletinId}`,
      { mode: 'exclusive' },
      () => uploadBulletinImagesWithLock(cleanBulletinId, photos)
    )
  } catch (err) {
    return { success: false, error: unexpectedError(err) }
  }
}

/** Fetch all curator-visible Bulletins, including drafts, newest first. */
export async function getCuratorBulletins(): Promise<CuratorBulletinsResult> {
  if (!isSupabaseConfigured) {
    return { data: null, error: configurationError(), isConfigured: false }
  }

  try {
    const { data, error } = await supabase
      .from('bulletins')
      .select(BULLETIN_LIST_FIELDS)
      .order('created_at', { ascending: false })

    if (error) return { data: null, error: new Error(error.message), isConfigured: true }
    return { data: (data ?? []) as CuratorBulletinListItem[], error: null, isConfigured: true }
  } catch (err) {
    return { data: null, error: unexpectedError(err), isConfigured: true }
  }
}

/** Fetch a curator-visible Bulletin by UUID, including drafts and its related watch. */
export async function getCuratorBulletinById(id: string): Promise<CuratorBulletinResult> {
  const bulletinId = typeof id === 'string' ? id.trim() : ''
  if (!bulletinId) {
    return {
      data: null,
      error: new Error('A Bulletin ID is required.'),
      isConfigured: isSupabaseConfigured,
    }
  }

  if (!isSupabaseConfigured) {
    return { data: null, error: configurationError(), isConfigured: false }
  }

  try {
    const { data, error } = await supabase
      .from('bulletins')
      .select(BULLETIN_DETAIL_FIELDS)
      .eq('id', bulletinId)
      .maybeSingle()

    if (error) return { data: null, error: new Error(error.message), isConfigured: true }
    return {
      data: data
        ? normalizeRelatedWatch(data as unknown as RawBulletinWithRelatedWatch)
        : null,
      error: null,
      isConfigured: true,
    }
  } catch (err) {
    return { data: null, error: unexpectedError(err), isConfigured: true }
  }
}

/** Create a Bulletin; PostgreSQL generates bulletin_number from its identity. */
export async function createBulletin(
  input: CreateBulletinInput
): Promise<CuratorBulletinMutationResult> {
  if (!isSupabaseConfigured) {
    return { data: null, error: configurationError(), isConfigured: false }
  }

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) {
      return { data: null, error: new Error(userError.message), isConfigured: true }
    }
    if (!userData.user) {
      return {
        data: null,
        error: new Error('An authenticated user is required to create a Bulletin.'),
        isConfigured: true,
      }
    }

    const { data, error } = await supabase
      .from('bulletins')
      .insert({
        title: input.title,
        body: input.body,
        era: input.era,
        category: input.category,
        slug: input.slug,
        cover_image: input.cover_image,
        related_watch_id: input.related_watch_id,
        published_at: input.published_at,
        author_id: userData.user.id,
      })
      .select(BULLETIN_MUTATION_FIELDS)
      .single()

    if (error) return { data: null, error: new Error(error.message), isConfigured: true }
    return { data: data as Bulletin, error: null, isConfigured: true }
  } catch (err) {
    return { data: null, error: unexpectedError(err), isConfigured: true }
  }
}

/** Update only editable Bulletin fields; updated_at remains database-controlled. */
export async function updateBulletin(
  id: string,
  input: UpdateBulletinInput
): Promise<CuratorBulletinMutationResult> {
  const bulletinId = typeof id === 'string' ? id.trim() : ''
  if (!bulletinId) {
    return {
      data: null,
      error: new Error('A Bulletin ID is required.'),
      isConfigured: isSupabaseConfigured,
    }
  }

  if (!isSupabaseConfigured) {
    return { data: null, error: configurationError(), isConfigured: false }
  }

  const updates: UpdateBulletinInput = {}
  if (input.title !== undefined) updates.title = input.title
  if (input.body !== undefined) updates.body = input.body
  if (input.era !== undefined) updates.era = input.era
  if (input.category !== undefined) updates.category = input.category
  if (input.slug !== undefined) updates.slug = input.slug
  if (input.cover_image !== undefined) updates.cover_image = input.cover_image
  if (input.related_watch_id !== undefined) updates.related_watch_id = input.related_watch_id
  if (input.published_at !== undefined) updates.published_at = input.published_at

  try {
    const { data, error } = await supabase
      .from('bulletins')
      .update(updates)
      .eq('id', bulletinId)
      .select(BULLETIN_MUTATION_FIELDS)
      .single()

    if (error) return { data: null, error: new Error(error.message), isConfigured: true }
    return { data: data as Bulletin, error: null, isConfigured: true }
  } catch (err) {
    return { data: null, error: unexpectedError(err), isConfigured: true }
  }
}

/** Permanently delete a Bulletin; related watches are not touched. */
export async function deleteBulletin(id: string): Promise<DeleteCuratorBulletinResult> {
  const bulletinId = typeof id === 'string' ? id.trim() : ''
  if (!bulletinId) {
    return {
      success: false,
      error: new Error('A Bulletin ID is required.'),
      isConfigured: isSupabaseConfigured,
    }
  }

  if (!isSupabaseConfigured) {
    return { success: false, error: configurationError(), isConfigured: false }
  }

  try {
    const { data: deletionStarted, error: beginError } = await supabase.rpc(
      'begin_bulletin_deletion',
      { p_bulletin_id: bulletinId }
    )

    if (beginError) {
      return { success: false, error: new Error(beginError.message), isConfigured: true }
    }
    if (!deletionStarted) {
      return {
        success: false,
        error: new Error('Bulletin has photos still uploading. Retry deletion after the photo upload finishes.'),
        isConfigured: true,
      }
    }

    const { data: imagePathsData, error: imageRowsError } = await supabase.rpc(
      'get_bulletin_deletion_image_paths',
      { p_bulletin_id: bulletinId }
    )

    if (imageRowsError) {
      return {
        success: false,
        error: new Error(`Unable to inspect Bulletin photos before deletion: ${imageRowsError.message}`),
        isConfigured: true,
      }
    }

    const imagePaths = (imagePathsData ?? []) as string[]
    if (imagePaths.some((path) => {
      const [folder, ...fileParts] = path.split('/')
      return folder !== bulletinId || fileParts.length !== 1 || !fileParts[0]
    })) {
      return {
        success: false,
        error: new Error('A Bulletin photo path could not be safely matched to this Bulletin. No photos or Bulletin records were deleted.'),
        isConfigured: true,
      }
    }

    if (imagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from(BULLETIN_IMAGES_BUCKET)
        .remove(imagePaths)
      if (storageError) {
        return {
          success: false,
          error: new Error(
            `Unable to remove Bulletin photos from Storage. The Bulletin was not deleted; retry deletion after resolving the storage error: ${storageError.message}`
          ),
          isConfigured: true,
        }
      }
    }

    const { data: deletionFinished, error: finishError } = await supabase.rpc(
      'finish_bulletin_deletion',
      { p_bulletin_id: bulletinId }
    )

    if (finishError) {
      return { success: false, error: new Error(finishError.message), isConfigured: true }
    }
    if (!deletionFinished) return { success: false, error: new Error('Bulletin deletion did not complete.'), isConfigured: true }
    return { success: true, error: null, isConfigured: true }
  } catch (err) {
    return { success: false, error: unexpectedError(err), isConfigured: true }
  }
}
