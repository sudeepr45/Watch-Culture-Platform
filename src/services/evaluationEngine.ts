import type { Watch } from '../types/watch'
import {
  EVALUATION_PILLARS,
  type EvaluationPillarKey,
  type PillarScoreBreakdown,
  type ContenderEvaluation,
  type DeterministicEvaluation,
  type PillarAdvantage,
  type VerdictClassification,
} from '../types/evaluation'

/**
 * -----------------------------------------------------------------------------
 * WATCH EVALUATION ENGINE (PHASE 2H v1)
 * -----------------------------------------------------------------------------
 * Pure, stateless, deterministic scoring model calculating 5 core pillars
 * directly from verified Watch database records.
 *
 * Weights:
 * - Engineering & Mechanics: 25%
 * - Build & Materials:       20%
 * - Wearability & Ergonomics: 20%
 * - Value Proposition:       20%
 * - Heritage & Lineage:      15%
 * -----------------------------------------------------------------------------
 */

// -----------------------------------------------------------------------------
// PILLAR 1: ENGINEERING & MECHANICS (0 - 100)
// -----------------------------------------------------------------------------
function evaluateEngineering(watch: Watch): PillarScoreBreakdown {
  const movType = (watch.movement_type || '').toLowerCase()
  const calibre = (watch.calibre || watch.movement_name || '').toLowerCase()
  const brand = (watch.brand || '').toLowerCase()
  const model = (watch.model || '').toLowerCase()
  const category = (watch.category || '').toLowerCase()
  const style = (watch.style || '').toLowerCase()
  const pr = watch.power_reserve_hours

  // 1. Autonomy & Power Reserve (0 - 35)
  let autonomyScore = 18
  let autonomyRationale = 'Standard ~40-hour power reserve autonomy.'

  if (movType.includes('spring drive')) {
    autonomyScore = 34
    autonomyRationale = '72-hour power reserve with continuous electronic tri-synchro regulation.'
  } else if (movType.includes('quartz')) {
    autonomyScore = 30
    autonomyRationale = 'High-autonomy battery life providing 3 to 8+ years of uninterrupted run-time.'
  } else if (pr !== null && pr > 0) {
    // Mechanical formula: 40h -> 18 pts; 70h -> 31 pts; 80h -> 35 pts
    const calculated = Math.round(18 + ((pr - 40) / 40) * 17)
    autonomyScore = Math.min(35, Math.max(15, calculated))
    autonomyRationale = `${pr}-hour power reserve autonomy rating.`
  }

  // 2. Calibre Pedigree & Regulation (0 - 40)
  let calibreScore = 25
  let calibreRationale = 'Standard production mechanical movement.'

  if (
    calibre.includes('7121') ||
    brand.includes('audemars piguet')
  ) {
    calibreScore = 40
    calibreRationale = 'Haute Horlogerie ultra-thin manufacture calibre with bespoke hand finishing.'
  } else if (
    calibre.includes('3235') ||
    calibre.includes('3285') ||
    calibre.includes('superlative') ||
    brand.includes('rolex')
  ) {
    calibreScore = 39
    calibreRationale = 'Superlative Chronometer certification regulated to an exceptional ±2 sec/day.'
  } else if (
    calibre.includes('3861') ||
    calibre.includes('metas') ||
    calibre.includes('co-axial')
  ) {
    calibreScore = 38
    calibreRationale = 'METAS Master Chronometer Co-Axial movement certified to 15,000 gauss magnetic resistance.'
  } else if (
    calibre.includes('9r65') ||
    calibre.includes('9r') ||
    brand.includes('grand seiko')
  ) {
    calibreScore = 38
    calibreRationale = 'In-house Spring Drive hybrid calibre delivering quartz-grade precision with mechanical power.'
  } else if (
    calibre.includes('mt5402') ||
    calibre.includes('cosc')
  ) {
    calibreScore = 37
    calibreRationale = 'COSC-certified manufacture calibre with silicon balance spring and free-sprung balance.'
  } else if (
    brand.includes('jaeger-lecoultre') ||
    calibre.includes('657') ||
    calibre.includes('822')
  ) {
    calibreScore = 35
    calibreRationale = 'Manufacture calibre from the "Watchmaker of Watchmakers" with dedicated finishing.'
  } else if (
    calibre.includes('powermatic 80') ||
    calibre.includes('h-50') ||
    calibre.includes('c07')
  ) {
    calibreScore = 32
    calibreRationale = 'Extended 80-hour reserve architecture with anti-magnetic balance spring.'
  } else if (brand.includes('cartier') && movType.includes('quartz')) {
    calibreScore = 30
    calibreRationale = 'Cartier high-autonomy quartz movement optimized for longevity and ultra-thin profile.'
  } else if (calibre.includes('5611') || brand.includes('casio')) {
    calibreScore = 28
    calibreRationale = 'Dual analog-digital shock-resistant quartz module with multi-functional capabilities.'
  } else if (calibre.includes('4r36') || calibre.includes('nh35') || brand.includes('seiko')) {
    calibreScore = 26
    calibreRationale = 'Robust industrial workhorse mechanical movement with hacking and hand-winding.'
  }

  // 3. Complications & Horological Purpose (0 - 25)
  let complicationScore = 18
  let complicationRationale = 'Clean time-only display executed to genre purpose.'

  if (category.includes('gmt') || style.includes('travel') || model.includes('gmt') || model.includes('pepsi')) {
    complicationScore = 25
    complicationRationale = 'True GMT independent local jumping hour hand and 24-hour dual-timezone bezel.'
  } else if (category.includes('chronograph') || style.includes('chrono') || model.includes('speedmaster')) {
    complicationScore = 24
    complicationRationale = 'Triple-register mechanical chronograph complication with tachymeter scale.'
  } else if (brand.includes('casio') || calibre.includes('5611')) {
    complicationScore = 22
    complicationRationale = 'World time, 1/100s stopwatch, countdown timer, 5 daily alarms, and double LED illuminator.'
  } else if (model.includes('snowflake') || (watch.description && watch.description.toLowerCase().includes('glide'))) {
    complicationScore = 21
    complicationRationale = 'Dial-side power reserve complication and instantaneous date change.'
  } else if (category.includes('dive') || style.includes('dive') || model.includes('submariner') || model.includes('black bay')) {
    complicationScore = 20
    complicationRationale = 'Unidirectional 60-minute elapsed immersion timing bezel with high-contrast date.'
  } else if (calibre.includes('4r36') || model.includes('5 sports')) {
    complicationScore = 19
    complicationRationale = 'Dual day-and-date complication with rotating elapsed-time timing ring.'
  } else if (calibre.includes('7121') || model.includes('royal oak') || calibre.includes('powermatic')) {
    complicationScore = 20
    complicationRationale = 'Rapid-advance date display integrated smoothly into dial architecture.'
  }

  const totalScore = Math.min(100, Math.max(10, autonomyScore + calibreScore + complicationScore))

  return {
    score: totalScore,
    subScores: [
      { label: 'Autonomy & Reserve', score: autonomyScore, max: 35, rationale: autonomyRationale },
      { label: 'Calibre Pedigree', score: calibreScore, max: 40, rationale: calibreRationale },
      { label: 'Functional Complication', score: complicationScore, max: 25, rationale: complicationRationale },
    ],
    summary: `${calibreScore >= 37 ? 'Manufacture/Certified calibre' : 'Proven calibre'} with ${autonomyRationale}`,
  }
}

