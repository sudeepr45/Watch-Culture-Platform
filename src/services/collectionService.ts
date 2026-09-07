import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type {
  UserWatchWithWatch,
  FetchCollectionResult,
  CollectionActionResult,
  CollectionStatusResult,
} from '../types/collection'
import type { Watch } from '../types/watch'

interface RawUserWatchRow {
  id: string
  user_id: string
  watch_id: string
  created_at: string
  watch: Watch | Watch[] | null
}

/**
 * Fetch all watches in an authenticated collector's wrist collection.
 * Joins the central public.watches table to retrieve full watch specifications and photography.
 */
export async function fetchUserCollection(userId: string): Promise<FetchCollectionResult> {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: new Error('Supabase project credentials not configured in environment variables.'),
      isConfigured: false,
    }
  }

  try {
    const { data, error } = await supabase
      .from('user_watches')
      .select(`
        id,
        user_id,
        watch_id,
        created_at,
        watch:watches (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      return {
        data: null,
        error: new Error(error.message),
        isConfigured: true,
      }
    }

    const rows = (data as unknown as RawUserWatchRow[]) || []
    const items: UserWatchWithWatch[] = rows
      .map((row) => {
        const watchRecord = Array.isArray(row.watch) ? row.watch[0] : row.watch
        return {
          id: row.id,
          user_id: row.user_id,
          watch_id: row.watch_id,
          created_at: row.created_at,
          watch: watchRecord as Watch,
        }
      })
      .filter((item): item is UserWatchWithWatch => Boolean(item.watch))

    return {
      data: items,
      error: null,
      isConfigured: true,
    }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to load wrist collection.'),
      isConfigured: true,
    }
  }
}

/**
 * Check if a specific watch exists in the user's collection.
 */
export async function isWatchInCollection(
  userId: string,
  watchId: string
): Promise<CollectionStatusResult> {
  if (!isSupabaseConfigured) {
    return { inCollection: false }
  }

  try {
    const { data, error } = await supabase
      .from('user_watches')
      .select('id')
      .eq('user_id', userId)
      .eq('watch_id', watchId)
      .maybeSingle()

    if (error) {
      return { inCollection: false, error: error.message }
    }

    return { inCollection: Boolean(data) }
  } catch (err) {
    return {
      inCollection: false,
      error: err instanceof Error ? err.message : 'Error checking collection status.',
    }
  }
}

/**
 * Add a watch to the authenticated collector's wrist collection.
 * The database UNIQUE(user_id, watch_id) constraint protects against duplicates.
 */
export async function addWatchToCollection(
  userId: string,
  watchId: string
): Promise<CollectionActionResult> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      error: 'Supabase credentials are not configured in your environment variables.',
    }
  }

  try {
    const { error } = await supabase.from('user_watches').insert({
      user_id: userId,
      watch_id: watchId,
    })

    if (error) {
      // If duplicate entry error (PostgreSQL unique_violation code 23505)
      if (error.code === '23505' || error.message.includes('unique_user_watch')) {
        return { success: true }
      }
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to add timepiece to wrist.',
    }
  }
}

/**
 * Remove a watch from the authenticated collector's wrist collection.
 */
export async function removeWatchFromCollection(
  userId: string,
  watchId: string
): Promise<CollectionActionResult> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      error: 'Supabase credentials are not configured in your environment variables.',
    }
  }

  try {
    const { error } = await supabase
      .from('user_watches')
      .delete()
      .eq('user_id', userId)
      .eq('watch_id', watchId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to remove timepiece from wrist.',
    }
  }
}
