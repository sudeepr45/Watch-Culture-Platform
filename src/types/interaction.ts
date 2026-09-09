import type { Profile } from './auth'
import type { StoryWithAuthorAndWatch } from './story'

export interface StoryLike {
  id: string
  story_id: string
  user_id: string
  created_at: string
}

export interface StoryBookmark {
  id: string
  story_id: string
  user_id: string
  created_at: string
}

export interface StoryComment {
  id: string
  story_id: string
  user_id: string
  comment_text: string
  created_at: string
  updated_at: string
}

export interface StoryCommentWithAuthor extends StoryComment {
  author: Profile
}

export interface InteractionActionResult {
  success: boolean
  error: Error | null
  isConfigured: boolean
}

export interface FetchCommentsResult {
  data: StoryCommentWithAuthor[] | null
  error: Error | null
  isConfigured: boolean
}

export interface PostCommentResult {
  data: StoryCommentWithAuthor | null
  error: Error | null
  isConfigured: boolean
}

export interface UpdateCommentResult {
  data: StoryComment | null
  error: Error | null
  isConfigured: boolean
}

export interface FetchBookmarkedStoriesResult {
  data: StoryWithAuthorAndWatch[] | null
  error: Error | null
  isConfigured: boolean
}