// -----------------------------------------------------------------------------
// PILLAR 2: BUILD & MATERIALS (0 - 100)
// -----------------------------------------------------------------------------
function evaluateMaterials(watch: Watch): PillarScoreBreakdown {
  const crystal = (watch.crystal || '').toLowerCase()
  const material = (watch.case_material || '').toLowerCase()
  const desc = (watch.description || '').toLowerCase()
  const category = (watch.category || '').toLowerCase()
  const style = (watch.style || '').toLowerCase()
  const wr = watch.water_resistance_m

  // 1. Crystal & Optical Defense (0 - 35)
  let crystalScore = 25
  let crystalRationale = 'Protective mineral or standard optical crystal.'

  if (crystal.includes('sapphire')) {
    crystalScore = 35
    crystalRationale = 'Scratch-proof sapphire crystal with anti-reflective treatment.'
  } else if (crystal.includes('hesalite') || crystal.includes('acrylic') || desc.includes('flight-qualified')) {
    crystalScore = 28
    crystalRationale = 'Shatterproof acrylic/hesalite engineered to NASA spaceflight safety specifications.'
  } else if (crystal.includes('hardlex')) {
    crystalScore = 22
    crystalRationale = 'Seiko proprietary Hardlex mineral crystal with enhanced impact resistance.'
  } else if (crystal.includes('mineral')) {
    crystalScore = 22
    crystalRationale = 'Standard mineral glass crystal.'
  }

  // 2. Metallurgy & Finishing (0 - 35)
  let metallurgyScore = 26
  let metallurgyRationale = 'Standard stainless steel case construction.'

  if (material.includes('titanium') || material.includes('zaratsu')) {
    metallurgyScore = 35
    metallurgyRationale = 'High-Intensity Titanium with distortion-free Zaratsu mirror polishing.'
  } else if (material.includes('904l') || material.includes('oystersteel')) {
    metallurgyScore = 35
    metallurgyRationale = 'Rolex proprietary 904L Oystersteel with exceptional chemical and corrosion resistance.'
  } else if (material.includes('hand-satin') || desc.includes('gérald genta') || (material.includes('stainless steel') && watch.brand === 'Audemars Piguet')) {
    metallurgyScore = 35
    metallurgyRationale = 'Haute Horlogerie hand-satin brushing with mirror-polished case and bezel bevels.'
  } else if (material.includes('316l')) {
    metallurgyScore = 30
    metallurgyRationale = 'Marine-grade 316L stainless steel with refined brushing and chamfering.'
  } else if (material.includes('sandblasted') || material.includes('matte')) {
    metallurgyScore = 28
    metallurgyRationale = 'Non-reflective bead-blasted matte steel engineered for military field utility.'
  } else if (material.includes('carbon') || material.includes('resin')) {
    metallurgyScore = 27
    metallurgyRationale = 'Carbon-reinforced resin structure delivering superior structural shock resistance.'
  } else if (material.includes('swiveling') || watch.brand === 'Jaeger-LeCoultre') {
    metallurgyScore = 33
    metallurgyRationale = 'Art Deco swiveling dual-chassis reversible steel case architecture.'
  }

  // 3. Contextual Water Resistance (0 - 30)
  let wrScore: number
  let wrRationale: string

  const isDive = category.includes('dive') || style.includes('dive')
  const isDress = category.includes('dress') || style.includes('dress') || style.includes('art deco') || style.includes('classic')

  if (isDive) {
    if (wr !== null && wr >= 300) {
      wrScore = 30
      wrRationale = `${wr}m professional saturation dive rating exceeding ISO 6425.`
    } else if (wr !== null && wr >= 200) {
      wrScore = 27
      wrRationale = `${wr}m deep recreation dive depth rating.`
    } else if (wr !== null && wr >= 100) {
      wrScore = 18
      wrRationale = `${wr}m baseline skin-dive capability.`
    } else {
      wrScore = 12
      wrRationale = 'Sub-optimal depth resistance for dedicated dive category.'
    }
  } else if (isDress) {
    if (wr !== null && wr >= 50) {
      wrScore = 30
      wrRationale = `${wr}m water resistance, exceptional for an ultra-thin formal dress timepiece.`
    } else if (wr !== null && wr >= 30) {
      wrScore = 26
      wrRationale = `${wr}m water resistance, the horological industry standard for slim formal watches.`
    } else {
      wrScore = 20
      wrRationale = 'Splash-proof formal case sealing.'
    }
  } else {
    // Sport, Field, GMT, Chronograph, Everyday
    if (wr !== null && wr >= 200) {
      wrScore = 30
      wrRationale = `${wr}m robust water resistance, providing complete aquatic versatility.`
    } else if (wr !== null && wr >= 100) {
      wrScore = 28
      wrRationale = `${wr}m water resistance, optimal for sports and everyday tool watches.`
    } else if (wr !== null && wr >= 50) {
      wrScore = 24
      wrRationale = `${wr}m field water resistance suitable for swimming and rain.`
    } else if (wr !== null && wr >= 30) {
      wrScore = 18
      wrRationale = `${wr}m water resistance handling surface splashes.`
    } else {
      wrScore = 12
      wrRationale = 'Minimal water defense.'
    }
  }

  const totalScore = Math.min(100, Math.max(10, crystalScore + metallurgyScore + wrScore))

  return {
    score: totalScore,
    subScores: [
      { label: 'Crystal Defense', score: crystalScore, max: 35, rationale: crystalRationale },
      { label: 'Metallurgy & Finishing', score: metallurgyScore, max: 35, rationale: metallurgyRationale },
      { label: 'Contextual WR', score: wrScore, max: 30, rationale: wrRationale },
    ],
    summary: `${crystalRationale} Paired with ${metallurgyRationale.toLowerCase()}`,
  }
}

