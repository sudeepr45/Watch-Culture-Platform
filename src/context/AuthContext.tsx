import {
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type {
  Profile,
  SignUpData,
  SignInData,
  UpdateProfileData,
  AuthResult,
} from '../types/auth'
import {
  fetchProfileById,
  upsertProfile,
  isUsernameAvailable,
  validateUsername,
} from '../services/profileService'
import { AuthContext } from './authContextDef'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(() => isSupabaseConfigured)
  const [isCurator, setIsCurator] = useState(false)

  // Fetch or safely auto-provision profile for an authenticated user
  const loadProfile = useCallback(async (authUser: User) => {
    try {
      const res = await fetchProfileById(authUser.id)
      if (res.data) {
        setProfile(res.data)
        return
      }

      // If no profile exists yet in the database (e.g. trigger not installed), auto-provision
      const defaultUsername =
        (authUser.user_metadata?.username as string) ||
        `collector_${authUser.id.slice(0, 8)}`
      const defaultDisplayName =
        (authUser.user_metadata?.display_name as string) ||
        (authUser.user_metadata?.full_name as string) ||
        'Watch Enthusiast'

      const created = await upsertProfile(authUser.id, {
        username: defaultUsername,
        display_name: defaultDisplayName,
      })

      if (created.data) {
        setProfile(created.data)
      }
    } catch (err) {
      console.error('[Auth] Error loading user profile:', err)
    }
  }, [])

  // Check whether the current authenticated user is a curator.
  // Calls the public.is_curator() SECURITY DEFINER RPC on the database.
  // This result is UX-only; the real authorization boundary is database RLS.
  const checkCuratorStatus = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setIsCurator(false)
      return
    }
    try {
      const { data, error } = await supabase.rpc('is_curator')
      if (!error && data === true) {
        setIsCurator(true)
      } else {
        setIsCurator(false)
      }
    } catch {
      setIsCurator(false)
    }
  }, [])

  // Initialize active session on mount
  useEffect(() => {
    let isMounted = true

    if (!isSupabaseConfigured) {
      return
    }

    // Get current session
    supabase.auth
      .getSession()
      .then(async ({ data: { session: initialSession } }) => {
        if (!isMounted) return

        if (initialSession?.user) {
          setSession(initialSession)
          setUser(initialSession.user)
          await loadProfile(initialSession.user)
          await checkCuratorStatus()
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('[Auth] Error fetching initial session:', err)
        if (isMounted) setLoading(false)
      })

    // Listen to real-time auth state transitions
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return

      setSession(newSession)
      setUser(newSession?.user || null)

      if (newSession?.user) {
        await loadProfile(newSession.user)
        await checkCuratorStatus()
      } else {
        setProfile(null)
        setIsCurator(false)
      }
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [loadProfile, checkCuratorStatus])

  // Sign In with email & password
  const signIn = async ({ email, password }: SignInData): Promise<AuthResult> => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Supabase credentials are not configured in your environment variables.',
      }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.user) {
        setUser(data.user)
        setSession(data.session)
        await loadProfile(data.user)
      }

      return { success: true }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'An unexpected login error occurred.',
      }
    }
  }

  // Sign Up with email, password, username, and optional display name
  const signUp = async ({
    email,
    password,
    username,
    displayName,
  }: SignUpData): Promise<AuthResult> => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Supabase credentials are not configured in your environment variables.',
      }
    }

    // Validate username format
    const validation = validateUsername(username)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Check username uniqueness
    const availability = await isUsernameAvailable(username)
    if (!availability.available) {
      return {
        success: false,
        error: availability.error || `The username @${username} is already taken. Please choose another.`,
      }
    }

    try {
      const normalizedUsername = username.trim().toLowerCase()
      const effectiveDisplayName = displayName?.trim() || 'Watch Collector'

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            username: normalizedUsername,
            display_name: effectiveDisplayName,
          },
        },
      })

      if (error) {
        return { success: false, error: error.message }
      }

      // Check if email confirmation is required by Supabase
      if (data.user && !data.session) {
        return { success: true, requiresConfirmation: true }
      }

      // If user is directly logged in, ensure profile is saved
      if (data.user && data.session) {
        setUser(data.user)
        setSession(data.session)
        const profileResult = await upsertProfile(data.user.id, {
          username: normalizedUsername,
          display_name: effectiveDisplayName,
        })
        if (profileResult.data) {
          setProfile(profileResult.data)
        }
      }

      return { success: true, requiresConfirmation: false }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create account.',
      }
    }
  }

  // Sign Out
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('[Auth] Sign out error:', err)
    } finally {
      setUser(null)
      setSession(null)
      setProfile(null)
    }
  }

  // Refresh current user's profile from database
  const refreshProfile = async () => {
    if (!user) return
    const res = await fetchProfileById(user.id)
    if (res.data) {
      setProfile(res.data)
    }
  }

  // Update profile attributes
  const updateProfile = async (
    updates: UpdateProfileData
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User is not authenticated.' }
    }

    // If username is being changed, validate it
    if (updates.username && updates.username !== profile?.username) {
      const validation = validateUsername(updates.username)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      const availability = await isUsernameAvailable(updates.username, user.id)
      if (!availability.available) {
        return {
          success: false,
          error: `The username @${updates.username} is already taken.`,
        }
      }
    }

    const res = await upsertProfile(user.id, updates)
    if (res.error) {
      return { success: false, error: res.error.message }
    }

    if (res.data) {
      setProfile(res.data)
    }

    return { success: true }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isAuthenticated: Boolean(user),
        isCurator,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
