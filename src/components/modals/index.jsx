import { useState } from 'react'
import { Modal, ModalLabel, FieldInput } from '../ui/Modal'
import { INTEGRITY_CONTRACTS } from '../../constants/contracts'
import { GRACE_REASONS } from '../../constants/habits'
import { todayStr } from '../../lib/storage'

// ── Grace Day Modal ───────────────────────────────────────────────────────────
export function GraceModal({ mc, graceDaysLeft, onPick, onClose }) {
  return (
    <Modal onClose={onClose}>
      <ModalLabel>WHY DID YOU MISS?</ModalLabel>
      <div style={{ fontSize: 10, color: '#44403c', marginBottom: 16, lineHeight: 1.7 }}>
        {graceDaysLeft} grace days remaining.
      </div>
      {GRACE_REASONS.map(r => (
        <button key={r.id} onClick={() => onPick(r.id)} style={{ display: 'block', width: '100%', padding: 11, background: '#0a0908', border: `1px solid ${r.valid ? '#1c1917' : '#7f1d1d'}`, borderRadius: 7, color: r.valid ? '#d6d3d1' : '#f87171', fontSize: 12, cursor: 'pointer', marginBottom: 7, textAlign: 'left' }}>
          {r.label}
        </button>
      ))}
      <button onClick={onClose} style={{ width: '100%', padding: 9, background: 'transparent', border: '1px solid #1c1917', borderRadius: 7, color: '#44403c', fontSize: 10, cursor: 'pointer' }}>CANCEL</button>
    </Modal>
  )
}

// ── Mission Modal ─────────────────────────────────────────────────────────────
export function MissionModal({ onAdd, onClose }) {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [why, setWhy] = useState('')
  const [emoji, setEmoji] = useState('🎯')

  return (
    <Modal onClose={onClose}>
      <ModalLabel>NEW MISSION</ModalLabel>
      <FieldInput label="Name" value={name} onChange={setName} placeholder="Fashion Show" />
      <FieldInput label="Date (YYYY-MM-DD)" value={date} onChange={setDate} placeholder="2027-02-01" />
      <FieldInput label="Why (one line)" value={why} onChange={setWhy} placeholder="This is what I am building for." />
      <FieldInput label="Emoji" value={emoji} onChange={setEmoji} placeholder="🎯" />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button onClick={() => name && date && onAdd({ name, date, why, emoji })} style={{ flex: 1, padding: 10, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 7, color: '#fbbf24', fontSize: 10, cursor: 'pointer' }}>ADD</button>
        <button onClick={onClose} style={{ padding: '10px 14px', background: 'transparent', border: '1px solid #1c1917', borderRadius: 7, color: '#44403c', fontSize: 10, cursor: 'pointer' }}>CANCEL</button>
      </div>
    </Modal>
  )
}

// ── Habit Modal ───────────────────────────────────────────────────────────────
export function HabitModal({ onAdd, onClose }) {
  const [label, setLabel] = useState('')
  const [icon, setIcon]   = useState('⚡')
  const [xp, setXp]       = useState('15')

  return (
    <Modal onClose={onClose}>
      <ModalLabel>NEW DIRECTIVE</ModalLabel>
      <FieldInput label="Name" value={label} onChange={setLabel} placeholder="Cold Plunge" />
      <FieldInput label="Icon" value={icon} onChange={setIcon} placeholder="⚡" />
      <FieldInput label="XP" value={xp} onChange={setXp} placeholder="15" />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button onClick={() => label && onAdd({ label, icon, xp: parseInt(xp) || 10 })} style={{ flex: 1, padding: 10, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 7, color: '#fbbf24', fontSize: 10, cursor: 'pointer' }}>ADD</button>
        <button onClick={onClose} style={{ padding: '10px 14px', background: 'transparent', border: '1px solid #1c1917', borderRadius: 7, color: '#44403c', fontSize: 10, cursor: 'pointer' }}>CANCEL</button>
      </div>
    </Modal>
  )
}

// ── Body Log Modal ────────────────────────────────────────────────────────────
export function BodyModal({ onLog, onClose }) {
  const [weight, setWeight] = useState('')
  const [energy, setEnergy] = useState('7')
  const [notes, setNotes]   = useState('')

  return (
    <Modal onClose={onClose}>
      <ModalLabel>BODY CHECK-IN</ModalLabel>
      <FieldInput label="Weight (kg)" value={weight} onChange={setWeight} placeholder="72" />
      <FieldInput label="Energy (1-10)" value={energy} onChange={setEnergy} placeholder="7" />
      <FieldInput label="Notes" value={notes} onChange={setNotes} placeholder="Feeling leaner..." />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button onClick={() => onLog({ date: todayStr(), weight, energy, notes })} style={{ flex: 1, padding: 10, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 7, color: '#fbbf24', fontSize: 10, cursor: 'pointer' }}>LOG</button>
        <button onClick={onClose} style={{ padding: '10px 14px', background: 'transparent', border: '1px solid #1c1917', borderRadius: 7, color: '#44403c', fontSize: 10, cursor: 'pointer' }}>CANCEL</button>
      </div>
    </Modal>
  )
}