// -----------------------------------------------------------------------------
// PILLAR 3: WEARABILITY & ERGONOMICS (0 - 100)
// -----------------------------------------------------------------------------
function evaluateWearability(watch: Watch): PillarScoreBreakdown {
  const category = (watch.category || '').toLowerCase()
  const style = (watch.style || '').toLowerCase()
  const model = (watch.model || '').toLowerCase()
  const th = watch.case_thickness_mm
  const dia = watch.case_diameter_mm
  const l2l = watch.lug_to_lug_mm ?? (dia ? dia + 7 : 48)

  const isDress = category.includes('dress') || style.includes('dress') || style.includes('art deco')
  const isField = category.includes('field') || style.includes('military')
  const isRectangular = dia !== null && dia < 30

  // 1. Thickness Profile Efficiency (0 - 40)
  let thicknessScore: number
  let thicknessRationale: string

  if (isDress) {
    if (th !== null && th <= 7.5) {
      thicknessScore = 40
      thicknessRationale = `Ultra-thin ${th}mm profile slipping effortlessly under any tailored shirt cuff.`
    } else if (th !== null && th <= 8.5) {
      thicknessScore = 38
      thicknessRationale = `Slim ${th}mm silhouette offering exceptional formal wrist presence.`
    } else if (th !== null && th <= 10.0) {
      thicknessScore = 33
      thicknessRationale = `Sub-10mm profile (${th}mm) well-proportioned for formal attire.`
    } else {
      thicknessScore = 24
      thicknessRationale = `Thicker profile (${th ?? '—'}mm) for classical dress proportions.`
    }
  } else if (isField) {
    if (th !== null && th <= 10.0) {
      thicknessScore = 40
      thicknessRationale = `Extremely slim ${th}mm hand-wound field architecture.`
    } else if (th !== null && th <= 11.5) {
      thicknessScore = 36
      thicknessRationale = `Compact ${th}mm military profile.`
    } else {
      thicknessScore = 26
      thicknessRationale = `Standard ${th ?? '—'}mm field watch depth.`
    }
  } else {
    // Sport / Diver / GMT / Chronograph / Everyday
    if (th !== null && th <= 11.0) {
      thicknessScore = 39
      thicknessRationale = `Exceptionally lean ${th}mm case for an automatic sports watch.`
    } else if (th !== null && th <= 12.0) {
      thicknessScore = 36
      thicknessRationale = `Balanced ${th}mm profile providing ideal daily comfort.`
    } else if (th !== null && th <= 12.6) {
      thicknessScore = 33
      thicknessRationale = `Classic ${th}mm luxury sports proportions.`
    } else if (th !== null && th <= 13.5) {
      thicknessScore = 27
      thicknessRationale = `Moderate ${th}mm thickness typical of robust mechanical movements/chronographs.`
    } else {
      thicknessScore = 20
      thicknessRationale = `Substantial ${th ?? '—'}mm case with noticeable vertical wrist presence.`
    }
  }

  // 2. Lug-to-Lug Wrist Stance (0 - 35)
  let lugScore: number
  let lugRationale: string

  if (isRectangular || model.includes('tank') || model.includes('reverso')) {
    if (l2l <= 36.0) {
      lugScore = 35
      lugRationale = `Compact ${l2l}mm vertical span guaranteeing universal elegance on all wrist sizes.`
    } else if (l2l <= 42.0) {
      lugScore = 32
      lugRationale = `Comfortable ${l2l}mm rectangular geometry fitting average wrists securely.`
    } else {
      lugScore = 26
      lugRationale = `Extended ${l2l}mm case length requiring wider wrist surface.`
    }
  } else {
    if (l2l < 46.0) {
      lugScore = 35
      lugRationale = `Short ${l2l}mm lug stance ensuring zero overhang even on slender wrists.`
    } else if (l2l <= 48.0) {
      lugScore = 33
      lugRationale = `Ideal ${l2l}mm lug-to-lug sweet spot with excellent downward curvature.`
    } else if (l2l <= 49.5) {
      lugScore = 28
      lugRationale = `Commanding ${l2l}mm wrist presence with balanced weight distribution.`
    } else {
      lugScore = 20
      lugRationale = `Extended ${l2l}mm lug span demanding a 7-inch+ wrist circumference.`
    }
  }

  // 3. Diameter Proportionality (0 - 25)
  let diaScore: number
  let diaRationale: string

  if (isDress) {
    if (dia !== null && dia <= 36) {
      diaScore = 25
      diaRationale = `Understated ${dia}mm case diameter honoring classical horological codes.`
    } else if (dia !== null && dia <= 38) {
      diaScore = 22
      diaRationale = `Modern ${dia}mm dress dimension.`
    } else {
      diaScore = 17
      diaRationale = 'Large case diameter for traditional dress dress code.'
    }
  } else if (isField) {
    if (dia !== null && dia >= 36 && dia <= 39) {
      diaScore = 25
      diaRationale = `Quintessential ${dia}mm field watch proportion.`
    } else {
      diaScore = 21
      diaRationale = `${dia ?? '—'}mm field case.`
    }
  } else {
    // Sport / Dive / GMT / Chrono / Everyday
    if (dia !== null && dia >= 38.5 && dia <= 41.5) {
      diaScore = 25
      diaRationale = `Golden ratio ${dia}mm sports diameter offering optimal legibility and wrist stance.`
    } else if (dia !== null && dia > 41.5 && dia <= 43.0) {
      diaScore = 22
      diaRationale = `Purposeful ${dia}mm instrument proportion.`
    } else if (dia !== null && dia > 43.0) {
      diaScore = 18
      diaRationale = `Oversized ${dia}mm tactical profile.`
    } else {
      diaScore = 22
      diaRationale = `${dia ?? '—'}mm case diameter.`
    }
  }

  const totalScore = Math.min(100, Math.max(10, thicknessScore + lugScore + diaScore))

  return {
    score: totalScore,
    subScores: [
      { label: 'Thickness Efficiency', score: thicknessScore, max: 40, rationale: thicknessRationale },
      { label: 'Lug-to-Lug Geometry', score: lugScore, max: 35, rationale: lugRationale },
      { label: 'Diameter Harmony', score: diaScore, max: 25, rationale: diaRationale },
    ],
    summary: `${thicknessRationale} Paired with ${lugRationale.toLowerCase()}`,
  }
}

