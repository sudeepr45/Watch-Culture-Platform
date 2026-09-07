import type { Watch } from './watch'

export interface UserWatch {
  id: string
  user_id: string
  watch_id: string
  created_at: string
}

export interface UserWatchWithWatch extends UserWatch {
  watch: Watch
}

export interface FetchCollectionResult {
  data: UserWatchWithWatch[] | null
  error: Error | null
  isConfigured: boolean
}

export interface CollectionActionResult {
  success: boolean
  error?: string
}

export interface CollectionStatusResult {
  inCollection: boolean
  error?: string
}
