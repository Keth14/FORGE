import { useState, useEffect, useCallback } from 'react'
import { loadState, saveState, initState, todayStr } from '../lib/storage'
import {
  calcMomentum, calcDrift, calcResistance, calcSelfBetrayal,
  inferMode, calcCollapseRisk, detectContractDivergence,
  storeCollapsePattern, findPatternMatch,
} from '../lib/signals'
import { MODE_CONFIG, getLevel, getNextLevel } from '../constants/modes'

export function useForge() {
  const [state, setState] = useState(() => loadState() || initState())
  const [checks, setChecks] = useState({})
  const [comments, setComments] = useState({})

  const today = todayStr()

  // Load today's data on mount / date change
  useEffect(() => {
    const h = state.history[today]
    if (h?.checks)   setChecks(h.checks)
    if (h?.comments) setComments(h.comments)
  }, [today])

  // Persist state
  useEffect(() => {
    saveState(state)
  }, [state])

  // ── Derived values ────────────────────────────────────────────────────────

  // Live history: merge today's checks so trackers update in real time
  const liveHistory = {
    ...state.history,
    [today]: {
      ...(state.history[today] || {}),
      checks,
      comments,
    },
  }

  const momentum     = calcMomentum(liveHistory, state.habits)
  const drift        = calcDrift(liveHistory, state.habits)
  const resistance   = calcResistance(liveHistory, state.habits)
  const selfBetrayal = calcSelfBetrayal(liveHistory, state.habits)

  const mode         = inferMode(liveHistory, state.habits)
  const collapseRisk = calcCollapseRisk(liveHistory, state.habits, state.goals)
  const contractDivergences = detectContractDivergence(liveHistory, state.habits)
  const patternMatch = findPatternMatch(collapseRisk.signals, state.collapsePatterns)

  // Effective mode: collapse risk can override inferred mode
  let effectiveMode = mode
  if (collapseRisk.phase === 'stabilization') effectiveMode = 'stabilization'
  else if (collapseRisk.phase === 'watch' && mode === 'stable') effectiveMode = 'watch'

  const mc = MODE_CONFIG[effectiveMode] || MODE_CONFIG.stable

  const level     = getLevel(state.totalXP)
  const nextLevel = getNextLevel(state.totalXP)
  const levelPct  = nextLevel ? ((state.totalXP - level.min) / (nextLevel.min - level.min)) * 100 : 100
  const consPct   = state.lifetimePossible > 0
    ? Math.round((state.lifetimeChecks / state.lifetimePossible) * 100)
    : 0

  const doneToday    = state.habits.filter(h => checks[h.id]).length
  const allDoneToday = state.habits.every(h => checks[h.id])
  const week         = Math.ceil(state.dayCount / 7)

  // ── Store collapse patterns when elevated ────────────────────────────────
  useEffect(() => {
    if (collapseRisk.phase === 'drift' || collapseRisk.phase === 'stabilization') {
      setState(s => storeCollapsePattern(s, collapseRisk, today))
    }
  }, [collapseRisk.phase])

  // ── Actions ───────────────────────────────────────────────────────────────

  const toggleHabit = useCallback((habitId) => {
    const habit = state.habits.find(h => h.id === habitId)
    if (!habit) return

    const was        = !!checks[habitId]
    const newChecks  = { ...checks, [habitId]: !was }
    const wasAllDone = state.habits.every(h => !!checks[h.id])
    const allDone    = state.habits.every(h => newChecks[h.id])
    const bonusXP    = allDone && !wasAllDone ? 50 : 0
    const lostBonus  = !allDone && wasAllDone ? 50 : 0
    const dayXP      = state.habits.reduce((s, h) => s + (newChecks[h.id] ? h.xp : 0), 0) + (allDone ? 50 : 0)

    setChecks(newChecks)

    setState(s => {
      const newXP     = Math.max(0, s.totalXP + (!was ? habit.xp : -habit.xp) + bonusXP - lostBonus)
      let streak      = s.streak
      let longest     = s.longestStreak
      let lastActive  = s.lastActiveDate

      if (allDone && s.lastActiveDate !== today) {
        const yest = new Date()
        yest.setDate(yest.getDate() - 1)
        const yStr = yest.toISOString().slice(0, 10)
        streak     = s.lastActiveDate === yStr ? s.streak + 1 : 1
        longest    = Math.max(streak, s.longestStreak)
        lastActive = today
      }

      const existingComments = s.history[today]?.comments || comments
      const newHistory = {
        ...s.history,
        [today]: { checks: newChecks, comments: existingComments, xpEarned: dayXP },
      }

      return {
        ...s,
        totalXP: newXP,
        streak,
        longestStreak: longest,
        lastActiveDate: lastActive,
        lifetimeChecks: Math.max(0, s.lifetimeChecks + (!was ? 1 : -1)),
        history: newHistory,
      }
    })
  }, [checks, comments, state.habits, state.totalXP, today])

  const saveComment = useCallback((habitId, text) => {
    const newComments = { ...comments, [habitId]: text }
    setComments(newComments)
    setState(s => ({
      ...s,
      history: {
        ...s.history,
        [today]: { ...(s.history[today] || {}), comments: newComments },
      },
    }))
  }, [comments, today])

  const advanceDay = useCallback(() => {
    setState(s => ({
      ...s,
      dayCount: s.dayCount + 1,
      lifetimePossible: s.lifetimePossible + s.habits.length,
    }))
    setChecks({})
    setComments({})
  }, [])

  const useGrace = useCallback((reasonId) => {
    const { GRACE_REASONS } = require('../constants/habits')
    const reason = GRACE_REASONS.find(r => r.id === reasonId)
    if (!reason) return
    setState(s => ({
      ...s,
      graceDaysUsed: reason.valid ? s.graceDaysUsed + 1 : s.graceDaysUsed,
      streak: reason.valid ? s.streak : 0,
      totalXP: reason.valid ? s.totalXP : Math.max(0, s.totalXP - 30),
    }))
    advanceDay()
  }, [advanceDay])

  const acknowledgeAwareness = useCallback(() => {
    setState(s => ({ ...s, awarenessAcknowledged: today }))
  }, [today])

  const addMission = useCallback((mission) => {
    setState(s => ({
      ...s,
      missions: [...s.missions, { id: Date.now(), ...mission }]
        .sort((a, b) => new Date(a.date) - new Date(b.date)),
    }))
  }, [])

  const removeMission = useCallback((id) => {
    setState(s => ({ ...s, missions: s.missions.filter(m => m.id !== id) }))
  }, [])

  const addHabit = useCallback((habit) => {
    setState(s => ({
      ...s,
      habits: [...s.habits, { id: `c${Date.now()}`, locked: false, ...habit }],
    }))
  }, [])

  const removeHabit = useCallback((id) => {
    setState(s => ({
      ...s,
      habits: s.habits.filter(h => h.id !== id || h.locked),
    }))
  }, [])

  const addGoal = useCallback((goal) => {
    setState(s => ({ ...s, goals: [...s.goals, goal] }))
  }, [])

  const updateGoal = useCallback((goalId, updates) => {
    setState(s => ({
      ...s,
      goals: s.goals.map(g => g.id === goalId ? { ...g, ...updates } : g),
    }))
  }, [])

  const removeGoal = useCallback((goalId) => {
    setState(s => ({ ...s, goals: s.goals.filter(g => g.id !== goalId) }))
  }, [])

  const toggleGoalItem = useCallback((goalId, itemId) => {
    setState(s => ({
      ...s,
      goals: s.goals.map(g => {
        if (g.id !== goalId) return g
        return { ...g, checks: { ...g.checks, [itemId]: !g.checks?.[itemId] } }
      }),
    }))
  }, [])

  const addJarvisInsight = useCallback((insight) => {
    setState(s => ({
      ...s,
      jarvisInsights: [insight, ...s.jarvisInsights].slice(0, 15),
    }))
  }, [])

  const addBodyLog = useCallback((entry) => {
    setState(s => ({ ...s, bodyLog: [...s.bodyLog, entry] }))
  }, [])

  const addPhotoLog = useCallback((entry) => {
    setState(s => ({ ...s, photoLog: [...s.photoLog, entry] }))
  }, [])

  const setPin = useCallback((pin) => {
    setState(s => ({ ...s, pin }))
  }, [])

  const importConfig = useCallback((config) => {
    if (config.habits) {
      setState(s => ({
        ...s,
        habits: config.habits,
        username: config.username || s.username,
        missions: config.missions || s.missions,
      }))
    }
  }, [])

  return {
    // State
    state,
    setState,
    checks,
    comments,
    today,
    week,

    // Derived
    momentum,
    drift,
    resistance,
    selfBetrayal,
    mode,
    effectiveMode,
    mc,
    collapseRisk,
    contractDivergences,
    patternMatch,
    level,
    nextLevel,
    levelPct,
    consPct,
    doneToday,
    allDoneToday,

    // Actions
    toggleHabit,
    saveComment,
    advanceDay,
    useGrace,
    acknowledgeAwareness,
    addMission,
    removeMission,
    addHabit,
    removeHabit,
    addGoal,
    updateGoal,
    removeGoal,
    toggleGoalItem,
    addJarvisInsight,
    addBodyLog,
    addPhotoLog,
    setPin,
    importConfig,
  }
}
