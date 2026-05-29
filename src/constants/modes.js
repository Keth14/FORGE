export const MODE_CONFIG = {
  stable: {
    label: 'STABLE',
    accent: '#f59e0b',
    bg: '#0a0908',
    cardBg: '#0f0e0d',
    border: '#1c1917',
  },
  war: {
    label: 'WAR',
    accent: '#ef4444',
    bg: '#090808',
    cardBg: '#0f0c0c',
    border: '#2a1515',
  },
  drift: {
    label: 'DRIFT',
    accent: '#78716c',
    bg: '#0c0c0b',
    cardBg: '#111110',
    border: '#1a1a18',
  },
  delusion: {
    label: 'DELUSION',
    accent: '#8b5cf6',
    bg: '#0b0a0e',
    cardBg: '#100f14',
    border: '#1e1a2a',
  },
  recovery: {
    label: 'RECOVERY',
    accent: '#60a5fa',
    bg: '#090c0f',
    cardBg: '#0d1117',
    border: '#152030',
  },
  watch: {
    label: 'WATCH',
    accent: '#fb923c',
    bg: '#0b0a08',
    cardBg: '#110f0d',
    border: '#1f1a15',
  },
  stabilization: {
    label: 'STABILIZATION',
    accent: '#60a5fa',
    bg: '#08090c',
    cardBg: '#0c0d10',
    border: '#141620',
  },
}

export const LEVELS = [
  { name: 'CIVILIAN',   min: 0,     color: '#6b7280' },
  { name: 'INITIATE',   min: 500,   color: '#10b981' },
  { name: 'OPERATOR',   min: 1500,  color: '#3b82f6' },
  { name: 'SPECIALIST', min: 3500,  color: '#8b5cf6' },
  { name: 'IRONCLAD',   min: 7000,  color: '#f59e0b' },
  { name: 'FORGED',     min: 12000, color: '#ef4444' },
]

export function getLevel(xp) {
  let level = LEVELS[0]
  for (const l of LEVELS) {
    if (xp >= l.min) level = l
  }
  return level
}

export function getNextLevel(xp) {
  for (let i = 0; i < LEVELS.length - 1; i++) {
    if (xp >= LEVELS[i].min && xp < LEVELS[i + 1].min) return LEVELS[i + 1]
  }
  return null
}
