import type { Profile } from './auth'
import type { Watch } from './watch'

export type StoryStatus = 'draft' | 'published'

export interface Story {
  id: string
  user_id: string
  watch_id: string
  slug: string
  title: string
  story_text: string
  photo_url: string | null
  status: StoryStatus
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface StoryWithAuthorAndWatch extends Story {
  author: Profile
  watch: Watch
}

export interface FetchStoriesResult {
  data: StoryWithAuthorAndWatch[] | null
  error: Error | null
  isConfigured: boolean
}

export interface FetchStoryResult {
  data: StoryWithAuthorAndWatch | null
  error: Error | null
  isConfigured: boolean
}
