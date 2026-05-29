import {
  DRIFT_WORDS, RESISTANCE_WORDS, DELUSION_WORDS, RECOVERY_WORDS,
  RESTRUCTURE_WORDS, PLANNING_WORDS, PHILOSOPHICAL_WORDS,
} from '../constants/signals'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getEntries(history, days = 7) {
  return Object.entries(history || {})
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .slice(0, days)
}

function execRate(entries, habits) {
  if (!entries.length) return 0
  const total = entries.reduce((s, [, d]) =>
    s + habits.filter(h => d.checks?.[h.id]).length, 0)
  return total / (entries.length * habits.length)
}

function allCommentText(entries) {
  return entries
    .flatMap(([, d]) => Object.values(d.comments || {}))
    .join(' ')
    .toLowerCase()
}

function countWords(text, wordList) {
  return wordList.filter(w => text.includes(w)).length
}

// ── Core Trackers ─────────────────────────────────────────────────────────────

export function calcMomentum(history, habits) {
  const last14 = getEntries(history, 14)
  if (!last14.length) return 0
  const recent = last14.slice(0, 7)
  const older = last14.slice(7, 14)
  const recentRate = execRate(recent, habits)
  const olderRate = execRate(older, habits)
  const base = recentRate * 100
  const trend = older.length > 0 ? (recentRate - olderRate) * 50 : 0
  return Math.round(Math.min(100, Math.max(0, base + trend)))
}

export function calcDrift(history, habits) {
  const entries = getEntries(history, 7)
  if (!entries.length) return 0
  const text = allCommentText(entries)
  const langScore = countWords(text, DRIFT_WORDS) * 8
  const deepMissed = entries.filter(([, d]) => !d.checks?.deepwork).length
  const phoneMissed = entries.filter(([, d]) => !d.checks?.phone).length
  const execScore = ((deepMissed + phoneMissed) / (entries.length * 2)) * 60
  return Math.round(Math.min(100, langScore + execScore))
}

export function calcResistance(history, habits) {
  const entries = getEntries(history, 7)
  if (!entries.length) return 0
  const text = allCommentText(entries)
  const langScore = countWords(text, RESISTANCE_WORDS) * 10
  const locked = ['train', 'phone', 'deepwork']
  const lockedMissed = entries.reduce((s, [, d]) =>
    s + locked.filter(id => !d.checks?.[id]).length, 0)
  const execScore = (lockedMissed / (entries.length * locked.length)) * 50
  return Math.round(Math.min(100, langScore + execScore))
}

export function calcSelfBetrayal(history, habits) {
  const entries = getEntries(history, 14)
  if (!entries.length) return 0
  const text = allCommentText(entries)
  const betrayalHits = [...DRIFT_WORDS, ...RESISTANCE_WORDS].filter(w => text.includes(w)).length
  const criticalMissed = entries.filter(([, d]) => !d.checks?.train || !d.checks?.deepwork).length
  const score = betrayalHits * 5 + (criticalMissed / entries.length) * 60
  return Math.round(Math.min(100, score))
}

// ── Mode Inference ────────────────────────────────────────────────────────────

export function inferMode(history, habits) {
  const entries = getEntries(history, 7)
  if (entries.length < 2) return 'stable'

  const deepDone = entries.filter(([, d]) => d.checks?.deepwork).length
  const phoneDone = entries.filter(([, d]) => d.checks?.phone).length
  const trainDone = entries.filter(([, d]) => d.checks?.train).length
  const rate = execRate(entries, habits)
  const text = allCommentText(entries)

  const driftSignal = countWords(text, DRIFT_WORDS)
  const delusionSignal = countWords(text, DELUSION_WORDS)
  const recoverySignal = countWords(text, RECOVERY_WORDS)

  if (recoverySignal >= 2 || (rate < 0.25 && trainDone === 0)) return 'recovery'
  if (delusionSignal >= 2 || (driftSignal >= 3 && rate < 0.4)) return 'delusion'
  if (driftSignal >= 2 || (deepDone <= 1 && phoneDone <= 1 && rate < 0.45)) return 'drift'
  if (deepDone >= 5 && phoneDone >= 5 && rate > 0.75) return 'war'
  return 'stable'
}