// ── Goal Modal ────────────────────────────────────────────────────────────────
export function GoalModal({ onAdd, onClose }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')

  return (
    <Modal onClose={onClose}>
      <ModalLabel>NEW GOAL</ModalLabel>
      <div style={{ fontSize: 10, color: '#44403c', marginBottom: 14, lineHeight: 1.7 }}>
        JARVIS generates a full actionable plan. Be specific.
      </div>
      <FieldInput label="Goal" value={name} onChange={setName} placeholder="Build lean aesthetic body" />
      <FieldInput label="Context" value={desc} onChange={setDesc} placeholder="72kg, no gym, fashion show Feb 2027" />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button onClick={() => name && onAdd(name, desc)} style={{ flex: 1, padding: 10, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 7, color: '#fbbf24', fontSize: 10, cursor: 'pointer' }}>GENERATE PLAN</button>
        <button onClick={onClose} style={{ padding: '10px 14px', background: 'transparent', border: '1px solid #1c1917', borderRadius: 7, color: '#44403c', fontSize: 10, cursor: 'pointer' }}>CANCEL</button>
      </div>
    </Modal>
  )
}

// ── Photo Modal ───────────────────────────────────────────────────────────────
export function PhotoModal({ fortnightNum, onLog, onClose }) {
  const [note, setNote] = useState('')

  return (
    <Modal onClose={onClose}>
      <ModalLabel>FORTNIGHT {fortnightNum} SNAPSHOT</ModalLabel>
      <div style={{ fontSize: 10, color: '#44403c', marginBottom: 14, lineHeight: 1.7 }}>
        Take a photo now and save it to your camera roll. Add honest notes here.
      </div>
      <div style={{ background: '#0a0908', border: '1px solid #1c1917', borderRadius: 8, padding: 16, textAlign: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 30, marginBottom: 4 }}>📸</div>
        <div style={{ fontSize: 9, color: '#44403c', letterSpacing: '0.1em' }}>TAKE YOUR PHOTO NOW</div>
      </div>
      <div style={{ fontSize: 9, color: '#44403c', letterSpacing: '0.15em', marginBottom: 4 }}>YOUR NOTES</div>
      <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="What do you see? What changed? What still needs work?" style={{ width: '100%', padding: '8px 10px', background: '#0a0908', border: '1px solid #1c1917', borderRadius: 6, color: '#78716c', fontSize: 10, outline: 'none', height: 80, resize: 'none', lineHeight: 1.6 }} />
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button onClick={() => onLog({ date: todayStr(), note, fortnight: fortnightNum })} style={{ flex: 1, padding: 10, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 7, color: '#fbbf24', fontSize: 10, cursor: 'pointer' }}>LOG SNAPSHOT</button>
        <button onClick={onClose} style={{ padding: '10px 14px', background: 'transparent', border: '1px solid #1c1917', borderRadius: 7, color: '#44403c', fontSize: 10, cursor: 'pointer' }}>CANCEL</button>
      </div>
    </Modal>
  )
}

// ── Weekly Scorecard Modal ────────────────────────────────────────────────────
export function WeeklyModal({ state, mc, onClose }) {
  const entries = Object.entries(state.history).sort(([a], [b]) => (a < b ? 1 : -1)).slice(0, 7)

  if (!entries.length) {
    return (
      <Modal onClose={onClose}>
        <ModalLabel>WEEKLY SCORECARD</ModalLabel>
        <div style={{ fontSize: 12, color: '#44403c', padding: '20px 0', textAlign: 'center' }}>Not enough data yet.</div>
        <button onClick={onClose} style={{ width: '100%', padding: 9, background: 'transparent', border: '1px solid #1c1917', borderRadius: 7, color: '#44403c', fontSize: 10, cursor: 'pointer' }}>CLOSE</button>
      </Modal>
    )
  }

  const total = entries.reduce((s, [, d]) => s + state.habits.filter(h => d.checks?.[h.id]).length, 0)
  const pct   = Math.round((total / (entries.length * state.habits.length)) * 100)
  const grade = pct >= 90 ? 'S' : pct >= 75 ? 'A' : pct >= 60 ? 'B' : pct >= 40 ? 'C' : 'D'
  const gc    = { S: '#f59e0b', A: '#10b981', B: '#3b82f6', C: '#8b5cf6', D: '#ef4444' }[grade]
  const perfect = entries.filter(([, d]) => state.habits.every(h => d.checks?.[h.id])).length

  return (
    <Modal onClose={onClose}>
      <ModalLabel>WEEKLY SCORECARD</ModalLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, padding: 12, background: '#0a0908', borderRadius: 8, border: '1px solid #1c1917' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, color: gc, lineHeight: 1 }}>{grade}</div>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: '#e7e5e4' }}>{pct}%</div>
          <div style={{ fontSize: 9, color: '#44403c', letterSpacing: '0.1em' }}>LAST {entries.length} DAYS</div>
          <div style={{ fontSize: 9, color: '#44403c', marginTop: 2 }}>{perfect} perfect days</div>
        </div>
      </div>
      {state.habits.map(h => {
        const rate = Math.round(entries.filter(([, d]) => d.checks?.[h.id]).length / entries.length * 100)
        return (
          <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 13 }}>{h.icon}</span>
            <div style={{ flex: 1, fontSize: 10, color: '#d6d3d1' }}>{h.label}</div>
            <div style={{ fontSize: 10, color: rate >= 70 ? '#10b981' : rate >= 40 ? mc.accent : '#ef4444', width: 36, textAlign: 'right' }}>{rate}%</div>
          </div>
        )
      })}
      <button onClick={onClose} style={{ marginTop: 14, width: '100%', padding: 9, background: 'transparent', border: '1px solid #1c1917', borderRadius: 7, color: '#44403c', fontSize: 10, cursor: 'pointer' }}>CLOSE</button>
    </Modal>
  )
}

