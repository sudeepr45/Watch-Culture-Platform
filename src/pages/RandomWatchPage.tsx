import { useEffect, useState, useMemo, useRef } from 'react'
import Container from '../components/common/Container'
import Button from '../components/common/Button'
import WatchImage from '../components/common/WatchImage'
import { Link } from '../router'
import { useRouter } from '../router/useRouter'
import { fetchWatches } from '../services/watchService'
import { fetchStoriesByWatchId } from '../services/storyService'
import { getAllTopics } from '../data/watch101'
import type { Watch } from '../types/watch'
import type { StoryWithAuthorAndWatch } from '../types/story'
import type { Watch101Topic } from '../types/watch101'

// Curatorial affinity mapping to genuine archive timepieces
const WATCH_AFFINITIES: Record<string, string[]> = {
  'casio-g-shock-ga-2100-1a1': ['quiet', 'character', 'daily'],
  'seiko-5-sports-srpd55': ['quiet', 'character', 'daily'],
  'hamilton-khaki-field-mechanical-h69439931': ['quiet', 'story', 'history', 'character'],
  'tissot-prx-powermatic-80-blue': ['form', 'machine', 'daily', 'quiet'],
  'tudor-black-bay-58-m79030n': ['classic', 'story', 'daily', 'history', 'archive'],
  'rolex-submariner-date-126610ln': ['statement', 'classic', 'story', 'history', 'daily'],
  'omega-speedmaster-professional-moonwatch-sapphire': [
    'statement',
    'classic',
    'story',
    'machine',
    'history',
    'conversation',
  ],
  'cartier-tank-must-large-wsta0041': ['quiet', 'classic', 'form', 'history'],
  'grand-seiko-snowflake-sbga211': ['quiet', 'odd', 'machine', 'conversation', 'daily'],
  'rolex-gmt-master-ii-pepsi-126710blro': ['statement', 'character', 'archive', 'conversation'],
  'jaeger-lecoultre-reverso-classic-monoface': ['classic', 'odd', 'form', 'conversation', 'archive'],
  'audemars-piguet-royal-oak-jumbo-16202st': ['statement', 'machine', 'form', 'archive', 'conversation'],
}

interface RitualOption {
  id: string
  label: string
  detail: string
}

interface RitualQuestion {
  number: string
  total: string
  topic: string
  title: string
  subtitle: string
  key: 'q1' | 'q2' | 'q3'
  options: RitualOption[]
}

const RITUAL_QUESTIONS: RitualQuestion[] = [
  {
    number: '01',
    total: '03',
    topic: 'HOROLOGICAL POSTURE',
    title: 'What presence should this object command on your wrist?',
    subtitle: 'Consider physical architecture, visual mass, and how the watch meets the eye.',
    key: 'q1',
    options: [
      {
        id: 'quiet',
        label: 'A RESTRAINED INSTRUMENT',
        detail: 'Understated geometry, monochrome poise, unconcerned with external notice.',
      },
      {
        id: 'statement',
        label: 'AN UNMISTAKABLE SILHOUETTE',
        detail: 'Architectural authority, iconic contours, commanding visual weight.',
      },
      {
        id: 'classic',
        label: 'THE CANONICAL PROPORTION',
        detail: 'Proportions tested across decades, disciplined symmetry, enduring balance.',
      },
      {
        id: 'odd',
        label: 'THE HOROLOGICAL ANOMALY',
        detail: 'Idiosyncratic case geometry, unexpected dial layouts, singular character.',
      },
    ],
  },
  {
    number: '02',
    total: '03',
    topic: 'MECHANICAL ESSENCE',
    title: 'Where does the soul of the timepiece reside for you?',
    subtitle: 'The dimension of the watch that commands your sustained intellectual attention.',
    key: 'q2',
    options: [
      {
        id: 'story',
        label: 'CULTURAL PROVENANCE & LORE',
        detail: 'Expeditions, cinematic moments, and historical chapters behind the reference.',
      },
      {
        id: 'machine',
        label: 'CALIBRE ARCHITECTURE & CRAFT',
        detail: 'Escapement mechanics, bridge finishing, micro-rotor engineering, and tactile winding.',
      },
      {
        id: 'form',
        label: 'PURE INDUSTRIAL GEOMETRY',
        detail: 'Bezel bevels, integrated case lines, typography, and mathematical tension.',
      },
      {
        id: 'character',
        label: 'ECCENTRICITY & WRIST TENSION',
        detail: 'Tactile weight, idiosyncratic quirks, dial texture, and physical feedback.',
      },
    ],
  },
  {
    number: '03',
    total: '03',
    topic: 'ARCHIVAL INTENT',
    title: 'What purpose does this specimen fulfill in your life?',
    subtitle: 'The intended relationship between the instrument and the wearer.',
    key: 'q3',
    options: [
      {
        id: 'daily',
        label: 'AN UNWAVERING DAILY COMPANION',
        detail: 'Built for perpetual wear, mechanical resilience, water depth, and real life.',
      },
      {
        id: 'conversation',
        label: 'A SUBJECT OF HOROLOGICAL DISCOURSE',
        detail: 'An object that sparks discussion, invites debate, and rewards close inspection.',
      },
      {
        id: 'history',
        label: 'A LIVING HISTORICAL MILESTONE',
        detail: 'A reference that solved an engineering barrier and shaped horological chronology.',
      },
      {
        id: 'archive',
        label: 'A RARITY DRAWN FROM THE VAULT',
        detail: 'A nuanced catalog reference to study, collect, and appreciate quietly.',
      },
    ],
  },
]