// ── Collapse Risk ─────────────────────────────────────────────────────────────

export function calcCollapseRisk(history, habits, goals = []) {
  const last7 = getEntries(history, 7)
  const last14 = getEntries(history, 14)
  const last2 = getEntries(history, 2)

  let score = 0
  const signals = []
  const text7 = allCommentText(last7)

  // +25 Sudden goal creation spike
  const recentGoals = goals.filter(g => last7.some(([date]) => date === g.createdAt))
  if (recentGoals.length >= 2) {
    score += 25
    signals.push('Multiple goals created in short window')
  }

  // +20 System restructure language
  const restructureHits = countWords(text7, RESTRUCTURE_WORDS)
  if (restructureHits >= 2) {
    score += 20
    signals.push(`System restructure language detected (${restructureHits} signals)`)
  }

  // +20 Planning-heavy language spike
  const planningHits = countWords(text7, PLANNING_WORDS)
  if (planningHits >= 2) {
    score += 20
    signals.push('Planning language elevated without matching execution')
  }

  // +20 Execution collapse after ambition spike
  if (last14.length >= 7) {
    const older7 = last14.slice(7, 14)
    const recentRate = execRate(last7, habits)
    const olderRate = execRate(older7, habits)
    const commentLen = last7.reduce((s, [, d]) =>
      s + Object.values(d.comments || {}).join('').length, 0)
    if (commentLen > 200 && recentRate < olderRate - 0.2) {
      score += 20
      signals.push('High conceptual activity paired with execution decline')
    }
  }

  // +15 Philosophical abstraction spike
  const abstractHits = countWords(text7, PHILOSOPHICAL_WORDS)
  if (abstractHits >= 2) {
    score += 15
    signals.push('Philosophical abstraction spike detected')
  }

  // +15 Physical grounding collapse
  const trainMissed = last7.filter(([, d]) => !d.checks?.train).length
  const waterMissed = last7.filter(([, d]) => !d.checks?.water).length
  const sleepMissed = last7.filter(([, d]) => !d.checks?.sleep).length
  const physicalCollapse = (trainMissed >= 4 ? 1 : 0) + (waterMissed >= 4 ? 1 : 0) + (sleepMissed >= 4 ? 1 : 0)
  if (physicalCollapse >= 2) {
    score += 15
    signals.push('Physical grounding collapsing (train/water/sleep)')
  }

  // +10 Logging gap
  if (last2.length < 2) {
    score += 10
    signals.push('Logging gap detected')
  }

  // +10 Long comments + low execution
  const avgCommentLen = last7.length > 0
    ? last7.reduce((s, [, d]) => s + Object.values(d.comments || {}).join('').length, 0) / last7.length
    : 0
  const deepMissed = last7.filter(([, d]) => !d.checks?.deepwork).length
  if (avgCommentLen > 80 && deepMissed >= 4) {
    score += 10
    signals.push('Verbose commentary without execution')
  }

  // +10 High goal count, low completion
  if (goals.length >= 2) {
    const totalItems = goals.reduce((s, g) => s + (g.plan || []).length, 0)
    const doneItems = goals.reduce((s, g) => s + Object.values(g.checks || {}).filter(Boolean).length, 0)
    if (totalItems > 6 && doneItems / totalItems < 0.2) {
      score += 10
      signals.push('High goal count, low completion ratio')
    }
  }

  score = Math.min(100, score)
  const phase = score < 35 ? 'stable' : score < 55 ? 'watch' : score < 75 ? 'drift' : 'stabilization'

  return { score, phase, signals }
}

// ── Contract Divergence ───────────────────────────────────────────────────────

