import type { Watch } from './watch'

export type EvaluationPillarKey =
  | 'engineering'
  | 'materials'
  | 'wearability'
  | 'value'
  | 'heritage'

export interface PillarDefinition {
  key: EvaluationPillarKey
  name: string
  weight: number
  weightLabel: string
  description: string
}

export const EVALUATION_PILLARS: PillarDefinition[] = [
  {
    key: 'engineering',
    name: 'Engineering & Mechanics',
    weight: 0.25,
    weightLabel: '25%',
    description: 'Calibre pedigree, movement architecture, power reserve autonomy, and functional complication utility.',
  },
  {
    key: 'materials',
    name: 'Build & Materials',
    weight: 0.20,
    weightLabel: '20%',
    description: 'Crystal resilience, metallurgy grade, case finishing craftsmanship, and genre-contextual water resistance.',
  },
  {
    key: 'wearability',
    name: 'Wearability & Ergonomics',
    weight: 0.20,
    weightLabel: '20%',
    description: 'Case thickness profile efficiency, lug-to-lug wrist stance, and diameter harmony relative to watch genre.',
  },
  {
    key: 'value',
    name: 'Value Proposition',
    weight: 0.20,
    weightLabel: '20%',
    description: 'Substance-to-price ratio evaluating horological content delivered relative to price band expectations.',
  },
  {
    key: 'heritage',
    name: 'Heritage & Lineage',
    weight: 0.15,
    weightLabel: '15%',
    description: 'Ancestral historical origins, iconic lineage milestones, and brand standing in horological culture.',
  },
]

export interface PillarSubScore {
  label: string
  score: number
  max: number
  rationale: string
}

export interface PillarScoreBreakdown {
  score: number // 0 - 100
  subScores: PillarSubScore[]
  summary: string
}

export interface ContenderEvaluation {
  watch: Watch
  scores: Record<EvaluationPillarKey, number>
  breakdowns: Record<EvaluationPillarKey, PillarScoreBreakdown>
  overallScore: number // 0 - 100
}

export type VerdictClassification = 'DEAD HEAT' | 'SLIGHT EDGE' | 'CLEAR ADVANTAGE'

export interface PillarAdvantage {
  pillarKey: EvaluationPillarKey
  winnerSlot: 1 | 2 | 'tie'
  delta: number
  rationale: string
}

export interface DeterministicEvaluation {
  watch1: Watch
  watch2: Watch
  contender1: ContenderEvaluation
  contender2: ContenderEvaluation
  winnerSlot: 1 | 2 | 'tie'
  winner: Watch | null
  margin: number
  verdictType: VerdictClassification
  headline: string
  summaryRationale: string
  pillarAdvantages: Record<EvaluationPillarKey, PillarAdvantage>
}
