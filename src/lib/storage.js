import { DEFAULT_HABITS } from '../constants/habits'

const STORAGE_KEY = 'forge_keth_v4'
const API_KEY_STORAGE = 'forge_ai_key'

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const s = JSON.parse(raw)
    if (!s.habits) s.habits = DEFAULT_HABITS
    return s
  } catch {
    return null
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage full or unavailable
  }
}

export function clearState() {
  localStorage.clear()
}

export function getApiKey() {
  try {
    // Prefer env variable, fall back to localStorage
    return import.meta.env.VITE_OPENAI_API_KEY || localStorage.getItem(API_KEY_STORAGE) || ''
  } catch {
    return ''
  }
}

export function saveApiKey(key) {
  try {
    localStorage.setItem(API_KEY_STORAGE, key.trim())
  } catch {}
}

export function clearApiKey() {
  try {
    localStorage.removeItem(API_KEY_STORAGE)
  } catch {}
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function daysUntil(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date(todayStr())) / 86400000)
}

export function initState() {
  return {
    username: 'Keth',
    startDate: todayStr(),
    dayCount: 1,
    totalXP: 0,
    lifetimeChecks: 0,
    lifetimePossible: 0,
    streak: 0,
    longestStreak: 0,
    graceDaysUsed: 0,
    lastActiveDate: null,
    history: {},
    habits: DEFAULT_HABITS,
    missions: [],
    bodyLog: [],
    photoLog: [],
    jarvisInsights: [],
    goals: [],
    collapsePatterns: [],
    awarenessAcknowledged: null,
    pin: null,
  }
}
