import { createContext } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import type {
  Profile,
  SignUpData,
  SignInData,
  UpdateProfileData,
  AuthResult,
} from '../types/auth'

export interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
  signIn: (data: SignInData) => Promise<AuthResult>
  signUp: (data: SignUpData) => Promise<AuthResult>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  updateProfile: (data: UpdateProfileData) => Promise<{ success: boolean; error?: string }>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
