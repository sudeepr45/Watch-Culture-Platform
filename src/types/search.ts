import type { Watch } from './watch'
import type { Watch101Topic } from './watch101'

export type SearchFilter = 'all' | 'watches' | 'topics'

export interface UnifiedSearchResults {
  watches: Watch[]
  topics: Watch101Topic[]
}

export interface SearchResultState {
  data: UnifiedSearchResults
  loading: boolean
  error: string | null
}