// ── Contracts Modal ───────────────────────────────────────────────────────────
export function ContractsModal({ contractDivergences, mc, onClose }) {
  return (
    <Modal onClose={onClose}>
      <ModalLabel>INTEGRITY CONTRACT DIVERGENCES</ModalLabel>
      {contractDivergences.map(d => {
        const contract = INTEGRITY_CONTRACTS.find(c => c.id === d.contract)
        return (
          <div key={d.contract} style={{ padding: '12px 0', borderBottom: '1px solid rgba(239,68,68,0.1)' }}>
            <div style={{ fontSize: 9, color: '#ef4444', letterSpacing: '0.12em', marginBottom: 6 }}>CONTRACT #{d.contract}</div>
            <div style={{ fontSize: 11, color: '#e7e5e4', marginBottom: 6, fontStyle: 'italic' }}>{contract?.short}</div>
            <div style={{ fontSize: 11, color: '#78716c', lineHeight: 1.7 }}>{d.note}</div>
            {contract && <div style={{ fontSize: 10, color: '#44403c', marginTop: 8, lineHeight: 1.6, borderLeft: '2px solid rgba(239,68,68,0.2)', paddingLeft: 10 }}>{contract.full}</div>}
          </div>
        )
      })}
      <button onClick={onClose} style={{ marginTop: 14, width: '100%', padding: 9, background: 'transparent', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, color: '#f87171', fontSize: 9, cursor: 'pointer' }}>ACKNOWLEDGED</button>
    </Modal>
  )
}

// ── PIN Modal ─────────────────────────────────────────────────────────────────
export function PinModal({ onSet, onClose, mc }) {
  const [pin1, setPin1] = useState('')
  const [pin2, setPin2] = useState('')
  const [stage, setStage] = useState(1)
  const [err, setErr] = useState('')

  const current = stage === 1 ? pin1 : pin2

  function handleKey(k) {
    if (k === '<') {
      stage === 1 ? setPin1(p => p.slice(0, -1)) : setPin2(p => p.slice(0, -1))
      return
    }
    const next = current + k
    stage === 1 ? setPin1(next) : setPin2(next)
    if (next.length === 4) {
      if (stage === 1) { setStage(2) }
      else if (next === pin1) { onSet(pin1) }
      else { setErr("PINs don't match."); setPin1(''); setPin2(''); setStage(1); setTimeout(() => setErr(''), 1500) }
    }
  }

  return (
    <Modal onClose={onClose}>
      <ModalLabel>{stage === 1 ? 'SET PIN' : 'CONFIRM PIN'}</ModalLabel>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 16 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: current.length > i ? (mc?.accent || '#f59e0b') : '#1c1917', transition: 'background 0.15s' }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
        {['1','2','3','4','5','6','7','8','9','','0','<'].map((k, i) => (
          <button key={i} onClick={() => k && handleKey(k)} style={{ height: 52, borderRadius: 8, background: k ? '#1c1917' : 'transparent', border: k ? '1px solid #292524' : 'none', color: '#e7e5e4', fontSize: 16, cursor: k ? 'pointer' : 'default', opacity: k ? 1 : 0, fontFamily: "'Bebas Neue', sans-serif" }}>
            {k}
          </button>
        ))}
      </div>
      {err && <div style={{ fontSize: 10, color: '#ef4444', textAlign: 'center', marginBottom: 8 }}>{err}</div>}
      <button onClick={onClose} style={{ width: '100%', padding: 9, background: 'transparent', border: '1px solid #1c1917', borderRadius: 7, color: '#44403c', fontSize: 10, cursor: 'pointer' }}>CANCEL</button>
    </Modal>
  )
}
