export type TopicCategory = 'foundations' | 'complications' | 'materials' | 'language'

export interface TopicCategoryMeta {
  id: TopicCategory
  label: string
  shortLabel: string
  description: string
}

export type InteractiveWidgetType =
  | 'automatic-vs-quartz'
  | 'water-resistance'
  | 'case-size'
  | 'gmt'
  | 'chronograph'
  | 'power-reserve'

export interface Watch101Topic {
  id: string
  slug: string
  title: string
  category: TopicCategory
  shortDescription: string
  readTimeMinutes: number
  keywords: string[]
  tenSecondAnswer: string
  deeperExplanation: {
    lead: string
    paragraphs: string[]
    keyTakeaways?: string[]
  }
  whyItMatters: string
  interactiveType?: InteractiveWidgetType
  watchSlugs?: string[] // References into public.watches
  relatedTopicSlugs: string[]
  battleSuggestion?: {
    watch1Slug: string
    watch2Slug: string
    label: string
    prompt: string
  }
}
