import { useState, useMemo } from 'react'
import Container from '../components/common/Container'
import { Link } from '../router'
import { getAllTopics, getCategories } from '../data/watch101'
import type { TopicCategory } from '../types/watch101'

export default function Watch101Page() {
  const [selectedCategory, setSelectedCategory] = useState<TopicCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const allTopics = useMemo(() => getAllTopics(), [])
  const categories = useMemo(() => getCategories(), [])

  // Filter topics by category and search query
  const filteredTopics = useMemo(() => {
    let result = allTopics

    if (selectedCategory !== 'all') {
      result = result.filter((t) => t.category === selectedCategory)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.shortDescription.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.keywords.some((kw) => kw.toLowerCase().includes(q))
      )
    }

    return result
  }, [allTopics, selectedCategory, searchQuery])

  // Count topics per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allTopics.length }
    for (const cat of categories) {
      counts[cat.id] = allTopics.filter((t) => t.category === cat.id).length
    }
    return counts
  }, [allTopics, categories])

  // Spotlight topic (first foundations topic: Automatic vs Quartz)
  const spotlightTopic = allTopics[0]

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        {/* Editorial Header */}
        <div className="border-b border-hairline pb-8 mb-12 sm:mb-16">
          <div className="flex items-center gap-2 mb-3 text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-ink-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-hidden="true" />
            <span>ACADEMY &bull; HOROLOGICAL ESSENTIALS</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-ink uppercase">
            Watch 101
          </h1>

          <p className="mt-3 text-lg sm:text-2xl font-display italic text-ink font-normal">
            &ldquo;Learn the stuff watch people argue about.&rdquo;
          </p>

          <p className="mt-3 text-sm sm:text-base text-ink-secondary max-w-3xl font-light leading-relaxed">
            A beginner-friendly curriculum exploring internal movements, complications, case metallurgy, and collector terminology. Designed to make horology straightforward, tangible, and fun.
          </p>
        </div>

        {/* Featured Editorial Spotlight (Only shown when no search is active) */}
        {!searchQuery && selectedCategory === 'all' && spotlightTopic && (
          <div className="mb-14 border border-hairline bg-warm-surface/30 relative overflow-hidden group">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-10 lg:p-12 items-center">
              <div className="lg:col-span-8">
                <div className="flex items-center gap-2.5 mb-3 text-[10px] font-mono uppercase tracking-[0.25em] text-gold font-semibold">
                  <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                  <span>FEATURED SPOTLIGHT &bull; ESSENTIAL PILLAR</span>
                </div>

                <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-ink uppercase">
                  {spotlightTopic.title}
                </h2>

                <p className="mt-3 text-sm sm:text-base text-ink-secondary font-light max-w-2xl leading-relaxed">
                  {spotlightTopic.shortDescription}
                </p>

                <div className="mt-6 border-l-2 border-gold pl-4 py-1 text-xs font-mono text-ink italic">
                  &ldquo;{spotlightTopic.tenSecondAnswer}&rdquo;
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col items-start lg:items-end justify-center">
                <div className="text-[10px] font-mono tracking-widest uppercase text-ink-muted mb-2">
                  INCLUDES INTERACTIVE LAB &bull; {spotlightTopic.readTimeMinutes} MIN
                </div>
                <Link
                  to={`/watch-101/${spotlightTopic.slug}`}
                  className="inline-flex items-center justify-center font-medium tracking-[0.12em] uppercase text-xs px-6 py-3.5 bg-ink text-warm-white hover:bg-neutral-800 transition-colors shadow-sm cursor-pointer"
                >
                  START LESSON &rarr;
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Search & Filter Controls */}
        <div className="mb-10 space-y-4">
          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 border text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'border-ink bg-ink text-warm-white font-semibold'
                  : 'border-hairline bg-warm-white text-ink hover:border-ink'
              }`}
            >
              ALL ({categoryCounts.all})
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 border text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'border-ink bg-ink text-warm-white font-semibold'
                    : 'border-hairline bg-warm-white text-ink hover:border-ink'
                }`}
              >
                {cat.shortLabel} ({categoryCounts[cat.id] || 0})
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative max-w-2xl">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search terminology, calibres, materials, complications, keywords..."
              className="w-full bg-warm-surface/40 border border-hairline px-4 py-3 pl-11 text-xs font-mono text-ink placeholder:text-ink-muted focus:outline-none focus:border-ink transition-colors"
            />
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-secondary">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="16.5" y1="16.5" x2="21" y2="21" />
              </svg>
            </div>

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-mono text-ink-muted hover:text-ink cursor-pointer"
              >
                CLEAR
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase pt-1">
            <span>
              SHOWING {filteredTopics.length} OF {allTopics.length} LESSONS
            </span>
            <span>VERIFIED HOROLOGICAL CURRICULUM</span>
          </div>
        </div>

        {/* Dynamic Topic Grid */}
        {filteredTopics.length === 0 ? (
          <div className="border border-dashed border-hairline bg-warm-surface/20 p-12 text-center max-w-md mx-auto my-12">
            <p className="text-xs font-mono tracking-widest text-ink-muted uppercase">
              NO TOPICS MATCH &ldquo;{searchQuery}&rdquo;
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
              }}
              className="mt-3 text-xs font-mono uppercase tracking-wider text-ink underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTopics.map((topic) => (
              <Link
                key={topic.id}
                to={`/watch-101/${topic.slug}`}
                className="group border border-hairline bg-warm-surface/20 p-6 sm:p-7 flex flex-col justify-between hover:border-ink hover:bg-warm-surface/50 transition-all duration-300"
              >
                <div>
                  {/* Topic Metadata & Badge */}
                  <div className="flex items-center justify-between gap-2 text-[9px] font-mono uppercase tracking-[0.2em] text-ink-secondary mb-3">
                    <span className="font-semibold text-gold">{topic.category}</span>
                    <span>{topic.readTimeMinutes} MIN</span>
                  </div>

                  <h3 className="font-display text-xl sm:text-2xl font-normal text-ink uppercase tracking-tight group-hover:text-neutral-800 transition-colors">
                    {topic.title}
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm text-ink-secondary font-light line-clamp-3 leading-relaxed">
                    {topic.shortDescription}
                  </p>

                  {/* Interactive Badge indicator */}
                  {topic.interactiveType && (
                    <div className="mt-4 inline-flex items-center gap-1.5 px-2 py-0.5 border border-hairline bg-warm-white text-[8px] font-mono tracking-widest uppercase text-ink font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                      <span>INTERACTIVE LAB</span>
                    </div>
                  )}
                </div>

                {/* Footer Link Callout */}
                <div className="mt-6 pt-4 border-t border-hairline flex items-center justify-between text-[10px] font-mono uppercase text-ink-muted group-hover:text-ink transition-colors">
                  <span className="tracking-wider">EXPLORE LESSON</span>
                  <span className="text-gold font-semibold transition-transform duration-300 group-hover:translate-x-1">
                    &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Knowledge Base Colophon */}
        <div className="mt-16 sm:mt-24 border border-hairline bg-warm-surface/30 p-8 text-center max-w-3xl mx-auto">
          <div className="text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-2">
            WATCH 101 CURRICULUM ARCHITECTURE
          </div>
          <p className="text-xs sm:text-sm font-mono text-ink-secondary leading-relaxed">
            All educational definitions are grounded in verified horological engineering standards. New modules, quizzes, and calibre breakdowns are integrated continuously.
          </p>
        </div>
      </Container>
    </div>
  )
}