// -----------------------------------------------------------------------------
// PILLAR 4: VALUE PROPOSITION (0 - 100)
// -----------------------------------------------------------------------------
function evaluateValue(
  watch: Watch,
  engineeringScore: number,
  materialsScore: number,
  wearabilityScore: number
): PillarScoreBreakdown {
  // 1. Calculate the Horological Substance Index (0 - 100)
  const substanceIndex =
    engineeringScore * 0.4 + materialsScore * 0.35 + wearabilityScore * 0.25

  // 2. Compute Expected Substance for Price Band
  // Scale from $50 entry Casio to $35k Haute Horlogerie
  const price = watch.price ?? 500
  const effectivePrice = Math.max(price, 50)
  const expectedSubstance = 42 + 10 * Math.log10(effectivePrice / 50)

  // 3. Calculate Value Score
  const rawDelta = substanceIndex - expectedSubstance
  const valueScore = Math.round(Math.min(98, Math.max(30, 50 + rawDelta * 2.2)))

  let yieldRationale: string
  if (valueScore >= 85) {
    yieldRationale = 'Tremendous substance-to-price ratio delivering features punching far above its MSRP.'
  } else if (valueScore >= 70) {
    yieldRationale = 'Strong value proposition with high horological return per dollar spent.'
  } else if (valueScore >= 55) {
    yieldRationale = 'Commensurate luxury pricing where pedigree and finishing command standard market premium.'
  } else {
    yieldRationale = 'Haute horlogerie luxury positioning where exclusivity and prestige transcend pure dollar-per-spec metrics.'
  }

  const deliveryScore = Math.round(substanceIndex * 0.5)
  const efficiencyScore = Math.round(Math.min(50, Math.max(15, 25 + rawDelta * 1.1)))

  return {
    score: valueScore,
    subScores: [
      {
        label: 'Substance Delivered',
        score: deliveryScore,
        max: 50,
        rationale: `Delivers ${Math.round(substanceIndex)}/100 points of raw mechanical and material substance.`,
      },
      {
        label: 'Price Yield Efficiency',
        score: efficiencyScore,
        max: 50,
        rationale: yieldRationale,
      },
    ],
    summary: `${yieldRationale} (${price > 0 ? `$${price.toLocaleString()} ${watch.currency}` : 'MSRP On Request'})`,
  }
}

