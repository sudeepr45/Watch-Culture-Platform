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