export function detectContractDivergence(history, habits) {
  const entries = getEntries(history, 7)
  if (entries.length < 3) return []

  const text = allCommentText(entries)
  const divergences = []

  const deepMissed = entries.filter(([, d]) => !d.checks?.deepwork).length
  const trainMissed = entries.filter(([, d]) => !d.checks?.train).length
  const phoneMissed = entries.filter(([, d]) => !d.checks?.phone).length
  const driftLang = countWords(text, DRIFT_WORDS)
  const delusionLang = countWords(text, DELUSION_WORDS)

  if (driftLang >= 2 || (deepMissed >= 4 && delusionLang >= 1)) {
    divergences.push({ contract: 1, note: `Increased planning language without matching execution for ${entries.length} consecutive days.` })
  }
  if (phoneMissed >= 4) {
    divergences.push({ contract: 2, note: `Morning quarantine failed ${phoneMissed} of last ${entries.length} days.` })
  }
  if (trainMissed >= 4) {
    divergences.push({ contract: 4, note: `Training missed ${trainMissed} of last ${entries.length} days. Physical anchor destabilizing.` })
  }
  if (deepMissed >= 4) {
    divergences.push({ contract: 7, note: `Deep work avoided ${deepMissed} of last ${entries.length} days. Resistance pattern strengthening.` })
  }

  return divergences
}

// ── Pattern Memory ────────────────────────────────────────────────────────────

export function storeCollapsePattern(state, risk, today) {
  if (risk.phase !== 'drift' && risk.phase !== 'stabilization') return state
  const existing = state.collapsePatterns || []
  if (existing.length > 0 && existing[0].date === today) return state
  const pattern = { date: today, phase: risk.phase, score: risk.score, signals: risk.signals }
  return { ...state, collapsePatterns: [pattern, ...existing].slice(0, 10) }
}

export function findPatternMatch(currentSignals, collapsePatterns = []) {
  const prev = collapsePatterns.slice(1)
  for (const p of prev) {
    const matches = currentSignals.filter(s =>
      p.signals.some(ps => ps.slice(0, 20) === s.slice(0, 20))
    ).length
    if (matches >= 2) return p
  }
  return null
}

// ── Avatar Stats ──────────────────────────────────────────────────────────────

export function calcAvatarStats(state, momentum, drift, resistance, selfBetrayal, collapseRisk) {
  const entries = Object.entries(state.history || {})
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .slice(0, 14)
  const n = entries.length || 1

  const rate = id => entries.filter(([, d]) => d.checks?.[id]).length / n

  const trainRate    = rate('train')
  const sleepRate    = rate('sleep')
  const waterRate    = rate('water')
  const deepRate     = rate('deepwork')
  const phoneRate    = rate('phone')
  const groomRate    = rate('groom')
  const interactRate = rate('interact')
  const debriefRate  = rate('debrief')

  const discipline = Math.round(((momentum / 100) * 0.4 + deepRate * 0.3 + phoneRate * 0.3) * 100)
  const physical   = Math.round((trainRate * 0.45 + sleepRate * 0.3 + waterRate * 0.25) * 100)
  const clarity    = Math.round(((1 - drift / 100) * 0.4 + deepRate * 0.35 + debriefRate * 0.25) * 100)
  const presence   = Math.round((groomRate * 0.35 + interactRate * 0.35 + (1 - drift / 100) * 0.3) * 100)
  const integrity  = Math.round(((1 - selfBetrayal / 100) * 0.6 + (1 - collapseRisk.score / 100) * 0.4) * 100)
  const confidence = Math.round((discipline * 0.3 + physical * 0.25 + integrity * 0.25 + presence * 0.2))

  const clamp = v => Math.min(100, Math.max(0, v))

  return {
    discipline: clamp(discipline),
    physical:   clamp(physical),
    clarity:    clamp(clarity),
    presence:   clamp(presence),
    integrity:  clamp(integrity),
    confidence: clamp(confidence),
  }
}

export function getTierLabel(val) {
  if (val >= 80) return 'ALIGNED'
  if (val >= 60) return 'STRENGTHENING'
  if (val >= 40) return 'GROUNDED'
  if (val >= 25) return 'WEAKENING'
  return 'UNSTABLE'
}

export function getTierColor(val) {
  if (val >= 80) return '#10b981'
  if (val >= 60) return '#f59e0b'
  if (val >= 40) return '#fb923c'
  if (val >= 25) return '#f87171'
  return '#ef4444'
}