// -----------------------------------------------------------------------------
// PILLAR 5: HERITAGE & LINEAGE (0 - 100)
// -----------------------------------------------------------------------------
function evaluateHeritage(watch: Watch): PillarScoreBreakdown {
  const brand = (watch.brand || '').toLowerCase()
  const model = (watch.model || '').toLowerCase()
  const desc = (watch.description || '').toLowerCase()

  // 1. Ancestral Origins & Provenance (0 - 50)
  let provenanceScore = 30
  let provenanceRationale = 'Established modern production lineage.'

  if (model.includes('tank') || desc.includes('1917')) {
    provenanceScore = 50
    provenanceRationale = 'Conceived by Louis Cartier in 1917; one of the foundational wristwatches of modern history.'
  } else if (model.includes('reverso') || desc.includes('1931')) {
    provenanceScore = 50
    provenanceRationale = 'Conceived in 1931 for polo players in India; an immortal pillar of Art Deco horology.'
  } else if (model.includes('submariner') || desc.includes('1953')) {
    provenanceScore = 48
    provenanceRationale = 'Launched in 1953; the foundational blueprint for the entire modern dive watch archetype.'
  } else if (model.includes('gmt-master') || desc.includes('pepsi')) {
    provenanceScore = 48
    provenanceRationale = 'Created in 1954 for Pan Am transcontinental pilots; the archetype of world-travel timepieces.'
  } else if (model.includes('speedmaster') || desc.includes('moonwatch') || desc.includes('nasa')) {
    provenanceScore = 49
    provenanceRationale = 'Flight-qualified by NASA in 1965 and worn on the lunar surface during Apollo 11.'
  } else if (model.includes('royal oak') || desc.includes('gérald genta') || desc.includes('1972')) {
    provenanceScore = 48
    provenanceRationale = 'Designed by Gérald Genta in 1972; singlehandedly birthed the luxury stainless steel sports watch category.'
  } else if (model.includes('black bay 58') || desc.includes('1958')) {
    provenanceScore = 43
    provenanceRationale = 'Direct tribute to Tudor’s landmark 1958 "Big Crown" Reference 7924 diver.'
  } else if (model.includes('khaki field') || desc.includes('military service')) {
    provenanceScore = 42
    provenanceRationale = 'Direct lineage to Hamilton military service watches issued to US armed forces in the mid-20th century.'
  } else if (model.includes('prx') || desc.includes('1978')) {
    provenanceScore = 41
    provenanceRationale = 'Archival re-issue of Tissot’s 1978 integrated sports watch defining the late-70s aesthetic.'
  } else if (model.includes('seiko 5') || desc.includes('1963')) {
    provenanceScore = 40
    provenanceRationale = 'Tracing its lineage to 1963; democratic mechanical icon embodying Seiko’s 5 core promises.'
  } else if (model.includes('snowflake') || brand.includes('grand seiko')) {
    provenanceScore = 38
    provenanceRationale = 'Modern landmark of Japanese high-craftsmanship and revolutionary 2005 Spring Drive technology.'
  } else if (brand.includes('casio') || model.includes('g-shock')) {
    provenanceScore = 36
    provenanceRationale = 'Heir to Kikuo Ibe’s 1983 unbreakable G-Shock vision, reinvented in the modern octagonal CasiOak.'
  }

  // 2. Brand Standing & Cultural Prestige (0 - 50)
  let prestigeScore = 30
  let prestigeRationale = 'Established brand in global watch culture.'

  if (brand.includes('audemars piguet')) {
    prestigeScore = 50
    prestigeRationale = 'Holy Trinity manufacture standing at the absolute summit of Swiss Haute Horlogerie.'
  } else if (brand.includes('rolex')) {
    prestigeScore = 47
    prestigeRationale = 'The most culturally recognizable and prestigious luxury watchmaker on earth.'
  } else if (brand.includes('omega')) {
    prestigeScore = 46
    prestigeRationale = 'Historic Swiss titan with Olympic timing, space exploration, and ocean exploration heritage.'
  } else if (brand.includes('jaeger-lecoultre')) {
    prestigeScore = 46
    prestigeRationale = '"The Watchmaker of Watchmakers", supplying movements to Patek Philippe, Vacheron Constantin, and AP.'
  } else if (brand.includes('cartier')) {
    prestigeScore = 45
    prestigeRationale = 'King of Jewellers and Jeweller of Kings; master of shaped wristwatches and Paris design.'
  } else if (brand.includes('grand seiko')) {
    prestigeScore = 41
    prestigeRationale = 'Mastery of Japanese artistic finishing, Zaratsu polishing, and mechanical-quartz fusion.'
  } else if (brand.includes('tudor')) {
    prestigeScore = 39
    prestigeRationale = 'Born under Hans Wilsdorf in 1926 as Rolex’s tool watch sibling; now a manufacture powerhouse.'
  } else if (brand.includes('tissot') || brand.includes('hamilton')) {
    prestigeScore = 32
    prestigeRationale = 'Historic Swiss manufacture tracing origins to the 19th century with deep horological archives.'
  } else if (brand.includes('seiko') || brand.includes('casio')) {
    prestigeScore = 30
    prestigeRationale = 'Mass horological pioneer that reshaped modern timekeeping on a global scale.'
  }

  const totalScore = Math.min(100, Math.max(10, provenanceScore + prestigeScore))

  return {
    score: totalScore,
    subScores: [
      { label: 'Ancestral Origins', score: provenanceScore, max: 50, rationale: provenanceRationale },
      { label: 'Cultural Prestige', score: prestigeScore, max: 50, rationale: prestigeRationale },
    ],
    summary: `${provenanceRationale} Positioned with ${prestigeRationale.toLowerCase()}`,
  }
}

