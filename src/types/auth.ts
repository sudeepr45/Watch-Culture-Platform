export interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface SignUpData {
  email: string
  password: string
  username: string
  displayName?: string
}

export interface SignInData {
  email: string
  password: string
}

export interface UpdateProfileData {
  username?: string
  display_name?: string | null
  bio?: string | null
  avatar_url?: string | null
}

export interface AuthResult {
  success: boolean
  error?: string
  requiresConfirmation?: boolean
}

export interface ProfileResult {
  data: Profile | null
  error: Error | null
}
