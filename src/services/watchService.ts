import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Watch } from '../types/watch'

export interface FetchWatchesResult {
  data: Watch[] | null
  error: Error | null
  isConfigured: boolean
}

export interface FetchWatchResult {
  data: Watch | null
  error: Error | null
  isConfigured: boolean
}

/**
 * Fetch published watches intended for public display.
 * Explicitly filters for status = 'published' so draft or archived
 * curator records are never surfaced in public feeds.
 */
export async function fetchPublishedWatches(limit?: number): Promise<FetchWatchesResult> {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: new Error('Supabase project credentials not configured in environment variables.'),
      isConfigured: false,
    }
  }

  try {
    let query = supabase
      .from('watches')
      .select('*')
      .eq('status', 'published')
      .order('brand', { ascending: true })

    if (typeof limit === 'number' && limit > 0) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      return {
        data: null,
        error: new Error(error.message),
        isConfigured: true,
      }
    }

    return {
      data: data as Watch[],
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
 * Fetch all watches from the central Supabase Watch Database.
 */
export async function fetchWatches(): Promise<FetchWatchesResult> {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: new Error('Supabase project credentials not configured in environment variables.'),
      isConfigured: false,
    }
  }

  try {
    const { data, error } = await supabase
      .from('watches')
      .select('*')
      .order('brand', { ascending: true })

    if (error) {
      return {
        data: null,
        error: new Error(error.message),
        isConfigured: true,
      }
    }

    return {
      data: data as Watch[],
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
 * Fetch a single watch record by its unique slug.
 */
export async function fetchWatchBySlug(slug: string): Promise<FetchWatchResult> {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: new Error('Supabase project credentials not configured in environment variables.'),
      isConfigured: false,
    }
  }

  try {
    const { data, error } = await supabase
      .from('watches')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    if (error) {
      return {
        data: null,
        error: new Error(error.message),
        isConfigured: true,
      }
    }

    return {
      data: data as Watch | null,
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
 * Fetch a random watch from the central Supabase Watch Database.
 * If excludeId is provided and multiple watches exist, excludes that watch ID
 * so consecutive draws produce distinct specimens.
 */
export async function fetchRandomWatch(excludeId?: string): Promise<FetchWatchResult> {
  const result = await fetchWatches()

  if (result.error || !result.data) {
    return {
      data: null,
      error: result.error,
      isConfigured: result.isConfigured,
    }
  }

  const allWatches = result.data

  if (allWatches.length === 0) {
    return {
      data: null,
      error: null,
      isConfigured: result.isConfigured,
    }
  }

  // Filter out the excluded watch if more than one watch exists
  const candidates =
    excludeId && allWatches.length > 1
      ? allWatches.filter((w) => w.id !== excludeId)
      : allWatches

  const selectedPool = candidates.length > 0 ? candidates : allWatches
  const randomIndex = Math.floor(Math.random() * selectedPool.length)
  const randomWatch = selectedPool[randomIndex]

  return {
    data: randomWatch,
    error: null,
    isConfigured: true,
  }
}