// -----------------------------------------------------------------------------
// EVALUATE INDIVIDUAL CONTENDER
// -----------------------------------------------------------------------------
export function evaluateWatchContender(watch: Watch): ContenderEvaluation {
  const engineering = evaluateEngineering(watch)
  const materials = evaluateMaterials(watch)
  const wearability = evaluateWearability(watch)
  const value = evaluateValue(watch, engineering.score, materials.score, wearability.score)
  const heritage = evaluateHeritage(watch)

  const scores: Record<EvaluationPillarKey, number> = {
    engineering: engineering.score,
    materials: materials.score,
    wearability: wearability.score,
    value: value.score,
    heritage: heritage.score,
  }

  const breakdowns: Record<EvaluationPillarKey, PillarScoreBreakdown> = {
    engineering,
    materials,
    wearability,
    value,
    heritage,
  }

  // Composite Weighted Score
  const rawComposite =
    scores.engineering * 0.25 +
    scores.materials * 0.20 +
    scores.wearability * 0.20 +
    scores.value * 0.20 +
    scores.heritage * 0.15

  const overallScore = Math.round(rawComposite * 10) / 10

  return {
    watch,
    scores,
    breakdowns,
    overallScore,
  }
}

// -----------------------------------------------------------------------------
// EVALUATE HEAD-TO-HEAD MATCHUP
// -----------------------------------------------------------------------------
export function evaluateMatchup(watch1: Watch, watch2: Watch): DeterministicEvaluation {
  const contender1 = evaluateWatchContender(watch1)
  const contender2 = evaluateWatchContender(watch2)

  const margin = Math.round(Math.abs(contender1.overallScore - contender2.overallScore) * 10) / 10

  let verdictType: VerdictClassification
  let winnerSlot: 1 | 2 | 'tie'
  let winner: Watch | null = null

  if (margin <= 1.5) {
    verdictType = 'DEAD HEAT'
    winnerSlot = 'tie'
  } else if (margin <= 5.0) {
    verdictType = 'SLIGHT EDGE'
    winnerSlot = contender1.overallScore > contender2.overallScore ? 1 : 2
    winner = winnerSlot === 1 ? watch1 : watch2
  } else {
    verdictType = 'CLEAR ADVANTAGE'
    winnerSlot = contender1.overallScore > contender2.overallScore ? 1 : 2
    winner = winnerSlot === 1 ? watch1 : watch2
  }

  // Calculate Pillar Advantages
  const pillarAdvantages: Record<EvaluationPillarKey, PillarAdvantage> = {
    engineering: { pillarKey: 'engineering', winnerSlot: 'tie', delta: 0, rationale: '' },
    materials: { pillarKey: 'materials', winnerSlot: 'tie', delta: 0, rationale: '' },
    wearability: { pillarKey: 'wearability', winnerSlot: 'tie', delta: 0, rationale: '' },
    value: { pillarKey: 'value', winnerSlot: 'tie', delta: 0, rationale: '' },
    heritage: { pillarKey: 'heritage', winnerSlot: 'tie', delta: 0, rationale: '' },
  }

  for (const pillar of EVALUATION_PILLARS) {
    const s1 = contender1.scores[pillar.key]
    const s2 = contender2.scores[pillar.key]
    const diff = Math.round(Math.abs(s1 - s2) * 10) / 10

    let pWinnerSlot: 1 | 2 | 'tie' = 'tie'
    let pRationale = 'Parity between both contenders.'

    if (diff > 1.0) {
      pWinnerSlot = s1 > s2 ? 1 : 2
      const leaderWatch = pWinnerSlot === 1 ? watch1 : watch2
      const leaderBreakdown = pWinnerSlot === 1 ? contender1.breakdowns[pillar.key] : contender2.breakdowns[pillar.key]
      pRationale = `${leaderWatch.brand} leads (+${diff.toFixed(1)} pts): ${leaderBreakdown.summary}`
    }

    pillarAdvantages[pillar.key] = {
      pillarKey: pillar.key,
      winnerSlot: pWinnerSlot,
      delta: diff,
      rationale: pRationale,
    }
  }

  // Construct Editorial Headline & Rationale
  let headline: string
  let summaryRationale: string

  const leader = winnerSlot === 1 ? contender1 : contender2
  const trailer = winnerSlot === 1 ? contender2 : contender1

  if (verdictType === 'DEAD HEAT') {
    headline = `DEAD HEAT // NEGLIGIBLE ${margin.toFixed(1)}-POINT DIFFERENTIAL`
    summaryRationale = `An exceptionally balanced showdown between the ${watch1.brand} ${watch1.model} (${contender1.overallScore.toFixed(1)}) and ${watch2.brand} ${watch2.model} (${contender2.overallScore.toFixed(1)}). While ${watch1.brand} excels in ${getTopPillars(contender1, contender2)}, ${watch2.brand} effectively neutralizes the gap with superior performance in ${getTopPillars(contender2, contender1)}. Both timepieces represent masterclasses within their respective design philosophies.`
  } else if (verdictType === 'SLIGHT EDGE') {
    headline = `SLIGHT EDGE // ${leader.watch.brand.toUpperCase()} LEADS BY ${margin.toFixed(1)} POINTS`
    summaryRationale = `The ${leader.watch.brand} ${leader.watch.model} (${leader.overallScore.toFixed(1)}) claims a competitive victory over the ${trailer.watch.brand} ${trailer.watch.model} (${trailer.overallScore.toFixed(1)}). The deciding factors were ${leader.watch.brand}’s decisive leads in ${getTopPillars(leader, trailer)}, which outweighed ${trailer.watch.brand}’s strengths in ${getTopPillars(trailer, leader)}.`
  } else {
    headline = `DECISIVE BENCHMARK // ${leader.watch.brand.toUpperCase()} COMMANDS +${margin.toFixed(1)} POINT SPREAD`
    summaryRationale = `The ${leader.watch.brand} ${leader.watch.model} (${leader.overallScore.toFixed(1)}) establishes a commanding lead over the ${trailer.watch.brand} ${trailer.watch.model} (${trailer.overallScore.toFixed(1)}). ${leader.watch.brand} outperforms across ${getTopPillars(leader, trailer)}, establishing a higher tier of specifications, horological pedigree, and build execution relative to the matchup.`
  }

  return {
    watch1,
    watch2,
    contender1,
    contender2,
    winnerSlot,
    winner,
    margin,
    verdictType,
    headline,
    summaryRationale,
    pillarAdvantages,
  }
}

function getTopPillars(c1: ContenderEvaluation, c2: ContenderEvaluation): string {
  const advantages = EVALUATION_PILLARS
    .map((p) => ({
      name: p.name,
      diff: c1.scores[p.key] - c2.scores[p.key],
    }))
    .filter((p) => p.diff > 1.0)
    .sort((a, b) => b.diff - a.diff)

  if (advantages.length === 0) {
    return 'overall consistency'
  }
  if (advantages.length === 1) {
    return advantages[0].name
  }
  return `${advantages[0].name} and ${advantages[1].name}`
}
