import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { getAllTopics } from '../data/watch101'
import type { Watch } from '../types/watch'
import type { Watch101Topic } from '../types/watch101'
import type { UnifiedSearchResults } from '../types/search'

/**
 * Search watches in the central Supabase public.watches table using ILIKE pattern matching.
 * Matches brand, model, reference number, calibre, case material, category, and style.
 */
export async function searchWatches(
  query: string
): Promise<{ data: Watch[]; error: Error | null }> {
  const trimmed = query.trim()
  if (!trimmed) {
    return { data: [], error: null }
  }

  if (!isSupabaseConfigured) {
    return {
      data: [],
      error: new Error('Supabase project credentials not configured in environment variables.'),
    }
  }

  // Sanitize query to prevent PostgREST syntax errors with commas or parentheses
  const sanitized = trimmed.replace(/[,()]/g, ' ').trim()
  if (!sanitized) {
    return { data: [], error: null }
  }

  try {
    const pattern = `%${sanitized}%`
    const { data, error } = await supabase
      .from('watches')
      .select('*')
      .or(
        `brand.ilike.${pattern},` +
        `model.ilike.${pattern},` +
        `reference_number.ilike.${pattern},` +
        `calibre.ilike.${pattern},` +
        `case_material.ilike.${pattern},` +
        `category.ilike.${pattern},` +
        `style.ilike.${pattern}`
      )
      .order('brand', { ascending: true })

    if (error) {
      return { data: [], error: new Error(error.message) }
    }

    const watches = ((data as Watch[]) || []).slice().sort((a, b) => {
      const brandCmp = a.brand.localeCompare(b.brand)
      if (brandCmp !== 0) return brandCmp
      return a.model.localeCompare(b.model)
    })

    return { data: watches, error: null }
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error('Unexpected error querying watches.'),
    }
  }
}

/**
 * Search Watch 101 educational lessons in-memory without duplicating watch data.
 * Matches title, short description, category, and keywords.
 */
export function searchTopics(query: string): Watch101Topic[] {
  const q = query.toLowerCase().trim()
  if (!q) {
    return []
  }

  return getAllTopics().filter((topic) => {
    const titleMatch = topic.title.toLowerCase().includes(q)
    const descMatch = topic.shortDescription.toLowerCase().includes(q)
    const catMatch = topic.category.toLowerCase().includes(q)
    const keywordMatch = topic.keywords.some((kw) => kw.toLowerCase().includes(q))
    return titleMatch || descMatch || catMatch || keywordMatch
  })
}

/**
 * Execute unified search across central watches table and Watch 101 Academy.
 */
export async function searchAll(
  query: string
): Promise<{ data: UnifiedSearchResults; error: Error | null }> {
  const trimmed = query.trim()
  if (!trimmed) {
    return {
      data: { watches: [], topics: [] },
      error: null,
    }
  }

  const [watchRes, topics] = await Promise.all([
    searchWatches(trimmed),
    Promise.resolve(searchTopics(trimmed)),
  ])

  return {
    data: {
      watches: watchRes.data,
      topics,
    },
    error: watchRes.error,
  }
}