/**
 * Synthesizes a factual, data-driven curatorial finding note connecting
 * user inquiries directly with verified watch specifications.
 */
function generateCuratorialReasoning(
  watch: Watch,
  choices: { q1: string | null; q2: string | null; q3: string | null }
): string {
  const { q1, q2, q3 } = choices
  if (!q1 && !q2 && !q3) {
    return `Retrieved via open extraction from the central archive. A cataloged specimen of ${watch.brand} horology, featuring the ${watch.movement_type || 'mechanical'} movement (Ref. ${watch.reference_number}).`
  }

  const posturePhrases: Record<string, string> = {
    quiet: `a preference for restrained wrist posture (${watch.case_diameter_mm ? `${watch.case_diameter_mm}mm proportions` : 'measured footprint'})`,
    statement: `an affinity for unmistakable presence and definitive case architecture`,
    classic: `adherence to canonical proportions and enduring design discipline`,
    odd: `an attraction toward distinct character and idiosyncratic geometry`,
  }

  const essencePhrases: Record<string, string> = {
    story: `an emphasis on cultural provenance and historical lore`,
    machine: `focus on calibre architecture and mechanical craft (${watch.calibre || watch.movement_name || watch.movement_type || 'calibre'})`,
    form: `appreciation for clean industrial lines and case metallurgy (${watch.case_material || 'casing'})`,
    character: `a valuation of distinctive tactile individuality and dial nuance`,
  }

  const intentPhrases: Record<string, string> = {
    daily: `engineering optimized for continuous daily wear with ${watch.water_resistance_m ? `${watch.water_resistance_m}m depth resistance` : 'sealed protection'}`,
    conversation: `offering rich historical and mechanical substance for horological discourse`,
    history: `standing as a pivotal milestone in ${watch.release_year ? `the ${watch.release_year} era of ` : ''}${watch.brand} archives`,
    archive: `serving as a compelling catalog specimen for quiet study and collecting`,
  }

  const posture = q1 ? posturePhrases[q1] : null
  const essence = q2 ? essencePhrases[q2] : null
  const intent = q3 ? intentPhrases[q3] : null

  const parts = [posture, essence, intent].filter(Boolean)
  if (parts.length === 0) {
    return `Surfaced from the vault as an authentic ${watch.brand} ${watch.model} (Ref. ${watch.reference_number}).`
  }

  return `Surfaced from the central archive matching ${parts.join(', alongside ')}. The ${watch.brand} ${watch.model} (Ref. ${watch.reference_number}) exemplifies this synthesis through its ${watch.category ? `${watch.category.toLowerCase()} classification` : 'horological design'}.`
}

/**
 * Finds the most relevant genuine Watch 101 topic for a given watch specimen.
 */
function findRelevantWatch101Topic(watch: Watch): Watch101Topic | null {
  const topics = getAllTopics()
  if (!topics || topics.length === 0) return null

  // 1. Direct watch slug match
  const directMatch = topics.find((t) => t.watchSlugs?.includes(watch.slug))
  if (directMatch) return directMatch

  // 2. Keyword and category match
  const cat = (watch.category || '').toLowerCase()
  const mov = (watch.movement_type || '').toLowerCase()
  const mod = (watch.model || '').toLowerCase()

  if (cat.includes('diver') || (watch.water_resistance_m && watch.water_resistance_m >= 200)) {
    const waterTopic = topics.find((t) => t.slug === 'water-resistance')
    if (waterTopic) return waterTopic
  }

  if (cat.includes('chronograph') || mod.includes('speedmaster') || mod.includes('chronograph')) {
    const chronoTopic = topics.find((t) => t.slug === 'chronograph' || t.slug.includes('chronograph'))
    if (chronoTopic) return chronoTopic
  }

  if (mov.includes('quartz')) {
    const quartzTopic = topics.find((t) => t.slug === 'automatic-vs-quartz')
    if (quartzTopic) return quartzTopic
  }

  if (mov.includes('manual') || mov.includes('hand-wound')) {
    const manualTopic = topics.find((t) => t.slug === 'mechanical-watches')
    if (manualTopic) return manualTopic
  }

  const calibreTopic = topics.find((t) => t.slug === 'what-is-a-calibre')
  return calibreTopic || topics[0]
}

