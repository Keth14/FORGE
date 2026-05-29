export const DEFAULT_HABITS = [
  {
    id: 'train',
    icon: '🏋️',
    label: 'Train',
    desc: 'Lean and aesthetic. Build the body for the stage.',
    xp: 30,
    locked: true,
  },
  {
    id: 'water',
    icon: '💧',
    label: '3L Water',
    desc: 'Jaw definition. Skin. Energy.',
    xp: 10,
    locked: true,
  },
  {
    id: 'groom',
    icon: '🪞',
    label: 'Grooming',
    desc: 'Look the part every day. No exceptions.',
    xp: 10,
    locked: false,
  },
  {
    id: 'phone',
    icon: '📵',
    label: 'Phone Quarantine',
    desc: 'First 90 min. Face down.',
    xp: 25,
    locked: true,
  },
  {
    id: 'deepwork',
    icon: '🧠',
    label: 'Deep Work',
    desc: 'One focused block. Build or study.',
    xp: 30,
    locked: true,
  },
  {
    id: 'read',
    icon: '📖',
    label: 'Read',
    desc: 'Feed the mind. Not the feed.',
    xp: 15,
    locked: false,
  },
  {
    id: 'debrief',
    icon: '✍️',
    label: 'Debrief',
    desc: 'What was today for. What did it cost.',
    xp: 10,
    locked: false,
  },
  {
    id: 'interact',
    icon: '🗣️',
    label: 'Sharp Interaction',
    desc: 'One present, engaged, real conversation.',
    xp: 10,
    locked: false,
  },
  {
    id: 'sleep',
    icon: '😴',
    label: 'Sleep',
    desc: 'Discipline starts the night before.',
    xp: 15,
    locked: false,
  },
]

export const STABILIZATION_HABITS = [
  { id: 'sleep',   icon: '😴', label: 'Sleep',     desc: 'Consistent time. Non-negotiable.' },
  { id: 'water',   icon: '💧', label: 'Water',      desc: '3 litres. Basic system maintenance.' },
  { id: 'move',    icon: '🚶', label: 'Move',       desc: 'Walk. Sunlight. Get outside.' },
  { id: 'shower',  icon: '🚿', label: 'Shower',     desc: 'Physical reset.' },
  { id: 'connect', icon: '🗣️', label: 'One Human', desc: 'Talk to someone real. Not a screen.' },
]

export const GRACE_REASONS = [
  { id: 'sick',   label: 'Sick / Unwell',          valid: true  },
  { id: 'travel', label: 'Travelling / Disrupted', valid: true  },
  { id: 'mental', label: 'Mental Health Day',       valid: true  },
  { id: 'nope',   label: 'No excuse. I slipped.',   valid: false },
]

export const MAX_GRACE = 5
