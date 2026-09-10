import { useEffect, useState, useMemo } from 'react'
import Container from '../components/common/Container'
import Button from '../components/common/Button'
import { Link } from '../router'
import { useRouter } from '../router/useRouter'
import { getTopicBySlug, getAdjacentTopics } from '../data/watch101'
import { fetchWatches } from '../services/watchService'
import type { Watch } from '../types/watch'
import InteractiveTopicWidget from '../components/watch101/InteractiveTopicWidget'

interface Watch101TopicPageProps {
  slug: string
}

export default function Watch101TopicPage({ slug }: Watch101TopicPageProps) {
  const { navigate } = useRouter()
  const topic = getTopicBySlug(slug)
  const { prev, next } = getAdjacentTopics(slug)

  const [allWatches, setAllWatches] = useState<Watch[]>([])
  const [loadingWatches, setLoadingWatches] = useState(true)

  // Fetch watches from Supabase once on mount
  useEffect(() => {
    let isMounted = true

    fetchWatches().then((result) => {
      if (!isMounted) return
      if (result.data) {
        setAllWatches(result.data)
      }
      setLoadingWatches(false)
    })

    return () => {
      isMounted = false
    }
  }, [])

  // Derive matched watches for this topic
  const matchedWatches = useMemo(() => {
    if (!topic?.watchSlugs || topic.watchSlugs.length === 0) return []
    return allWatches.filter((w) => topic.watchSlugs?.includes(w.slug))
  }, [allWatches, topic])

  // Not Found State
  if (!topic) {
    return (
      <div className="py-20 sm:py-32">
        <Container>
          <div className="border border-hairline bg-warm-surface/40 p-12 sm:p-16 text-center max-w-2xl mx-auto">
            <div className="text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-3">
              ERROR 404 // TOPIC NOT FOUND
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-normal text-ink uppercase mb-3">
              Lesson Unavailable
            </h2>
            <p className="text-sm font-mono text-ink-secondary mb-8">
              The requested lesson &ldquo;{slug}&rdquo; is not part of the current Watch 101 curriculum.
            </p>
            <Button variant="secondary" size="sm" onClick={() => navigate('/watch-101')}>
              &larr; RETURN TO WATCH 101 INDEX
            </Button>
          </div>
        </Container>
      </div>
    )
  }

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        {/* Navigation Breadcrumb */}
        <div className="mb-8 sm:mb-12">
          <Link
            to="/watch-101"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-ink-secondary hover:text-ink transition-colors"
          >
            &larr; <span>BACK TO WATCH 101 CURRICULUM</span>
          </Link>
        </div>

        {/* Topic Editorial Header */}
        <div className="border-b border-hairline pb-8 mb-12 sm:mb-16">
          <div className="flex flex-wrap items-center gap-3 mb-3 text-[10px] font-mono uppercase tracking-[0.25em] text-ink-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
            <span className="text-ink font-semibold">{topic.category}</span>
            <span>&bull;</span>
            <span>{topic.readTimeMinutes} MIN READ</span>
            <span>&bull;</span>
            <span>TOPIC // {topic.slug}</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-ink uppercase">
            {topic.title}
          </h1>

          <p className="mt-3 text-base sm:text-lg text-ink-secondary max-w-3xl font-light leading-relaxed">
            {topic.shortDescription}
          </p>
        </div>

        {/* 1. THE 10-SECOND ANSWER (Hero callout) */}
        <div className="border-l-4 border-ink bg-warm-surface/40 p-6 sm:p-8 mb-12 border-y border-r border-hairline">
          <div className="text-[10px] font-mono tracking-[0.25em] text-ink uppercase mb-2 font-semibold">
            THE 10-SECOND ANSWER
          </div>
          <p className="font-display text-xl sm:text-2xl text-ink font-normal leading-snug">
            &ldquo;{topic.tenSecondAnswer}&rdquo;
          </p>
        </div>

        {/* 2. INTERACTIVE LAB PLAYGROUND (If topic has an interactive widget) */}
        {topic.interactiveType && (
          <div className="mb-14">
            <InteractiveTopicWidget type={topic.interactiveType} />
          </div>
        )}

        {/* 3. THEN GO DEEPER (Main Editorial Content) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start mb-16">
          {/* Main Body (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="border-b border-hairline pb-4 mb-6">
              <div className="text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase">
                EXPLANATION &bull; DEEP DIVE
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-normal text-ink uppercase mt-1">
                Then Go Deeper
              </h2>
            </div>

            <p className="text-lg sm:text-xl text-ink font-light leading-relaxed">
              {topic.deeperExplanation.lead}
            </p>

            {topic.deeperExplanation.paragraphs.map((para, idx) => (
              <p
                key={idx}
                className="text-sm sm:text-base text-ink-secondary font-light leading-relaxed"
              >
                {para}
              </p>
            ))}

            {/* Key Takeaways Box */}
            {topic.deeperExplanation.keyTakeaways && (
              <div className="mt-8 p-6 border border-hairline bg-warm-surface/30">
                <div className="text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-3 font-semibold">
                  KEY HOROLOGICAL TAKEAWAYS
                </div>
                <ul className="space-y-2 text-xs sm:text-sm font-mono text-ink">
                  {topic.deeperExplanation.keyTakeaways.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="text-steel font-bold">&bull;</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right Column: WHY IT MATTERS (4 cols) */}
          <div className="lg:col-span-4">
            <div className="border border-hairline bg-warm-surface/20 p-6 sm:p-7 sticky top-24">
              <div className="text-[10px] font-mono tracking-[0.2em] text-ink uppercase font-semibold mb-2">
                BUYER &amp; COLLECTOR DOSSIER
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-normal text-ink uppercase mb-3">
                Why It Matters
              </h3>
              <p className="text-xs sm:text-sm font-mono text-ink-secondary leading-relaxed">
                {topic.whyItMatters}
              </p>

              {/* Keywords Tag Cloud */}
              <div className="mt-6 pt-4 border-t border-hairline">
                <div className="text-[9px] font-mono uppercase tracking-widest text-ink-muted mb-2">
                  INDEXED TERMS
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {topic.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-2 py-0.5 border border-hairline bg-warm-white text-[9px] font-mono text-ink-secondary uppercase"
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. WATCH CONNECTIONS / RABBIT HOLES */}
        <div className="border-t border-hairline pt-12 sm:pt-16 mb-16">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2 text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
              <span>THE WATCH CONNECTIONS // REAL-WORLD EXAMPLES</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-normal text-ink uppercase">
              Watches That Embody This
            </h2>
            <p className="text-xs font-mono text-ink-secondary mt-1">
              Timepieces from the central database demonstrating this specific horological engineering.
            </p>
          </div>

          {loadingWatches ? (
            <div className="p-8 border border-hairline text-center text-xs font-mono text-ink-muted uppercase tracking-widest">
              QUERYING SUPABASE SPECIMENS...
            </div>
          ) : matchedWatches.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {matchedWatches.map((watch) => (
                <Link
                  key={watch.id}
                  to={`/watches/${watch.slug}`}
                  className="group border border-hairline bg-warm-surface/20 flex flex-col justify-between overflow-hidden hover:border-ink hover:bg-warm-surface/50 transition-all"
                >
                  <div className="relative aspect-[4/3] w-full bg-warm-surface border-b border-hairline overflow-hidden">
                    {watch.image_url ? (
                      <img
                        src={watch.image_url}
                        alt={`${watch.brand} ${watch.model}`}
                        loading="lazy"
                        className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[10px] font-mono text-ink-muted uppercase">
                        PHOTO PENDING
                      </div>
                    )}
                    {watch.category && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-warm-white/90 backdrop-blur-sm border border-hairline text-[8px] font-mono tracking-widest uppercase font-medium text-ink">
                        {watch.category}
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex flex-col justify-between flex-grow">
                    <div>
                      <div className="text-[9px] font-mono uppercase tracking-widest text-ink-secondary">
                        {watch.brand}
                      </div>
                      <h4 className="font-display text-lg uppercase font-normal text-ink mt-0.5">
                        {watch.model}
                      </h4>
                      <div className="text-[10px] font-mono text-ink-muted mt-1">
                        REF. {watch.reference_number}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-hairline flex items-center justify-between text-[11px] font-mono">
                      <span className="font-semibold text-ink">
                        {watch.price !== null
                          ? `$${watch.price.toLocaleString()} ${watch.currency}`
                          : 'PRICE ON REQUEST'}
                      </span>
                      <span className="text-ink tracking-widest uppercase text-[9px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                        VIEW DOSSIER &rarr;
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-6 border border-hairline bg-warm-surface/20 text-xs font-mono text-ink-secondary mb-12">
              Specific database specimen tag linking across upcoming index expansions.
            </div>
          )}

          {/* Contextual Battle Suggestion Banner */}
          {topic.battleSuggestion && (
            <div className="border border-hairline bg-warm-surface/40 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12">
              <div>
                <div className="text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-1">
                  PUT THIS KNOWLEDGE TO THE TEST // WATCH BATTLE
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-normal text-ink uppercase">
                  {topic.battleSuggestion.label}
                </h3>
                <p className="text-xs font-mono text-ink-secondary mt-1 max-w-xl">
                  {topic.battleSuggestion.prompt}
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  navigate(
                    `/battles?w1=${topic.battleSuggestion?.watch1Slug}&w2=${topic.battleSuggestion?.watch2Slug}`
                  )
                }
              >
                BATTLE THIS CONCEPT &rarr;
              </Button>
            </div>
          )}

          {/* Related Topics / Deeper Rabbit Holes */}
          {topic.relatedTopicSlugs.length > 0 && (
            <div>
              <div className="text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-4">
                RELATED WATCH 101 LESSONS
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {topic.relatedTopicSlugs.map((relSlug) => {
                  const relTopic = getTopicBySlug(relSlug)
                  if (!relTopic) return null

                  return (
                    <Link
                      key={relTopic.slug}
                      to={`/watch-101/${relTopic.slug}`}
                      className="group border border-hairline bg-warm-white p-4 hover:border-ink hover:bg-warm-surface/30 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="text-[9px] font-mono uppercase tracking-widest text-ink-secondary mb-1">
                          {relTopic.category} &bull; {relTopic.readTimeMinutes} MIN
                        </div>
                        <h4 className="font-display text-base font-normal uppercase text-ink group-hover:text-neutral-800">
                          {relTopic.title}
                        </h4>
                        <p className="text-xs font-mono text-ink-secondary mt-1 line-clamp-2">
                          {relTopic.shortDescription}
                        </p>
                      </div>

                      <div className="mt-4 pt-2 border-t border-hairline/60 flex items-center justify-between text-[9px] font-mono uppercase text-ink-muted group-hover:text-ink">
                        <span>EXPLORE LESSON</span>
                        <span>&rarr;</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* 5. PREVIOUS / NEXT TOPIC PAGINATION FOOTER */}
        <div className="border-t border-hairline pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
          {prev ? (
            <Link
              to={`/watch-101/${prev.slug}`}
              className="inline-flex items-center gap-2 text-ink-secondary hover:text-ink transition-colors uppercase tracking-wider"
            >
              &larr; <span>PREVIOUS: {prev.title}</span>
            </Link>
          ) : (
            <div />
          )}

          {next ? (
            <Link
              to={`/watch-101/${next.slug}`}
              className="inline-flex items-center gap-2 text-ink font-semibold hover:text-neutral-700 transition-colors uppercase tracking-wider"
            >
              <span>NEXT: {next.title}</span> &rarr;
            </Link>
          ) : (
            <div />
          )}
        </div>
      </Container>
    </div>
  )
}