export default function RandomWatchPage() {
  const [allWatches, setAllWatches] = useState<Watch[]>([])
  const [watch, setWatch] = useState<Watch | null>(null)
  const [loading, setLoading] = useState(true)
  const [drawing, setDrawing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEmpty, setIsEmpty] = useState(false)

  // Ritual Navigation State: only one question at a time
  const [step, setStep] = useState<'inquiry' | 'consulting' | 'finding'>('inquiry')
  const [inquiryIndex, setInquiryIndex] = useState<number>(0)
  const [q1, setQ1] = useState<string | null>(null)
  const [q2, setQ2] = useState<string | null>(null)
  const [q3, setQ3] = useState<string | null>(null)

  // Genuine cross-referenced data
  const [relatedStory, setRelatedStory] = useState<StoryWithAuthorAndWatch | null>(null)

  const isMountedRef = useRef(true)
  const { navigate } = useRouter()

  // Load verified archive from Supabase upon mount
  useEffect(() => {
    isMountedRef.current = true

    const loadArchive = async () => {
      setLoading(true)
      setError(null)
      const result = await fetchWatches()

      if (!isMountedRef.current) return

      if (result.error) {
        setError(result.error.message)
      } else if (!result.data || result.data.length === 0) {
        setIsEmpty(true)
      } else {
        setAllWatches(result.data)
      }
      setLoading(false)
    }

    loadArchive()

    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Core selection algorithm: selects a real watch from public.watches matching user affinity
  const pickSpecimen = (excludeId?: string, forceBypass = false): Watch | null => {
    if (allWatches.length === 0) return null

    const activeChoices = forceBypass ? [] : ([q1, q2, q3].filter(Boolean) as string[])

    let candidatePool: Watch[] = allWatches

    if (activeChoices.length > 0) {
      // Score each watch based on affinity match count
      const scored = allWatches.map((w) => {
        const affinities = WATCH_AFFINITIES[w.slug] || []
        const score = activeChoices.filter((choice) => affinities.includes(choice)).length
        return { watch: w, score }
      })

      // Determine highest score
      scored.sort((a, b) => b.score - a.score)
      const maxScore = scored[0]?.score ?? 0

      // Get all watches in the top affinity tier
      const topTier = scored.filter((s) => s.score === maxScore).map((s) => s.watch)
      if (topTier.length > 0) {
        candidatePool = topTier
      }
    }

    // Filter out the excluded watch if more than one candidate exists
    const filteredPool =
      excludeId && candidatePool.length > 1
        ? candidatePool.filter((w) => w.id !== excludeId)
        : candidatePool

    const finalPool = filteredPool.length > 0 ? filteredPool : allWatches
    const randomIndex = Math.floor(Math.random() * finalPool.length)
    return finalPool[randomIndex]
  }

  const loadRelatedStory = (watchId: string) => {
    fetchStoriesByWatchId(watchId).then((res) => {
      if (!isMountedRef.current) return
      if (res.data && res.data.length > 0) {
        setRelatedStory(res.data[0])
      } else {
        setRelatedStory(null)
      }
    })
  }

  // Open the archive after inquiry completion or direct bypass
  const handleOpenArchive = (directBypass = false) => {
    if (allWatches.length === 0) return
    setStep('consulting')

    setTimeout(() => {
      if (!isMountedRef.current) return
      const selected = pickSpecimen(undefined, directBypass)
      setWatch(selected)
      if (selected) {
        loadRelatedStory(selected.id)
      }
      setStep('finding')
    }, 450)
  }

  // Draw another specimen without repeating the current one
  const handleDrawAnother = () => {
    if (drawing || allWatches.length === 0) return
    setDrawing(true)

    setTimeout(() => {
      if (!isMountedRef.current) return
      const nextWatch = pickSpecimen(watch?.id)
      setWatch(nextWatch)
      if (nextWatch) {
        loadRelatedStory(nextWatch.id)
      }
      setDrawing(false)
    }, 250)
  }

  // Reset the ritual and return to inquiry 01
  const handleResetRitual = () => {
    setQ1(null)
    setQ2(null)
    setQ3(null)
    setInquiryIndex(0)
    setWatch(null)
    setRelatedStory(null)
    setStep('inquiry')
  }

  // Current active single question
  const currentQuestion = RITUAL_QUESTIONS[inquiryIndex]
  const currentAnswer =
    currentQuestion.key === 'q1' ? q1 : currentQuestion.key === 'q2' ? q2 : q3
  const currentSetter =
    currentQuestion.key === 'q1' ? setQ1 : currentQuestion.key === 'q2' ? setQ2 : setQ3

  // Matched Watch 101 topic for finding state
  const relevantTopic = useMemo(() => {
    if (!watch) return null
    return findRelevantWatch101Topic(watch)
  }, [watch])

  return (
    <div className="py-12 sm:py-16 lg:py-20">
      <Container>
        {/* Navigation Breadcrumb */}
        <div className="mb-8 sm:mb-12">
          {step === 'finding' ? (
            <button
              type="button"
              onClick={handleResetRitual}
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-ink-secondary hover:text-ink transition-colors cursor-pointer"
            >
              &larr; <span>BEGIN NEW ARCHIVAL RITUAL</span>
            </button>
          ) : (
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-ink-secondary hover:text-ink transition-colors"
            >
              &larr; <span>BACK TO EXPLORE</span>
            </Link>
          )}
        </div>

        {/* Editorial Masthead */}
        <div className="border-b border-hairline pb-8 mb-12 sm:mb-16">
          <div className="flex items-center gap-2 mb-3 text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-ink-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
            <span>ARCHIVAL EXTRACTION // RANDOM ACCESS</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-ink uppercase">
            Random Access
          </h1>
          <p className="mt-3 text-base sm:text-lg text-ink-secondary max-w-2xl font-light leading-relaxed">
            {step === 'finding'
              ? 'An archival finding retrieved from the MOERI & JEANNERET central collection.'
              : 'A quiet archival ritual. Three inquiries to surface a single specimen from the MOERI & JEANNERET collection.'}
          </p>
        </div>

        {/* 1. Loading Archive State */}
        {loading && (
          <div className="border border-hairline bg-warm-surface/20 p-12 sm:p-20 text-center max-w-2xl mx-auto">
            <div className="w-10 h-10 mx-auto mb-6 flex items-center justify-center border border-hairline bg-warm-white">
              <svg
                className="w-5 h-5 text-steel animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
              </svg>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-ink uppercase">
              Connecting to Archive...
            </h2>
            <p className="mt-3 text-xs sm:text-sm font-mono tracking-widest text-ink-muted uppercase">
              INITIALIZING SPECIMEN VAULT...
            </p>
          </div>
        )}

        {/* 2. Error State */}
        {!loading && error && (
          <div className="border border-hairline bg-warm-surface/30 p-8 sm:p-14 text-center max-w-2xl mx-auto">
            <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center border border-hairline bg-warm-white text-ink">
              <svg
                className="w-5 h-5 text-ink-secondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-2">
              DISPATCH // NOTICE
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-ink uppercase">
              Archive Query Error
            </h2>
            <p className="mt-3 text-sm text-ink-secondary font-light max-w-md mx-auto">
              {error || 'Unable to retrieve specimens from the central archive.'}
            </p>
            <div className="mt-8">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setLoading(true)
                  fetchWatches().then((res) => {
                    if (res.data) setAllWatches(res.data)
                    if (res.error) setError(res.error.message)
                    setLoading(false)
                  })
                }}
              >
                RETRY ARCHIVE ACCESS &rarr;
              </Button>
            </div>
          </div>
        )}

        {/* 3. Empty Repository State */}
        {!loading && !error && (isEmpty || allWatches.length === 0) && (
          <div className="border border-hairline bg-warm-surface/20 p-12 sm:p-20 text-center max-w-2xl mx-auto">
            <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center border border-hairline bg-warm-white text-ink">
              <svg
                className="w-5 h-5 text-ink-secondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-2">
              INDEX STATUS
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-ink uppercase">
              Archive Empty // No Specimens Cataloged
            </h2>
            <p className="mt-3 text-sm text-ink-secondary font-light max-w-md mx-auto">
              The central watch index currently contains no cataloged records.
            </p>
            <div className="mt-8">
              <Button variant="primary" size="sm" onClick={() => navigate('/watches')}>
                VIEW WATCH INDEX &rarr;
              </Button>
            </div>
          </div>
        )}

        {/* 4. One Question at a Time: Archival Inquiry Ritual */}
        {!loading && !error && allWatches.length > 0 && step === 'inquiry' && (
          <div className="max-w-2xl mx-auto">
            <div className="border border-hairline bg-warm-surface/20 p-6 sm:p-10 lg:p-12">
              {/* Telemetry Indicator (No gamified XP/bars) */}
              <div className="flex items-center justify-between text-[11px] font-mono tracking-[0.25em] text-ink-muted uppercase pb-4 mb-8 border-b border-hairline/60">
                <span>
                  [ INQUIRY {currentQuestion.number} OF {currentQuestion.total} ]
                </span>
                <span className="text-ink-secondary font-medium">{currentQuestion.topic}</span>
              </div>

              {/* Inquiry Question Header */}
              <div className="mb-8">
                <h2 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-ink uppercase leading-snug">
                  "{currentQuestion.title}"
                </h2>
                <p className="mt-3 text-xs sm:text-sm font-mono text-ink-secondary leading-relaxed">
                  {currentQuestion.subtitle}
                </p>
              </div>

              {/* Inquiry Options Grid: Sensory, Editorial, Specific */}
              <div className="space-y-3">
                {currentQuestion.options.map((opt) => {
                  const isSelected = currentAnswer === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => currentSetter(opt.id)}
                      className={`w-full group border p-4 sm:p-5 text-left transition-all duration-200 cursor-pointer flex items-start justify-between gap-4 ${
                        isSelected
                          ? 'border-ink bg-warm-white text-ink'
                          : 'border-hairline bg-warm-surface/20 text-ink-secondary hover:border-ink hover:text-ink hover:bg-warm-surface/40'
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-grow">
                        <div className="font-mono text-xs tracking-[0.16em] uppercase font-semibold text-ink">
                          {opt.label}
                        </div>
                        <div className="font-sans text-xs text-ink-muted leading-relaxed font-light">
                          {opt.detail}
                        </div>
                      </div>
                      <span
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 transition-colors ${
                          isSelected ? 'bg-steel' : 'border border-hairline bg-transparent'
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  )
                })}
              </div>

              {/* Ritual Navigation Bar */}
              <div className="mt-10 pt-6 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  {inquiryIndex > 0 ? (
                    <button
                      type="button"
                      onClick={() => setInquiryIndex(inquiryIndex - 1)}
                      className="text-[11px] font-mono tracking-[0.18em] uppercase text-ink-muted hover:text-ink transition-colors cursor-pointer"
                    >
                      &larr; PREVIOUS INQUIRY
                    </button>
                  ) : (
                    <span className="text-[10px] font-mono tracking-[0.18em] uppercase text-ink-muted">
                      INQUIRY INITIATION
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {inquiryIndex < 2 ? (
                    <Button
                      variant="primary"
                      size="md"
                      disabled={!currentAnswer}
                      onClick={() => setInquiryIndex(inquiryIndex + 1)}
                      className="w-full sm:w-auto"
                    >
                      CONTINUE TO INQUIRY 0{inquiryIndex + 2} &rarr;
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="md"
                      disabled={!currentAnswer}
                      onClick={() => handleOpenArchive(false)}
                      className="w-full sm:w-auto"
                    >
                      CONSULT THE ARCHIVE &rarr;
                    </Button>
                  )}
                </div>
              </div>

              {/* Direct Bypass: Draw without ritual */}
              <div className="mt-8 pt-4 border-t border-hairline/40 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setQ1(null)
                    setQ2(null)
                    setQ3(null)
                    handleOpenArchive(true)
                  }}
                  className="text-[10px] font-mono tracking-[0.2em] text-ink-muted hover:text-ink uppercase transition-colors underline cursor-pointer"
                >
                  OR DRAW SPECIMEN AT RANDOM WITHOUT INQUIRY &rarr;
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. Consulting State */}
        {step === 'consulting' && (
          <div className="border border-hairline bg-warm-surface/20 p-12 sm:p-20 text-center max-w-2xl mx-auto">
            <div className="w-10 h-10 mx-auto mb-6 flex items-center justify-center border border-hairline bg-warm-white">
              <svg
                className="w-5 h-5 text-steel animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
              </svg>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-normal tracking-tight text-ink uppercase">
              Consulting the Archive...
            </h2>
            <p className="mt-3 text-xs sm:text-sm font-mono tracking-widest text-ink-muted uppercase">
              SYNTHESIZING INQUIRY AFFINITIES WITH CATALOGED SPECIMENS...
            </p>
          </div>
        )}

        {/* 6. The Archival Finding (Result State) */}
        {!loading && !error && watch && step === 'finding' && (
          <div className="space-y-12">
            {/* Finding Specimen Container */}
            <div className="border border-hairline bg-warm-surface/20">
              {/* Instrument Status Bar */}
              <div className="flex flex-wrap items-center justify-between border-b border-hairline p-4 sm:px-8 text-[10px] font-mono tracking-[0.2em] text-ink-secondary uppercase gap-2 bg-warm-surface/40">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-steel" aria-hidden="true" />
                  <span className="font-semibold text-ink">ARCHIVAL DISCOVERY // SPECIMEN SURFACED</span>
                  <span>&bull;</span>
                  <span>RECORD REF. {watch.reference_number || '—'}</span>
                </div>
                <div className="flex items-center gap-3 text-ink-muted">
                  <span>SPECIMEN ID: {watch.slug}</span>
                  <span>&bull;</span>
                  <span>MODE: RANDOM ACCESS</span>
                </div>
              </div>

              {/* Specimen Main Plate */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 p-6 sm:p-10 lg:p-12 items-start">
                {/* Left Column: Specimen Photography Plate (7 cols) */}
                <div className="lg:col-span-7">
                  <div className="relative border border-hairline bg-warm-surface overflow-hidden">
                    <div className="aspect-[4/3] sm:aspect-[16/11] w-full">
                      <WatchImage
                        src={watch.image_url}
                        alt={`${watch.brand} ${watch.model}`}
                        aspectRatio="h-full w-full"
                        loading="eager"
                      />
                    </div>

                    {/* Integrated Footplate Tag */}
                    <div className="p-3.5 border-t border-hairline bg-warm-white flex items-center justify-between text-[10px] font-mono tracking-[0.18em] uppercase text-ink">
                      <span>VERIFIED CATALOG RECORD</span>
                      <span className="text-steel font-semibold">REF. {watch.reference_number}</span>
                    </div>
                  </div>
                </div>

                {/* Right Column: Specimen Identity & Specification Ledger (5 cols) */}
                <div className="lg:col-span-5 flex flex-col justify-between">
                  <div>
                    {/* Maison & Era Folio */}
                    <div className="flex items-center gap-2.5 text-[11px] font-mono uppercase tracking-[0.24em] text-ink-secondary mb-2">
                      <span>{watch.brand}</span>
                      {watch.release_year && (
                        <>
                          <span className="text-ink-muted">&bull;</span>
                          <span className="text-ink-muted">CIRCA {watch.release_year}</span>
                        </>
                      )}
                    </div>

                    {/* Model Designation */}
                    <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight text-ink uppercase leading-snug">
                      {watch.model}
                    </h2>

                    {/* Reference Identification */}
                    <div className="mt-2 text-xs font-mono text-ink-muted tracking-wider uppercase">
                      REFERENCE: {watch.reference_number || '—'}
                    </div>

                    {/* Archival Description */}
                    {watch.description && (
                      <p className="mt-5 text-sm sm:text-base text-ink-secondary font-light leading-relaxed border-t border-hairline pt-4">
                        {watch.description}
                      </p>
                    )}

                    {/* Technical Specification Ledger */}
                    <div className="mt-6 pt-5 border-t border-hairline">
                      <div className="text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-3">
                        SPECIFICATION LEDGER
                      </div>
                      <dl className="space-y-2.5 text-xs font-mono">
                        <div className="flex items-baseline justify-between border-b border-hairline/60 pb-1.5">
                          <dt className="text-ink-muted uppercase tracking-wider">Movement</dt>
                          <dd className="text-ink font-medium tracking-wide">
                            {watch.movement_type || '—'}
                          </dd>
                        </div>

                        <div className="flex items-baseline justify-between border-b border-hairline/60 pb-1.5">
                          <dt className="text-ink-muted uppercase tracking-wider">Calibre</dt>
                          <dd className="text-ink font-medium tracking-wide">
                            {watch.calibre || watch.movement_name || '—'}
                          </dd>
                        </div>

                        <div className="flex items-baseline justify-between border-b border-hairline/60 pb-1.5">
                          <dt className="text-ink-muted uppercase tracking-wider">Case Diameter</dt>
                          <dd className="text-ink font-medium tracking-wide">
                            {watch.case_diameter_mm ? `${watch.case_diameter_mm} mm` : '—'}
                          </dd>
                        </div>

                        <div className="flex items-baseline justify-between border-b border-hairline/60 pb-1.5">
                          <dt className="text-ink-muted uppercase tracking-wider">Case Material</dt>
                          <dd className="text-ink font-medium tracking-wide">
                            {watch.case_material || '—'}
                          </dd>
                        </div>

                        <div className="flex items-baseline justify-between border-b border-hairline/60 pb-1.5">
                          <dt className="text-ink-muted uppercase tracking-wider">Water Resistance</dt>
                          <dd className="text-ink font-medium tracking-wide">
                            {watch.water_resistance_m ? `${watch.water_resistance_m} m` : '—'}
                          </dd>
                        </div>

                        <div className="flex items-baseline justify-between border-b border-hairline/60 pb-1.5">
                          <dt className="text-ink-muted uppercase tracking-wider">Published Retail</dt>
                          <dd className="text-ink font-medium tracking-wide">
                            {watch.price !== null
                              ? `$${watch.price.toLocaleString()} ${watch.currency}`
                              : 'MSRP ON REQUEST'}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Specific Reasoning: Curatorial Finding Note */}
              <div className="border-t border-hairline bg-warm-white p-6 sm:p-8 lg:p-10">
                <div className="max-w-3xl">
                  <div className="text-[10px] font-mono tracking-[0.25em] text-ink-muted uppercase mb-2">
                    CURATORIAL FINDING // ARCHIVAL REASONING
                  </div>
                  <h3 className="font-display text-lg sm:text-xl font-normal text-ink uppercase tracking-tight">
                    Why This Specimen Surfaced
                  </h3>
                  <p className="mt-3 text-sm sm:text-base font-sans text-ink-secondary leading-relaxed font-light">
                    {generateCuratorialReasoning(watch, { q1, q2, q3 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Return Loop: 5 Genuine Next Doors */}
            <div className="border border-hairline bg-warm-surface/20 p-6 sm:p-10">
              <div className="mb-6 pb-4 border-b border-hairline/60 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-[0.25em] text-ink-muted">
                    HOROLOGICAL DOORWAYS // NEXT THREADS
                  </div>
                  <h3 className="font-display text-xl sm:text-2xl font-normal tracking-tight text-ink uppercase mt-1">
                    Continue Examination
                  </h3>
                </div>
                <div className="text-xs font-mono text-ink-muted">
                  GENUINE PLATFORM PATHWAYS FOR REF. {watch.reference_number}
                </div>
              </div>

              {/* 5 Genuine Return Doors Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Door 1: Open Dossier */}
                <div className="border border-hairline bg-warm-white p-5 flex flex-col justify-between">
                  <div>
                    <div className="text-[9px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-1">
                      DOORWAY 01 // ARCHIVE RECORD
                    </div>
                    <div className="font-display text-base uppercase text-ink font-normal">
                      Specimen Dossier
                    </div>
                    <p className="mt-2 text-xs font-sans text-ink-secondary leading-relaxed font-light">
                      Complete archival record, technical specifications, and high-resolution plate.
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-hairline/60">
                    <Link
                      to={`/watches/${watch.slug}`}
                      className="text-[10px] font-mono tracking-wider uppercase text-ink font-semibold flex items-center justify-between hover:underline"
                    >
                      <span>EXAMINE DOSSIER</span>
                      <span>&rarr;</span>
                    </Link>
                  </div>
                </div>

                {/* Door 2: WORTH IT? Evaluation */}
                <div className="border border-hairline bg-warm-white p-5 flex flex-col justify-between">
                  <div>
                    <div className="text-[9px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-1">
                      DOORWAY 02 // BUYING INSTRUMENT
                    </div>
                    <div className="font-display text-base uppercase text-ink font-normal">
                      Worth It? Audit
                    </div>
                    <p className="mt-2 text-xs font-sans text-ink-secondary leading-relaxed font-light">
                      Audit this specimen against your personal wear priorities and compromise tolerance.
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-hairline/60">
                    <Link
                      to={`/case?slug=${watch.slug}`}
                      className="text-[10px] font-mono tracking-wider uppercase text-ink font-semibold flex items-center justify-between hover:underline"
                    >
                      <span>AUDIT SPECIMEN</span>
                      <span>&rarr;</span>
                    </Link>
                  </div>
                </div>

                {/* Door 3: Central Archive */}
                <div className="border border-hairline bg-warm-white p-5 flex flex-col justify-between">
                  <div>
                    <div className="text-[9px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-1">
                      DOORWAY 03 // REFERENCE VAULT
                    </div>
                    <div className="font-display text-base uppercase text-ink font-normal">
                      The Central Archive
                    </div>
                    <p className="mt-2 text-xs font-sans text-ink-secondary leading-relaxed font-light">
                      Cross-reference {watch.brand} against all cataloged specimens across the repository.
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-hairline/60">
                    <Link
                      to="/watches"
                      className="text-[10px] font-mono tracking-wider uppercase text-ink font-semibold flex items-center justify-between hover:underline"
                    >
                      <span>ENTER ARCHIVE</span>
                      <span>&rarr;</span>
                    </Link>
                  </div>
                </div>

                {/* Door 4: Story / Field Reports */}
                <div className="border border-hairline bg-warm-white p-5 flex flex-col justify-between">
                  <div>
                    <div className="text-[9px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-1">
                      DOORWAY 04 // COLLECTOR PROVENANCE
                    </div>
                    {relatedStory ? (
                      <>
                        <div className="font-display text-base uppercase text-ink font-normal line-clamp-1">
                          "{relatedStory.title}"
                        </div>
                        <p className="mt-2 text-xs font-sans text-ink-secondary leading-relaxed font-light">
                          By {relatedStory.author.display_name || relatedStory.author.username || 'Collector'}. Firsthand wrist dispatch.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="font-display text-base uppercase text-ink font-normal">
                          Collector Dispatches
                        </div>
                        <p className="mt-2 text-xs font-sans text-ink-secondary leading-relaxed font-light">
                          Firsthand ownership accounts and field reports from the community.
                        </p>
                      </>
                    )}
                  </div>
                  <div className="mt-5 pt-3 border-t border-hairline/60">
                    <Link
                      to={relatedStory ? `/stories/${relatedStory.slug}` : '/stories'}
                      className="text-[10px] font-mono tracking-wider uppercase text-ink font-semibold flex items-center justify-between hover:underline"
                    >
                      <span>{relatedStory ? 'READ FIELD REPORT' : 'EXPLORE DISPATCHES'}</span>
                      <span>&rarr;</span>
                    </Link>
                  </div>
                </div>

                {/* Door 5: Watch 101 Academy */}
                <div className="border border-hairline bg-warm-white p-5 flex flex-col justify-between">
                  <div>
                    <div className="text-[9px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-1">
                      DOORWAY 05 // TECHNICAL SPECIFICATION
                    </div>
                    <div className="font-display text-base uppercase text-ink font-normal line-clamp-1">
                      {relevantTopic?.title || 'Watch Foundations'}
                    </div>
                    <p className="mt-2 text-xs font-sans text-ink-secondary leading-relaxed font-light line-clamp-2">
                      {relevantTopic?.shortDescription || 'Core mechanical concepts, escapements, and architecture.'}
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-hairline/60">
                    <Link
                      to={relevantTopic ? `/watch-101/${relevantTopic.slug}` : '/watch-101'}
                      className="text-[10px] font-mono tracking-wider uppercase text-ink font-semibold flex items-center justify-between hover:underline"
                    >
                      <span>STUDY TOPIC</span>
                      <span>&rarr;</span>
                    </Link>
                  </div>
                </div>

                {/* Door 6: Systematic Recalibration */}
                <div className="border border-hairline bg-warm-white p-5 flex flex-col justify-between">
                  <div>
                    <div className="text-[9px] font-mono tracking-[0.2em] text-ink-muted uppercase mb-1">
                      ARCHIVAL REPETITION
                    </div>
                    <div className="font-display text-base uppercase text-ink font-normal">
                      Draw Another Specimen
                    </div>
                    <p className="mt-2 text-xs font-sans text-ink-secondary leading-relaxed font-light">
                      Extract an alternate cataloged specimen matching your current inquiry parameters.
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-hairline/60">
                    <button
                      type="button"
                      disabled={drawing}
                      onClick={handleDrawAnother}
                      className="text-[10px] font-mono tracking-wider uppercase text-ink font-semibold flex items-center justify-between w-full hover:underline cursor-pointer disabled:opacity-50"
                    >
                      <span>{drawing ? 'EXTRACTING...' : 'DRAW ALTERNATE'}</span>
                      <span>&rarr;</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Controls Bar */}
            <div className="pt-6 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleResetRitual}
                className="text-xs font-mono tracking-[0.18em] uppercase text-ink-secondary hover:text-ink transition-colors cursor-pointer"
              >
                &larr; BEGIN NEW ARCHIVAL RITUAL
              </button>

              <div className="flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="md"
                  disabled={drawing}
                  onClick={handleDrawAnother}
                >
                  {drawing ? 'EXTRACTING...' : 'DRAW ANOTHER SPECIMEN ↺'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  )
}
