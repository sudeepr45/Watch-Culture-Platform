import { supabase, isSupabaseConfigured } from '../lib/supabase'

export interface BulletinRelatedWatch {
  id: string
  brand: string
  model: string
  reference_number: string
  slug: string
  image_url: string | null
}

export interface Bulletin {
  id: string
  bulletin_number: number
  slug: string
  title: string
  body: string
  category: 'Market' | 'Auction' | 'Release' | 'History' | 'Note'
  cover_image: string | null
  author_id: string
  related_watch_id: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface BulletinWithRelatedWatch extends Bulletin {
  related_watch: BulletinRelatedWatch | null
}

export interface GetBulletinsResult {
  data: Bulletin[] | null
  error: Error | null
  isConfigured: boolean
}

export interface GetBulletinResult {
  data: BulletinWithRelatedWatch | null
  error: Error | null
  isConfigured: boolean
}

interface RawBulletinWithRelatedWatch extends Bulletin {
  related_watch: BulletinRelatedWatch | BulletinRelatedWatch[] | null
}

const BULLETIN_SELECT_FIELDS = `
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

const BULLETIN_WITH_WATCH_SELECT_FIELDS = `
  ${BULLETIN_SELECT_FIELDS},
  related_watch:watches (
    id,
    brand,
    model,
    reference_number,
    slug,
    image_url
  )
`

function normalizeBulletinWithRelatedWatch(
  row: RawBulletinWithRelatedWatch
): BulletinWithRelatedWatch {
  const watch = Array.isArray(row.related_watch)
    ? row.related_watch[0] ?? null
    : row.related_watch

  return {
    ...row,
    related_watch: watch,
  }
}

/** Fetch all published Bulletins in reverse publication order. */
export async function getPublishedBulletins(): Promise<GetBulletinsResult> {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: new Error('Supabase project credentials not configured in environment variables.'),
      isConfigured: false,
    }
  }

  try {
    const { data, error } = await supabase
      .from('bulletins')
      .select(BULLETIN_SELECT_FIELDS)
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })

    if (error) {
      return { data: null, error: new Error(error.message), isConfigured: true }
    }

    return { data: (data ?? []) as Bulletin[], error: null, isConfigured: true }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('An unexpected network error occurred.'),
      isConfigured: true,
    }
  }
}

/** Fetch one published Bulletin by slug, including its related archive watch. */
export async function getBulletinBySlug(slug: string): Promise<GetBulletinResult> {
  const trimmedSlug = typeof slug === 'string' ? slug.trim() : ''
  if (!trimmedSlug) {
    return {
      data: null,
      error: new Error('A Bulletin slug is required.'),
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
      .from('bulletins')
      .select(BULLETIN_WITH_WATCH_SELECT_FIELDS)
      .eq('slug', trimmedSlug)
      .not('published_at', 'is', null)
      .maybeSingle()

    if (error) {
      return { data: null, error: new Error(error.message), isConfigured: true }
    }

    return {
      data: data
        ? normalizeBulletinWithRelatedWatch(data as unknown as RawBulletinWithRelatedWatch)
        : null,
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

/** Fetch the most recent published Bulletins, limited to the requested count. */
export async function getLatestBulletins(limit: number): Promise<GetBulletinsResult> {
  if (!Number.isFinite(limit) || limit < 0) {
    return {
      data: null,
      error: new Error('A non-negative Bulletin limit is required.'),
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
      .from('bulletins')
      .select(BULLETIN_SELECT_FIELDS)
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false })
      .limit(Math.floor(limit))

    if (error) {
      return { data: null, error: new Error(error.message), isConfigured: true }
    }

    return { data: (data ?? []) as Bulletin[], error: null, isConfigured: true }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('An unexpected network error occurred.'),
      isConfigured: true,
    }
  }
}
