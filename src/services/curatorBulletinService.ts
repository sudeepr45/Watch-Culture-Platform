import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type {
  Bulletin,
  BulletinRelatedWatch,
  BulletinWithRelatedWatch,
} from './bulletinService'

export type BulletinCategory = 'Market' | 'Auction' | 'Release' | 'History' | 'Note'

export interface CreateBulletinInput {
  title: string
  body: string
  category: BulletinCategory
  slug: string
  cover_image?: string | null
  related_watch_id?: string | null
  published_at?: string | null
}

export interface UpdateBulletinInput {
  title?: string
  body?: string
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

interface RawBulletinWithRelatedWatch extends Bulletin {
  related_watch: BulletinRelatedWatch | BulletinRelatedWatch[] | null
}

const BULLETIN_LIST_FIELDS = `
  id,
  bulletin_number,
  slug,
  title,
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
    const { data, error } = await supabase
      .from('bulletins')
      .delete()
      .eq('id', bulletinId)
      .select('id')
      .maybeSingle()

    if (error) return { success: false, error: new Error(error.message), isConfigured: true }
    if (!data) {
      return {
        success: false,
        error: new Error('Bulletin not found or you do not have permission to delete it.'),
        isConfigured: true,
      }
    }
    return { success: true, error: null, isConfigured: true }
  } catch (err) {
    return { success: false, error: unexpectedError(err), isConfigured: true }
  }
}
