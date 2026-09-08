import type { Profile } from './auth'
import type { Watch } from './watch'

export type StoryStatus = 'draft' | 'published'

export interface Story {
  id: string
  user_id: string
  watch_id: string | null
  personal_watch_brand: string
  personal_watch_model: string
  personal_watch_reference: string | null
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
  watch?: Watch | null
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

export interface UploadStoryPhotoResult {
  publicUrl: string | null
  filePath: string | null
  error: Error | null
  isConfigured: boolean
}

export interface CreateStoryInput {
  userId: string
  personal_watch_brand: string
  personal_watch_model: string
  personal_watch_reference?: string | null
  title: string
  story_text: string
  photo_url?: string | null
  status?: StoryStatus
}

export interface CreateStoryResult {
  data: Story | null
  error: Error | null
  isConfigured: boolean
}

export interface UpdateStoryInput {
  personal_watch_brand?: string
  personal_watch_model?: string
  personal_watch_reference?: string | null
  title?: string
  story_text?: string
  photo_url?: string | null
  status?: StoryStatus
}

export interface UpdateStoryResult {
  data: Story | null
  error: Error | null
  isConfigured: boolean
}

