import { useState, useEffect, useRef } from 'react'
import { useForge } from './hooks/useForge'
import { callJarvis, formatApiError } from './lib/api'
import { JARVIS_SYSTEM, GOAL_SYSTEM } from './constants/prompts'
import { todayStr } from './lib/storage'

import { Splash } from './components/Splash'
import { PinLock } from './components/PinLock'
import { Header } from './components/Header'
import { Nav } from './components/Nav'
import { JarvisOverlay } from './components/JarvisOverlay'

import { TodayView } from './components/views/TodayView'
import { GoalsView } from './components/views/GoalsView'
import { LogView } from './components/views/LogView'
import { IntelView } from './components/views/IntelView'
import { TalkView } from './components/views/TalkView'
import { YouView } from './components/views/YouView'
import { MeView } from './components/views/MeView'

import {
  GraceModal, MissionModal, HabitModal, BodyModal,
  GoalModal, PhotoModal, WeeklyModal, ContractsModal, PinModal,
} from './components/modals'

export default function App() {
  const forge = useForge()
  const {
    state, setState, checks, comments, today, week,
    momentum, drift, resistance, selfBetrayal,
    mode, effectiveMode, mc, collapseRisk, contractDivergences, patternMatch,
    level, nextLevel, levelPct, consPct, doneToday, allDoneToday,
    toggleHabit, saveComment, advanceDay, useGrace, acknowledgeAwareness,
    addMission, removeMission, addHabit, removeHabit,
    addGoal, updateGoal, removeGoal, toggleGoalItem,
    addJarvisInsight, addBodyLog, addPhotoLog, setPin, importConfig,
  } = forge

  const [view, setView] = useState('today')
  const [modal, setModal] = useState(null)
  const [splash, setSplash] = useState(true)
  const [locked, setLocked] = useState(false)

  // JARVIS overlay state
  const [jarvisOpen, setJarvisOpen] = useState(false)
  const [jarvisLoading, setJarvisLoading] = useState(false)
  const [jarvisText, setJarvisText] = useState('')

  // XP pop-up notifications
  const [xpPops, setXpPops] = useState([])
  const popId = useRef(0)

  // Splash timer
  useEffect(() => {
    const t = setTimeout(() => setSplash(false), 2200)
    return () => clearTimeout(t)
  }, [])

  // PIN lock on mount
  useEffect(() => {
    if (state.pin) setLocked(true)
  }, [])

  // XP pop helper — called from toggleHabit wrapper below
  function showXpPop(amt) {
    const id = popId.current++
    setXpPops(p => [...p, { id, amt }])
    setTimeout(() => setXpPops(p => p.filter(x => x.id !== id)), 2200)
  }

  // Wrap toggleHabit to trigger XP popups
  function handleToggleHabit(hid) {
    const habit = state.habits.find(h => h.id === hid)
    const was = !!checks[hid]
    if (!was && habit) showXpPop(habit.xp)
    const wasAllDone = state.habits.every(h => !!checks[h.id])
    toggleHabit(hid)
    // Check if all done after toggle for bonus popup
    const newChecks = { ...checks, [hid]: !was }
    const allDone = state.habits.every(h => newChecks[h.id])
    if (allDone && !wasAllDone) setTimeout(() => showXpPop(50), 350)
  }

  // ── JARVIS analysis ──────────────────────────────────────────────────────
  async function runJarvis(trigger) {
    setJarvisOpen(true)
    setJarvisLoading(true)
    setJarvisText('')

    const hist = Object.entries(state.history)
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .slice(0, 14)

    const habitLines = state.habits.map(h => {
      const done = hist.filter(([, d]) => d.checks?.[h.id]).length
      const recentComments = hist
        .filter(([, d]) => d.comments?.[h.id])
        .map(([date, d]) => `${date}: ${d.comments[h.id]}`)
        .slice(-3)
      return `${h.label}: ${done}/${hist.length}${recentComments.length ? ` | notes: ${recentComments.join(' / ')}` : ''}`
    }).join('\n')

    const allComments = hist
      .flatMap(([date, d]) =>
        Object.entries(d.comments || {}).map(([hid, c]) => {
          const h = state.habits.find(x => x.id === hid)
          return `[${date}] ${h?.label || hid}: ${c}`
        })
      )
      .slice(-20)
      .join('\n')

    const divergences = contractDivergences
      .map(d => `Contract ${d.contract}: ${d.note}`)
      .join('\n')

    const collapseInfo = `Collapse risk: ${collapseRisk.score} (${collapseRisk.phase}) signals: ${collapseRisk.signals.join('; ') || 'none'}`
    const patternInfo  = patternMatch
      ? `Pattern match: ${patternMatch.date} score ${patternMatch.score}`
      : 'No pattern match.'

    const msg = [
      `Current mode: ${effectiveMode.toUpperCase()}`,
      `Day: ${state.dayCount} | Streak: ${state.streak} | Grace used: ${state.graceDaysUsed}/5`,
      `Momentum: ${momentum} | Drift: ${drift} | Resistance: ${resistance} | Self-betrayal: ${selfBetrayal}`,
      '',
      collapseInfo,
      patternInfo,
      '',
      `Habit data (last ${hist.length} days):`,
      habitLines,
      '',
      'Personal notes:',
      allComments || 'None.',
      '',
      'Contract divergences:',
      divergences || 'None detected.',
      '',
      `Trigger: ${trigger}`,
    ].join('\n')

    try {
      const text = await callJarvis(JARVIS_SYSTEM, msg)
      setJarvisText(text)
      addJarvisInsight({ date: todayStr(), trigger, msg: text, mode: effectiveMode })
    } catch (err) {
      setJarvisText(formatApiError(err))
    }
    setJarvisLoading(false)
  }

  // ── Goal creation (async — calls JARVIS) ─────────────────────────────────
  async function handleCreateGoal(name, description) {
    const goalId = `g${Date.now()}`
    const newGoal = {
      id: goalId, name, description, createdAt: todayStr(),
      plan: null, planLoading: true, dailyFocus: null,
      dailyFocusDate: null, dailyFocusLoading: false, checks: {},
    }
    addGoal(newGoal)
    setModal(null)

    try {
      const raw  = await callJarvis(GOAL_SYSTEM, `Goal: ${name}\nContext: ${description}`)
      const plan = JSON.parse(raw.replace(/```json|```/g, '').trim())
      updateGoal(goalId, { plan, planLoading: false })
    } catch (err) {
      console.error(formatApiError(err))
      updateGoal(goalId, { plan: [], planLoading: false })
    }
  }

  // ── Early returns ────────────────────────────────────────────────────────
  if (splash) return <Splash />

  if (locked) {
    return (
      <PinLock
        pin={state.pin}
        mc={mc}
        onUnlock={() => setLocked(false)}
      />
    )
  }

  // ── Modal resolver ────────────────────────────────────────────────────────
  const sharedModalProps = { mc, onClose: () => setModal(null) }

  function renderModal() {
    switch (modal) {
      case 'grace':
        return <GraceModal {...sharedModalProps} graceDaysLeft={5 - state.graceDaysUsed} onPick={rid => { useGrace(rid); setModal(null) }} />
      case 'mission':
        return <MissionModal {...sharedModalProps} onAdd={m => { addMission(m); setModal(null) }} />
      case 'habit':
        return <HabitModal {...sharedModalProps} onAdd={h => { addHabit(h); setModal(null) }} />
      case 'body':
        return <BodyModal {...sharedModalProps} onLog={e => { addBodyLog(e); setModal(null) }} />
      case 'goal':
        return collapseRisk.phase !== 'stabilization'
          ? <GoalModal {...sharedModalProps} onAdd={handleCreateGoal} />
          : null
      case 'photo':
        return <PhotoModal {...sharedModalProps} fortnightNum={Math.floor(state.dayCount / 14) + 1} onLog={e => { addPhotoLog(e); setModal(null) }} />
      case 'weekly':
        return <WeeklyModal {...sharedModalProps} state={state} />
      case 'contracts':
        return <ContractsModal {...sharedModalProps} contractDivergences={contractDivergences} />
      case 'pin':
        return <PinModal {...sharedModalProps} onSet={p => { setPin(p); setModal(null) }} />
      default:
        return null
    }
  }

  // ── Shared view props ─────────────────────────────────────────────────────
  const psychProps = { momentum, drift, resistance, selfBetrayal, collapseRisk, patternMatch, mode: effectiveMode, mc }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: mc.bg, color: '#e7e5e4', transition: 'background 1.5s' }}>

      {/* XP popups */}
      {xpPops.map(p => (
        <div key={p.id} style={{
          position: 'fixed', top: '16%', right: 14,
          border: `1px solid ${mc.accent}44`, color: mc.accent,
          fontWeight: 'bold', fontSize: 14, padding: '7px 12px',
          borderRadius: 6, zIndex: 999,
          animation: 'fadeUp 2.2s ease forwards',
          pointerEvents: 'none',
          fontFamily: "'DM Mono', monospace",
          letterSpacing: '0.05em',
          background: mc.cardBg,
        }}>
          +{p.amt}
        </div>
      ))}

      {/* JARVIS overlay */}
      {jarvisOpen && (
        <JarvisOverlay
          loading={jarvisLoading}
          text={jarvisText}
          onClose={() => setJarvisOpen(false)}
        />
      )}

      {/* Active modal */}
      {renderModal()}

      {/* Header + missions bar */}
      <Header state={state} mc={mc} level={level} effectiveMode={effectiveMode} />

      {/* Nav */}
      <Nav view={view} setView={setView} mc={mc} />

      {/* Main content */}
      <main style={{ padding: 12, maxWidth: 600, margin: '0 auto', paddingBottom: 50 }}>
        {view === 'today' && (
          <TodayView
            state={state} week={week} checks={checks} comments={comments}
            doneToday={doneToday} allDoneToday={allDoneToday}
            contractDivergences={contractDivergences}
            level={level} nextLevel={nextLevel} levelPct={levelPct}
            toggleHabit={handleToggleHabit} saveComment={saveComment}
            advanceDay={advanceDay} setModal={setModal}
            runJarvis={runJarvis} acknowledgeAwareness={acknowledgeAwareness}
            {...psychProps}
          />
        )}

        {view === 'goals' && (
          <GoalsView
            state={state} mc={mc}
            toggleGoalItem={toggleGoalItem}
            updateGoal={updateGoal}
            removeGoal={removeGoal}
            setModal={setModal}
            collapseRisk={collapseRisk}
          />
        )}

        {view === 'log' && (
          <LogView state={state} mc={mc} setModal={setModal} />
        )}

        {view === 'intel' && (
          <IntelView
            state={state}
            contractDivergences={contractDivergences}
            runJarvis={runJarvis}
            jarvisLoading={jarvisLoading}
            {...psychProps}
          />
        )}

        {view === 'talk' && (
          <TalkView
            state={state}
            contractDivergences={contractDivergences}
            {...psychProps}
          />
        )}

        {view === 'you' && (
          <YouView state={state} {...psychProps} />
        )}

        {view === 'me' && (
          <MeView
            state={state}
            setState={setState}
            mc={mc}
            level={level}
            levelPct={levelPct}
            nextLevel={nextLevel}
            consPct={consPct}
            setModal={setModal}
          />
        )}
      </main>
    </div>
  )
}
