import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Profile, ProfileResult, UpdateProfileData } from '../types/auth'

/**
 * Validates a username according to platform rules:
 * - 3 to 20 characters long
 * - Letters, numbers, and underscores only
 * - Trimmed, no spaces
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  const trimmed = username.trim()

  if (!trimmed) {
    return { valid: false, error: 'Username is required.' }
  }

  if (trimmed.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters long.' }
  }

  if (trimmed.length > 20) {
    return { valid: false, error: 'Username cannot exceed 20 characters.' }
  }

  const validCharsRegex = /^[a-zA-Z0-9_]+$/
  if (!validCharsRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'Username can only contain letters, numbers, and underscores (_).',
    }
  }

  return { valid: true }
}

/**
 * Check if a username is available in public.profiles.
 */
export async function isUsernameAvailable(
  username: string,
  excludeUserId?: string
): Promise<{ available: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { available: true }
  }

  try {
    const normalized = username.trim().toLowerCase()
    let query = supabase
      .from('profiles')
      .select('id')
      .ilike('username', normalized)

    if (excludeUserId) {
      query = query.neq('id', excludeUserId)
    }

    const { data, error } = await query

    if (error) {
      return { available: false, error: error.message }
    }

    return { available: !data || data.length === 0 }
  } catch (err) {
    return {
      available: false,
      error: err instanceof Error ? err.message : 'Unable to verify username availability.',
    }
  }
}

/**
 * Fetch a profile by authenticated user UUID.
 */
export async function fetchProfileById(userId: string): Promise<ProfileResult> {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: new Error('Supabase project credentials not configured.'),
    }
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      return { data: null, error: new Error(error.message) }
    }

    return { data: data as Profile | null, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('An unexpected network error occurred.'),
    }
  }
}

/**
 * Create or update an authenticated user's profile.
 */
export async function upsertProfile(
  userId: string,
  updates: UpdateProfileData
): Promise<ProfileResult> {
  if (!isSupabaseConfigured) {
    return {
      data: null,
      error: new Error('Supabase project credentials not configured.'),
    }
  }

  try {
    const payload: Record<string, unknown> = {
      id: userId,
      updated_at: new Date().toISOString(),
    }

    if (updates.username !== undefined) {
      payload.username = updates.username.trim().toLowerCase()
    }
    if (updates.display_name !== undefined) {
      payload.display_name = updates.display_name ? updates.display_name.trim() : null
    }
    if (updates.bio !== undefined) {
      payload.bio = updates.bio ? updates.bio.trim() : null
    }
    if (updates.avatar_url !== undefined) {
      payload.avatar_url = updates.avatar_url ? updates.avatar_url.trim() : null
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload)
      .select()
      .single()

    if (error) {
      return { data: null, error: new Error(error.message) }
    }

    return { data: data as Profile, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Failed to update profile.'),
    }
  }
}
